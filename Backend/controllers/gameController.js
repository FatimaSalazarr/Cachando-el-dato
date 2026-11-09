const { db, FieldValue } = require('../config/firebase-admin');
const fs = require('fs');
const path = require('path');

const COSTO_GACHA = 50;
const modelosDirectory = path.resolve(__dirname, '..', '..', 'public', 'modelos');

const obtenerModelosCartas = () => fs.readdirSync(modelosDirectory, { withFileTypes: true })
  .filter((entry) => (
    (entry.isFile() || entry.isSymbolicLink())
    && /carta\.glb$/i.test(entry.name)
    && fs.statSync(path.join(modelosDirectory, entry.name)).isFile()
  ))
  .map((entry) => {
    const nombre = entry.name
      .replace(/[-_\s]*carta\.glb$/i, '')
      .replace(/[-_]+/g, ' ')
      .toLocaleLowerCase('es-MX')
      .replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase('es-MX'));

    return {
      nombre,
      archivo: entry.name,
      tag: nombre.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase()
    };
  });

const normalizarNombre = (nombre) => String(nombre || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/gi, '')
  .toLowerCase();

const agregarModelosFaltantes = (items) => {
  const modelosCartas = obtenerModelosCartas();
  const modelosPorNombre = new Map(
    modelosCartas.map((modelo) => [normalizarNombre(modelo.nombre), modelo])
  );

  return items.map((item) => {
    if (item.modeloUrl) return item;

    const modelo = modelosPorNombre.get(normalizarNombre(item.nombre || item.equipo));
    return modelo
      ? { ...item, modeloUrl: `/modelos/${encodeURIComponent(modelo.archivo)}` }
      : item;
  });
};

const sortearPremio = () => {
  const modelosCartas = obtenerModelosCartas();
  if (modelosCartas.length === 0) {
    const error = new Error(`No hay modelos de cartas .glb en ${modelosDirectory}`);
    error.status = 503;
    throw error;
  }

  const roll = Math.random() * 100;
  const rarity = roll < 5 ? 'legendario' : roll < 30 ? 'raro' : 'comun';
  const modelo = modelosCartas[Math.floor(Math.random() * modelosCartas.length)];

  return {
    nombre: modelo.nombre,
    equipo: modelo.nombre,
    tag: modelo.tag,
    modeloUrl: `/modelos/${encodeURIComponent(modelo.archivo)}`,
    rareza: rarity,
    rarezaLabel: rarity === 'legendario' ? 'LEGENDARIO' : rarity === 'raro' ? 'RARO' : 'COMÚN',
    tipo: 'Tarjeta de jugador'
  };
};

const sumarPuntosTrivia = async (req, res) => {
  try {
    const { puntosGana } = req.body;
    if (puntosGana !== 10) {
      return res.status(400).json({ error: 'La recompensa de trivia debe ser de 10 puntos' });
    }

    const usuarioRef = db.collection('usuarios').doc(req.usuario.id);
    await usuarioRef.update({ puntos: FieldValue.increment(puntosGana) });
    const usuarioDoc = await usuarioRef.get();
    return res.json({ puntos: usuarioDoc.data().puntos });
  } catch (error) {
    console.error('Error al actualizar puntos de trivia:', error);
    return res.status(500).json({ error: 'Error al actualizar puntos' });
  }
};

const tirarGacha = async (req, res) => {
  try {
    const usuarioRef = db.collection('usuarios').doc(req.usuario.id);
    const premio = sortearPremio();
    const inventarioRef = db.collection('inventarios').doc();

    const puntosRestantes = await db.runTransaction(async (transaction) => {
      const usuarioDoc = await transaction.get(usuarioRef);
      if (!usuarioDoc.exists) {
        const error = new Error('Usuario no encontrado');
        error.status = 404;
        throw error;
      }

      const puntosActuales = Number(usuarioDoc.data().puntos) || 0;
      if (puntosActuales < COSTO_GACHA) {
        const error = new Error('Puntos insuficientes');
        error.status = 400;
        error.puntosActuales = puntosActuales;
        throw error;
      }

      const restantes = puntosActuales - COSTO_GACHA;
      transaction.update(usuarioRef, { puntos: restantes });
      transaction.set(inventarioRef, {
        usuarioId: req.usuario.id,
        nombre: premio.nombre,
        equipo: premio.equipo,
        tag: premio.tag,
        modeloUrl: premio.modeloUrl,
        rareza: premio.rareza,
        tipo: premio.tipo,
        fecha: FieldValue.serverTimestamp()
      });
      return restantes;
    });

    return res.json({ premio, puntosRestantes });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message, puntosActuales: error.puntosActuales });
    }
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    if (error.status === 503) {
      console.error('Catálogo del gacha vacío:', error.message);
      return res.status(503).json({ error: 'No hay modelos de cartas disponibles. Verifica la carpeta modelos del servidor.' });
    }
    console.error('Error en el gacha:', error);
    return res.status(500).json({ error: 'Error en el gacha' });
  }
};

const obtenerInventario = async (req, res) => {
  try {
    const snapshot = await db.collection('inventarios')
      .where('usuarioId', '==', req.usuario.id)
      .get();
    const items = agregarModelosFaltantes(
      snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    );
    return res.json({ items });
  } catch (error) {
    console.error('Error al obtener el inventario:', error);
    return res.status(500).json({ error: 'Error al obtener el inventario' });
  }
};

const obtenerPerfil = async (req, res) => {
  try {
    const usuarioRef = db.collection('usuarios').doc(req.usuario.id);
    const [usuarioDoc, inventarioSnapshot] = await Promise.all([
      usuarioRef.get(),
      db.collection('inventarios')
        .where('usuarioId', '==', req.usuario.id)
        .get()
    ]);

    if (!usuarioDoc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuarioData = usuarioDoc.data();
    const items = agregarModelosFaltantes(
      inventarioSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    )
      .sort((a, b) => {
        const fechaA = a.fecha?.toMillis?.() || 0;
        const fechaB = b.fecha?.toMillis?.() || 0;
        return fechaB - fechaA;
      });

    return res.json({
      usuario: {
        id: usuarioDoc.id,
        username: usuarioData.username || '',
        email: usuarioData.email || '',
        puntos: Number(usuarioData.puntos) || 0,
        fotoPerfil: usuarioData.fotoPerfil || ''
      },
      items
    });
  } catch (error) {
    console.error('Error al obtener el perfil:', error);
    return res.status(500).json({ error: 'Error al obtener el perfil' });
  }
};

module.exports = { sumarPuntosTrivia, tirarGacha, obtenerInventario, obtenerPerfil };