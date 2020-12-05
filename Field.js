class Field {
    mainStrokes = [];
    outerFeature = {};
    actualFeature = {};
    turnrowFeatures = [];

    constructor(turf) {
        this.turf = turf;
    }

    get ActualFeature() {
        return this.actualFeature 
            && this.actualFeature.type 
            && this.actualFeature.type == 'FeatureCollection' ? this.actualFeature : this.outerFeature;
      }

    setOuterFeature(feature) {
        this.outerFeature = feature;
    }

    addMainStroke(stroke, rowWidth) {
        if(stroke instanceof MainStroke){
            this.mainStrokes.push(stroke);

            /* Create back reference from stroke to field */
            stroke.field = this;

            let newLines = this.getStrokesFromMainStroke(stroke.lineFeature, rowWidth);

            stroke.lines.push(...newLines);

            return this;
        }
        else{
            throw "addMainStroke: 1st parameter must be of type MainStroke";
        }
    }

    toDisplayFeatures(display) {
        for(let i = 0; i < this.mainStrokes.length; i++) {
            for(let j = 0; j < this.mainStrokes[i].lines.length; j++) {
                display(this.mainStrokes[i].lines[j]);
            }
        }
    }

    getStrokesFromMainStroke(mainStroke, rowWidth) {
        maxDistance = this.turf.distanceInFeatureCollectionFurthestFromLine(this.ActualFeature, mainStroke);
        current = -Math.floor(maxDistance / rowWidth);

        let lines = [];

        while (current * rowWidth <= maxDistance) {
            let currentLine = this.turf.lineOffsetFeature(mainStroke, current * rowWidth, 'meters');
            let intersections = turf.lineIntersect(this.ActualFeature, turf.transformScale(currentLine, 30));
            if (intersections.features.length == 2) {
                let choppedLine = turf.lineString([
                    intersections.features[0].geometry.coordinates,
                    intersections.features[1].geometry.coordinates
                ]);
                choppedLine.properties.id = 'template';
                lines.push(choppedLine);
            }
            else {
                // TODO
                console.log(intersections.features);
            }
            current += 1;
        }
        return lines;
    }

    createTurnrow(width) {
        // Get selected features
        let selectedFeat = allFeatures.filter(x => selectedFeatures.includes(x.properties.id));

        // Create boundaries
        //let boundaries = selectedFeat.map(x => turf.lineOffset(x, -width, {units: 'meters'}));
        let boundaries = selectedFeat.map(x => this.turf.lineOffsetFeature(x, -width, 'meters'));

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