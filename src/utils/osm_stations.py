from OSMPythonTools.overpass import Overpass

def retrieve_osm_trainstation(min_lon, max_lon, min_lat, max_lat):
    if min_lon > max_lon:
        min_lon, max_lon = max_lon, min_lon
    if min_lat > max_lat:
        min_lat, max_lat = max_lat, min_lat
    min_lon = float(min_lon)
    max_lon = float(max_lon)
    min_lat = float(min_lat)
    max_lat = float(max_lat)

    bounding_box = f"{min_lat:.6f},{min_lon:.6f},{max_lat:.6f},{max_lon:.6f}"
    overpass = Overpass()
    stations = []

    try:
        queryString = (
            f'(node["railway"="platform"]({bounding_box});node["railway"="station"]({bounding_box});node["railway"="halt"]({bounding_box});); '
            f"out;"
        )
        res = overpass.query(queryString)
        if res is not None and res.nodes() is not None:
            for r in res.nodes():
                stations.append(
                    {
                        "longitude": r.lon(),
                        "latitude": r.lat(),
                        "type": r.tags().get("railway", None),
                        "tags": r.tags(),
                    }
                )
    except BaseException as e:
        print(e)
        return []

    return stations