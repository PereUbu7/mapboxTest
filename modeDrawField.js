//const ModeDrawField = Object.assign({}, MapboxDraw.modes.draw_polygon);
//const ModeDrawField = JSON.parse(JSON.stringify(MapboxDraw.modes.draw_polygon));


const ModeDrawField = MapboxDraw.modes.draw_polygon;
ModeDrawField.onStopParent = ModeDrawField.onStop;

ModeDrawField.convertDrawToLayer = function () {
    // Take all points from all polygons
    let t = draw.getAll()
        .features
        .filter(x => x.geometry.type == 'Polygon')
        .map(x => turf.rewind(x))
        .map(x => x.geometry.coordinates)
        .flat(2);

    // Create lineString features from every pair of points
    features = [];
    for (let i = 0; i < t.length - 1; i++) {
        let lineString = turf.lineString(t.slice(i, i + 2));
        lineString.properties.id = i + allFeatures.length;
        features.push(lineString);
    }

    // Add new features to total collection of features
    allFeatures = allFeatures.concat(features);

    // Create a feature collection object
    let featureCollection = turf.featureCollection(allFeatures);

    if (map.getSource('linesToSelect')) {
        map.removeLayer('linesToSelect');
        map.removeLayer('linesToSelect-highlighted');
        map.removeSource('linesToSelect');
    }

    map.addSource('linesToSelect', { type: 'geojson', data: featureCollection });

    if (!map.getLayer('linesToSelect')) {
        map.addLayer({
            id: 'linesToSelect',
            type: 'line',
            source: 'linesToSelect',
            'paint': {
                'line-color': '#ed6498',
                'line-width': 3,
                'line-opacity': 0.8
            }
        });
    }

    if (!map.getLayer('linesToSelect-highlighted')) {
        map.addLayer({
            id: 'linesToSelect-highlighted',
            type: 'line',
            source: 'linesToSelect',
            'paint': {
                'line-color': '#ffffff',
                'line-width': 5,
                'line-opacity': 1
            },
            filter: ['in', 'id', '']
        });
    };

    draw.deleteAll();

    return features;
}

ModeDrawField.onStop = function (state) {
    /* TODO */
    if(draw.getAll()
        .features
        .filter(x => x.geometry.type == 'Polygon' && x.geometry.coordinates[0].length > 2).length == 0)
        return;

    let newField = new Field(MyTurf);
    newField.setOuterFeature(draw.getAll());
    fields.push(newField);

    updateArea(null);
    
    this.convertDrawToLayer();
}

function updateArea(e) {
    var data = draw.getAll();
    console.log(data);
    var answer = document.getElementById('calculated-area');
    if (data.features.length > 0) {
        var area = turf.area(data);
        // restrict to area to 2 decimal points
        var rounded_area = Math.round(area * 100) / 100;
        answer.innerHTML =
            '<p><strong>' +
            rounded_area +
            '</strong></p><p>square meters</p>';
    } else {
        answer.innerHTML = '';
        if (e.type !== 'draw.delete')
            alert('Use the draw tools to draw a polygon!');
    }
}

