import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Sub-component to fit map bounds to current polygon data
function MapAutoBounds({ data }) {
  const map = useMap();

  useEffect(() => {
    if (data && data.length > 0) {
      try {
        const bounds = [];
        data.forEach(item => {
          if (item.geojson) {
            const geojsonLayer = L.geoJSON(item.geojson);
            bounds.push(geojsonLayer.getBounds());
          }
        });
        
        if (bounds.length > 0) {
          const combinedBounds = bounds.reduce((acc, curr) => acc.extend(curr));
          map.fitBounds(combinedBounds, { padding: [50, 50], maxZoom: 16 });
        }
      } catch (err) {
        console.error('Error fitting bounds:', err);
      }
    }
  }, [data, map]);

  return null;
}

export default function MapComponent({ lahanData, height = '450px' }) {
  // Center of Indonesia as default fallback
  const defaultCenter = [-2.5, 118.0];
  const defaultZoom = 5;

  // Function to determine style of each polygon based on backend calculated status_color
  const getPolygonStyle = (feature, statusColor) => {
    let fillColor = '#dc2626'; // Red fallback (0%)
    let color = '#b91c1c';

    if (statusColor === 'green') {
      fillColor = '#16a34a'; // Green (>= 100%)
      color = '#15803d';
    } else if (statusColor === 'yellow') {
      fillColor = '#d97706'; // Yellow/Orange (0% < progress < 100%)
      color = '#b45309';
    }

    return {
      fillColor: fillColor,
      fillOpacity: 0.55,
      color: color,
      weight: 2,
      opacity: 0.9,
      dashArray: '3',
    };
  };

  const onEachFeature = (lahan, layer) => {
    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          fillOpacity: 0.75,
          weight: 3,
        });
      },
      mouseout: (e) => {
        const l = e.target;
        // Reset to default style
        l.setStyle({
          fillOpacity: 0.55,
          weight: 2,
        });
      }
    });
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-inner border border-slate-200" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {lahanData && lahanData.map((lahan) => {
          if (!lahan.geojson) return null;
          
          return (
            <GeoJSON
              key={lahan.id}
              data={lahan.geojson}
              style={(feature) => getPolygonStyle(feature, lahan.status_color)}
              onEachFeature={onEachFeature}
            >
              <Popup className="custom-popup">
                <div className="p-1 min-w-[180px]">
                  <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-1 mb-2">
                    {lahan.nama_blok}
                  </h4>
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Target RKAB:</span>
                      <span className="font-semibold text-slate-800">{Number(lahan.target_luas).toFixed(2)} Ha</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Realisasi Fisik:</span>
                      <span className="font-semibold text-slate-800">{Number(lahan.total_realisasi).toFixed(2)} Ha</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col">
                      <div className="flex justify-between text-xs font-bold">
                        <span>Progres Reklamasi:</span>
                        <span className={
                          lahan.progress_percentage >= 100 ? 'text-accentGreen-dark' :
                          lahan.progress_percentage > 0 ? 'text-accentGold' : 'text-accentRed'
                        }>
                          {Number(lahan.progress_percentage).toFixed(2)}%
                        </span>
                      </div>
                      
                      {/* Mini Progress Bar inside Popup */}
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            lahan.progress_percentage >= 100 ? 'bg-accentGreen' :
                            lahan.progress_percentage > 0 ? 'bg-accentGold' : 'bg-accentRed'
                          }`}
                          style={{ width: `${Math.min(100, lahan.progress_percentage)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </GeoJSON>
          );
        })}

        <MapAutoBounds data={lahanData} />
      </MapContainer>
    </div>
  );
}
