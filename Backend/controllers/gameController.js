const { db, FieldValue } = require('../config/firebase-admin');

const sumarPuntosTrivia = async (req, res) => {
  try {
    const { usuarioId, puntosGana } = req.body;
    const usuarioRef = db.collection('usuarios').doc(usuarioId);
    
    await usuarioRef.update({ puntos: FieldValue.increment(puntosGana) });
    res.json({ mensaje: `Se sumaron ${puntosGana} puntos` });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar puntos' });
  }
};

const tirarGacha = async (req, res) => {
  try {
    const { usuarioId, costoPuntos = 100 } = req.body;
    const usuarioRef = db.collection('usuarios').doc(usuarioId);
    const usuarioDoc = await usuarioRef.get();
    const puntosActuales = usuarioDoc.data().puntos;

    if (puntosActuales < costoPuntos) {
      return res.status(400).json({ error: 'Puntos insuficientes' });
    }

    await usuarioRef.update({ puntos: FieldValue.increment(-costoPuntos) });

    const equipos = ['Diablos Rojos', 'Sultanes', 'Toros', 'Leones'];
    const equipoGanado = equipos[Math.floor(Math.random() * equipos.length)];

    await db.collection('inventarios').add({
      usuarioId,
      equipo: equipoGanado,
      fecha: FieldValue.serverTimestamp()
    });

    res.json({ equipo: equipoGanado, puntosRestantes: puntosActuales - costoPuntos });
  } catch (error) {
    res.status(500).json({ error: 'Error en el gacha' });
  }
};

module.exports = { sumarPuntosTrivia, tirarGacha };