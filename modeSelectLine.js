const ModeSelectLine = {};

ModeSelectLine.onSetup = function(opts) {
    let state = {};
    state.count = opts.count || 0;

    return state;
  };

  ModeSelectLine.onClick = function(state, e) {
    console.log(e);
        document.querySelector("#currentPosition").innerHTML = "X:" + e.point.x + " Y:" + e.point.y;

        var bbox = [
          [e.point.x - 10, e.point.y - 10],
          [e.point.x + 10, e.point.y + 10]
        ];
        var features = map.queryRenderedFeatures(bbox, {
          layers: ['linesToSelect']
        });

        selectedIds = features.map(x => x.properties.id);

        if(selectedFeatures.some(x => selectedIds.includes(x)))
        {
          selectedFeatures = selectedFeatures.filter(x => !selectedIds.includes(x));
        }
        else
        {
          selectedFeatures = selectedFeatures.concat(selectedIds);
        }

        var filter = ['in', 'id'].concat(selectedFeatures);

        map.setFilter('linesToSelect-highlighted', filter);

        createTurnAreaBoundary(document.querySelector("#turnAreaWidth").value);
        console.log(features);
  };

  ModeSelectLine.onKeyUp = function(state, e) {
    if (e.keyCode === 27) return this.changeMode('draw_polygon');
  };

  ModeSelectLine.toDisplayFeatures = function(state, geojson, display) {
    display(geojson);
  };

function createTurnAreaBoundary(width)
{
  // TODO: This always uses first field - we must know what field is being selected
  let featureCollection = fields[0].createTurnrow(width);

  if(map.getSource('boundaries')){
        map.removeLayer('boundaries');
        map.removeSource('boundaries');
      }
      
      map.addSource('boundaries', {type: 'geojson', data: featureCollection});
      
      if(!map.getLayer('boundaries')){
        map.addLayer({
          id: 'boundaries',
          type: 'line',
          source: 'boundaries',
          'paint': {
            'line-color': '#d4ad72',
            'line-width': 3,
            'line-opacity': 0.8,
            'line-dasharray': [1, 1]
          }
        });
      }
}