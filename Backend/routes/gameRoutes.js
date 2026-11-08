const express = require('express');
const router = express.Router();
const { sumarPuntosTrivia, tirarGacha } = require('../controllers/gameController');

router.post('/trivia', sumarPuntosTrivia);
router.post('/gacha', tirarGacha);

module.exports = router;