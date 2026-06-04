# Colegio App - Login con roles

Proyecto separado en backend y frontend para iniciar sesion desde una app movil con Expo Go.

## 🚀 Inicio Rápido

### Opción 1: Ejecutar ambos servicios a la vez (RECOMENDADO)

```bash
# Desde la raiz del proyecto
npm run dev:all
```

Esto inicia automáticamente:
- **Backend**: http://localhost:3001 (Express + MySQL)
- **Frontend**: http://localhost:8081 (Expo Web)

### Opción 2: Ejecutar por separado

**Terminal 1 - Backend:**
```bash
npm run backend
```

**Terminal 2 - Frontend:**
```bash
npm run frontend
```

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

### Instalación inicial

```bash
# Desde la raiz del proyecto
npm run setup
```

Esto instala todas las dependencias de backend y frontend.

### Configuración de BD

1. Crea la base de datos y la tabla:

```bash
mysql -u root -p < backend/database/schema.sql
```

2. Ajusta tus datos de conexion en `backend/.env`:

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

3. Crea usuarios de prueba con contrasenas cifradas:

```bash
npm run seed
```

Usuarios creados:

| Usuario | Contrasena | Rol |
| --- | --- | --- |
| admin | Admin123* | admin |
| docente | Docente123* | docente |

## Backend

### Instalación y ejecución

```bash
cd backend
npm install
npm run dev
```

El servidor Express corre en **http://localhost:3001**

### Endpoints principales

```http
POST /api/auth/login
Content-Type: application/json

{
  "correo": "admin@colegio.com",
  "password": "Admin123*"
}
```

**Respuesta exitosa (200):**
```json
{
  "ok": true,
  "mensaje": "Login exitoso",
  "data": {
    "token": "eyJhbGc...",
    "usuario": {
      "id": 1,
      "correo": "admin@colegio.com",
      "rol": "administrador"
    }
  }
}
```

**Respuesta fallida (401):**
```json
{
  "ok": false,
  "mensaje": "Credenciales incorrectas"
}
```

## Frontend

### Instalación y ejecución

```bash
cd frontend
npm install
npm start
```

La app Expo corre en **http://localhost:8081** (web)

### Acceso desde dispositivo móvil

Si usas **Expo Go** en tu celular:

1. Asegúrate de estar en la misma red Wi-Fi que el computador
2. Escanea el código QR que aparece en la terminal
3. La app se abrirá en Expo Go
4. Antes de login, actualiza `API_URL` en `frontend/src/services/api.js`:

```javascript
const API_URL = "http://192.168.1.10:3001"; // Reemplaza con tu IP local
```

Para obtener tu IP local:
```bash
# Windows
ipconfig

# macOS/Linux
ifconfig
```

**Nota:** En emulador Android puedes usar `http://10.0.2.2:3001`

## Flujo de login

- El formulario pide solo `Usuario` y `Contrasena`.
- El backend valida campos vacios, busca el usuario en MySQL y compara la contrasena con bcrypt.
- Si las credenciales son correctas, devuelve un JWT y el rol.
- El frontend guarda la sesion en AsyncStorage.
- Si el rol es `admin`, abre el panel de administrador.
- Si el rol es `docente`, abre el panel docente.
- Si falla el login, muestra el mensaje de error.

## 🔐 Credenciales de Prueba

Después de ejecutar `npm run seed`:

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin@colegio.com | Admin123* | administrador |
| docente@colegio.com | Docente123* | profesor |

**URL para login:**
- Web: http://localhost:8081
- API: http://localhost:3001/api/auth/login

## 📋 Comandos Disponibles

Desde la **raíz del proyecto**:

```bash
# Iniciar ambos servicios simultáneamente (RECOMENDADO)
npm run dev:all

# Instalar dependencias en backend y frontend
npm run setup

# Crear/resetear datos de prueba en BD
npm run seed

# Ejecutar solo backend
npm run backend

# Ejecutar solo frontend
npm run frontend
```

## ⚙️ Tecnologías

- **Backend:** Node.js, Express, MySQL2, JWT, bcryptjs
- **Frontend:** React Native, Expo, TypeScript
- **Base de Datos:** MySQL
- **Autenticación:** JWT tokens con roles

## 📝 Notas

- Las contraseñas se cifran con bcryptjs antes de guardarse
- Los tokens JWT expiran en 8 horas (configurable en `.env`)
- El dashboard se adapta según el rol del usuario
- CORS habilitado para desarrollo local
