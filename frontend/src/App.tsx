import MapView from './components/MapView';

export default function App() {
  return (
    <div className="w-screen h-screen">
      <MapView activeLayers={[]} onMapClick={() => {}} onPolygonDraw={() => {}} candidatePins={[]} />
    </div>
  );
}
