const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/authRoutes');
const categoriasRoutes = require('./routes/categoriasRoutes');
const equiposRoutes = require('./routes/equiposRoutes');
const jugadoresRoutes = require('./routes/jugadoresRoutes');
const temporadasRoutes = require('./routes/temporadasRoutes');
const juegosRoutes = require('./routes/juegosRoutes');
const boxscoreRoutes = require('./routes/boxscoreRoutes');
// A medida que crees los demás módulos (posiciones, lideres,
// control-lanzadores, cuadro-honor) se importan y se montan igual que
// los de abajo. posiciones y lideres son solo lectura de vistas SQL,
// no tienen tabla propia.

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/jugadores', jugadoresRoutes);
app.use('/api/temporadas', temporadasRoutes);
app.use('/api/juegos', juegosRoutes);
app.use('/api/boxscore', boxscoreRoutes);

app.use(errorHandler);

module.exports = app;
