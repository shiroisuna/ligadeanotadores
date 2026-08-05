# Cómo arrancar (en orden)

1. Copia estos archivos dentro de tu carpeta
   `laragon/www/ligaanotadoresmunicipioindependencia/backend/`
   respetando las subcarpetas (config, controllers, middlewares, models,
   routes, services van dentro de `src/`; package.json y .env.example
   van en la raíz de `backend/`).

2. Instala dependencias:
   ```
   npm install
   ```

3. Renombra `.env.example` a `.env` y completa tus datos de MySQL
   (con Laragon normalmente `DB_USER=root` y `DB_PASSWORD=` vacío).

4. Crea tu primer usuario administrador (no hay registro público).
   Genera el hash:
   ```
   node -e "console.log(require('bcryptjs').hashSync('tu_password', 10))"
   ```
   Y en phpMyAdmin:
   ```sql
   INSERT INTO usuarios (email, password_hash, rol)
   VALUES ('profesor@liga.com', '<hash_generado>', 'administrador');
   ```

5. Arranca el servidor:
   ```
   npm run dev
   ```
   Deberías ver: "API Liga de Anotadores corriendo en http://localhost:4000"

6. Prueba en el navegador: http://localhost:4000/api/health → debe responder {"ok":true}

7. Prueba el login con Postman/Thunder Client:
   POST http://localhost:4000/api/categorias  (con Authorization: Bearer <token del login>)

## Patrón para los módulos que faltan

Cada módulo nuevo son 4 archivos, uno en cada carpeta, mismo nombre base:

- `models/xModel.js` — únicas queries SQL (usa `../config/db`)
- `services/xService.js` — validaciones y reglas de negocio (usa el model)
- `controllers/xController.js` — recibe req/res, llama al service
- `routes/xRoutes.js` — define endpoints y qué rol requiere cada uno

Y se monta en `app.js`:
```js
const xRoutes = require('./routes/xRoutes');
app.use('/api/x', xRoutes);
```

Copia `categoriasModel.js` / `categoriasService.js` / `categoriasController.js` /
`categoriasRoutes.js` como plantilla para: temporadas, equipos, jugadores+roster,
juegos, boxscore, posiciones, lideres, control-lanzadores, cuadro-honor.
