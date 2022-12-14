import datetime
import time
from pathlib import Path

import flask
import re

import stravalib.exc
from flask import Flask, request, Response, session, render_template, url_for, jsonify

from werkzeug.utils import secure_filename

import requests
import xml.etree.ElementTree as ET
import json
import toml
from OSMPythonTools.overpass import Overpass
from stravalib import Client

from utils.gpx import reverse_gpx_trackpts
from utils.osm_stations import retrieve_osm_trainstation

import os

import tempfile

UPLOAD_FILE = tempfile.gettempdir()

print(os.getcwd())

STATIC_FOLDER = "/static/"
TOML_STRAVA_CONFIGURATION = "./config_strava_downloader.toml"

try:
    from local_settings import *
except ImportError as e:
    print(f"ImportError: {e}")

app = Flask(__name__, static_folder=STATIC_FOLDER)
app.secret_key = b"\xdd\xd5\xe7\xf1\x9f\xa0I\x03\xa8(\x16\xab\xff*|\x08\x9e\x8e\x14\x99\xb6*\xe9E5y\xb3\xcb\xee\x13\xa2$"
try:
    app.strava_config = toml.load(TOML_STRAVA_CONFIGURATION)
except FileNotFoundError as e:
    print(f"Could not read configurations from: {TOML_STRAVA_CONFIGURATION}")
    app.strava_config = {}


@app.template_filter()
def format_datetime(value):
    return datetime.datetime.fromtimestamp(value).strftime("%Y-%m-%d %H:%M")


@app.template_filter()
def format_distance(value):
    grps = re.search("^(\d+)\.\d+ m$", str(value)).groups()
    return f"{(float(grps[0]) / 1000):.2f} km"


@app.context_processor
def utility_stringify_object():
    def stringify_object(obj):
        try:
            data = json.dumps(obj)
            return f"{data}"
        except BaseException as e:
            return json.dumps({"error": str(e)})

    return dict(stringify_object=stringify_object)


@app.context_processor
def utility_dir_object():
    def dir_object(obj):
        return f"{dir(obj)}"

    return dict(dir_object=dir_object)


@app.route("/login")
def test_login():
    client = Client()
    authorize_url = client.authorization_url(
        client_id=app.strava_config["strava"]["client_id"],
        redirect_uri=flask.request.host_url[:-1] + url_for("test_redirect"),
        scope=["read_all", "activity:read_all", "activity:write"],
    )
    return flask.redirect(authorize_url)


@app.route("/authorized")
def test_redirect():
    client = Client()
    code = request.args.get("code")  # or whatever your framework does
    token_response = client.exchange_code_for_token(
        client_id=app.strava_config["strava"]["client_id"],
        client_secret=app.strava_config["strava"]["client_secret"],
        code=code,
    )
    access_token = token_response["access_token"]
    refresh_token = token_response["refresh_token"]
    session["access_token"] = access_token
    session["refresh_token"] = refresh_token
    session["expires_at"] = token_response["expires_at"]
    return flask.redirect(url_for("index"))


def update_token():
    if "expires_at" not in session:
        return False
    if time.time() > session["expires_at"]:
        client = Client()
        refresh_response = client.refresh_access_token(
            client_id=app.strava_config["strava"]["client_id"],
            client_secret=app.strava_config["strava"]["client_secret"],
            refresh_token=session["refresh_token"],
        )
        session["access_token"] = refresh_response["access_token"]
        session["refresh_token"] = refresh_response["refresh_token"]
        session["expires_at"] = refresh_response["expires_at"]
    return True


@app.route("/osm/trainstation")
def osm_trainstation():
    min_lon = request.args.get("min_lon", None)
    max_lon = request.args.get("max_lon", None)
    min_lat = request.args.get("min_lat", None)
    max_lat = request.args.get("max_lat", None)
    if min_lon is None or max_lon is None or min_lat is None or max_lat is None:
        raise ("parameters are missing")
    stations = retrieve_osm_trainstation(min_lon, max_lon, min_lat, max_lat)
    return jsonify(stations)


@app.route("/")
def index():
    if session.get("access_token", None) is None:
        return flask.redirect(url_for("test_login"))
    cl = Client(access_token=session["access_token"])
    update_token()
    # # Extract the code from your webapp response
    try:
        athlete = cl.get_athlete()
        routes = cl.get_routes(athlete.id)
    except stravalib.exc.AccessUnauthorized as e:
        return flask.redirect(url_for("test_login"))

    return render_template("index.html", routes=routes, athlete=athlete)


def get_gpx(route_id):
    try:
        url_request = f"https://www.strava.com/api/v3/routes/{route_id}/export_gpx"
        response = requests.get(
            url_request, headers={"Authorization": f"Bearer {session['access_token']}"}
        )
    except BaseException as e:
        raise e
    return response.content


@app.route("/upload_status/<upload_id>")
def upload_status(upload_id):
    try:
        url_request = f"https://www.strava.com/api/v3/uploads/{upload_id}"
        response = requests.get(
            url_request, headers={"Authorization": f"Bearer {session['access_token']}"}
        )
    except BaseException as e:
        raise e
    return Response(response.content, content_type="application/json")

@app.route("/download_gpx/<route_id>")
def download_gpx(route_id):
    update_token()
    gpx_content = get_gpx(route_id)
    r = Response(gpx_content, content_type="text/xml")
    r.headers["Content-Disposition"] = f"attachment;filename=route_{route_id}.gpx"
    return r


@app.route("/gpx/<route_id>")
def retrieve_gpx(route_id):
    update_token()
    gpx_content = get_gpx(route_id)
    r = Response(gpx_content, content_type="text/xml")
    return r


@app.route("/reverse_gpx/<route_id>")
def reverse_gpx(route_id):
    gpx_content = get_gpx(route_id)
    root = reverse_gpx_trackpts(gpx_content)
    gpx_content = ET.tostring(root)
    r = Response(gpx_content, content_type="text/xml")
    r.headers["Content-Disposition"] = f"attachment;filename=route_{route_id}.gpx"
    return r

@app.route("/segment_efforts/<segment_id>")
def segment_efforts(segment_id):
    update_token()
    url_request = f"https://www.strava.com/api/v3/segment_efforts"
    response = requests.get(
        url_request, headers={"Authorization": f"Bearer {session['access_token']}"},
        params={
            "segment_id": segment_id
        }
    )
    return Response(response.content, content_type="application/json")


@app.route("/segments/<segment_id>")
def segment_details(segment_id):
    update_token()
    url_request = f"https://www.strava.com/api/v3/segments/{segment_id}"
    response = requests.get(
        url_request, headers={"Authorization": f"Bearer {session['access_token']}"}
    )
    return Response(response.content, content_type="application/json")

@app.route("/map")
def show_map():
    return render_template("map.html")


@app.route("/upload", methods=["GET", "POST"])
def show_upload_page():
    update_token()
    return render_template("show_upload.html")

@app.route("/segments")
def show_segments():
    update_token()
    url_request = f"https://www.strava.com/api/v3/segments/starred"
    response = requests.get(
        url_request, headers={"Authorization": f"Bearer {session['access_token']}"}
    )

    obj = json.loads(response.text)
    return render_template("show_segments.html", **{"data_obj": obj})

@app.route("/upload_activity", methods=["POST"])
def upload_activity():
    update_token()
    assert request.method == "POST"
    activity_name = request.form.get("activity_name", None)
    activity_description = request.form.get("activity_description", None)
    file = request.files["activity_file"]
    filename = secure_filename(file.filename)
    save_path = Path(UPLOAD_FILE) / filename
    file.save(save_path)

    # TODO: make datatype dependent on file
    additional_options = {
        "data_type": "fit"
    }

    if activity_name is not None and activity_name.strip() != "":
        additional_options["name"] = activity_name
        print(f"Adding a name to the activity: {activity_name}")
    if activity_description is not None and activity_description.strip() != "":
        additional_options["description"] = activity_description
        print(f"Adding a description to the activity: {activity_description}")

    with open(save_path, "r+b") as f:
        url_request = f"https://www.strava.com/api/v3/uploads"
        response = requests.post(
            url_request,
            headers={"Authorization": f"Bearer {session['access_token']}"},
            files={"file": f},
            params=additional_options,
        )
    assert response is not None
    return Response(response.text, content_type="application/json")


@app.route("/activities", methods=["GET", "POST"])
def load_activities():
    update_token()
    if request.method == "POST":
        id_of_activity = request.form["toggle"]
        response = requests.put(
            f"https://www.strava.com/api/v3/activities/{id_of_activity}",
            headers={"Authorization": f"Bearer {session['access_token']}"},
            params={
                "visibility": "only_me",
            },
        )

    url_request = f"https://www.strava.com/api/v3/athlete/activities"
    response = requests.get(
        url_request, headers={"Authorization": f"Bearer {session['access_token']}"}
    )

    obj = json.loads(response.text)
    return render_template(
        "show_activities.html", **{"response": response.text, "response_obj": obj}
    )
