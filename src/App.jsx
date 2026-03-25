import { useEffect, useState, useCallback } from 'react';
import './App.css';

function App() {
  const [eventos, setEventos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  // Definimos la función de carga de forma estable con useCallback
  const cargarAgenda = useCallback(async () => {
    try {
      // El fetch apunta a la Serverless Function de Vercel en /api
      const res = await fetch('/api/get-agenda');
      if (!res.ok) throw new Error('Error en la respuesta de la API');
      
      const data = await res.json();
      setEventos(data);
      setCargando(false);
    } catch (e) {
      console.error("Error al obtener la agenda:", e);
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // Primera carga al montar el componente
    cargarAgenda();

    // Configuramos el intervalo de actualización automática (10 minutos)
    const interval = setInterval(() => {
      cargarAgenda();
    }, 600000);

    // Limpieza al desmontar el componente para evitar fugas de memoria
    return () => clearInterval(interval);
  }, [cargarAgenda]);

  // Lógica de filtrado: mantenemos las FECHAS siempre visibles 
  // o filtramos PARTIDOS por nombre de equipo o canal
  const filtrados = eventos.filter(item => {
    if (item.tipo === 'FECHA') return true;
    
    const termino = busqueda.toLowerCase();
    return (
      item.evento?.toLowerCase().includes(termino) ||
      item.canales?.toLowerCase().includes(termino)
    );
  });

  return (
    <div className="container">
      <header>
        <h1>⚽ Agenda Deportiva</h1>
        <input 
          type="text" 
          placeholder="Buscar equipo o canal (Boca, ESPN...)" 
          className="search-bar"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {cargando && <p className="status-text">Actualizando datos...</p>}
      </header>

      <div className="tabla-container">
        <table>
          <tbody>
            {filtrados.length > 0 ? (
              filtrados.map((item, index) => (
                item.tipo === 'FECHA' ? (
                  <tr key={`fecha-${index}`} className="fila-fecha">
                    <td colSpan="3">{item.valor}</td>
                  </tr>
                ) : (
                  <tr key={`partido-${index}`} className="fila-partido">
                    <td className="col-hora">{item.hora}</td>
                    <td className="col-evento">{item.evento}</td>
                    <td className="col-canales">{item.canales}</td>
                  </tr>
                )
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                  {cargando ? "Cargando partidos..." : "No se encontraron eventos."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;