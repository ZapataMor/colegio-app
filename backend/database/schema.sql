/* ============================================================
   BASE DE DATOS: colegio_app
   Sistema escolar para aplicativo movil Expo Go + Node.js Express
   Compatible con MySQL 8
   Version 2.0 - Estructura unificada de personas y areas
   ============================================================ */

CREATE DATABASE IF NOT EXISTS colegio_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE colegio_app;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS notas_actividades;
DROP TABLE IF EXISTS actividades;
DROP TABLE IF EXISTS comunicados;
DROP TABLE IF EXISTS matriculas;
DROP TABLE IF EXISTS asistencias;
DROP TABLE IF EXISTS notas;
DROP TABLE IF EXISTS periodos_academicos;
DROP TABLE IF EXISTS horarios;
DROP TABLE IF EXISTS profesor_asignatura;
DROP TABLE IF EXISTS salones;
DROP TABLE IF EXISTS asignaturas;
DROP TABLE IF EXISTS areas;
DROP TABLE IF EXISTS estudiante_acudiente;
DROP TABLE IF EXISTS estudiantes;
DROP TABLE IF EXISTS profesores;
DROP TABLE IF EXISTS acudientes;
DROP TABLE IF EXISTS cursos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS persona_roles;
DROP TABLE IF EXISTS personas;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(150),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE personas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  tipo_documento ENUM('CC','TI','CE','PP','RC') NOT NULL DEFAULT 'CC',
  documento VARCHAR(50) NOT NULL UNIQUE,
  fecha_nacimiento DATE,
  genero ENUM('masculino','femenino','otro','no_especifica'),
  telefono VARCHAR(30),
  correo VARCHAR(150) UNIQUE,
  direccion VARCHAR(255),
  foto_url VARCHAR(255),
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_personas_documento (documento),
  INDEX idx_personas_apellidos (apellidos),
  INDEX idx_personas_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  persona_id INT UNSIGNED NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  ultimo_acceso TIMESTAMP NULL,
  estado ENUM('activo','inactivo','bloqueado') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_personas FOREIGN KEY (persona_id) REFERENCES personas(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_usuarios_persona_id (persona_id),
  INDEX idx_usuarios_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE persona_roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  persona_id INT UNSIGNED NOT NULL,
  rol_id INT UNSIGNED NOT NULL,
  fecha_inicio DATE NOT NULL DEFAULT (CURRENT_DATE),
  fecha_fin DATE NULL,
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_persona_roles_persona FOREIGN KEY (persona_id) REFERENCES personas(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_persona_roles_rol FOREIGN KEY (rol_id) REFERENCES roles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uq_persona_rol (persona_id, rol_id),
  INDEX idx_persona_roles_persona_id (persona_id),
  INDEX idx_persona_roles_rol_id (rol_id),
  INDEX idx_persona_roles_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cursos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  nivel VARCHAR(50) NOT NULL,
  jornada ENUM('mañana','tarde','noche','unica') NOT NULL DEFAULT 'mañana',
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cursos_estado (estado),
  INDEX idx_cursos_nivel (nivel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE estudiantes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  persona_id INT UNSIGNED NOT NULL UNIQUE,
  curso_id INT UNSIGNED NOT NULL,
  codigo_estudiante VARCHAR(20) UNIQUE,
  estado ENUM('activo','inactivo','retirado','egresado') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_estudiantes_personas FOREIGN KEY (persona_id) REFERENCES personas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_estudiantes_cursos FOREIGN KEY (curso_id) REFERENCES cursos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_estudiantes_persona_id (persona_id),
  INDEX idx_estudiantes_curso_id (curso_id),
  INDEX idx_estudiantes_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE profesores (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  persona_id INT UNSIGNED NOT NULL UNIQUE,
  especialidad VARCHAR(100),
  titulo VARCHAR(100),
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profesores_personas FOREIGN KEY (persona_id) REFERENCES personas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_profesores_persona_id (persona_id),
  INDEX idx_profesores_estado (estado),
  INDEX idx_profesores_especialidad (especialidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE acudientes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  persona_id INT UNSIGNED NOT NULL UNIQUE,
  ocupacion VARCHAR(100),
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_acudientes_personas FOREIGN KEY (persona_id) REFERENCES personas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_acudientes_persona_id (persona_id),
  INDEX idx_acudientes_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE estudiante_acudiente (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT UNSIGNED NOT NULL,
  acudiente_id INT UNSIGNED NOT NULL,
  parentesco VARCHAR(50) NOT NULL,
  es_principal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_est_acudiente_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_est_acudiente_acudiente FOREIGN KEY (acudiente_id) REFERENCES acudientes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY uq_estudiante_acudiente (estudiante_id, acudiente_id),
  INDEX idx_est_acudiente_estudiante_id (estudiante_id),
  INDEX idx_est_acudiente_acudiente_id (acudiente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE areas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_areas_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE asignaturas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  area_id INT UNSIGNED NOT NULL,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_asignaturas_areas FOREIGN KEY (area_id) REFERENCES areas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_asignaturas_area_id (area_id),
  INDEX idx_asignaturas_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE salones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  ubicacion VARCHAR(150),
  capacidad INT UNSIGNED NOT NULL DEFAULT 0,
  estado ENUM('activo','inactivo','mantenimiento') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_salones_estado (estado),
  CHECK (capacidad >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE profesor_asignatura (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profesor_id INT UNSIGNED NOT NULL,
  asignatura_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_prof_asig_profesor FOREIGN KEY (profesor_id) REFERENCES profesores(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_prof_asig_asignatura FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY uq_profesor_asignatura (profesor_id, asignatura_id),
  INDEX idx_prof_asig_profesor_id (profesor_id),
  INDEX idx_prof_asig_asignatura_id (asignatura_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE periodos_academicos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado ENUM('activo','inactivo','cerrado') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_periodos_fechas CHECK (fecha_fin >= fecha_inicio),
  INDEX idx_periodos_estado (estado),
  INDEX idx_periodos_fechas (fecha_inicio, fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE horarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  curso_id INT UNSIGNED NOT NULL,
  profesor_id INT UNSIGNED NOT NULL,
  asignatura_id INT UNSIGNED NOT NULL,
  salon_id INT UNSIGNED NOT NULL,
  dia_semana ENUM('lunes','martes','miercoles','jueves','viernes','sabado','domingo') NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_horarios_cursos FOREIGN KEY (curso_id) REFERENCES cursos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_horarios_profesores FOREIGN KEY (profesor_id) REFERENCES profesores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_horarios_asignaturas FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_horarios_salones FOREIGN KEY (salon_id) REFERENCES salones(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_horarios_horas CHECK (hora_fin > hora_inicio),
  UNIQUE KEY uq_horario_salon (salon_id, dia_semana, hora_inicio),
  UNIQUE KEY uq_horario_profesor (profesor_id, dia_semana, hora_inicio),
  UNIQUE KEY uq_horario_curso (curso_id, dia_semana, hora_inicio),
  INDEX idx_horarios_curso_id (curso_id),
  INDEX idx_horarios_profesor_id (profesor_id),
  INDEX idx_horarios_asignatura_id (asignatura_id),
  INDEX idx_horarios_salon_id (salon_id),
  INDEX idx_horarios_dia_hora (dia_semana, hora_inicio),
  INDEX idx_horarios_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE matriculas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT UNSIGNED NOT NULL,
  curso_id INT UNSIGNED NOT NULL,
  anio YEAR NOT NULL,
  fecha_matricula DATE NOT NULL DEFAULT (CURRENT_DATE),
  estado ENUM('activa','cancelada','finalizada') NOT NULL DEFAULT 'activa',
  observacion TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_matriculas_estudiantes FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_matriculas_cursos FOREIGN KEY (curso_id) REFERENCES cursos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uq_matricula_estudiante_anio (estudiante_id, anio),
  INDEX idx_matriculas_estudiante_id (estudiante_id),
  INDEX idx_matriculas_curso_id (curso_id),
  INDEX idx_matriculas_anio (anio),
  INDEX idx_matriculas_estado (estado),
  INDEX idx_matriculas_fecha (fecha_matricula)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT UNSIGNED NOT NULL,
  curso_id INT UNSIGNED NOT NULL,
  asignatura_id INT UNSIGNED NOT NULL,
  profesor_id INT UNSIGNED NOT NULL,
  periodo_id INT UNSIGNED NOT NULL,
  nota DECIMAL(3,2) NOT NULL,
  observacion TEXT,
  fecha_registro DATE NOT NULL DEFAULT (CURRENT_DATE),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notas_estudiantes FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_notas_cursos FOREIGN KEY (curso_id) REFERENCES cursos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_notas_asignaturas FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_notas_profesores FOREIGN KEY (profesor_id) REFERENCES profesores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_notas_periodos FOREIGN KEY (periodo_id) REFERENCES periodos_academicos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_notas_rango CHECK (nota >= 0.00 AND nota <= 5.00),
  UNIQUE KEY uq_nota_estudiante_asignatura_periodo (estudiante_id, asignatura_id, periodo_id),
  INDEX idx_notas_estudiante_id (estudiante_id),
  INDEX idx_notas_curso_id (curso_id),
  INDEX idx_notas_asignatura_id (asignatura_id),
  INDEX idx_notas_profesor_id (profesor_id),
  INDEX idx_notas_periodo_id (periodo_id),
  INDEX idx_notas_fecha_registro (fecha_registro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE asistencias (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT UNSIGNED NOT NULL,
  curso_id INT UNSIGNED NOT NULL,
  asignatura_id INT UNSIGNED NOT NULL,
  profesor_id INT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  estado_asistencia ENUM('presente','ausente','excusa','tardanza') NOT NULL,
  observacion TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_asistencias_estudiantes FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_asistencias_cursos FOREIGN KEY (curso_id) REFERENCES cursos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_asistencias_asignaturas FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_asistencias_profesores FOREIGN KEY (profesor_id) REFERENCES profesores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uq_asistencia_estudiante_asignatura_fecha (estudiante_id, asignatura_id, fecha),
  INDEX idx_asistencias_estudiante_id (estudiante_id),
  INDEX idx_asistencias_curso_id (curso_id),
  INDEX idx_asistencias_asignatura_id (asignatura_id),
  INDEX idx_asistencias_profesor_id (profesor_id),
  INDEX idx_asistencias_fecha (fecha),
  INDEX idx_asistencias_estado (estado_asistencia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE actividades (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  curso_id INT UNSIGNED NOT NULL,
  asignatura_id INT UNSIGNED NOT NULL,
  profesor_id INT UNSIGNED NOT NULL,
  periodo_id INT UNSIGNED NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT,
  porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  fecha DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_actividades_cursos FOREIGN KEY (curso_id) REFERENCES cursos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_actividades_asignaturas FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_actividades_profesores FOREIGN KEY (profesor_id) REFERENCES profesores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_actividades_periodos FOREIGN KEY (periodo_id) REFERENCES periodos_academicos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_actividades_porcentaje CHECK (porcentaje >= 0.00 AND porcentaje <= 100.00),
  INDEX idx_actividades_curso_id (curso_id),
  INDEX idx_actividades_asignatura_id (asignatura_id),
  INDEX idx_actividades_profesor_id (profesor_id),
  INDEX idx_actividades_periodo_id (periodo_id),
  INDEX idx_actividades_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE comunicados (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(140) NOT NULL,
  resumen VARCHAR(220),
  contenido TEXT NOT NULL,
  prioridad ENUM('baja','media','alta','urgente') NOT NULL DEFAULT 'media',
  audiencia ENUM('todos','administrador','profesor','estudiante','acudiente') NOT NULL DEFAULT 'todos',
  curso_id INT UNSIGNED NULL,
  publicado_por_persona_id INT UNSIGNED NULL,
  fecha_publicacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion DATETIME NULL,
  estado ENUM('borrador','publicado','archivado') NOT NULL DEFAULT 'publicado',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_comunicados_cursos FOREIGN KEY (curso_id) REFERENCES cursos(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_comunicados_personas FOREIGN KEY (publicado_por_persona_id) REFERENCES personas(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_comunicados_audiencia (audiencia),
  INDEX idx_comunicados_curso_id (curso_id),
  INDEX idx_comunicados_estado (estado),
  INDEX idx_comunicados_fecha_publicacion (fecha_publicacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notas_actividades (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actividad_id INT UNSIGNED NOT NULL,
  estudiante_id INT UNSIGNED NOT NULL,
  nota DECIMAL(3,2) NOT NULL,
  observacion TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notas_act_actividades FOREIGN KEY (actividad_id) REFERENCES actividades(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_notas_act_estudiantes FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_notas_act_rango CHECK (nota >= 0.00 AND nota <= 5.00),
  UNIQUE KEY uq_nota_actividad_estudiante (actividad_id, estudiante_id),
  INDEX idx_notas_act_actividad_id (actividad_id),
  INDEX idx_notas_act_estudiante_id (estudiante_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (nombre, descripcion) VALUES
('administrador', 'Acceso completo al sistema'),
('profesor', 'Gestiona asignaturas, notas y asistencias'),
('estudiante', 'Acceso a informacion academica propia'),
('acudiente', 'Consulta el rendimiento de sus acudidos');

INSERT INTO areas (nombre, descripcion) VALUES
('Matemáticas', 'Pensamiento logico y numerico'),
('Ciencias Naturales', 'Biologia, quimica y medio ambiente'),
('Humanidades', 'Lengua castellana e ingles'),
('Ciencias Sociales', 'Historia, geografia y ciudadania'),
('Tecnología e Informática', 'Sistemas y tecnologia'),
('Educación Física', 'Deporte y salud'),
('Arte y Cultura', 'Expresion artistica y musical');

INSERT INTO cursos (nombre, nivel, jornada) VALUES
('6A', 'Básica secundaria', 'mañana'),
('7B', 'Básica secundaria', 'mañana'),
('10A', 'Media académica', 'tarde');

INSERT INTO asignaturas (area_id, nombre, descripcion) VALUES
(1, 'Matemáticas', 'Aritmetica, algebra y geometria'),
(1, 'Estadística', 'Analisis de datos y probabilidad'),
(2, 'Ciencias Naturales', 'Ciencias y medio ambiente'),
(2, 'Química', 'Elementos y reacciones quimicas'),
(3, 'Español', 'Lengua castellana y comunicacion'),
(3, 'Inglés', 'Lengua extranjera'),
(4, 'Sociales', 'Historia, geografia y ciudadania'),
(5, 'Informática', 'Fundamentos de programacion y sistemas'),
(6, 'Educación Física', 'Deporte, salud y bienestar'),
(7, 'Arte', 'Expresion plastica y visual');

INSERT INTO salones (nombre, ubicacion, capacidad) VALUES
('Salón 101', 'Bloque A - Piso 1', 35),
('Salón 202', 'Bloque B - Piso 2', 30),
('Laboratorio 1', 'Bloque C - Piso 1', 25),
('Sala de Sistemas', 'Bloque D - Piso 1', 20);

INSERT INTO periodos_academicos (nombre, fecha_inicio, fecha_fin, estado) VALUES
('Periodo 1 - 2026', '2026-01-20', '2026-03-27', 'cerrado'),
('Periodo 2 - 2026', '2026-04-06', '2026-06-12', 'activo'),
('Periodo 3 - 2026', '2026-07-06', '2026-09-11', 'inactivo'),
('Periodo 4 - 2026', '2026-09-21', '2026-11-27', 'inactivo');

INSERT INTO comunicados (titulo, resumen, contenido, prioridad, audiencia, estado) VALUES
('Bienvenida al segundo periodo', 'Inicio del periodo academico activo para toda la comunidad.', 'Se recuerda a estudiantes, acudientes y docentes revisar cronogramas, horarios y compromisos del nuevo periodo academico.', 'alta', 'todos', 'publicado');
