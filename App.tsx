
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GPSPoint } from './types';
import { generateSUIReport } from './services/geminiService';
import MapView from './components/MapView';

const App: React.FC = () => {
  const [operador, setOperador] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [points, setPoints] = useState<GPSPoint[]>([]);
  const [allLogs, setAllLogs] = useState<GPSPoint[]>([]);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [serverUrl, setServerUrl] = useState(localStorage.getItem('redecol_server_url') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('redecol_logs');
    if (saved) setAllLogs(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('redecol_logs', JSON.stringify(allLogs));
    localStorage.setItem('redecol_server_url', serverUrl);
  }, [allLogs, serverUrl]);

  const startTracking = useCallback(() => {
    if (!operador) {
      alert('Por favor, ingrese el nombre del operario.');
      return;
    }
    setIsTracking(true);
    setPoints([]);
    
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPoint: GPSPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString(),
          operador: operador
        };
        setPoints(prev => [...prev, newPoint]);
        setAllLogs(prev => [newPoint, ...prev].slice(0, 500));
      },
      (error) => alert('Error de GPS. Verifique permisos.'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [operador]);

  const stopTracking = useCallback(async () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);

    // Intento de sincronización automática si hay URL configurada
    if (serverUrl && points.length > 0) {
      syncWithCentralSystem();
    }
  }, [serverUrl, points]);

  const syncWithCentralSystem = async () => {
    if (!serverUrl) return;
    setSyncStatus('syncing');
    try {
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'ROUTE_COMPLETED',
          operador,
          data: points,
          timestamp: new Date().toISOString()
        })
      });
      if (response.ok) setSyncStatus('success');
      else setSyncStatus('error');
    } catch (e) {
      setSyncStatus('error');
    }
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  // Fix: Added handleGenerateAIReport to handle the AI report generation process.
  const handleGenerateAIReport = useCallback(async () => {
    if (points.length === 0) return;
    setIsGeneratingReport(true);
    setAiReport(null);
    try {
      const report = await generateSUIReport(points, operador);
      setAiReport(report);
    } catch (error) {
      console.error("AI Report error:", error);
      setAiReport("Error al procesar el reporte inteligente.");
    } finally {
      setIsGeneratingReport(false);
    }
  }, [points, operador]);

  const exportCSV = () => {
    const headers = "timestamp,operador,latitud,longitud\n";
    const csvContent = points.map(p => `${p.timestamp},${p.operador},${p.lat},${p.lng}`).join("\n");
    const blob = new Blob([headers + csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `REDECOL_${operador}_${new Date().getTime()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-blue-700 text-white p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded text-blue-700 font-black">RE</div>
          <h1 className="font-bold uppercase tracking-tight">REDECOL E.S.P</h1>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-blue-600 rounded-full transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      </header>

      {showSettings && (
        <div className="bg-white border-b p-4 animate-in slide-in-from-top">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">URL del Sistema Central (API/Webhook)</label>
          <input 
            type="text" 
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            className="w-full bg-slate-100 p-3 rounded-lg text-xs"
            placeholder="https://tu-sistema.com/api/recepcion"
          />
          <p className="text-[9px] text-slate-400 mt-2 italic">Si configuras esta URL, los datos se enviarán automáticamente al detener la ruta.</p>
        </div>
      )}

      <main className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <input 
              type="text" 
              value={operador}
              onChange={(e) => setOperador(e.target.value)}
              disabled={isTracking}
              className="w-full p-4 bg-slate-50 rounded-xl font-bold text-blue-900 border-none outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="Nombre del Reciclador..."
            />
            <div className="flex gap-2">
              {!isTracking ? (
                <button onClick={startTracking} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg">Iniciar Ruta</button>
              ) : (
                <button onClick={stopTracking} className="flex-1 bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg">Terminar y Sincronizar</button>
              )}
            </div>
          </div>
          <div className="bg-white h-[400px] lg:h-[550px] rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <MapView currentPoints={points} activeOperador={operador} />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
            <h2 className="text-sm font-bold mb-4 flex items-center justify-between">
              Analítica SUI
              {syncStatus !== 'idle' && (
                <span className={`text-[9px] px-2 py-1 rounded ${syncStatus === 'success' ? 'bg-green-500' : syncStatus === 'error' ? 'bg-red-500' : 'bg-blue-500 animate-pulse'}`}>
                  {syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'success' ? 'Sincronizado' : 'Error Sync'}
                </span>
              )}
            </h2>
            <button 
              onClick={handleGenerateAIReport}
              disabled={isGeneratingReport || points.length === 0}
              className="w-full bg-blue-600 py-3 rounded-xl font-bold text-sm mb-4 disabled:opacity-50"
            >
              {isGeneratingReport ? 'Procesando...' : 'Generar Evidencia IA'}
            </button>
            {aiReport && (
              <div className="bg-slate-800 p-4 rounded-xl text-[11px] mb-4 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {aiReport}
              </div>
            )}
            <button onClick={exportCSV} disabled={points.length === 0} className="w-full bg-slate-700 py-3 rounded-xl text-xs font-bold">Exportar CSV para Sistema</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
