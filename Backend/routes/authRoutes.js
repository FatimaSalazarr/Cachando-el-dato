const express = require('express');
const router = express.Router();
const autenticarUsuario = require('../middleware/authMiddleware');
const {
  registrarUsuario,
  actualizarPerfil,
  solicitarRestablecimiento,
  restablecerConToken,
  loginUsuario
} = require('../controllers/authController');

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.post('/forgot-password', solicitarRestablecimiento);
router.post('/reset-password', restablecerConToken);
router.patch('/perfil', autenticarUsuario, actualizarPerfil);


module.exports = router;