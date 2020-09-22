const ModeDrawMainStroke = {};

ModeDrawMainStroke.GetWidth = (x => {
    let value = document.querySelector("#bedWidth").value;
    return value;
})

ModeDrawMainStroke.onSetup = function(opts) {
    opts = opts || {};
    const featureId = opts.featureId;

    let line, currentVertexPosition;
    let direction = 'forward';
    
    if (featureId) {
        line = this.getFeature(featureId);
        if (!line) {
          throw new Error('Could not find a feature with the provided featureId');
        }
        let from = opts.from;
        if (from && from.type === 'Feature' && from.geometry && from.geometry.type === 'Point') {
          from = from.geometry;
        }
        if (from && from.type === 'Point' && from.coordinates && from.coordinates.length === 2) {
          from = from.coordinates;
        }
        if (!from || !Array.isArray(from)) {
          throw new Error('Please use the `from` property to indicate which point to continue the line from');
        }
        const lastCoord = line.coordinates.length - 1;
        if (line.coordinates[lastCoord][0] === from[0] && line.coordinates[lastCoord][1] === from[1]) {
          currentVertexPosition = lastCoord + 1;
          // add one new coordinate to continue from
          line.addCoordinate(currentVertexPosition, ...line.coordinates[lastCoord]);
        } else if (line.coordinates[0][0] === from[0] && line.coordinates[0][1] === from[1]) {
          direction = 'backwards';
          currentVertexPosition = 0;
          // add one new coordinate to continue from
          line.addCoordinate(currentVertexPosition, ...line.coordinates[0]);
        } else {
          throw new Error('`from` should match the point at either the start or the end of the provided LineString');
        }
      } else {
        line = this.newFeature({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        });
        currentVertexPosition = 0;
        this.addFeature(line);
      }

      this.clearSelectedFeatures();
      this.updateUIClasses({ mouse: 'Add' });
      this.activateUIButton('Line');
      this.setActionableState({
        trash: true
      });
    
      return {
        line,
        currentVertexPosition,
        direction
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
    
    for(let i = -50; i < 50; i++){
        display(lineOffsetFeature(geojson, i*this.GetWidth(), 'meters'));
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