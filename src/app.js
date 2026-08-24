const express = require('express');
const cors    = require('cors');
const path    = require('path');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes             = require('./routes/authRoutes');
const categoriasRoutes       = require('./routes/categoriasRoutes');
const disciplinasRoutes      = require('./routes/disciplinasRoutes');
const equiposRoutes          = require('./routes/equiposRoutes');
const jugadoresRoutes        = require('./routes/jugadoresRoutes');
const temporadasRoutes       = require('./routes/temporadasRoutes');
const juegosRoutes           = require('./routes/juegosRoutes');
const boxscoreRoutes         = require('./routes/boxscoreRoutes');
const estadisticasRoutes     = require('./routes/estadisticasRoutes');
const posicionesRoutes       = require('./routes/posicionesRoutes');
const lideresRoutes          = require('./routes/lideresRoutes');
const controlLanzadoresRoutes = require('./routes/controlLanzadoresRoutes');
const fotosRoutes            = require('./routes/fotosRoutes');
const contenidoRoutes        = require('./routes/contenidoRoutes');
const pagosRoutes            = require('./routes/pagosRoutes');
const uploadsRoutes          = require('./routes/uploadsRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Archivos estáticos (logos, fotos, galería)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.use('/api/auth',              authRoutes);
app.use('/api/categorias',        categoriasRoutes);
app.use('/api/disciplinas',       disciplinasRoutes);
app.use('/api/equipos',           equiposRoutes);
app.use('/api/jugadores',         jugadoresRoutes);
app.use('/api/temporadas',        temporadasRoutes);
app.use('/api/juegos',            juegosRoutes);
app.use('/api/boxscore',          boxscoreRoutes);
app.use('/api/estadisticas',      estadisticasRoutes);
app.use('/api/posiciones',        posicionesRoutes);
app.use('/api/lideres',           lideresRoutes);
app.use('/api/control-lanzadores', controlLanzadoresRoutes);
app.use('/api/fotos',             fotosRoutes);
app.use('/api/contenido',         contenidoRoutes);
app.use('/api/pagos',             pagosRoutes);
app.use('/api/uploads',           uploadsRoutes);

app.use(errorHandler);
module.exports = app;
