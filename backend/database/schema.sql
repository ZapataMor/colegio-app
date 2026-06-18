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
DROP TABLE IF EXISTS grados;
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

CREATE TABLE grados (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  numeric_level TINYINT UNSIGNED NULL UNIQUE,
  education_level VARCHAR(80),
  status ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_grados_status (status),
  INDEX idx_grados_numeric_level (numeric_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cursos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  grade_id INT UNSIGNED NOT NULL,
  nomenclature VARCHAR(20) NOT NULL,
  full_name VARCHAR(60) NOT NULL UNIQUE,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  nivel VARCHAR(50) NOT NULL,
  max_students INT UNSIGNED NOT NULL DEFAULT 35,
  jornada ENUM('mañana','tarde','noche','unica') NOT NULL DEFAULT 'mañana',
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cursos_grados FOREIGN KEY (grade_id) REFERENCES grados(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uq_cursos_grado_nomenclature (grade_id, nomenclature),
  INDEX idx_cursos_estado (estado),
  INDEX idx_cursos_nivel (nivel),
  INDEX idx_cursos_grade_id (grade_id),
  CHECK (max_students > 0)
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
  CONSTRAINT chk_notas_act_rango CHECK (nota >= 1.00 AND nota <= 5.00),
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

INSERT INTO grados (nombre, numeric_level, education_level) VALUES
('Primero', 1, 'Basica primaria'),
('Segundo', 2, 'Basica primaria'),
('Tercero', 3, 'Basica primaria'),
('Cuarto', 4, 'Basica primaria'),
('Quinto', 5, 'Basica primaria'),
('Sexto', 6, 'Basica secundaria'),
('Septimo', 7, 'Basica secundaria'),
('Octavo', 8, 'Basica secundaria'),
('Noveno', 9, 'Basica secundaria'),
('Decimo', 10, 'Media academica'),
('Once', 11, 'Media academica');

INSERT INTO cursos (grade_id, nomenclature, full_name, nombre, nivel, max_students)
SELECT g.id, x.nomenclature, CONCAT(g.numeric_level, x.nomenclature), CONCAT(g.numeric_level, x.nomenclature), g.education_level, 35
FROM grados g
INNER JOIN (
  SELECT 1 AS numeric_level, 'A' AS nomenclature UNION ALL
  SELECT 1, 'B' UNION ALL SELECT 1, 'C' UNION ALL
  SELECT 2, 'A' UNION ALL SELECT 2, 'B' UNION ALL SELECT 2, 'C' UNION ALL
  SELECT 3, 'A' UNION ALL SELECT 3, 'B' UNION ALL SELECT 3, 'C' UNION ALL
  SELECT 4, 'A' UNION ALL SELECT 4, 'B' UNION ALL SELECT 4, 'C' UNION ALL
  SELECT 5, 'A' UNION ALL SELECT 5, 'B' UNION ALL SELECT 5, 'C' UNION ALL
  SELECT 6, 'A' UNION ALL SELECT 6, 'B' UNION ALL SELECT 6, 'C' UNION ALL
  SELECT 7, 'A' UNION ALL SELECT 7, 'B' UNION ALL SELECT 7, 'C' UNION ALL
  SELECT 8, 'A' UNION ALL SELECT 8, 'B' UNION ALL SELECT 8, 'C' UNION ALL
  SELECT 9, 'A' UNION ALL SELECT 9, 'B' UNION ALL SELECT 9, 'C' UNION ALL
  SELECT 10, 'A' UNION ALL SELECT 10, 'B' UNION ALL SELECT 10, 'C' UNION ALL
  SELECT 11, 'A' UNION ALL SELECT 11, 'B' UNION ALL SELECT 11, 'C'
) x ON x.numeric_level = g.numeric_level;

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
('Salon 1', 'Bloque Primaria - Piso 1', 20),
('Salon 2', 'Bloque Primaria - Piso 1', 20),
('Salon 3', 'Bloque Primaria - Piso 1', 20),
('Salon 4', 'Bloque Primaria - Piso 1', 20),
('Salon 5', 'Bloque Primaria - Piso 1', 20),
('Salon 6', 'Bloque Primaria - Piso 1', 20),
('Salon 7', 'Bloque Primaria - Piso 2', 20),
('Salon 8', 'Bloque Primaria - Piso 2', 20),
('Salon 9', 'Bloque Primaria - Piso 2', 20),
('Salon 10', 'Bloque Primaria - Piso 2', 20),
('Salon 11', 'Bloque Primaria - Piso 2', 20),
('Salon 12', 'Bloque Primaria - Piso 2', 20),
('Salon 13', 'Bloque Primaria - Piso 3', 20),
('Salon 14', 'Bloque Primaria - Piso 3', 20),
('Salon 15', 'Bloque Primaria - Piso 3', 20),
('Salon 16', 'Bloque Secundaria - Piso 1', 20),
('Salon 17', 'Bloque Secundaria - Piso 1', 20),
('Salon 18', 'Bloque Secundaria - Piso 1', 20),
('Salon 19', 'Bloque Secundaria - Piso 1', 20),
('Salon 20', 'Bloque Secundaria - Piso 1', 20),
('Salon 21', 'Bloque Secundaria - Piso 1', 20),
('Salon 22', 'Bloque Secundaria - Piso 2', 20),
('Salon 23', 'Bloque Secundaria - Piso 2', 20),
('Salon 24', 'Bloque Secundaria - Piso 2', 20),
('Salon 25', 'Bloque Secundaria - Piso 2', 20),
('Salon 26', 'Bloque Secundaria - Piso 2', 20),
('Salon 27', 'Bloque Secundaria - Piso 2', 20),
('Salon 28', 'Bloque Media - Piso 1', 20),
('Salon 29', 'Bloque Media - Piso 1', 20),
('Salon 30', 'Bloque Media - Piso 1', 20),
('Salon 31', 'Bloque Media - Piso 2', 20),
('Salon 32', 'Bloque Media - Piso 2', 20),
('Salon 33', 'Bloque Media - Piso 2', 20);

INSERT INTO personas (nombres, apellidos, tipo_documento, documento, genero, telefono, correo, direccion) VALUES
('Diana Carolina', 'Martinez Rojas', 'CC', '810000001', 'femenino', '3001000001', 'diana.martinez@colegio.com', 'Carrera Docente 1 #10-01'),
('Andres Felipe', 'Ramirez Torres', 'CC', '810000002', 'masculino', '3001000002', 'andres.ramirez@colegio.com', 'Carrera Docente 1 #10-02'),
('Claudia Patricia', 'Gomez Herrera', 'CC', '810000003', 'femenino', '3001000003', 'claudia.gomez@colegio.com', 'Carrera Docente 1 #10-03'),
('Julian Andres', 'Castro Mejia', 'CC', '810000004', 'masculino', '3001000004', 'julian.castro@colegio.com', 'Carrera Docente 1 #10-04'),
('Natalia', 'Herrera Vargas', 'CC', '810000005', 'femenino', '3001000005', 'natalia.herrera@colegio.com', 'Carrera Docente 1 #10-05'),
('Camilo', 'Sanchez Moreno', 'CC', '810000006', 'masculino', '3001000006', 'camilo.sanchez@colegio.com', 'Carrera Docente 1 #10-06'),
('Paola Andrea', 'Morales Diaz', 'CC', '810000007', 'femenino', '3001000007', 'paola.morales@colegio.com', 'Carrera Docente 1 #10-07'),
('Sergio', 'Pineda Salazar', 'CC', '810000008', 'masculino', '3001000008', 'sergio.pineda@colegio.com', 'Carrera Docente 1 #10-08'),
('Marcela', 'Rincon Alvarez', 'CC', '810000009', 'femenino', '3001000009', 'marcela.rincon@colegio.com', 'Carrera Docente 1 #10-09'),
('Oscar', 'Navarro Cardenas', 'CC', '810000010', 'masculino', '3001000010', 'oscar.navarro@colegio.com', 'Carrera Docente 1 #10-10'),
('Laura Vanessa', 'Ortega Leon', 'CC', '810000011', 'femenino', '3001000011', 'laura.ortega@colegio.com', 'Carrera Docente 1 #10-11'),
('Rafael', 'Bermudez Silva', 'CC', '810000012', 'masculino', '3001000012', 'rafael.bermudez@colegio.com', 'Carrera Docente 1 #10-12'),
('Monica', 'Vega Molina', 'CC', '810000013', 'femenino', '3001000013', 'monica.vega@colegio.com', 'Carrera Docente 1 #10-13'),
('Hector', 'Quintero Ruiz', 'CC', '810000014', 'masculino', '3001000014', 'hector.quintero@colegio.com', 'Carrera Docente 1 #10-14'),
('Patricia', 'Cortes Aguilar', 'CC', '810000015', 'femenino', '3001000015', 'patricia.cortes@colegio.com', 'Carrera Docente 1 #10-15');

INSERT INTO persona_roles (persona_id, rol_id)
SELECT p.id, r.id
FROM personas p
INNER JOIN roles r ON r.nombre = 'profesor'
WHERE p.correo IN (
  'diana.martinez@colegio.com',
  'andres.ramirez@colegio.com',
  'claudia.gomez@colegio.com',
  'julian.castro@colegio.com',
  'natalia.herrera@colegio.com',
  'camilo.sanchez@colegio.com',
  'paola.morales@colegio.com',
  'sergio.pineda@colegio.com',
  'marcela.rincon@colegio.com',
  'oscar.navarro@colegio.com',
  'laura.ortega@colegio.com',
  'rafael.bermudez@colegio.com',
  'monica.vega@colegio.com',
  'hector.quintero@colegio.com',
  'patricia.cortes@colegio.com'
);

INSERT INTO profesores (persona_id, especialidad, titulo)
SELECT p.id,
  CASE p.correo
    WHEN 'diana.martinez@colegio.com' THEN 'Matematicas'
    WHEN 'andres.ramirez@colegio.com' THEN 'Estadistica'
    WHEN 'claudia.gomez@colegio.com' THEN 'Espanol'
    WHEN 'julian.castro@colegio.com' THEN 'Ingles'
    WHEN 'natalia.herrera@colegio.com' THEN 'Ciencias Naturales'
    WHEN 'camilo.sanchez@colegio.com' THEN 'Biologia'
    WHEN 'paola.morales@colegio.com' THEN 'Quimica'
    WHEN 'sergio.pineda@colegio.com' THEN 'Fisica'
    WHEN 'marcela.rincon@colegio.com' THEN 'Sociales'
    WHEN 'oscar.navarro@colegio.com' THEN 'Filosofia'
    WHEN 'laura.ortega@colegio.com' THEN 'Informatica'
    WHEN 'rafael.bermudez@colegio.com' THEN 'Educacion Fisica'
    WHEN 'monica.vega@colegio.com' THEN 'Arte'
    WHEN 'hector.quintero@colegio.com' THEN 'Etica y Valores'
    ELSE 'Religion'
  END AS especialidad,
  CASE p.correo
    WHEN 'diana.martinez@colegio.com' THEN 'Licenciada en Matematicas'
    WHEN 'andres.ramirez@colegio.com' THEN 'Magister en Educacion Matematica'
    WHEN 'claudia.gomez@colegio.com' THEN 'Licenciada en Lengua Castellana'
    WHEN 'julian.castro@colegio.com' THEN 'Licenciado en Lenguas Modernas'
    WHEN 'natalia.herrera@colegio.com' THEN 'Licenciada en Ciencias Naturales'
    WHEN 'camilo.sanchez@colegio.com' THEN 'Biologo'
    WHEN 'paola.morales@colegio.com' THEN 'Quimica'
    WHEN 'sergio.pineda@colegio.com' THEN 'Fisico'
    WHEN 'marcela.rincon@colegio.com' THEN 'Licenciada en Ciencias Sociales'
    WHEN 'oscar.navarro@colegio.com' THEN 'Filosofo'
    WHEN 'laura.ortega@colegio.com' THEN 'Ingeniera de Sistemas'
    WHEN 'rafael.bermudez@colegio.com' THEN 'Licenciado en Educacion Fisica'
    WHEN 'monica.vega@colegio.com' THEN 'Maestra en Artes'
    WHEN 'hector.quintero@colegio.com' THEN 'Licenciado en Filosofia y Etica'
    ELSE 'Licenciada en Educacion Religiosa'
  END AS titulo
FROM personas p
WHERE p.correo IN (
  'diana.martinez@colegio.com',
  'andres.ramirez@colegio.com',
  'claudia.gomez@colegio.com',
  'julian.castro@colegio.com',
  'natalia.herrera@colegio.com',
  'camilo.sanchez@colegio.com',
  'paola.morales@colegio.com',
  'sergio.pineda@colegio.com',
  'marcela.rincon@colegio.com',
  'oscar.navarro@colegio.com',
  'laura.ortega@colegio.com',
  'rafael.bermudez@colegio.com',
  'monica.vega@colegio.com',
  'hector.quintero@colegio.com',
  'patricia.cortes@colegio.com'
);

INSERT INTO usuarios (persona_id, password_hash)
SELECT p.id, '$2b$10$yMIuYfaKKuyeR8fIHgZuWOS7YgWxq9GpDL8g.dq1hM77Vr5JzX9Yu'
FROM personas p
WHERE p.correo IN (
  'diana.martinez@colegio.com',
  'andres.ramirez@colegio.com',
  'claudia.gomez@colegio.com',
  'julian.castro@colegio.com',
  'natalia.herrera@colegio.com',
  'camilo.sanchez@colegio.com',
  'paola.morales@colegio.com',
  'sergio.pineda@colegio.com',
  'marcela.rincon@colegio.com',
  'oscar.navarro@colegio.com',
  'laura.ortega@colegio.com',
  'rafael.bermudez@colegio.com',
  'monica.vega@colegio.com',
  'hector.quintero@colegio.com',
  'patricia.cortes@colegio.com'
);

CREATE TEMPORARY TABLE tmp_estudiantes_base (
  numero INT UNSIGNED NOT NULL PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  genero ENUM('masculino','femenino','otro','no_especifica') NOT NULL
);

INSERT INTO tmp_estudiantes_base (numero, nombres, apellidos, genero) VALUES
(1, 'Santiago', 'Lopez Garcia', 'masculino'),
(2, 'Valentina', 'Rodriguez Perez', 'femenino'),
(3, 'Mateo', 'Gonzalez Martinez', 'masculino'),
(4, 'Isabella', 'Hernandez Sanchez', 'femenino'),
(5, 'Sebastian', 'Ramirez Torres', 'masculino'),
(6, 'Mariana', 'Diaz Vargas', 'femenino'),
(7, 'Nicolas', 'Morales Castro', 'masculino'),
(8, 'Salome', 'Rojas Moreno', 'femenino'),
(9, 'Daniel', 'Jimenez Herrera', 'masculino'),
(10, 'Gabriela', 'Ortiz Molina', 'femenino'),
(11, 'Emmanuel', 'Silva Navarro', 'masculino'),
(12, 'Antonella', 'Cortes Ruiz', 'femenino'),
(13, 'Samuel', 'Pineda Leon', 'masculino'),
(14, 'Luciana', 'Medina Alvarez', 'femenino'),
(15, 'Juan Pablo', 'Vega Cardenas', 'masculino'),
(16, 'Sara', 'Aguilar Salazar', 'femenino'),
(17, 'Martin', 'Quintero Mejia', 'masculino'),
(18, 'Maria Jose', 'Bermudez Ortega', 'femenino'),
(19, 'Alejandro', 'Arias Castillo', 'masculino'),
(20, 'Manuela', 'Mendoza Prieto', 'femenino');

INSERT INTO personas (
  nombres,
  apellidos,
  tipo_documento,
  documento,
  fecha_nacimiento,
  genero,
  telefono,
  correo,
  direccion
)
SELECT
  eb.nombres,
  eb.apellidos,
  'TI',
  CONCAT('71', LPAD(SUBSTRING(c.nombre, 1, CHAR_LENGTH(c.nombre) - 1), 2, '0'), ASCII(RIGHT(c.nombre, 1)), LPAD(eb.numero, 2, '0')),
  STR_TO_DATE(
    CONCAT(
      2026 - (CAST(SUBSTRING(c.nombre, 1, CHAR_LENGTH(c.nombre) - 1) AS UNSIGNED) + 5),
      '-',
      LPAD(((eb.numero - 1) MOD 12) + 1, 2, '0'),
      '-',
      LPAD(((eb.numero * 3) MOD 27) + 1, 2, '0')
    ),
    '%Y-%m-%d'
  ),
  eb.genero,
  CONCAT('310', LPAD(c.id, 3, '0'), LPAD(eb.numero, 4, '0')),
  CONCAT('estudiante.', LOWER(c.nombre), '.', LPAD(eb.numero, 2, '0'), '@colegio.com'),
  CONCAT('Barrio Escolar ', c.nombre, ', casa ', eb.numero)
FROM cursos c
CROSS JOIN tmp_estudiantes_base eb;

INSERT INTO persona_roles (persona_id, rol_id)
SELECT p.id, r.id
FROM personas p
INNER JOIN roles r ON r.nombre = 'estudiante'
WHERE p.correo LIKE 'estudiante.%@colegio.com';

INSERT INTO estudiantes (persona_id, curso_id, codigo_estudiante)
SELECT
  p.id,
  c.id,
  CONCAT('EST-2026-', c.nombre, '-', LPAD(eb.numero, 2, '0'))
FROM cursos c
CROSS JOIN tmp_estudiantes_base eb
INNER JOIN personas p
  ON p.documento = CONCAT('71', LPAD(SUBSTRING(c.nombre, 1, CHAR_LENGTH(c.nombre) - 1), 2, '0'), ASCII(RIGHT(c.nombre, 1)), LPAD(eb.numero, 2, '0'));

INSERT INTO matriculas (estudiante_id, curso_id, anio, fecha_matricula, estado, observacion)
SELECT
  e.id,
  e.curso_id,
  2026,
  '2026-01-18',
  'activa',
  CONCAT('Matricula academica 2026 para ', c.nombre)
FROM estudiantes e
INNER JOIN cursos c ON c.id = e.curso_id;

DROP TEMPORARY TABLE tmp_estudiantes_base;

INSERT INTO periodos_academicos (nombre, fecha_inicio, fecha_fin, estado) VALUES
('Periodo 1 - 2026', '2026-01-20', '2026-03-27', 'cerrado'),
('Periodo 2 - 2026', '2026-04-06', '2026-06-12', 'activo'),
('Periodo 3 - 2026', '2026-07-06', '2026-09-11', 'inactivo'),
('Periodo 4 - 2026', '2026-09-21', '2026-11-27', 'inactivo');

INSERT INTO notas (
  estudiante_id,
  curso_id,
  asignatura_id,
  profesor_id,
  periodo_id,
  nota,
  observacion,
  fecha_registro
)
SELECT
  e.id,
  e.curso_id,
  a.id,
  pr.id,
  pa.id,
  ROUND(1 + (RAND() * 4), 1),
  'Nota de prueba generada automaticamente.',
  '2026-06-05'
FROM estudiantes e
CROSS JOIN asignaturas a
INNER JOIN periodos_academicos pa ON pa.nombre = 'Periodo 2 - 2026'
INNER JOIN personas pp
  ON pp.correo = CASE a.id
    WHEN 1 THEN 'diana.martinez@colegio.com'
    WHEN 2 THEN 'andres.ramirez@colegio.com'
    WHEN 3 THEN 'natalia.herrera@colegio.com'
    WHEN 4 THEN 'paola.morales@colegio.com'
    WHEN 5 THEN 'claudia.gomez@colegio.com'
    WHEN 6 THEN 'julian.castro@colegio.com'
    WHEN 7 THEN 'marcela.rincon@colegio.com'
    WHEN 8 THEN 'laura.ortega@colegio.com'
    WHEN 9 THEN 'rafael.bermudez@colegio.com'
    ELSE 'monica.vega@colegio.com'
  END
INNER JOIN profesores pr ON pr.persona_id = pp.id;

INSERT INTO comunicados (titulo, resumen, contenido, prioridad, audiencia, estado) VALUES
('Bienvenida al segundo periodo', 'Inicio del periodo academico activo para toda la comunidad.', 'Se recuerda a estudiantes, acudientes y docentes revisar cronogramas, horarios y compromisos del nuevo periodo academico.', 'alta', 'todos', 'publicado');
