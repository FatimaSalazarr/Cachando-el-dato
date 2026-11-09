const jwt = require('jsonwebtoken');

const autenticarUsuario = (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET || 'secreto_temporal');
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'La sesión no es válida o expiró' });
  }
};

module.exports = autenticarUsuario;
