
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