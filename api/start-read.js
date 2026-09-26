const crypto = require('crypto');

module.exports = async (req, res) => {
  // Configuración de cabeceras CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Validar que el secreto esté configurado
    if (!process.env.SESSION_SECRET) {
      console.error('SESSION_SECRET no configurado en variables de entorno');
      return res.status(500).json({
        success: false,
        reason: 'Error interno: secreto no configurado'
      });
    }

    // Obtener la marca de tiempo actual en milisegundos
    const timestamp = Date.now();

    // Crear un payload con la marca de tiempo
    const payload = JSON.stringify({ timestamp });

    // Generar HMAC-SHA256 firmado con el secreto del servidor
    const signature = crypto
      .createHmac('sha256', process.env.SESSION_SECRET)
      .update(payload)
      .digest('hex');

    // Crear el token combinando payload + firma (separados por un punto)
    const sessionToken = `${Buffer.from(payload).toString('base64')}.${signature}`;

    return res.status(200).json({
      success: true,
      sessionToken: sessionToken,
      message: 'Sesión iniciada correctamente desde Vercel',
      expiresIn: 3600 // Token válido por 1 hora (opcional, para referencia del cliente)
    });
  } catch (error) {
    console.error('Error en start-read:', error);
    return res.status(500).json({
      success: false,
      reason: 'Error interno al generar token'
    });
  }
};
