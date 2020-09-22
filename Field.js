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

    createTurnrow(width) {
        // Get selected features
        let selectedFeat = allFeatures.filter(x => selectedFeatures.includes(x.properties.id));

        // Create boundaries
        //let boundaries = selectedFeat.map(x => turf.lineOffset(x, -width, {units: 'meters'}));
        let boundaries = selectedFeat.map(x => lineOffsetFeature(x, -width, 'meters'));

        // Clip/prolonge boundaries
        let longBoundaries = boundaries.map(x => turf.transformScale(x, 30));
        let m = turf.featureCollection(allFeatures.concat(longBoundaries));

        let features = [];
        for(let i = 0; i < longBoundaries.length; i++){
            let centerOfLine = turf.center(longBoundaries[i]);
            let intersections = turf.lineIntersect(longBoundaries[i], m);

            if(intersections.features.length == 2){
            features.push(turf.lineString(intersections.features.map(x => x.geometry.coordinates), {'id': 'boundaries'}));
            }
            else if(intersections.features.length > 2){
            // Get all distancies and angles to them
            let vectors = intersections.features.map(x => (
                {
                bearing: turf.bearing(centerOfLine, x.geometry),
                distance: turf.distance(centerOfLine, x.geometry),
                point: x.geometry.coodinates
                }));
            let index1 = vectors.map(x => x.distance).indexOf(Math.min(...vectors.map(x => x.distance)));
            let oppositeAngle = vectors[index1].bearing > 0 ? vectors[index1].bearing - 180 : vectors[index1].bearing + 180;
            let index2 = vectors.map(x => x.distance).indexOf(Math.min(...vectors.filter(x =>  oppositeAngle+1 > x.bearing && oppositeAngle-1 < x.bearing).map(x => x.distance)));

            features.push(turf.lineString(
                [ 
                    intersections.features[index1].geometry.coordinates, 
                    intersections.features[index2].geometry.coordinates
                ], {'id': 'boundaries'}));
            }
        }
        return turf.featureCollection(features);
    }
}