
function get_feature_from_selection(coordinates, properties) {
    return {
        type: "Feature",
        properties: properties,
        geometry: {
            type: "LineString",
            coordinates: coordinates
        }
    }
}

function find_best_station_for_point(latitude, longitude, station_data) {
    var bestFit = {
        metricDistance: Math.abs(Math.max()),
        item: null
    };
    station_data.forEach((tmp_data, i) => {
        let distance_to_station = distance(tmp_data.latitude, tmp_data.longitude, latitude,longitude );
        if (distance_to_station < bestFit.metricDistance) {
            bestFit.item = i;
            bestFit.metricDistance = distance_to_station;
        }
    });
    return bestFit;
}

function find_matching_group(stationGroups, distance) {
    let station_grouping = null;
    for (const [key, value] of Object.entries(stationGroups)) {
        if (value(distance)) {
            station_grouping = key;
            break;
        }
    }
    return station_grouping !== null ? parseInt(station_grouping) : station_grouping;
}


function geo_json_grouped_by_distance_to_train_station(geo_json_object, route_id) {
    // create a custom geojson which we can change the color of the lne one
    var custom_json = [];
    var current_selection = [
        geo_json_object.features[0].geometry.coordinates[0].slice(0, 2)
    ];

    const station_data = JSON.parse(localStorage.getItem("public_transport_" + route_id));

    const stationGroups = {
        0: (dist) => {return dist >= 0 && dist <= 2500},
        1: (dist) => {return dist > 2500 && dist <= 10000},
        2: (dist) => {return dist > 10000}
    };

    var bestFit = find_best_station_for_point(
        geo_json_object.features[0].geometry.coordinates[0][1], geo_json_object.features[0].geometry.coordinates[0][0], station_data
    );

    let station_grouping = find_matching_group(stationGroups, bestFit.metricDistance);

    var lastGrouping = station_grouping;
    var lastGradient = 0;
    var differences = [];
    geo_json_object.features[0].geometry.coordinates.slice(1).forEach((elm, i) => {
        var bestFit = find_best_station_for_point(elm[1], elm[0], station_data);
        var _change = trackStatistics.elevationChanges[i];
        if (Math.abs(_change) <= 1) {
            _change = 0;
        }
        let station_grouping = find_matching_group(stationGroups, bestFit.metricDistance);
        console.assert(station_grouping !== null);

        // always add the current element as it might be the end-point
        current_selection.push(
            elm.slice(0, 2)
        );
        differences.push(bestFit.metricDistance);
        // handle the case of a changing gradient
        if (lastGrouping !== station_grouping) {
            custom_json.push(
                get_feature_from_selection(
                    current_selection,
                    {
                        elevation: Math.sign(lastGradient),
                        differences: differences,
                        group: lastGrouping
                    }
                )
            );
            current_selection = [elm.slice(0, 2)];
            differences = [bestFit.metricDistance];
        }
        lastGradient = _change;
        lastGrouping = station_grouping;
    });
    if (current_selection.length !== 1) {
        custom_json.push(
            get_feature_from_selection(
                current_selection,
                {
                    elevation: Math.sign(lastGradient),
                    differences: differences,
                    group: lastGrouping
                }
            )
        )
    }
    return custom_json;
}

function geo_json_grouped_by_elevation_change(geo_json_object) {
    // create a custom geojson which we can change the color of the lne one
    var custom_json = [];
    var current_selection = [
        geo_json_object.features[0].geometry.coordinates[0].slice(0, 2)
    ];
    var lastGradient = 0;
    geo_json_object.features[0].geometry.coordinates.slice(1).forEach((elm, i) => {
        var _change = trackStatistics.elevationChanges[i];
        if (Math.abs(_change) <= 1) {
            _change = 0;
        }
        // always add the current element as it might be the end-point
        current_selection.push(
            elm.slice(0, 2)
        );
        // handle the case of a changing gradient
        if (Math.sign(lastGradient) !== Math.sign(_change)) {
            custom_json.push(
                get_feature_from_selection(
                    current_selection,
                    {
                        elevation: Math.sign(lastGradient)
                    }
                )
            );
            current_selection = [elm.slice(0, 2)];
        }

        lastGradient = _change;
    });
    if (current_selection.length !== 1) {
        custom_json.push(
            get_feature_from_selection(
                current_selection,
                {
                    elevation: Math.sign(lastGradient)
                }
            )
        )
    }
    return custom_json;
}