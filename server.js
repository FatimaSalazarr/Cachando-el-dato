const express = require('express');
const path = require('path');
const cors = require('cors'); // Necesario para la conexión con GitHub Pages
const authRoutes = require('./Backend/routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Montar las rutas modulares de la API
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// Ruta de respaldo para servir tu frontend estático
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicialización del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});