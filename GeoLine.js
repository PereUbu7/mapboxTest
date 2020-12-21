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
        return this.points;
    }
}