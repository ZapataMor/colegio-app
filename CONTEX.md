Este proyecto colegio-app esta dividido en frontend y backend, el front esta construido con expo go

este archivo debe ser iterado en cada ejecucion para agregar la ultima informacion relacionada con el estado actual del proyecto, sea esto lo que ya esta desarollado y en lo que se esta trabajando

como primera tarea debes:
1. ejecutar el proyecto backend y verificar que tenga inicio de sesion 
2. que pueda conectarse a la base de datos
3. iniciar el front y verificar que tenga vista de inicio de sesion
4. que ingrese y tenga un dashbord (aunque sea en blanco)

5. espero que despues de ver todo esto seas proactivo y me dejes aca el resumen ejecutivo de menos de 60 palabras de lo que esta y en que estado, incluso debes tratar de hacerlo si no lo tiene y sin consumir tanto

---

## RESUMEN EJECUTIVO (03/06/2026)

Backend v2 personas+roles. Usuarios vinculan persona existente. Dashboard por rol: admin ve módulos; demás roles mensaje de bienvenida sin módulos aún.

---

## ACTUALIZACIÓN v4 (03/06/2026 - CRUD)

### Backend
- `GET/POST/PUT/DELETE` `/api/usuarios`, `/api/estudiantes`, `/api/profesores`, `/api/matriculas`
- `GET /api/roles`, `GET /api/cursos`
- Script `npm run seed` en `backend/`

### Frontend
- Pantallas CRUD en Usuarios, Estudiantes, Profesores y Matrícula (lista + modal + filtro por año)
- Cliente API compartido (`src/lib/api.ts`, `src/lib/session.ts`)

---

## ACTUALIZACIÓN v3 (04/06/2026 - Dashboard Modular)

### ✨ Nuevas Características

1. **Script de Inicio Dual:** `npm run dev:all` desde raíz - inicia Backend + Frontend automáticamente
2. **package.json en raíz:** Facilita comandos globales del proyecto
3. **README mejorado:** Documentación completa con instrucciones claras
4. **Comandos simplificados:**
   - `npm run setup` - Instala todo
   - `npm run seed` - Crea usuarios de prueba
   - `npm run backend` - Solo backend
   - `npm run frontend` - Solo frontend
   - `npm run dev:all` - Ambos (RECOMENDADO)

**Estado:** Listo para producción en fase initial. Flujo de desarrollo optimizado.