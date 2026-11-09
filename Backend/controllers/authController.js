const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { db, FieldValue } = require('../config/firebase-admin');

const solicitudesRecuperacion = new Map();
const VENTANA_RECUPERACION_MS = 15 * 60 * 1000;
const MAX_SOLICITUDES_RECUPERACION = 5;

const esFotoPerfilValida = (fotoPerfil) => (
  typeof fotoPerfil === 'string'
  && (!fotoPerfil || (
    /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(fotoPerfil)
    && fotoPerfil.length <= 90000
  ))
);

const registrarUsuario = async (req, res) => {
  try {
    const { username, password, fotoPerfil = '' } = req.body;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Ingresa un correo electrónico válido' });
    }
    if (!esFotoPerfilValida(fotoPerfil)) {
      return res.status(400).json({ error: 'La foto debe ser JPEG y no superar el tamaño permitido' });
    }

    const usuariosRef = db.collection('usuarios');
    const snapshot = await usuariosRef.where('email', '==', email).get();
    
    if (!snapshot.empty) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const docRef = await usuariosRef.add({
      username: username,
      email: email,
      password_hash: password_hash,
      fotoPerfil,
      puntos: 0,
      fecha_registro: FieldValue.serverTimestamp()
    });

    res.status(201).json({ mensaje: 'Usuario creado exitosamente', id: docRef.id });

  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const actualizarPerfil = async (req, res) => {
  try {
    const body = req.body || {};
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const { fotoPerfil, quitarFoto } = body;

    if (!username || username.length > 60 || !email || email.length > 254) {
      return res.status(400).json({ error: 'Nombre y correo son obligatorios y deben tener un tamaño válido' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Ingresa un correo electrónico válido' });
    }
    if (fotoPerfil !== undefined && !esFotoPerfilValida(fotoPerfil)) {
      return res.status(400).json({ error: 'La foto debe ser JPEG y no superar el tamaño permitido' });
    }

    const usuarioRef = db.collection('usuarios').doc(req.usuario.id);
    const [usuarioDoc, emailSnapshot] = await Promise.all([
      usuarioRef.get(),
      db.collection('usuarios').where('email', '==', email).get()
    ]);

    if (!usuarioDoc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (emailSnapshot.docs.some((doc) => doc.id !== req.usuario.id)) {
      return res.status(409).json({ error: 'El correo ya está registrado por otra cuenta' });
    }

    const usuarioActual = usuarioDoc.data();
    const datosActualizados = { username, email };
    if (quitarFoto === true) {
      datosActualizados.fotoPerfil = '';
    } else if (fotoPerfil !== undefined) {
      datosActualizados.fotoPerfil = fotoPerfil;
    }

    await usuarioRef.update(datosActualizados);

    return res.json({
      usuario: {
        id: usuarioDoc.id,
        username,
        email,
        puntos: Number(usuarioActual.puntos) || 0,
        fotoPerfil: datosActualizados.fotoPerfil ?? usuarioActual.fotoPerfil ?? ''
      }
    });
  } catch (error) {
    console.error('Error al actualizar el perfil:', error);
    return res.status(500).json({ error: 'No se pudo actualizar el perfil' });
  }
};

const solicitarRestablecimiento = async (req, res) => {
  const mensajeGenerico = 'Si existe una cuenta con ese correo, recibirás instrucciones para restablecer la contraseña.';

  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Ingresa un correo electrónico válido' });
    }

    const ahora = Date.now();
    const solicitudesRecientes = (solicitudesRecuperacion.get(req.ip) || [])
      .filter((timestamp) => ahora - timestamp < VENTANA_RECUPERACION_MS);
    if (solicitudesRecientes.length >= MAX_SOLICITUDES_RECUPERACION) {
      return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' });
    }
    solicitudesRecientes.push(ahora);
    solicitudesRecuperacion.set(req.ip, solicitudesRecientes);
    for (const [ip, timestamps] of solicitudesRecuperacion) {
      if (timestamps.every((timestamp) => ahora - timestamp >= VENTANA_RECUPERACION_MS)) {
        solicitudesRecuperacion.delete(ip);
      }
    }

    const gmailUser = process.env.GMAIL_USER?.trim();
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
    if (!gmailUser || !gmailAppPassword) {
      return res.status(503).json({ error: 'La recuperación por correo aún no está configurada en el servidor.' });
    }

    const exactMatch = await db.collection('usuarios').where('email', '==', email).limit(1).get();
    const caseSensitiveMatch = email
      ? await db.collection('usuarios').where('email', '==', req.body.email.trim()).limit(1).get()
      : exactMatch;
    const usuarioDoc = exactMatch.docs[0] || caseSensitiveMatch.docs[0];
    let resetLink = '';

    if (usuarioDoc) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiracion = new Date(Date.now() + 60 * 60 * 1000);
      await usuarioDoc.ref.update({
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiracion
      });

      const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      const resetUrl = new URL(appBaseUrl);
      resetUrl.hash = `reset=${token}`;
      resetLink = resetUrl.toString();
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailAppPassword }
    });
    const contenido = resetLink
      ? `Recibimos una solicitud para restablecer la contraseña de tu cuenta. Este enlace vence en una hora y solo puede usarse una vez:\n\n${resetLink}\n\nSi no solicitaste el cambio, ignora este correo.`
      : 'Recibimos una solicitud de recuperación. Si existe una cuenta asociada a este correo, recibirás un enlace válido por una hora. Si no solicitaste el cambio, ignora este mensaje.';

    try {
      await transporter.sendMail({
        from: `"Cachando el Dato" <${gmailUser}>`,
        to: email,
        subject: 'Restablece tu contraseña de Cachando el Dato',
        text: contenido
      });
    } catch (error) {
      if (usuarioDoc) {
        await usuarioDoc.ref.update({
          passwordResetTokenHash: FieldValue.delete(),
          passwordResetExpiresAt: FieldValue.delete()
        });
      }
      throw error;
    }

    return res.json({ mensaje: mensajeGenerico });
  } catch (error) {
    console.error('Error al enviar el correo de restablecimiento:', error);
    return res.status(502).json({ error: 'No se pudo enviar el correo. Intenta de nuevo más tarde.' });
  }
};

const restablecerConToken = async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({ error: 'El enlace de restablecimiento no es válido o ya venció.' });
    }
    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const match = await db.collection('usuarios')
      .where('passwordResetTokenHash', '==', tokenHash)
      .limit(1)
      .get();
    if (match.empty) {
      return res.status(400).json({ error: 'El enlace de restablecimiento no es válido o ya venció.' });
    }

    const usuarioRef = match.docs[0].ref;
    const nuevoPasswordHash = await bcrypt.hash(password, 10);
    const restablecido = await db.runTransaction(async (transaction) => {
      const usuarioDoc = await transaction.get(usuarioRef);
      if (!usuarioDoc.exists) return false;

      const usuario = usuarioDoc.data();
      const expira = usuario.passwordResetExpiresAt?.toDate
        ? usuario.passwordResetExpiresAt.toDate()
        : usuario.passwordResetExpiresAt;
      if (usuario.passwordResetTokenHash !== tokenHash || !(expira instanceof Date) || expira.getTime() <= Date.now()) {
        if (usuario.passwordResetTokenHash === tokenHash) {
          transaction.update(usuarioRef, {
            passwordResetTokenHash: FieldValue.delete(),
            passwordResetExpiresAt: FieldValue.delete()
          });
        }
        return false;
      }

      transaction.update(usuarioRef, {
        password_hash: nuevoPasswordHash,
        passwordResetTokenHash: FieldValue.delete(),
        passwordResetExpiresAt: FieldValue.delete()
      });
      return true;
    });

    if (!restablecido) {
      return res.status(400).json({ error: 'El enlace de restablecimiento no es válido o ya venció.' });
    }
    return res.json({ mensaje: 'La contraseña se restableció correctamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    return res.status(500).json({ error: 'No se pudo restablecer la contraseña.' });
  }
};

const loginUsuario = async (req, res) => {
  try {
    const { password } = req.body || {};
    const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const email = rawEmail.toLowerCase();
    const usuariosRef = db.collection('usuarios');
    let snapshot = await usuariosRef.where('email', '==', email).get();
    if (snapshot.empty && rawEmail !== email) {
      snapshot = await usuariosRef.where('email', '==', rawEmail).get();
    }

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuarioDoc = snapshot.docs[0];
    const usuarioData = usuarioDoc.data();
    const validPassword = await bcrypt.compare(password, usuarioData.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: usuarioDoc.id },
      process.env.JWT_SECRET || 'secreto_temporal',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      usuario: {
        id: usuarioDoc.id,
        username: usuarioData.username,
        email: usuarioData.email,
        puntos: usuarioData.puntos,
        fotoPerfil: usuarioData.fotoPerfil || ''
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
};

module.exports = {
  registrarUsuario,
  actualizarPerfil,
  solicitarRestablecimiento,
  restablecerConToken,
  loginUsuario
};
