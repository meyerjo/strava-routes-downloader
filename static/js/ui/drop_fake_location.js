function drop_gps_location(e) {
    const element = e.target.dataset['value'];
    switch(element) {
        case "random-atlength":
            var positionId = Math.floor(Math.random()*window.gpx.tracks[0].points.length);
            window.currentPosition = {
                accuracy: 0,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                latitude: window.gpx.tracks[0].points[positionId].lat,
                longitude: window.gpx.tracks[0].points[positionId].lon,
                speed: null
            };
            locationMarker.setLatLng(new L.LatLng(
                window.gpx.tracks[0].points[positionId].lat,
                window.gpx.tracks[0].points[positionId].lon
            ))
            updatePositionSpecificCues();
            break;
        case "random-along":
            var positionId = Math.floor(Math.random()*window.gpx.tracks[0].points.length);
            const newLat = window.gpx.tracks[0].points[positionId].lat + Math.random() * 0.05;
            const newLon = window.gpx.tracks[0].points[positionId].lon + Math.random() * 0.05;
            window.currentPosition = {
                accuracy: 0,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                latitude: newLat,
                longitude: newLon,
                speed: null
            };
            locationMarker.setLatLng(new L.LatLng(
                newLat,
                newLon
            ))
            updatePositionSpecificCues();
            break;
        case "random":
            const bounds = window.map.getBounds();
            const latitude = bounds._southWest.lat + Math.random() * (bounds._northEast.lat -bounds._southWest.lat);
            const longitude = bounds._northEast.lng + Math.random() * (bounds._southWest.lng - bounds._northEast.lng);
            console.log(latitude, longitude);
            window.currentPosition = {
                accuracy: 0,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                latitude: latitude,
                longitude: longitude,
                speed: null
            };
            locationMarker.setLatLng(new L.LatLng(
                latitude,
                longitude
            ));
            updatePositionSpecificCues();
            break;
    }
}