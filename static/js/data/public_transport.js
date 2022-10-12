    async function retrieve_public_transport_stations(route_id, bounds) {
        var search_obj = {
            min_lon: bounds._southWest.lng,
            max_lon: bounds._northEast.lng,
            min_lat: bounds._southWest.lat,
            max_lat: bounds._northEast.lat
        };
        var retrieved_data = localStorage.getItem("public_transport_" + route_id)
        if (retrieved_data !== null) {
            return JSON.parse(retrieved_data);
        } else {
            var search_params = new URLSearchParams(search_obj);
            const response = await fetch("/osm/trainstation?" + search_params)
                .then((response) => response.json())
                .then((data) => {
                    return data;
                });
            localStorage.setItem("public_transport_" + route_id, JSON.stringify(response));
            return response;
        }
    }