import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  try {
    const { data } = await axios.get('https://www.futbolenvivoargentina.com/deporte', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const $ = cheerio.load(data);
    const grupos = {};
    let fechaActual = "";

    $('table.tablaPrincipal tr').each((i, el) => {
      const fila = $(el);

      if (fila.hasClass('cabeceraTabla')) {
        fechaActual = fila.find('td').text().trim().toUpperCase();
        if (!grupos[fechaActual]) grupos[fechaActual] = [];
      } 
      else if (fila.find('.hora').length > 0) {
        const deporte = fila.find('.detalles img').attr('title') || "Deporte";

        // Filtramos para quitar fútbol de esta sección
        if (deporte.toLowerCase().includes('fútbol') || deporte.toLowerCase().includes('soccer')) return;

        const hora = fila.find('.hora').text().trim();
        const local = fila.find('.local span').attr('title') || fila.find('.local').text().trim();
        const visitante = fila.find('.visitante span').attr('title') || fila.find('.visitante').text().trim();
        
        const canales = [];
        fila.find('.listaCanales li').each((j, li) => {
          const txt = $(li).text().trim();
          if (txt) canales.push(txt);
        });

        if (local && visitante && hora && fechaActual) {
          grupos[fechaActual].push({
            tipo: 'PARTIDO',
            hora,
            deporte,
            evento: `${local} vs ${visitante}`,
            canales: canales.join(' | ') || 'A confirmar'
          });
        }
      }
    });

    const agendaFinal = [];
    Object.keys(grupos).forEach(fecha => {
      agendaFinal.push({ tipo: 'FECHA', valor: fecha });
      const ordenados = grupos[fecha].sort((a, b) => a.hora.localeCompare(b.hora));
      agendaFinal.push(...ordenados);
    });

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).json(agendaFinal);
  } catch (e) {
    res.status(500).json({ error: 'Error en Deportes' });
  }
}