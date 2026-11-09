const express = require('express');
const router = express.Router();
const autenticarUsuario = require('../middleware/authMiddleware');
const { recibirMediaDeEquipo } = require('../middleware/teamMediaUpload');
const { sumarPuntosTrivia, tirarGacha, obtenerInventario, obtenerPerfil } = require('../controllers/gameController');
const {
  obtenerFeedEquipo,
  publicarMediaEquipo,
  validarEquipoFeed
} = require('../controllers/teamMediaController');

router.use(autenticarUsuario);
router.post('/trivia', sumarPuntosTrivia);
router.post('/gacha', tirarGacha);
router.get('/inventario', obtenerInventario);
router.get('/perfil', obtenerPerfil);
router.get('/team-feed/:teamKey', validarEquipoFeed, obtenerFeedEquipo);
router.post('/team-feed/:teamKey', validarEquipoFeed, recibirMediaDeEquipo, publicarMediaEquipo);

module.exports = router;