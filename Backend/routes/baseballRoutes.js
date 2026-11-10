const express = require('express');
const { obtenerNoticias, obtenerPartidos } = require('../controllers/baseballController');

const router = express.Router();

router.get('/news', obtenerNoticias);
router.get('/games', obtenerPartidos);

module.exports = router;
