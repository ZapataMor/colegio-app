# Colegio App - Login con roles

Proyecto separado en backend y frontend para iniciar sesion desde una app movil con Expo Go.

## Estructura

```text
colegio-app/
  backend/
    database/schema.sql
    scripts/seedUsers.js
    src/
      config/
      controllers/
      middlewares/
      models/
      routes/
      utils/
      app.js
      server.js
  frontend/
    App.js
    src/
      components/
      context/
      navigation/
      screens/
      services/
      theme/
```

## Base de datos

1. Crea la base de datos y la tabla:

```bash
mysql -u root -p < backend/database/schema.sql
```

2. Ajusta tus datos de conexion en `backend/.env`.

3. Crea usuarios de prueba con contrasenas cifradas:

```bash
cd backend
npm run seed
```

Usuarios creados:

| Usuario | Contrasena | Rol |
| --- | --- | --- |
| admin | Admin123* | admin |
| docente | Docente123* | docente |

## Backend

Instala dependencias y ejecuta Express:

```bash
cd backend
npm install
npm run dev
```

Endpoint principal:

```http
POST http://localhost:3001/login
Content-Type: application/json

{
  "usuario": "admin",
  "contrasena": "Admin123*"
}
```

Respuesta exitosa:

```json
{
  "message": "Login exitoso.",
  "token": "jwt...",
  "user": {
    "id": 1,
    "usuario": "admin",
    "rol": "admin"
  }
}
```

## Frontend

Instala dependencias y abre Expo:

```bash
cd frontend
npm install
npm start
```

Antes de iniciar sesion desde Expo Go, cambia `API_URL` en `frontend/src/services/api.js` por la IP local de tu computador. Ejemplo:

```js
const API_URL = "http://192.168.1.10:3001";
```

En Expo Go el celular debe estar en la misma red Wi-Fi que el computador donde corre el backend. Si usas emulador Android, normalmente puedes usar `http://10.0.2.2:3001`.

## Flujo de login

- El formulario pide solo `Usuario` y `Contrasena`.
- El backend valida campos vacios, busca el usuario en MySQL y compara la contrasena con bcrypt.
- Si las credenciales son correctas, devuelve un JWT y el rol.
- El frontend guarda la sesion en AsyncStorage.
- Si el rol es `admin`, abre el panel de administrador.
- Si el rol es `docente`, abre el panel docente.
- Si falla el login, muestra el mensaje de error.
