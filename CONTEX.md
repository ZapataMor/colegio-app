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

Backend v2 personas+roles. Usuarios vinculan persona existente. Dashboard por rol: admin ve modulos; demas roles mensaje de bienvenida sin modulos aun.

---

## ACTUALIZACION v4 (03/06/2026 - CRUD)

### Backend
- `GET/POST/PUT/DELETE` `/api/usuarios`, `/api/estudiantes`, `/api/profesores`, `/api/matriculas`
- `GET /api/roles`, `GET /api/cursos`
- Script `npm run seed` en `backend/`

### Frontend
- Pantallas CRUD en Usuarios, Estudiantes, Profesores y Matricula (lista + modal + filtro por ano)
- Cliente API compartido (`src/lib/api.ts`, `src/lib/session.ts`)

---

## ACTUALIZACION v3 (04/06/2026 - Dashboard Modular)

### Nuevas Caracteristicas

1. Script de Inicio Dual: `npm run dev:all` desde raiz - inicia Backend + Frontend automaticamente
2. package.json en raiz: Facilita comandos globales del proyecto
3. README mejorado: Documentacion completa con instrucciones claras
4. Comandos simplificados:
   - `npm run setup` - Instala todo
   - `npm run seed` - Crea usuarios de prueba
   - `npm run backend` - Solo backend
   - `npm run frontend` - Solo frontend
   - `npm run dev:all` - Ambos (RECOMENDADO)

**Estado:** Listo para produccion en fase initial. Flujo de desarrollo optimizado.

---

## ACTUALIZACION v5 (04/06/2026 - UI refinada)

### Frontend
- Login y dashboard con un estilo mas editorial: hero oscuro, acento dorado, tarjetas con profundidad y mejor jerarquia visual.
- `frontend/CLAUDE.md` documenta los patrones de diseno tomados como referencia temporal desde `Crear un login`.

**Estado:** El frontend compila correctamente con `npx.cmd tsc --noEmit`.
