import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [eventos, setEventos] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const cargarAgenda = async () => {
    try {
      const res = await fetch('/api/get-agenda');
      const data = await res.json();
      setEventos(data);
    } catch (e) {
      console.error("Error cargando agenda");
    }
  };

  useEffect(() => {
    cargarAgenda();
    const interval = setInterval(cargarAgenda, 600000); // 10 minutos
    return () => clearInterval(interval);
  }, []);

  const filtrados = eventos.filter(item => 
    item.tipo === 'FECHA' || 
    item.evento?.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.canales?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="container">
      <header>
        <h1>⚽ Agenda Deportiva</h1>
        <input 
          type="text" 
          placeholder="Buscar equipo o canal..." 
          className="search-bar"
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </header>

      <div className="tabla-container">
        <table>
          <tbody>
            {filtrados.map((item, index) => (
              item.tipo === 'FECHA' ? (
                <tr key={index} className="fila-fecha">
                  <td colSpan="3">{item.valor}</td>
                </tr>
              ) : (
                <tr key={index} className="fila-partido">
                  <td className="col-hora">{item.hora}</td>
                  <td className="col-evento">{item.evento}</td>
                  <td className="col-canales">{item.canales}</td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;