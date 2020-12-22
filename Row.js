"use strict"

class Row {
    constructor() {
        this.lineFeature = new GeoLine();
        this.mainStroke = {};
        this.field = {};
        this.options = {};
    }

    atDisplay(display) {
        display(this.lineFeature.toRowFeature(this.options));
    }
}