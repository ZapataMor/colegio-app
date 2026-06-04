/* ============================================================
   BASE DE DATOS: colegio_app
   Sistema escolar para aplicativo móvil Expo Go + Node.js Express
   Compatible con MySQL 8
   ============================================================ */

CREATE DATABASE IF NOT EXISTS colegio_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE colegio_app;

SET FOREIGN_KEY_CHECKS = 0;

/* ============================================================
   LIMPIEZA OPCIONAL DE TABLAS
   ============================================================ */

DROP TABLE IF EXISTS notas_actividades;
DROP TABLE IF EXISTS actividades;
DROP TABLE IF EXISTS matriculas;
DROP TABLE IF EXISTS asistencias;
DROP TABLE IF EXISTS notas;
DROP TABLE IF EXISTS periodos_academicos;
DROP TABLE IF EXISTS horarios;
DROP TABLE IF EXISTS profesor_asignatura;
DROP TABLE IF EXISTS salones;
DROP TABLE IF EXISTS asignaturas;
DROP TABLE IF EXISTS estudiante_acudiente;
DROP TABLE IF EXISTS acudientes;
DROP TABLE IF EXISTS profesores;
DROP TABLE IF EXISTS estudiantes;
DROP TABLE IF EXISTS cursos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

/* ============================================================
   TABLA: roles
   Almacena los tipos de usuario del sistema.
   ============================================================ */

CREATE TABLE roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(150),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ============================================================
   TABLA: usuarios
   Almacena credenciales y datos básicos de acceso al sistema.
   ============================================================ */

CREATE TABLE usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  rol_id INT UNSIGNED NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(30),
  estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_usuarios_roles
    FOREIGN KEY (rol_id) REFERENCES roles(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  INDEX idx_usuarios_rol_id (rol_id),
  INDEX idx_usuarios_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ============================================================
   TABLA: cursos
   Almacena grados o grupos académicos.
   ============================================================ */

CREATE TABLE cursos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  nivel VARCHAR(50) NOT NULL,
  jornada ENUM('mañana', 'tarde', 'noche', 'unica') NOT NULL DEFAULT 'mañana',
  estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_cursos_estado (estado),
  INDEX idx_cursos_nivel (nivel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ============================================================
   TABLA: estudiantes
   Almacena la información académica de los estudiantes.
   ============================================================ */

CREATE TABLE estudiantes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NULL,
  curso_id INT UNSIGNED NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  documento VARCHAR(50) NOT NULL UNIQUE,
  fecha_nacimiento DATE,
  genero ENUM('masculino', 'femenino', 'otro', 'no_especifica'),
  direccion VARCHAR(255),
  telefono_acudiente VARCHAR(30),
  nombre_acudiente VARCHAR(150),
  estado ENUM('activo', 'inactivo', 'retirado', 'egresado') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_estudiantes_usuarios
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT fk_estudiantes_cursos
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  INDEX idx_estudiantes_usuario_id (usuario_id),
  INDEX idx_estudiantes_curso_id (curso_id),
  INDEX idx_estudiantes_estado (estado),
  INDEX idx_estudiantes_apellidos (apellidos)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ============================================================
   TABLA: profesores
   Almacena información de los docentes.
   ============================================================ */

CREATE TABLE profesores (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  documento VARCHAR(50) NOT NULL UNIQUE,
  correo VARCHAR(150) UNIQUE,
  telefono VARCHAR(30),
  especialidad VARCHAR(100),
  estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_profesores_usuarios
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  INDEX idx_profesores_usuario_id (usuario_id),
  INDEX idx_profesores_estado (estado),
  INDEX idx_profesores_especialidad (especialidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ============================================================
   TABLA: acudientes
   Almacena acudientes o padres de familia.
   ============================================================ */

CREATE TABLE acudientes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  documento VARCHAR(50) NOT NULL UNIQUE,
  telefono VARCHAR(30),
  correo VARCHAR(150) UNIQUE,
  direccion VARCHAR(255),
  estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_acudientes_usuarios
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  INDEX idx_acudientes_usuario_id (usuario_id),
  INDEX idx_acudientes_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ============================================================
   TABLA: estudiante_acudiente
   Relaciona estudiantes con uno o varios acudientes.
   ============================================================ */

CREATE TABLE estudiante_acudiente (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT UNSIGNED NOT NULL,
  acudiente_id INT UNSIGNED NOT NULL,
  parentesco VARCHAR(50) NOT NULL,
  es_principal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_estudiante_acudiente_estudiante
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_estudiante_acudiente_acudiente
    FOREIGN KEY (acudiente_id) REFERENCES acudientes(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  UNIQUE KEY uq_estudiante_acudiente (estudiante_id, acudiente_id),
  INDEX idx_estudiante_acudiente_estudiante_id (estudiante_id),
  INDEX idx_estudiante_acudiente_acudiente_id (acudiente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ============================================================
   TABLA: asignaturas
   Almacena materias académicas.
   ============================================================ */

CREATE TABLE asignaturas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_asignaturas_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ============================================================
   TABLA: salones
   Almacena salones físicos disponibles.
   ============================================================ */

CREATE TABLE salones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  ubicacion VARCHAR(150),
  capacidad INT UNSIGNED NOT NULL DEFAULT 0,
  estado ENUM('activo', 'inactivo', 'mantenimiento') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_salones_estado (estado),
  CHECK (capacidad >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ============================================================
   TABLA: profesor_asignatura
   Relaciona profesores con asignaturas que pueden dictar.
   ============================================================ */

CREATE TABLE profesor_asignatura (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profesor_id INT UNSIGNED NOT NULL,
  asignatura_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_profesor_asignatura_profesor
    FOREIGN KEY (profesor_id) REFERENCES profesores(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_profesor_asignatura_asignatura
    FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  UNIQUE KEY uq_profesor_asignatura (profesor_id, asignatura_id),
  INDEX idx_profesor_asignatura_profesor_id (profesor_id),
  INDEX idx_profesor_asignatura_asignatura_id (asignatura_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ============================================================
   TABLA: horarios
   Almacena la programación semanal de clases.
   ============================================================ */

CREATE TABLE horarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  curso_id INT UNSIGNED NOT NULL,
  profesor_id INT UNSIGNED NOT NULL,
  asignatura_id INT UNSIGNED NOT NULL,
  salon_id INT UNSIGNED NOT NULL,
  dia_semana ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo') NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_horarios_cursos
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_horarios_profesores
    FOREIGN KEY (profesor_id) REFERENCES profesores(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_horarios_asignaturas
    FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_horarios_salones
    FOREIGN KEY (salon_id) REFERENCES salones(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT chk_horarios_horas
    CHECK (hora_fin > hora_inicio),

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

/* ============================================================
   TABLA: periodos_academicos
   Almacena periodos académicos del año escolar.
   ============================================================ */

CREATE TABLE periodos_academicos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado ENUM('activo', 'inactivo', 'cerrado') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT chk_periodos_fechas
    CHECK (fecha_fin >= fecha_inicio),

  INDEX idx_periodos_estado (estado),
  INDEX idx_periodos_fechas (fecha_inicio, fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ============================================================
   TABLA: notas
   Almacena calificaciones finales o consolidadas por periodo.
   ============================================================ */

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

  CONSTRAINT fk_notas_estudiantes
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_notas_cursos
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_notas_asignaturas
    FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_notas_profesores
    FOREIGN KEY (profesor_id) REFERENCES profesores(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_notas_periodos
    FOREIGN KEY (periodo_id) REFERENCES periodos_academicos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT chk_notas_rango
    CHECK (nota >= 0.00 AND nota <= 5.00),

  UNIQUE KEY uq_nota_estudiante_asignatura_periodo (estudiante_id, asignatura_id, periodo_id),
  INDEX idx_notas_estudiante_id (estudiante_id),
  INDEX idx_notas_curso_id (curso_id),
  INDEX idx_notas_asignatura_id (asignatura_id),
  INDEX idx_notas_profesor_id (profesor_id),
  INDEX idx_notas_periodo_id (periodo_id),
  INDEX idx_notas_fecha_registro (fecha_registro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ============================================================
   TABLA: asistencias
   Almacena asistencia diaria por estudiante y clase.
   ============================================================ */

CREATE TABLE asistencias (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT UNSIGNED NOT NULL,
  curso_id INT UNSIGNED NOT NULL,
  asignatura_id INT UNSIGNED NOT NULL,
  profesor_id INT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  estado_asistencia ENUM('presente', 'ausente', 'excusa', 'tardanza') NOT NULL,
  observacion TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_asistencias_estudiantes
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_asistencias_cursos
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_asistencias_asignaturas
    FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_asistencias_profesores
    FOREIGN KEY (profesor_id) REFERENCES profesores(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  UNIQUE KEY uq_asistencia_estudiante_asignatura_fecha (estudiante_id, asignatura_id, fecha),
  INDEX idx_asistencias_estudiante_id (estudiante_id),
  INDEX idx_asistencias_curso_id (curso_id),
  INDEX idx_asistencias_asignatura_id (asignatura_id),
  INDEX idx_asistencias_profesor_id (profesor_id),
  INDEX idx_asistencias_fecha (fecha),
  INDEX idx_asistencias_estado (estado_asistencia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ============================================================
   TABLA: matriculas
   Registra la matrícula de estudiantes por curso y año.
   ============================================================ */

CREATE TABLE matriculas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT UNSIGNED NOT NULL,
  curso_id INT UNSIGNED NOT NULL,
  anio YEAR NOT NULL,
  estado ENUM('activa', 'cancelada', 'finalizada') NOT NULL DEFAULT 'activa',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_matriculas_estudiantes
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_matriculas_cursos
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  UNIQUE KEY uq_matricula_estudiante_anio (estudiante_id, anio),
  INDEX idx_matriculas_estudiante_id (estudiante_id),
  INDEX idx_matriculas_curso_id (curso_id),
  INDEX idx_matriculas_anio (anio),
  INDEX idx_matriculas_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ============================================================
   TABLA: actividades
   Registra actividades evaluativas por curso, asignatura y periodo.
   ============================================================ */

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

  CONSTRAINT fk_actividades_cursos
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_actividades_asignaturas
    FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_actividades_profesores
    FOREIGN KEY (profesor_id) REFERENCES profesores(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_actividades_periodos
    FOREIGN KEY (periodo_id) REFERENCES periodos_academicos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT chk_actividades_porcentaje
    CHECK (porcentaje >= 0.00 AND porcentaje <= 100.00),

  INDEX idx_actividades_curso_id (curso_id),
  INDEX idx_actividades_asignatura_id (asignatura_id),
  INDEX idx_actividades_profesor_id (profesor_id),
  INDEX idx_actividades_periodo_id (periodo_id),
  INDEX idx_actividades_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ============================================================
   TABLA: notas_actividades
   Relaciona estudiantes con actividades evaluativas y sus notas.
   ============================================================ */

CREATE TABLE notas_actividades (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actividad_id INT UNSIGNED NOT NULL,
  estudiante_id INT UNSIGNED NOT NULL,
  nota DECIMAL(3,2) NOT NULL,
  observacion TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_notas_actividades_actividades
    FOREIGN KEY (actividad_id) REFERENCES actividades(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_notas_actividades_estudiantes
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT chk_notas_actividades_rango
    CHECK (nota >= 0.00 AND nota <= 5.00),

  UNIQUE KEY uq_nota_actividad_estudiante (actividad_id, estudiante_id),
  INDEX idx_notas_actividades_actividad_id (actividad_id),
  INDEX idx_notas_actividades_estudiante_id (estudiante_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ============================================================
   INSERTS INICIALES
   ============================================================ */

INSERT INTO roles (nombre, descripcion) VALUES
('administrador', 'Usuario con acceso completo al sistema'),
('profesor', 'Docente encargado de asignaturas, notas y asistencias'),
('estudiante', 'Estudiante con acceso a información académica'),
('acudiente', 'Padre de familia o acudiente del estudiante');

INSERT INTO cursos (nombre, nivel, jornada) VALUES
('6A', 'Básica secundaria', 'mañana'),
('7B', 'Básica secundaria', 'mañana'),
('10A', 'Media académica', 'tarde');

INSERT INTO asignaturas (nombre, descripcion) VALUES
('Matemáticas', 'Asignatura de razonamiento lógico y numérico'),
('Inglés', 'Asignatura de lengua extranjera'),
('Ciencias Naturales', 'Asignatura de ciencias y medio ambiente'),
('Sociales', 'Asignatura de historia, geografía y ciudadanía');

INSERT INTO salones (nombre, ubicacion, capacidad) VALUES
('Salón 101', 'Bloque A - Piso 1', 35),
('Salón 202', 'Bloque B - Piso 2', 30),
('Laboratorio 1', 'Bloque C - Piso 1', 25);

INSERT INTO periodos_academicos (nombre, fecha_inicio, fecha_fin, estado) VALUES
('Periodo 1', '2026-01-20', '2026-03-27', 'activo'),
('Periodo 2', '2026-04-06', '2026-06-12', 'activo'),
('Periodo 3', '2026-07-06', '2026-09-11', 'activo'),
('Periodo 4', '2026-09-21', '2026-11-27', 'activo');
