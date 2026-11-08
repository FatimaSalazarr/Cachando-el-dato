const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db, FieldValue } = require('../config/firebase-admin');

const registrarUsuario = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
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
      puntos: 0,
      fecha_registro: FieldValue.serverTimestamp()
    });

    res.status(201).json({ mensaje: 'Usuario creado exitosamente', id: docRef.id });

  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};


const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;
    const snapshot = await db.collection('usuarios').where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuarioDoc = snapshot.docs[0];
    const usuarioData = usuarioDoc.data();
    const validPassword = await bcrypt.compare(password, usuarioData.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ id: usuarioDoc.id }, 'secreto_temporal', { expiresIn: '24h' });

    res.json({ 
      token, 
      usuario: { id: usuarioDoc.id, username: usuarioData.username, puntos: usuarioData.puntos } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
};

module.exports = { registrarUsuario, loginUsuario };
