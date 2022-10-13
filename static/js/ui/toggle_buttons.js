
function toggle_global_elevation_button() {
    if (this.value === "show_map_content") {
        var bounds = window.map.getBounds();
        var valid_indices = get_gpx_track_indices_by_bounds(window.gpx.tracks[0].points, bounds);
        if (valid_indices.first !== null) {
            window.chart = plotElevation("graphcontainer", valid_indices.first, valid_indices.last);
        }
    } else if (this.value === "current_position") {
        if ((window.currentPosition !== null) && (window.currentPosition !== undefined)) {
            var closest_point_on_track = findClosestPointOnTrack(window.currentPosition.latitude, window.currentPosition.longitude);
            if (closest_point_on_track.metricDistance < AWAY_FROM_TRACK_THRESHOLD) {
                window.chart = plotElevation("graphcontainer", closest_point_on_track.index, null);
            } else {
                const myModal = new bootstrap.Modal('#myModal', {
                    keyboard: false
                });
                myModal.show();
            }
        }
    } else if (this.value === "reset") {
        window.chart = plotElevation("graphcontainer", null, null);
    } else {
        console.warn("Unknown value");
    }
}

function toggle_local_elevation_button() {
    var position = null;
    var input_check_value = document.querySelector("input[type='radio'][name='radioHeightProfileFrom']:checked").value;
    if (input_check_value  === "from_location") {
        position = window.currentPosition;
    } else if (input_check_value === "marker_location") {
        position = {
            longitude: clickedMarker._latlng.lng,
            latitude: clickedMarker._latlng.lat
        };
    }
    if ((position === undefined) || (position === null)) {
        return;
    }

    var closest_point_on_track = findClosestPointOnTrack(position.latitude, position.longitude);
    if (closest_point_on_track.metricDistance > AWAY_FROM_TRACK_THRESHOLD) {
        if (window.localElevationGraph !== null) {
            window.localElevationGraph.destroy();
            window.localElevationGraph = null;
        }
        const myModal = new bootstrap.Modal('#myModal', {
            keyboard: false
        });
        myModal.show();
        return;
    }

    var distanceAtPoint = window.trackStatistics.distancesAccumulated[closest_point_on_track.index];

    var lengthReachedIndex = null;

    if (this.value !== "next_peak") {
        var cutoffDistance = distanceAtPoint + parseInt(this.value);
        for (let i = closest_point_on_track.index; i < window.trackStatistics.distancesAccumulated.length; i++) {
            if (window.trackStatistics.distancesAccumulated[i] > cutoffDistance) {
                lengthReachedIndex = i;
                break;
            }
        }
    } else {
        <!-- TODO make this a useful function -->
        var sign_difference_elevation = Math.sign(window.trackStatistics.elevations[closest_point_on_track.index+3] - window.trackStatistics.elevations[closest_point_on_track.index]);

        for (let i = closest_point_on_track.index+1; i < window.trackStatistics.distancesAccumulated.length; i++) {
            var local_sign_diff = Math.sign(window.trackStatistics.elevations[i+3] - window.trackStatistics.elevations[i]);
            if (sign_difference_elevation !== local_sign_diff) {
                lengthReachedIndex = i;
                break;
            }
        }
    }

    window.localElevationGraph = plotElevation("localElevationGraph", closest_point_on_track.index, lengthReachedIndex);
}