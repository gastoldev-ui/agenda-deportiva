import { useEffect, useState, useCallback } from 'react';
import './App.css';

function App() {
  const [eventos, setEventos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [seccion, setSeccion] = useState("get-agenda"); 
  const [cargando, setCargando] = useState(true);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch(`/api/${seccion}`);
      const data = await res.json();
      setEventos(data);
    } catch (e) {
      console.error("Error cargando datos");
    } finally {
      setCargando(false);
    }
  }, [seccion]);

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 600000);
    return () => clearInterval(interval);
  }, [cargarDatos]);

  // Filtrado inteligente: Equipos, Canales o Deporte
  const filtrados = eventos.filter(item => {
    if (item.tipo === 'FECHA') return true;
    const t = busqueda.toLowerCase();
    return (
      item.evento?.toLowerCase().includes(t) || 
      item.canales?.toLowerCase().includes(t) ||
      item.deporte?.toLowerCase().includes(t)
    );
  });

  return (
    <div className="container">
      <header>
        <h1>{seccion === 'get-agenda' ? '⚽ Agenda Fútbol' : '🏀 Polideportivo'}</h1>
        
        <div className="tab-container">
          <button className={seccion === 'get-agenda' ? 'active' : ''} onClick={() => setSeccion('get-agenda')}>Fútbol</button>
          <button className={seccion === 'get-deportes' ? 'active' : ''} onClick={() => setSeccion('get-deportes')}>Otros Deportes</button>
        </div>

        <input 
          type="text" 
          placeholder="Buscar equipo, canal o deporte (Tenis, F1...)" 
          className="search-bar"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </header>

      <div className="tabla-container">
        <table>
          <tbody>
            {filtrados.map((item, index) => {
              if (item.tipo === 'FECHA') {
                // Solo mostrar la fecha si tiene partidos debajo después del filtro
                const indexSiguienteFecha = filtrados.slice(index + 1).findIndex(f => f.tipo === 'FECHA');
                const partidosEnBloque = indexSiguienteFecha === -1 
                  ? filtrados.slice(index + 1) 
                  : filtrados.slice(index + 1, index + 1 + indexSiguienteFecha);

                if (partidosEnBloque.length === 0) return null;

                return (
                  <tr key={`fecha-${index}`} className="fila-fecha">
                    <td colSpan="3">{item.valor}</td>
                  </tr>
                );
              }

              return (
                <tr key={`partido-${index}`} className="fila-partido">
                  <td className="col-hora">{item.hora}</td>
                  <td className="col-evento">
                    {seccion === 'get-deportes' && <span className="badge-deporte">{item.deporte}</span>}
                    {item.evento}
                  </td>
                  <td className="col-canales">{item.canales}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;