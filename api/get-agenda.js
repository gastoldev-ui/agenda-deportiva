import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  try {
    const { data } = await axios.get('https://www.futbolenvivoargentina.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const $ = cheerio.load(data);
    const agenda = [];

    // Recorremos todas las filas de la tabla
    $('table.tablaPrincipal tr').each((i, el) => {
      const fila = $(el);

      // DETECTAR FECHA: Buscamos filas con clase 'fecha' o que tengan ese fondo azul (estilo de la web)
      // Muchas veces son celdas que dicen "Partidos de hoy..."
      if (fila.hasClass('fecha') || fila.find('td.fecha').length > 0 || fila.text().includes('Partidos de hoy')) {
        const textoFecha = fila.text().trim().split('\n')[0]; // Limpiamos ruidos
        if (textoFecha.length > 5) {
          agenda.push({ tipo: 'FECHA', valor: textoFecha.toUpperCase() });
        }
      } 
      // DETECTAR PARTIDO: Si tiene hora, es un partido
      else if (fila.find('.hora').length > 0) {
        const hora = fila.find('.hora').text().trim();
        const local = fila.find('.local span').attr('title') || fila.find('.local').text().trim();
        const visitante = fila.find('.visitante span').attr('title') || fila.find('.visitante').text().trim();
        
        const canales = [];
        fila.find('.canales li, .canales a').each((j, can) => {
          const txt = $(can).text().trim();
          if (txt && !canales.includes(txt)) canales.push(txt);
        });

        if (local && visitante && hora.includes(':')) {
          agenda.push({
            tipo: 'PARTIDO',
            hora: hora,
            evento: `${local} vs ${visitante}`,
            canales: canales.join(' | ') || 'A confirmar'
          });
        }
      }
    });

    // IMPORTANTE: No ordenamos por hora globalmente, porque romperíamos la agrupación por fecha.
    // Los datos ya vienen ordenados por día y hora desde la web.

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).json(agenda);
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
}