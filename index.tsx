import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

interface Point {
  lat: number;
  lng: number;
  time: string;
}

const App = () => {
  const [operator, setOperator] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const watchId = useRef<number | null>(null);
  const mapRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const mapContainer = document.querySelector('.leaflet-container');
    if (mapContainer && !mapRef.current) {
      // @ts-ignore
      mapRef.current = L.map(mapContainer, { zoomControl: false }).setView([7.0653, -73.8547], 15);
      // @ts-ignore
      L.tileLayer('https://{s}.tile.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    if (mapRef.current && points.length > 0) {
      const coords = points.map(p => [p.lat, p.lng]);
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(coords);
      } else {
        // @ts-ignore
        polylineRef.current = L.polyline(coords, { color: '#2563eb', weight: 6 }).addTo(mapRef.current);
      }
      
      const last = coords[coords.length - 1];
      if (markerRef.current) {
        markerRef.current.setLatLng(last);
      } else {
        // @ts-ignore
        markerRef.current = L.circleMarker(last, { radius: 8, color: '#fff', fillColor: '#2563eb', fillOpacity: 1, weight: 3 }).addTo(mapRef.current);
      }
      mapRef.current.panTo(last);
    }
  }, [points]);

  const toggleTracking = () => {
    if (!operator) return alert('Ingresa el nombre del operario');
    
    if (isTracking) {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      setIsTracking(false);
    } else {
      setPoints([]);
      setReport(null);
      setIsTracking(true);
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          setPoints(prev => [...prev, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            time: new Date().toLocaleTimeString()
          }]);
        },
        (err) => alert('Error GPS. Activa la ubicación.'),
        { enableHighAccuracy: true }
      );
    }
  };

  const generateAIReport = async () => {
    if (points.length === 0) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Genera un reporte técnico de ruta para REDECOL E.S.P. Operario: ${operator}. Puntos recorridos: ${JSON.stringify(points)}. Valida cumplimiento del Decreto 1381 de 2024.`
      });
      setReport(response.text);
    } catch (e) {
      setReport("Error generando reporte inteligente.");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const csv = "Hora,Latitud,Longitud\n" + points.map(p => `${p.time},${p.lat},${p.lng}`).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ruta_${operator}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col flex-1 max-w-md mx-auto w-full bg-slate-50 min-h-screen">
      <header className="bg-blue-600 p-5 text-white shadow-lg flex justify-between items-center">
        <div>
          <h1 className="font-black text-lg tracking-tighter uppercase">REDECOL E.S.P</h1>
          <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Control GPS</p>
        </div>
        {isTracking && <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse shadow-lg" />}
      </header>

      <main className="p-4 flex flex-col gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <input 
            type="text" 
            placeholder="Nombre del operario" 
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            disabled={isTracking}
            className="w-full mb-4 p-4 bg-slate-50 rounded-2xl font-bold text-blue-900 border-none outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={toggleTracking}
            className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 ${isTracking ? 'bg-red-500 shadow-red-200' : 'bg-blue-600 shadow-blue-200'} text-white`}
          >
            {isTracking ? 'Detener Seguimiento' : 'Iniciar Seguimiento'}
          </button>
        </div>

        <div className="h-80 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl relative bg-slate-200">
          <div className="leaflet-container h-full w-full" />
          <div className="absolute bottom-4 right-4 z-[500] bg-white/90 backdrop-blur px-3 py-1 rounded-xl shadow-sm border border-white text-[10px] font-black text-blue-600 uppercase">
            {points.length} Puntos
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={exportCSV} disabled={points.length === 0 || isTracking} className="bg-slate-800 text-white font-bold py-4 rounded-2xl disabled:opacity-20 uppercase text-[10px] tracking-widest transition-all">Exportar CSV</button>
          <button onClick={generateAIReport} disabled={points.length === 0 || isTracking || loading} className="bg-blue-100 text-blue-700 font-black py-4 rounded-2xl disabled:opacity-20 uppercase text-[10px] tracking-widest transition-all">
            {loading ? '...' : 'Evidencia IA'}
          </button>
        </div>

        {report && (
          <div className="bg-white p-5 rounded-[2rem] border border-blue-50 shadow-sm animate-pulse-once">
            <h3 className="text-[10px] font-black text-blue-600 uppercase mb-2">Análisis de Cumplimiento</h3>
            <p className="text-sm text-slate-600 leading-relaxed italic">{report}</p>
          </div>
        )}
      </main>

      <footer className="mt-auto p-6 text-center">
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">REDECOL • 2024</p>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
