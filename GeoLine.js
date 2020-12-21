"use strict"

class GeoLine {
    points = [new GeoPoint(), new GeoPoint()];

    Points(p) {
        if(p instanceof Array 
            && p.length == 2
            && p[0] instanceof GeoPoint
            && p[1] instanceof GeoPoint) {
                this.points = p;
            }
        else if(arguments.length === 2
            && arguments[0] instanceof GeoPoint
            && arguments[1] instanceof GeoPoint) {
                this.points = [arguments[0], arguments[1]];
            }
        return this.points;
    }
}