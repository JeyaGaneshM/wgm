import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

// 🪦 List of graves
const graves = [
  { lat: 12.972442, lng: 77.580643, name: "John Doe", age: 75 },
  { lat: 12.975000, lng: 77.582500, name: "Mary Smith", age: 68 },
  { lat: 12.970800, lng: 77.584200, name: "Robert Lee", age: 82 },
  { lat: 12.971500, lng: 77.578900, name: "Linda Johnson", age: 70 },
  { lat: 12.974300, lng: 77.579800, name: "Michael Brown", age: 77 },
];

function Routing({ start, end }: { start: L.LatLngExpression, end: L.LatLngExpression | null }) {
  const map = useMap();
  const routingRef = useRef<L.Routing.Control | null>(null);
  const navButtonRef = useRef<L.Control | null>(null);

  useEffect(() => {
    if (!end) return;

    if (!routingRef.current) {
      routingRef.current = L.Routing.control({
        waypoints: [
          L.latLng(start),
          L.latLng(end),
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        createMarker: () => null,
      }).addTo(map);

      routingRef.current.on('routeselected', () => {
        const container = document.querySelector(
          '.leaflet-routing-container'
        ) as HTMLElement;
        if (container && !container.querySelector('.custom-close-btn')) {
          const btn = document.createElement('button');
          btn.innerHTML = '×';
          btn.className = 'custom-close-btn';
          btn.style.cssText = `
            position:absolute;
            top:4px;
            right:4px;
            background:#fff;
            border:none;
            font-size:18px;
            cursor:pointer;
          `;
          btn.onclick = () => {
            container.style.display = 'none';
            showNavIcon();
          };
          container.style.position = 'relative';
          container.appendChild(btn);
        }
      });
    } else {
      routingRef.current.setWaypoints([
        L.latLng(start),
        L.latLng(end),
      ]);
    }

    function showNavIcon() {
      if (navButtonRef.current) return;

      const NavButton = L.Control.extend({
        onAdd: function () {
          const btn = L.DomUtil.create('button', 'reopen-nav-btn');
          btn.innerHTML = '🧭';
          btn.style.cssText = `
            background:white;
            border:none;
            font-size:20px;
            padding:5px;
            cursor:pointer;
          `;
          btn.onclick = () => {
            const container = document.querySelector(
              '.leaflet-routing-container'
            ) as HTMLElement;
            if (container) {
              container.style.display = 'block';
              map.removeControl(navButtonRef.current!);
              navButtonRef.current = null;
            }
          };
          return btn;
        }
      });

      navButtonRef.current = new NavButton({ position: 'topright' });
      map.addControl(navButtonRef.current);
    }

  }, [start, end, map]);

  return null;
}

function App() {
  // const [userPos, setUserPos] = useState<L.LatLngExpression | null>(null);
  const [userPos, setUserPos] = useState<L.LatLngExpression>([12.9728512, 77.5815168]);
  const [selectedGrave, setSelectedGrave] = useState<L.LatLngExpression | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // useEffect(() => {
  //   if (!navigator.geolocation) {
  //     alert("Geolocation is not supported by your device.");
  //     return;
  //   }

  //   const watchId = navigator.geolocation.watchPosition(
  //     (pos) => {
  //       const newPos: L.LatLngExpression = [
  //         pos.coords.latitude,
  //         pos.coords.longitude,
  //       ];
  //       setUserPos(newPos);
  //       console.log('lat:'+pos.coords.latitude);
  //       console.log('long:'+pos.coords.longitude);
  //     },
  //     (err) => {
  //       console.error("Location error:", err);
  //       alert("Unable to get your location");
  //     },
  //     { enableHighAccuracy: true, maximumAge: 0 }
  //   );

  //   return () => navigator.geolocation.clearWatch(watchId);
  // }, []);
  
  

  const filteredGraves = graves.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      {/* 🔍 Search bar */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'white',
        padding: '5px',
        borderRadius: '5px',
        boxShadow: '0px 2px 6px rgba(0,0,0,0.3)'
      }}>
        <input
          type="text"
          placeholder="Search grave by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '5px', width: '200px' }}
        />
        {searchTerm && (
          <div style={{
            background: 'white',
            maxHeight: '150px',
            overflowY: 'auto',
            marginTop: '5px',
            border: '1px solid #ccc',
            borderRadius: '5px'
          }}>
            {filteredGraves.length > 0 ? (
              filteredGraves.map((grave, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '5px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee'
                  }}
                  onClick={() => {
                    setSelectedGrave([grave.lat, grave.lng]);
                    setSearchTerm('');
                  }}
                >
                  {grave.name} (Age: {grave.age})
                </div>
              ))
            ) : (
              <div style={{ padding: '5px', color: 'gray' }}>No results</div>
            )}
          </div>
        )}
      </div>

      {userPos && (
        <MapContainer
          center={userPos}
          zoom={18}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />

          {/* 🟢 Your location */}
          <Marker position={userPos}>
            <Popup>You are here</Popup>
          </Marker>

          {/* 🪦 Multiple grave markers */}
          {graves.map((grave, idx) => (
            <Marker
              key={idx}
              position={[grave.lat, grave.lng]}
              eventHandlers={{
                click: () => setSelectedGrave([grave.lat, grave.lng]),
              }}
            >
              <Popup>
                <b>{grave.name}</b><br />
                Age: {grave.age}<br />
                <button onClick={() => setSelectedGrave([grave.lat, grave.lng])}>
                  Go Here
                </button>
              </Popup>
            </Marker>
          ))}

          {/* Route to selected grave */}
          {selectedGrave && <Routing start={userPos} end={selectedGrave} />}
        </MapContainer>
      )}
    </div>
  );
}

export default App;
