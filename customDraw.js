var map;
var draw;
mapboxgl.accessToken = 'Your_Mapbox_token';class Mapload extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      lat: 27.85380233830591,
      lng: 78.37183893820759,
      zoom: 8.5,
    }
    
    this.drawPolygon = this.drawPolygon.bind(this);
    this.createArea = this.createArea.bind(this);
    this.updateArea = this.updateArea.bind(this);
    this.showPolygonData = this.showPolygonData.bind(this);
    this.polygonDataCalc = this.polygonDataCalc.bind(this);}
  
    componentDidMount() {
        const { lat, lng, zoom } = this.state;
        map = new mapboxgl.Map({
            container: this.mapDiv,
            style: 'mapbox://styles/mapbox/streets-v9',
            center: [lng, lat],
            zoom: zoom
        });
        
        draw = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
                polygon: true,
                trash: true
            }
        });
        
       map.addControl(draw);
       
       map.on('draw.create', this.createArea);
       map.on('draw.delete', this.deleteArea);
       map.on('draw.update', this.updateArea);
   }
   
   drawPolygon(points) {
        map.addLayer({
            'id': 'maine',
            'type': 'fill',
            'source': {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Polygon',
                        'coordinates': points
                    }
                }
            },
            'layout': {},
            'paint': {
                'fill-color': '#088',
                'fill-opacity': 0.3
            }
        });
    }
    
     createArea(e) {
          let data = draw.getAll();
          const polygonData = data.features[0].geometry.coordinates;
          this.drawPolygon(polygonData);
          this.polygonDataCalc(data);
    }
    
    polygonDataCalc(data){
        let area = turf.area(data);
        let centroid = turf.centroid(data);
        let rounded_area = Math.round(area*100)/100;
        this.polygonDiv.innerHTML = '<p><strong>Area: ' + rounded_area + ' square meter</strong></p><h4>Centroid: <br />'+
            centroid.geometry.coordinates+'</h4>';
    }
    
    deleteArea(e) {
         let data = draw.getAll();
         map.removeLayer('maine').removeSource('maine');
    }updateArea(e) {
          let data = draw.getAll();
          map.removeLayer('maine').removeSource('maine');
          const polygonData = data.features[0].geometry.coordinates;
          this.drawPolygon(polygonData);
          this.polygonDataCalc(data);
    }
  
  render() {
    return (
      "<div>
        <div ref={e => this.mapDiv = e} className="map"></div>
        <div className='calculation-box'>
          <div id='calculated-area' ref={el => this.polygonDiv = el}></div>
        </div>
      </div>"
    )
  }
}ReactDOM.render(<Mapload />, document.querySelector("#app"))