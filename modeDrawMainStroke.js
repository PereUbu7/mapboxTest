const ModeDrawMainStroke = {};

ModeDrawMainStroke.GetWidth = (x => {
    let value = document.querySelector("#bedWidth").value;
    return value;
})

ModeDrawMainStroke.onSetup = function(opts) {
    opts = opts || {};

    let line, currentVertexPosition, selectedField;
    let direction = 'forward';
    
    line = this.newFeature({
        type: 'Feature',
        properties: {},
        geometry: {
        type: 'LineString',
        coordinates: []
        }
    });

    currentVertexPosition = 0;
    selectedField = [];
    this.addFeature(line);
    
    this.clearSelectedFeatures();
    this.updateUIClasses({ mouse: 'Add' });
    this.activateUIButton('Line');
    this.setActionableState({
        trash: true
    });
    
    return {
        line,
        currentVertexPosition,
        direction,
        selectedField
    };
};

ModeDrawMainStroke.onStop = function(state) {
    doubleClickZoom.enable(this);
  
    this.activateUIButton();
  
    // check to see if we've deleted this feature
    if (this.getFeature(state.line.id) === undefined) return;
  
    // remove last added coordinate
    state.line.removeCoordinate('0');
    if (state.line.isValid()) {
      const lineGeoJson = state.line.toGeoJSON();
      // reconfigure the geojson line into a geojson point with a radius property
      const pointWithRadius = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: lineGeoJson.geometry.coordinates[0],
        },
      };
  
      this.map.fire('draw.create', {
        features: [pointWithRadius],
      });
    } else {
      this.deleteFeature([state.line.id], { silent: true });
      this.changeMode('simple_select', {}, { silent: true });
    }
  };

ModeDrawMainStroke.clickAnywhere = function(state, e) {
    if(!state.selectedField.some(x => x.selected)){
        let p = turf.point([e.lngLat.lng, e.lngLat.lat]);
        let t = fields.map(x => x.ActualFeature);
        let selectedFields = fields.filter(x => turf.booleanPointInPolygon(p, x.ActualFeature.features[0]));
        selectedFields.forEach(x => x.selected = true);
        state.selectedField = selectedFields;
        return null;
    }
    // this ends the drawing after the user creates a second point, triggering this.onStop
    if (state.currentVertexPosition === 1) {
      state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
      return this.changeMode('simple_select', { featureIds: [state.line.id] });
    }
    this.updateUIClasses({ mouse: 'add' });
    state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
    if (state.direction === 'forward') {
      state.currentVertexPosition += 1; // eslint-disable-line
      state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
    } else {
      state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
    }
  
    return null;
  };

ModeDrawMainStroke.onMouseMove = function(state, e) {
    state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
    this.updateUIClasses({ mouse: 'Pointer' });
};

ModeDrawMainStroke.onTap = ModeDrawMainStroke.onClick = function(state, e) {
    this.clickAnywhere(state, e);
};

ModeDrawMainStroke.toDisplayFeatures = function(state, geojson, display) {
    const isActiveLine = geojson.properties.id === state.line.id;
    geojson.properties.active = (isActiveLine) ? 'true' : 'false';
    if (!isActiveLine) return display(geojson);
  
    // Only render the line if it has at least one real coordinate
    if (geojson.geometry.coordinates.length < 2) return null;
    geojson.properties.meta = 'feature';
  
    // displays center vertex as a point feature
    display(createVertex(
      state.line.id,
      geojson.geometry.coordinates[state.direction === 'forward' ? geojson.geometry.coordinates.length - 2 : 1],
      `${state.direction === 'forward' ? geojson.geometry.coordinates.length - 2 : 1}`,
      false,
    ));
  
    // displays the line as it is drawn
    display(geojson);
    
    let templateStrokes = JSON.parse(JSON.stringify(geojson));
    maxDistance = distanceInFeatureCollectionFurthestFromLine(state.selectedField[0].ActualFeature, templateStrokes);
    current = -Math.floor(maxDistance / this.GetWidth());

    while(current * this.GetWidth() <= maxDistance){
        let currentLine = lineOffsetFeature(templateStrokes, current * this.GetWidth(), 'meters');
        let intersections = turf.lineIntersect(state.selectedField[0].ActualFeature, turf.transformScale(currentLine, 30));
        if(intersections.features.length == 2) {
            let choppedLine = turf.lineString([
                intersections.features[0].geometry.coordinates, 
                intersections.features[1].geometry.coordinates
            ]);
            choppedLine.properties.id = 'template';
            display(choppedLine);
        }
        else {
            console.log(intersections.features);
        }
        current += 1;
    }
  
    return null;
  };

  function createVertex(parentId, coordinates, path, selected) {
    return {
      type: 'Feature',
      properties: {
        meta: 'vertex',
        parent: parentId,
        coord_path: path,
        active: (selected) ? 'true' : 'false',
      },
      geometry: {
        type: 'Point',
        coordinates,
      },
    };
  }

  const doubleClickZoom = {
    enable: (ctx) => {
      setTimeout(() => {
        // First check we've got a map and some context.
        if (!ctx.map || !ctx.map.doubleClickZoom || !ctx._ctx || !ctx._ctx.store || !ctx._ctx.store.getInitialConfigValue) return;
        // Now check initial state wasn't false (we leave it disabled if so)
        if (!ctx._ctx.store.getInitialConfigValue('doubleClickZoom')) return;
        ctx.map.doubleClickZoom.enable();
      }, 0);
    },
  };