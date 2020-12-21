class GeoPoint {
    lon = 0;
    lat = 0;

    Lon(lon) {
        if(lon !== undefined) {
            this.lon = lon;
        }
        return this.lon;
    }

    Lat(lat) {
        if(lat !== undefined) {
            this.lat = lat;
        }
        return this.lat;
    }

    Coord(coord) {
        if(Array.isArray(coord) && coord.length == 2)
        {
            this.lon = coord[0];
            this.lat = coord[1];
        }
        return coord;
    }

    constructor(lon, lat) {
        if (lon===undefined) {}
        else { this.lon = lon; }

        if(lat===undefined) {}
        else { this.lat = lat; }
    }
}