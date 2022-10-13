
var locationMarker = null;
const options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};

function success(pos) {
    const crd = pos.coords;
    window.currentPosition = crd
    console.log(`Your current position is: Latitude : ${crd.latitude}; Longitude: ${crd.longitude}; More or less ${crd.accuracy} meters.`);

    // Show a market at the position of the Eiffel Tower
    locationMarker = L.marker([crd.latitude, crd.longitude]);
    locationMarker.addTo(window.map);
    updatePositionSpecificCues();
}

function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
}


function get_currentPosition() {
    navigator.geolocation.getCurrentPosition(success, error, options);
}