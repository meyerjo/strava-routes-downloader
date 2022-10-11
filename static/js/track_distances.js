
function distance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c; // in metres
    return d;
}

function findClosestPointOnTrack(latitude, longitude) {
    var min_distance = Math.abs(Math.max());
    var item_i = undefined;
    window.gpx.tracks[0].points.forEach((p, i) => {
        let metricDistance = distance(p.lat, p.lon, latitude, longitude);
        if (metricDistance < min_distance) {
            item_i = {index: i, point: p, metricDistance: metricDistance};
            min_distance = metricDistance;
        }
    });
    return item_i;
}