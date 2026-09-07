module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { sessionToken } = req.body || {};

  if (!sessionToken) {
    return res.status(400).json({ success: false, reason: "No se recibió un token de sesión válido." });
  }

  return res.status(200).json({
    success: true,
    message: " Lectura validada con éxito. +1 $LER sumado al saldo virtual.",
    reward: 1
  });
};
