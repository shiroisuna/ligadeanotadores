const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/authRoutes');
const categoriasRoutes = require('./routes/categoriasRoutes');
const equiposRoutes = require('./routes/equiposRoutes');
const jugadoresRoutes = require('./routes/jugadoresRoutes');
const temporadasRoutes = require('./routes/temporadasRoutes');
const juegosRoutes = require('./routes/juegosRoutes');
const boxscoreRoutes = require('./routes/boxscoreRoutes');
const posicionesRoutes = require('./routes/posicionesRoutes');
const lideresRoutes = require('./routes/lideresRoutes');
const controlLanzadoresRoutes = require('./routes/controlLanzadoresRoutes');
const cuadroHonorRoutes = require('./routes/cuadroHonorRoutes');
const fotosRoutes = require('./routes/fotosRoutes');
const disciplinasRoutes = require('./routes/disciplinasRoutes');
const uploadsRoutes = require('./routes/uploadsRoutes');
// Los 10 módulos del mapa del sitio original ya están todos aquí, más
// fotos (galería del inicio) y uploads (subida de logos/fotos a disco).

const app = express();

app.use(cors());
app.use(express.json());

// Sirve backend/uploads/* como archivos estáticos en /uploads/*
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/jugadores', jugadoresRoutes);
app.use('/api/temporadas', temporadasRoutes);
app.use('/api/juegos', juegosRoutes);
app.use('/api/boxscore', boxscoreRoutes);
app.use('/api/posiciones', posicionesRoutes);
app.use('/api/lideres', lideresRoutes);
app.use('/api/control-lanzadores', controlLanzadoresRoutes);
app.use('/api/cuadro-honor', cuadroHonorRoutes);
app.use('/api/fotos', fotosRoutes);
app.use('/api/disciplinas', disciplinasRoutes);
app.use('/api/uploads', uploadsRoutes);

app.use(errorHandler);

module.exports = app;
