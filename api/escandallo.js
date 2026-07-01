// api/escandallo.js
// Proxy serverless para el Copilot "Escandallo" de Ratios Food Cost.
// La API key de Anthropic vive SOLO aquí (variable de entorno de Vercel),
// nunca en el HTML que llega al navegador.
//
// Variables de entorno necesarias en Vercel (Project → Settings → Environment Variables):
//   ANTHROPIC_API_KEY       → tu clave real, empieza por sk-ant-...
//   ESCANDALLO_APP_TOKEN    → una cadena cualquiera que tú inventes, debe coincidir
//                             con ESC_APP_TOKEN en index.html

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  // Filtro simple: bloquea tráfico automático que no venga de la propia app.
  // No sustituye a un login real (el token también vive en el navegador),
  // pero evita que un escáner encuentre esta URL y la use sin más.
  const token = req.headers['x-app-token'];
  if (!process.env.ESCANDALLO_APP_TOKEN || token !== process.env.ESCANDALLO_APP_TOKEN) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'Falta ANTHROPIC_API_KEY en las variables de entorno de Vercel' });
    return;
  }

  try {
    const { system, tools, messages, max_tokens } = req.body || {};

    const respuesta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: max_tokens || 1200,
        system,
        tools,
        messages
      })
    });

    const datos = await respuesta.json();
    res.status(respuesta.status).json(datos);
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
