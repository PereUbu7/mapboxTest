let ModeSelectLine = {};

ModeSelectLine.onSetup = function(opts) {
    let state = {};
    state.count = opts.count || 0;

    return state;
  };

  ModeSelectLine.onClick = function(state, e) {
    console.log(state);
    console.log(e);
    if(e.featureTarget 
        && e.featureTarget._geometry
        && e.featureTarget._geometry.type) {
        console.log(e.featureTarget._geometry.type);
    }
  };

  ModeSelectLine.onKeyUp = function(state, e) {
    if (e.keyCode === 27) return this.changeMode('simple_select');
  };

  ModeSelectLine.toDisplayFeatures = function(state, geojson, display) {
    display(geojson);
  };