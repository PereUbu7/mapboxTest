"use strict"

Object.defineProperty(GeoLine.prototype, "toRowFeature", {
    value: function toRowFeature(options) {
        return {
            type: "Feature",
            geometry: {
                type: "Line",
                coordinates: [
                    this.Points()[0].Coords(),
                    this.Points()[1].Coords()
                ]
            },
            properties: GeoStyle.Row(options)
        };
    },
    writable: true,
    configurable: true
});