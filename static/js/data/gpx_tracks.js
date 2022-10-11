function get_gpx_track_indices_by_bounds(track_points, bounds) {
    var firstIndexIn = null;
    var lastIndexIn = null;
    track_points.forEach(function(elm, i) {
        if ((elm.lat >= bounds._southWest.lat) && (elm.lat <= bounds._northEast.lat)) {
            if ((elm.lon >= bounds._southWest.lng) && (elm.lon <= bounds._northEast.lng)) {
                if (firstIndexIn === null) {
                    firstIndexIn = i;
                } else {
                    lastIndexIn = i;
                }
            }
        }
    });
    return {first: firstIndexIn, last: lastIndexIn};
}


function point_statistics(points) {
    var elevations = [];
    var distance_point_to_point = [0];
    var elevation_change_p_to_p = [0];
    var positive_elevation_change_p_to_p = [0];
    var negative_elevation_change_p_to_p = [0];
    var i = 0;
    for (p of points) {
        elevations.push(p.ele);
        if (i > 0) {
            distance_point_to_point.push(
                distance(
                    points[i].lat,
                    points[i].lon,
                    points[i-1].lat,
                    points[i-1].lon,
                ) / 1000
            );
            elevation_change_p_to_p.push(
                points[i].ele - points[i-1].ele
            );
            var elevation_difference = points[i].ele - points[i-1].ele;
            if (Math.sign(elevation_difference) === 1) {
                positive_elevation_change_p_to_p.push(
                    Math.abs(elevation_difference)
                );
                negative_elevation_change_p_to_p.push(0);
            }
            else if (Math.sign(elevation_difference) === -1) {
                negative_elevation_change_p_to_p.push(
                    Math.abs(elevation_difference)
                );
                positive_elevation_change_p_to_p.push(0);
            } else {
                positive_elevation_change_p_to_p.push(0);
                negative_elevation_change_p_to_p.push(0);
            }
        }
        i++
    }

    positive_elevation_change_p_to_p.forEach(function(elm, i) {
        if (isNaN(elm)) {
            console.log(i, elm);
        }
    });

    // console.log(positive_elevation_change_p_to_p);
    // console.log(Math.max(...positive_elevation_change_p_to_p), Math.min(...negative_elevation_change_p_to_p));

    <!-- TODO: fix this -->
    const cumulativeSum = (sum => value => sum += value)(0);
    const cumulativeSum2 = (sum => value => sum += value)(0);
    const cumulativeSum3 = (sum => value => sum += value)(0);
    const cumulativeSum4 = (sum => value => sum += value)(0);
    var accumulated_distances = distance_point_to_point.map(cumulativeSum);
    var accumulated_elevation = elevation_change_p_to_p.map(cumulativeSum2);
    var accumulated_positive = positive_elevation_change_p_to_p.map(cumulativeSum3);
    var accumulated_negative = negative_elevation_change_p_to_p.map(cumulativeSum4);
    return {
        elevations: elevations,
        elevationChanges: elevation_change_p_to_p,
        distancesAccumulated: accumulated_distances,
        elevationAccumulated: accumulated_elevation,
        elevationPositiveAccumulated: accumulated_positive,
        elevationNegativeAccumulated: accumulated_negative,
        pointToPointDistances: distance_point_to_point
    }
}