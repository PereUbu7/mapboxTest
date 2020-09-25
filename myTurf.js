let earthRadius = 6371008.8;

let factors = {
    centimeters: earthRadius * 100,
    centimetres: earthRadius * 100,
    degrees: earthRadius / 111325,
    feet: earthRadius * 3.28084,
    inches: earthRadius * 39.370,
    kilometers: earthRadius / 1000,
    kilometres: earthRadius / 1000,
    meters: earthRadius,
    metres: earthRadius,
    miles: earthRadius / 1609.344,
    millimeters: earthRadius * 1000,
    millimetres: earthRadius * 1000,
    nauticalmiles: earthRadius / 1852,
    radians: 1,
    yards: earthRadius / 1.0936,
};

function lineOffsetFeature(line, distance, units) {
    var segments = [];
    var offsetDegrees = lengthToDegrees(distance, units);
    var coords = turf.getCoords(line);
    var finalCoords = [];
    coords.forEach(function (currentCoords, index) {
        if (index !== coords.length - 1) {
            var segment = processSegment(currentCoords, coords[index + 1], offsetDegrees);
            segments.push(segment);
            if (index > 0) {
                var seg2Coords = segments[index - 1];
                var intersects = turf.intersection(segment, seg2Coords);

                // Handling for line segments that aren't straight
                if (intersects !== false) {
                    seg2Coords[1] = intersects;
                    segment[0] = intersects;
                }

                finalCoords.push(seg2Coords[0]);
                if (index === coords.length - 2) {
                    finalCoords.push(segment[0]);
                    finalCoords.push(segment[1]);
                }
            }
            // Handling for lines that only have 1 segment
            if (coords.length === 2) {
                finalCoords.push(segment[0]);
                finalCoords.push(segment[1]);
            }
        }
    });
    return turf.lineString(finalCoords, line.properties);
}

function processSegment(point1, point2, offset) {
    // arccos of dot product of point1 and point2 is angle between points (in radians)
    var angle = Math.acos(
      Math.cos(point1[1]*Math.PI/180)*Math.cos(point1[0]*Math.PI/180) * Math.cos(point2[1]*Math.PI/180)*Math.cos(point2[0]*Math.PI/180)
    + Math.cos(point1[1]*Math.PI/180)*Math.sin(point1[0]*Math.PI/180) * Math.cos(point2[1]*Math.PI/180)*Math.sin(point2[0]*Math.PI/180)
    + Math.sin(point1[1]*Math.PI/180) * Math.sin(point2[1]*Math.PI/180));

    // convert to degrees
    var L = angle*180/Math.PI;

    if(L > 0){
        // Transform local cartesian coordinate system to account for lat steps being smaller farther away from the equator
        var midPointFactor = Math.cos( (point1[1] + point2[1])/2 * Math.PI / 180);

        var out1x = point1[0] + offset * (point2[1] - point1[1]) / L / midPointFactor;
        var out2x = point2[0] + offset * (point2[1] - point1[1]) / L / midPointFactor;
        var out1y = point1[1] + offset * (point1[0] - point2[0]) / L * midPointFactor;
        var out2y = point2[1] + offset * (point1[0] - point2[0]) / L * midPointFactor;
    }
    else{
        var out1x = point1[0];
        var out2x = point2[0];
        var out1y = point1[1];
        var out2y = point2[1];
    }
    return [[out1x, out1y], [out2x, out2y]];
}

function lengthToDegrees(distance, units) {
    return radiansToDegrees(lengthToRadians(distance, units));
}

function lengthToRadians(distance, units = "kilometers") {
    const factor = factors[units];
    if (!factor) { throw new Error(units + " units is invalid"); }
    return distance / factor;
}

function radiansToDegrees(radians) {
    const degrees = radians % (2 * Math.PI);
    return degrees * 180 / Math.PI;
}

function distanceInFeatureCollectionFurthestFromLine(fc, l) {
    let distancies = fc.features
        .map(x => x.geometry.coordinates)
        .flat(2)
        .map(x => (
            {
                distance : turf.pointToLineDistance(turf.point(x), l, {units: 'meters'}),
            }));
    let max = Math.max(...distancies.map(x => x.distance));

    return max;
} 

function flatten(arr) {
    return arr.reduce(function (flat, toFlatten) {
      return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
    }, []);
  }