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
    var angle = Math.acos(
        Math.cos(point1[1]*Math.PI/180)*Math.cos(point1[0]*Math.PI/180) * Math.cos(point2[1]*Math.PI/180)*Math.cos(point2[0]*Math.PI/180)
    + Math.cos(point1[1]*Math.PI/180)*Math.sin(point1[0]*Math.PI/180) * Math.cos(point2[1]*Math.PI/180)*Math.sin(point2[0]*Math.PI/180)
    + Math.sin(point1[1]*Math.PI/180) * Math.sin(point2[1]*Math.PI/180));
    var L = angle*180/Math.PI;
    if(L > 0){
        var midPoint = [(point1[0] + point2[0])/2, (point1[1] + point2[1])/2];

        var out1x = point1[0] + offset * (point2[1] - point1[1]) / L / Math.cos(midPoint[1]*Math.PI/180);
        var out2x = point2[0] + offset * (point2[1] - point1[1]) / L / Math.cos(midPoint[1]*Math.PI/180);
        var out1y = point1[1] + offset * (point1[0] - point2[0]) / L * Math.cos(midPoint[1]*Math.PI/180);
        var out2y = point2[1] + offset * (point1[0] - point2[0]) / L * Math.cos(midPoint[1]*Math.PI/180);
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
