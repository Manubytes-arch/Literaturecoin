module.exports = async (req, res) => {
  // Configuración de cabeceras para evitar errores de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Generamos un token temporal de prueba
  const mockToken = "token_demo_" + Date.now();

  return res.status(200).json({
    success: true,
    sessionToken: mockToken,
    message: "Sesión iniciada correctamente desde Vercel"
  });
};
