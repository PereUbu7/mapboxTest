const MyTurf = {};

MyTurf.earthRadius = 6371008.8;

MyTurf.factors = {
    centimeters: MyTurf.earthRadius * 100,
    centimetres: MyTurf.earthRadius * 100,
    degrees: MyTurf.earthRadius / 111325,
    feet: MyTurf.earthRadius * 3.28084,
    inches: MyTurf.earthRadius * 39.370,
    kilometers: MyTurf.earthRadius / 1000,
    kilometres: MyTurf.earthRadius / 1000,
    meters: MyTurf.earthRadius,
    metres: MyTurf.earthRadius,
    miles: MyTurf.earthRadius / 1609.344,
    millimeters: MyTurf.earthRadius * 1000,
    millimetres: MyTurf.earthRadius * 1000,
    nauticalmiles: MyTurf.earthRadius / 1852,
    radians: 1,
    yards: MyTurf.earthRadius / 1.0936,
};

MyTurf.lineOffsetFeature = function(line, distance, units) {
    var segments = [];
    var offsetDegrees = MyTurf.lengthToDegrees(distance, units);
    var coords = turf.getCoords(line);
    var finalCoords = [];
    coords.forEach(function (currentCoords, index) {
        if (index !== coords.length - 1) {
            var segment = MyTurf.processSegment(currentCoords, coords[index + 1], offsetDegrees);
            segments.push(segment);
            if (index > 0) {
                var seg2Coords = segments[index - 1];
                var intersects = MyTurf.intersection(segment, seg2Coords);

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

MyTurf.processSegment = function(point1, point2, offset) {
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

MyTurf.lengthToDegrees = function(distance, units) {
    return MyTurf.radiansToDegrees(MyTurf.lengthToRadians(distance, units));
}

MyTurf.lengthToRadians = function(distance, units = "kilometers") {
    const factor = MyTurf.factors[units];
    if (!factor) { throw new Error(units + " units is invalid"); }
    return distance / factor;
}

MyTurf.radiansToDegrees = function(radians) {
    const degrees = radians % (2 * Math.PI);
    return degrees * 180 / Math.PI;
}

MyTurf.distanceInFeatureCollectionFurthestFromLine = function(fc, l) {
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

MyTurf.flatten = function(arr) {
    return arr.reduce(function (flat, toFlatten) {
      return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
    }, []);
  }

  MyTurf.intersection = function(a, b) {
    if (MyTurf.isParallel(a, b)) return false;
    return MyTurf.intersectSegments(a, b);
}

MyTurf.isParallel = function(a, b) {
    var r = MyTurf.ab(a);
    var s = MyTurf.ab(b);
    return (MyTurf.crossProduct(r, s) === 0);
}

MyTurf.intersectSegments = function(a, b) {
    var p = a[0];
    var r = MyTurf.ab(a);
    var q = b[0];
    var s = MyTurf.ab(b);

    var cross = MyTurf.crossProduct(r, s);
    var qmp = MyTurf.sub(q, p);
    var numerator = MyTurf.crossProduct(qmp, s);
    var t = numerator / cross;
    var intersection = MyTurf.add(p, MyTurf.scalarMult(t, r));
    return intersection;
}

MyTurf.crossProduct = function(v1, v2) {
    return (v1[0] * v2[1]) - (v2[0] * v1[1]);
}

MyTurf.add = function(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1]];
}

MyTurf.sub = function(v1, v2) {
    return [v1[0] - v2[0], v1[1] - v2[1]];
}

MyTurf.ab = function(segment) {
    var start = segment[0];
    var end = segment[1];
    return [end[0] - start[0], end[1] - start[1]];
}

MyTurf.scalarMult = function(s, v) {
    return [s * v[0], s * v[1]];
}