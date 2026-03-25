import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  try {
    const { data } = await axios.get('https://www.futbolenvivoargentina.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const $ = cheerio.load(data);
    const grupos = {}; // Objeto para agrupar: { "FECHA": [partidos...] }
    let fechaActual = "SIN FECHA";

    $('table.tablaPrincipal tr').each((i, el) => {
      const fila = $(el);

      if (fila.hasClass('cabeceraTabla')) {
        fechaActual = fila.find('td').text().trim().toUpperCase();
        if (!grupos[fechaActual]) grupos[fechaActual] = [];
      } 
      else if (fila.find('.hora').length > 0) {
        const hora = fila.find('.hora').text().trim();
        const local = fila.find('.local span').attr('title') || fila.find('.local').text().trim();
        const visitante = fila.find('.visitante span').attr('title') || fila.find('.visitante').text().trim();
        
        const canales = [];
        fila.find('.listaCanales li').each((j, li) => {
          const txt = $(li).text().trim();
          if (txt) canales.push(txt);
        });

        if (local && visitante && hora) {
          if (!grupos[fechaActual]) grupos[fechaActual] = [];
          grupos[fechaActual].push({
            tipo: 'PARTIDO',
            hora,
            evento: `${local} vs ${visitante}`,
            canales: canales.join(' | ') || 'A confirmar'
          });
        }
      }
    });

    // Ahora armamos la lista final ordenada
    const agendaFinal = [];
    Object.keys(grupos).forEach(fecha => {
      // 1. Agregamos la cabecera de la fecha
      agendaFinal.push({ tipo: 'FECHA', valor: fecha });

      // 2. Ordenamos los partidos de ESA fecha por hora
      const partidosOrdenados = grupos[fecha].sort((a, b) => {
        return a.hora.localeCompare(b.hora);
      });

      // 3. Los metemos en la lista final
      agendaFinal.push(...partidosOrdenados);
    });

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).json(agendaFinal);
  } catch (e) {
    res.status(500).json({ error: 'Error al ordenar datos' });
  }
}