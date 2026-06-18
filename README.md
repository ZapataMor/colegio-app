# Colegio App - Login con roles

Proyecto separado en backend y frontend para una app escolar con Expo, Express y MySQL.

## Inicio rapido

### Ejecutar ambos servicios

```bash
npm run dev:all
```

Esto inicia:

- Backend: http://localhost:3001
- Frontend: http://localhost:8081

### Ejecutar por separado

```bash
npm run backend
npm run frontend
```

En PowerShell, si `npm` esta bloqueado por la politica de ejecucion, usa `npm.cmd`:

```bash
npm.cmd run seed
```

## Estructura

```text
colegio-app/
  backend/
    database/
      schema.sql
      alterations_2026_06_18_unificado.sql
    scripts/
      seed.js
      seedUsers.js
    src/
      config/
      controllers/
      middlewares/
      models/
      routes/
      utils/
  frontend/
    src/
      app/
      components/
      lib/
```

## Base de datos

### Instalacion inicial

```bash
npm run setup
```

### Configuracion

1. Crea la base de datos y las tablas:

```bash
mysql -u root -p < backend/database/schema.sql
```

2. Ajusta la conexion en `backend/.env`:

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=tu-secreto-jwt
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=colegio_app
DB_USERNAME=root
DB_PASSWORD=
```

3. Carga datos de prueba completos:

```bash
npm run seed
```

4. Si solo necesitas refrescar las claves de usuarios de prueba:

```bash
npm run seed:users
```

`seed:users` requiere que ya existan las tablas y los roles base.

## Credenciales de prueba

Despues de ejecutar `npm run seed`:

| Correo | Contrasena | Rol |
| --- | --- | --- |
| admin@colegio.com | Admin123* | administrador |
| diana.martinez@colegio.com | Docente123* | profesor |
| claudia.gomez@colegio.com | Docente123* | profesor |
| estudiante.1a.01@colegio.com | Estudiante123* | estudiante |
| estudiante.1a.02@colegio.com | Estudiante123* | estudiante |

## Backend

```bash
cd backend
npm install
npm run dev
```

El servidor Express corre en http://localhost:3001.

### Login

```http
POST /login
Content-Type: application/json

{
  "correo": "admin@colegio.com",
  "contrasena": "Admin123*"
}
```

Respuesta exitosa:

```json
{
  "message": "Login exitoso.",
  "token": "eyJhbGc...",
  "welcomeMessage": "Bienvenido al panel de administracion...",
  "user": {
    "id": 1,
    "personaId": 1,
    "nombre": "Admin",
    "apellido": "Principal",
    "correo": "admin@colegio.com",
    "rol": "administrador",
    "roles": ["administrador"]
  }
}
```

## Frontend

```bash
cd frontend
npm install
npm start
```

La app Expo corre en http://localhost:8081 para web.

Para Expo Go en celular, configura la URL del backend con tu IP local:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:3001
```

En emulador Android puedes usar:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
```

## Comandos disponibles

Desde la raiz del proyecto:

```bash
npm run dev:all
npm run setup
npm run seed
npm run seed:users
npm run backend
npm run frontend
```

## Notas

- `backend/database/schema.sql` crea la estructura completa desde cero.
- `backend/database/alterations_2026_06_18_unificado.sql` es para actualizar una base existente.
- `backend/scripts/seed.js` carga catalogos, grados, cursos, salones, profesores, estudiantes, horarios, usuarios y notas.
- `backend/scripts/seedUsers.js` solo asegura usuarios de prueba y sus contrasenas.
- Las contrasenas se cifran con `bcryptjs`.
- El dashboard se adapta segun el rol recibido en el login.
