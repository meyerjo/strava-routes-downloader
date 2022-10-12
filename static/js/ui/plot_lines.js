
function retrievePlotlines(currentPosition = null, clickLocation = null) {
    var closest_point_on_track = null;
    var plotLines = [];
    if ((currentPosition !== undefined) && (currentPosition !== null)) {
        closest_point_on_track = findClosestPointOnTrack(currentPosition.latitude, currentPosition.longitude);
        if (closest_point_on_track.metricDistance < AWAY_FROM_TRACK_THRESHOLD) {
            plotLines.push(
                {
                    color: '#00FF00', // Red
                    width: 2,
                    value: closest_point_on_track.index // Position, you'll have to translate this to the values on your x axis
                }
            );
        }
    }

    if ((clickLocation !== undefined) && (clickLocation !== null)) {
        closest_point_on_track = findClosestPointOnTrack(clickLocation.latitude, clickLocation.longitude);
        if (closest_point_on_track.metricDistance < AWAY_FROM_TRACK_THRESHOLD) {
            plotLines.push(
                {
                    color: '#FF0000', // Red
                    width: 2,
                    value: closest_point_on_track.index // Position, you'll have to translate this to the values on your x axis
                }
            )
        }
    }
    return plotLines;
}


function colorize_feature(feature) {
    var obj_color = getColors();
    var color = "#000000";
    if (document.querySelector("input[type=radio][name=visualization_type]:checked").value === "height_change") {
        if (feature.properties.elevation > 0) {
            color = obj_color.elevation.increasing;
        } else if (feature.properties.elevation < 0) {
            color = obj_color.elevation.decreasing;
        } else {
            color = obj_color.elevation.neutral;
        }
    } else if (document.querySelector("input[type=radio][name=visualization_type]:checked").value === "public_transport") {
        console.log(feature.properties)
        if (feature.properties.group === 0) {
            color = obj_color.public_transport.short;
        } else if (feature.properties.group === 1) {
            color = obj_color.public_transport.middle;
        } else {
            color = obj_color.public_transport.long;
        }
    }
    return {
        "color": color,
        "opacity": 1,
        "weight": 5
    }
}
