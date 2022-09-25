import datetime
import time

import flask
import re

import stravalib.exc
from flask import Flask, request, Response, session, render_template, url_for

import requests
import xml.etree.ElementTree as ET
import json
import toml
from stravalib import Client

from utils.gpx import reverse_gpx_trackpts

app = Flask(__name__)
app.secret_key = b"\xdd\xd5\xe7\xf1\x9f\xa0I\x03\xa8(\x16\xab\xff*|\x08\x9e\x8e\x14\x99\xb6*\xe9E5y\xb3\xcb\xee\x13\xa2$"

err = app.config.from_file("config_strava_downloader.toml", load=toml.load)

app.strava_config = toml.load("config_strava_downloader.toml")


@app.template_filter()
def format_datetime(value):
    return datetime.datetime.fromtimestamp(value).strftime("%Y-%m-%d %H:%M")


@app.template_filter()
def format_distance(value):
    grps = re.search("^(\d+)\.\d+ m$", str(value)).groups()
    return f"{(float(grps[0])/1000):.2f} km"


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
        refresh_response = client.refresh_access_token(client_id=app.strava_config["strava"]["client_id"], client_secret=pp.strava_config["strava"]["client_secret"],
            refresh_token=session["refresh_token"])
        session["access_token"] = refresh_response['access_token']
        session["refresh_token"] = refresh_response['refresh_token']
        session["expires_at"] = refresh_response['expires_at']
    return True



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
        print(url_request)
        response = requests.get(
            url_request, headers={"Authorization": f"Bearer {session['access_token']}"}
        )
    except BaseException as e:
        print(str(e))
        raise e
    return response.content


@app.route("/download_gpx/<route_id>")
def download_gpx(route_id):
    update_token()
    gpx_content = get_gpx(route_id)
    r = Response(gpx_content, content_type="text/xml")
    r.headers["Content-Disposition"] = f"attachment;filename=route_{route_id}.gpx"
    return r


@app.route("/reverse_gpx/<route_id>")
def reverse_gpx(route_id):
    gpx_content = get_gpx(route_id)
    root = reverse_gpx_trackpts(gpx_content)
    gpx_content = ET.tostring(root)
    r = Response(gpx_content, content_type="text/xml")
    r.headers["Content-Disposition"] = f"attachment;filename=route_{route_id}.gpx"
    return r

@app.route("/map")
def show_map():
    return render_template("map.html")