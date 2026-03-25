const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  try {
    const { data } = await axios.get('https://www.futbolenvivoargentina.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)' }
    });
    const $ = cheerio.load(data);
    const agenda = [];

    // Buscamos todas las filas de la tabla principal
    $('table.tablaPrincipal tr').each((i, el) => {
      const fila = $(el);
      
      // Detectar Cabecera de Fecha (ej: "Hoy martes 24...")
      if (fila.hasClass('fecha') || fila.find('td[colspan="3"]').length > 0) {
        const textoFecha = fila.text().trim();
        if (textoFecha.length > 5) {
          agenda.push({ tipo: 'FECHA', valor: textoFecha });
        }
      } 
      // Detectar Partido
      else if (fila.find('.hora').length > 0) {
        const local = fila.find('.local span').attr('title') || fila.find('.local').text().trim();
        const visitante = fila.find('.visitante span').attr('title') || fila.find('.visitante').text().trim();
        
        const canales = [];
        fila.find('.canales li').each((j, li) => {
          canales.push($(li).text().trim());
        });

        if (local && visitante) {
          agenda.push({
            tipo: 'PARTIDO',
            hora: fila.find('.hora').text().trim(),
            evento: `${local} vs ${visitante}`,
            canales: canales.join(' | ') || 'A confirmar'
          });
        }
      }
    });

    res.status(200).json(agenda);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener los datos' });
  }
};