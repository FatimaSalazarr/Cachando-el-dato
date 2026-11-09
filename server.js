const express = require('express');
const path = require('path');
const cors = require('cors'); // Necesario para la conexión con GitHub Pages
require('dotenv').config();
const authRoutes = require('./Backend/routes/authRoutes');
const gameRoutes = require('./Backend/routes/gameRoutes');
const { uploadsDirectory } = require('./Backend/middleware/teamMediaUpload');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Middlewares
app.use(cors());
app.use(express.json({ limit: '128kb' }));
app.use('/uploads/team-feed', express.static(uploadsDirectory, {
  dotfiles: 'deny',
  index: false
}));
app.use(express.static(path.join(__dirname, 'public')));

// Montar las rutas modulares de la API
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);



// Ruta de respaldo para servir tu frontend estático
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicialización del servidor: Solo se ejecuta en tu computadora (modo desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}


module.exports = app;