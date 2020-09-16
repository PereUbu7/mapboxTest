class Field {
    rows = [];
    outerFeature = {};
    actualFeature = {};
    turnrowFeatures = [];

    constructor(turf) {
        this.turf = turf;
    }

    addOuterFeature(feature) {
        this.outerFeature = feature;
    }

    addRow(row) {
        if(row instanceof Row){
            this.rows.push(row);
            return this;
        }
        else{
            throw "addRow: 1st parameter must be of type Row";
        }
    }
}