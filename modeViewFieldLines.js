const ModeViewFieldLines = {};


ModeViewFieldLines.onSetup = function(opts) {
    opts = opts || {};


    
    this.clearSelectedFeatures();
    this.updateUIClasses({ mouse: 'Add' });
    this.activateUIButton('Line');
    this.setActionableState({
        trash: true
    });
    
    return {};
};

ModeViewFieldLines.onStop = function(state) {
    doubleClickZoom.enable(this);
  
    this.activateUIButton();
  
    //this.changeMode('simple_select', {}, { silent: true });
  };

  ModeViewFieldLines.clickAnywhere = function(state, e) {
    return null;
  };

  ModeViewFieldLines.onMouseMove = function(state, e) {
    this.updateUIClasses({ mouse: 'Pointer' });
};

ModeViewFieldLines.onTap = ModeDrawMainStroke.onClick = function(state, e) {
    this.clickAnywhere(state, e);
};

ModeViewFieldLines.toDisplayFeatures = function(state, geojson, display) {
    display(geojson);
    
    for(let f = 0; f < fields.length; f++) {
      fields[f].toDisplayFeatures(display);
    }

    return null;
  };
