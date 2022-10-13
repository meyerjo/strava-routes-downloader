
function plotElevation(element_id, start_id = null, end_id = null) {
    if (start_id === null) {
        start_id = 0;
    }
    if (end_id === null) {
        end_id = window.gpx.tracks[0].points.length;
    }
    const coordinates = window.gpx.tracks[0].points.slice(start_id, end_id);
    const points = window.trackStatistics.elevations.slice(start_id, end_id);
    const accumulated_elevation_positive = window.trackStatistics.elevationPositiveAccumulated.slice(start_id, end_id);
    const accumulated_elevation_negative = window.trackStatistics.elevationNegativeAccumulated.slice(start_id, end_id);
    const accumulated_distances = window.trackStatistics.distancesAccumulated.slice(start_id, end_id);

    return Highcharts.chart(element_id, {
        series: [{
            data: points
        }],
        chart: {
            events: {
                click: function(e) {
                    console.log(
                        e.xAxis[0].value,
                        e.yAxis[0].value
                    );
                }
            }
        },
        plotOptions: {
            series: {
                events: {
                    mouseOut: function () {
                        if ((moving_marker !== null) || (moving_marker !== undefined)) {
                            map.removeLayer(moving_marker);
                            moving_marker = null;
                        }
                    }
                }
            }
        },
        tooltip: {
            formatter: function () {
                const position = coordinates[this.x];
                if (moving_marker !== null) {
                    moving_marker.setLatLng(new L.LatLng(position.lat, position.lon))
                } else {
                    moving_marker = L.marker([position.lat, position.lon]);
                    moving_marker.addTo(window.map);
                }

                var distance_to_last_5 = 0;
                var heightDifference = 0;
                var look_back_distance = 3;
                if (this.x > look_back_distance) {
                    distance_to_last_5 = accumulated_distances[this.x] - accumulated_distances[this.x - look_back_distance];
                    distance_to_last_5 = distance_to_last_5 * 1000;
                    heightDifference = points[this.x] - points[this.x - look_back_distance];
                }

                return 'The value for <b>' + Math.round(accumulated_distances[this.x]*10)/10 +
                    ' km</b> is <b>' + Math.round(this.y*100)/100 + 'm </b> of elevation. <br/>' +
                    `Elevation up done: ${Number(accumulated_elevation_positive[this.x]).toFixed(2)} m<br/>` +
                    `Elevation down done: ${Number(accumulated_elevation_negative[this.x]).toFixed(2)} m<br/>` +
                    `change: ${Number((heightDifference/distance_to_last_5)*100).toFixed(2)} %<br/>` +
                    `height difference: ${Number(heightDifference).toFixed(2)}<br/>` +
                    `distance: ${Number(distance_to_last_5).toFixed(2)}<br/>`
                    `look back distance: ${look_back_distance}<br/>`
                    ;
            }
        },
        xAxis: {
            labels: {
                enabled: true,
                formatter: function() {
                    return Math.round((accumulated_distances[this.value] * 100)/100) ;
                },
            }
        },
        yAxis: {
            title: {
                enabled: true,
                text: "Elevation [m]"
            }
        },
        legend: {
            enabled: false,
        },
        title: {
            enabled: false,
            text: ""
        }
    });
}