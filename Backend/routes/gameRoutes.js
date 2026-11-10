const express = require('express');
const router = express.Router();
const autenticarUsuario = require('../middleware/authMiddleware');
const { recibirMediaDeEquipo } = require('../middleware/teamMediaUpload');
const baseballRoutes = require('./baseballRoutes');
const { sumarPuntosTrivia, tirarGacha, obtenerInventario, obtenerPerfil } = require('../controllers/gameController');
const {
  obtenerFeedEquipo,
  obtenerGaleriaEquipo,
  descargarMediaEquipo,
  publicarMediaEquipo,
  publicarMediaGaleria,
  validarEquipoFeed
} = require('../controllers/teamMediaController');

router.use('/baseball', baseballRoutes);
router.use(autenticarUsuario);
router.post('/trivia', sumarPuntosTrivia);
router.post('/gacha', tirarGacha);
router.get('/inventario', obtenerInventario);
router.get('/perfil', obtenerPerfil);
router.get('/team-feed/:teamKey', validarEquipoFeed, obtenerFeedEquipo);
router.post('/team-feed/:teamKey', validarEquipoFeed, recibirMediaDeEquipo, publicarMediaEquipo);
router.get('/team-gallery/:teamKey', validarEquipoFeed, obtenerGaleriaEquipo);
router.post('/team-gallery/:teamKey', validarEquipoFeed, recibirMediaDeEquipo, publicarMediaGaleria);
router.get('/team-media/:mediaType/:teamKey/:publicationId/download', descargarMediaEquipo);

module.exports = router;