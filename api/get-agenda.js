import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  try {
    const { data } = await axios.get('https://www.futbolenvivoargentina.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const $ = cheerio.load(data);
    const agenda = [];

    // Recorremos las filas de la tabla principal
    $('table.tablaPrincipal tr').each((i, el) => {
      const fila = $(el);

      // 1. DETECTAR FECHA (Usa la clase .cabeceraTabla que me pasaste)
      if (fila.hasClass('cabeceraTabla')) {
        const textoFecha = fila.find('td').text().trim();
        if (textoFecha) {
          agenda.push({ tipo: 'FECHA', valor: textoFecha.toUpperCase() });
        }
      } 
      
      // 2. DETECTAR PARTIDO (Fila estándar con hora)
      else if (fila.find('.hora').length > 0) {
        const hora = fila.find('.hora').text().trim();
        
        // Extraer Competición (la que está en el <span> o <label>)
        const competicion = fila.find('.detalles label').attr('title') || fila.find('.detalles img').attr('title');

        // Extraer Equipos (usando el title del span como ya hacíamos)
        const local = fila.find('.local span').attr('title') || fila.find('.local').text().trim();
        const visitante = fila.find('.visitante span').attr('title') || fila.find('.visitante').text().trim();
        
        // Extraer Canales (recorriendo la .listaCanales que vimos en tu código)
        const canales = [];
        fila.find('.listaCanales li').each((j, li) => {
          const nombreCanal = $(li).text().trim();
          if (nombreCanal) canales.push(nombreCanal);
        });

        // Validamos que tengamos los datos mínimos
        if (local && visitante && hora) {
          agenda.push({
            tipo: 'PARTIDO',
            hora: hora,
            competicion: competicion || "Fútbol",
            evento: `${local} vs ${visitante}`,
            canales: canales.join(' | ') || 'A confirmar'
          });
        }
      }
    });

    // Cache de 1 minuto para no saturar y que cargue rápido
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).json(agenda);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener los datos' });
  }
}