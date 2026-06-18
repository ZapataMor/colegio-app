const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");

const ANIO_ACADEMICO = 2026;
const DEFAULT_PASSWORDS = {
  administrador: "Admin123*",
  profesor: "Docente123*",
  estudiante: "Estudiante123*",
};

const roles = [
  ["administrador", "Acceso completo al sistema"],
  ["profesor", "Gestiona asignaturas, notas y asistencias"],
  ["estudiante", "Acceso a informacion academica propia"],
  ["acudiente", "Consulta el rendimiento de sus acudidos"],
];

const grados = [
  ["Primero", 1, "Basica primaria"],
  ["Segundo", 2, "Basica primaria"],
  ["Tercero", 3, "Basica primaria"],
  ["Cuarto", 4, "Basica primaria"],
  ["Quinto", 5, "Basica primaria"],
  ["Sexto", 6, "Basica secundaria"],
  ["Septimo", 7, "Basica secundaria"],
  ["Octavo", 8, "Basica secundaria"],
  ["Noveno", 9, "Basica secundaria"],
  ["Decimo", 10, "Media academica"],
  ["Once", 11, "Media academica"],
];

const areas = [
  {
    nombre: "Matematicas",
    descripcion: "Pensamiento logico, numerico, geometrico y variacional",
    asignaturas: ["Matematicas", "Estadistica"],
  },
  {
    nombre: "Humanidades",
    descripcion: "Lengua castellana, lectura critica e idiomas",
    asignaturas: ["Espanol", "Ingles"],
  },
  {
    nombre: "Ciencias Naturales",
    descripcion: "Ciencias, biologia, quimica, fisica y medio ambiente",
    asignaturas: ["Ciencias Naturales", "Biologia", "Quimica", "Fisica"],
  },
  {
    nombre: "Ciencias Sociales",
    descripcion: "Historia, geografia, ciudadania y pensamiento social",
    asignaturas: ["Sociales", "Filosofia"],
  },
  {
    nombre: "Tecnologia e Informatica",
    descripcion: "Competencias digitales, sistemas y tecnologia",
    asignaturas: ["Informatica"],
  },
  {
    nombre: "Educacion Fisica",
    descripcion: "Deporte, salud, movimiento y bienestar",
    asignaturas: ["Educacion Fisica"],
  },
  {
    nombre: "Arte y Cultura",
    descripcion: "Expresion artistica, musica y cultura",
    asignaturas: ["Artistica"],
  },
  {
    nombre: "Etica y Religion",
    descripcion: "Formacion humana, valores y proyecto de vida",
    asignaturas: ["Etica y Valores", "Religion"],
  },
];

const periodos = [
  ["Periodo 1 - 2026", "2026-01-20", "2026-03-27", "cerrado"],
  ["Periodo 2 - 2026", "2026-04-06", "2026-06-12", "activo"],
  ["Periodo 3 - 2026", "2026-07-06", "2026-09-11", "inactivo"],
  ["Periodo 4 - 2026", "2026-09-21", "2026-11-27", "inactivo"],
];

// Dias y bloques horarios de la jornada escolar usados para generar los horarios.
const DIAS_CLASE = ["lunes", "martes", "miercoles", "jueves", "viernes"];

const BLOQUES_HORARIO = [
  ["07:00:00", "07:55:00"],
  ["08:00:00", "08:55:00"],
  ["09:00:00", "09:55:00"],
  // Descanso 09:55 - 10:20
  ["10:20:00", "11:15:00"],
  ["11:15:00", "12:10:00"],
  ["12:10:00", "13:05:00"],
];

const profesores = [
  ["Diana Carolina", "Martinez Rojas", "810000001", "diana.martinez@colegio.com", "3001000001", "Matematicas", "Licenciada en Matematicas"],
  ["Andres Felipe", "Ramirez Torres", "810000002", "andres.ramirez@colegio.com", "3001000002", "Estadistica", "Magister en Educacion Matematica"],
  ["Claudia Patricia", "Gomez Herrera", "810000003", "claudia.gomez@colegio.com", "3001000003", "Espanol", "Licenciada en Lengua Castellana"],
  ["Julian Andres", "Castro Mejia", "810000004", "julian.castro@colegio.com", "3001000004", "Ingles", "Licenciado en Lenguas Modernas"],
  ["Natalia", "Herrera Vargas", "810000005", "natalia.herrera@colegio.com", "3001000005", "Ciencias Naturales", "Licenciada en Ciencias Naturales"],
  ["Camilo", "Sanchez Moreno", "810000006", "camilo.sanchez@colegio.com", "3001000006", "Biologia", "Biologo"],
  ["Paola Andrea", "Morales Diaz", "810000007", "paola.morales@colegio.com", "3001000007", "Quimica", "Quimica"],
  ["Sergio", "Pineda Salazar", "810000008", "sergio.pineda@colegio.com", "3001000008", "Fisica", "Fisico"],
  ["Marcela", "Rincon Alvarez", "810000009", "marcela.rincon@colegio.com", "3001000009", "Sociales", "Licenciada en Ciencias Sociales"],
  ["Oscar", "Navarro Cardenas", "810000010", "oscar.navarro@colegio.com", "3001000010", "Filosofia", "Filosofo"],
  ["Laura Vanessa", "Ortega Leon", "810000011", "laura.ortega@colegio.com", "3001000011", "Informatica", "Ingeniera de Sistemas"],
  ["Rafael", "Bermudez Silva", "810000012", "rafael.bermudez@colegio.com", "3001000012", "Educacion Fisica", "Licenciado en Educacion Fisica"],
  ["Monica", "Vega Molina", "810000013", "monica.vega@colegio.com", "3001000013", "Artistica", "Maestra en Artes"],
  ["Hector", "Quintero Ruiz", "810000014", "hector.quintero@colegio.com", "3001000014", "Etica y Valores", "Licenciado en Filosofia y Etica"],
  ["Patricia", "Cortes Aguilar", "810000015", "patricia.cortes@colegio.com", "3001000015", "Religion", "Licenciada en Educacion Religiosa"],
];

const estudiantesBase = [
  ["Santiago", "Lopez Garcia", "masculino"],
  ["Valentina", "Rodriguez Perez", "femenino"],
  ["Mateo", "Gonzalez Martinez", "masculino"],
  ["Isabella", "Hernandez Sanchez", "femenino"],
  ["Sebastian", "Ramirez Torres", "masculino"],
  ["Mariana", "Diaz Vargas", "femenino"],
  ["Nicolas", "Morales Castro", "masculino"],
  ["Salome", "Rojas Moreno", "femenino"],
  ["Daniel", "Jimenez Herrera", "masculino"],
  ["Gabriela", "Ortiz Molina", "femenino"],
  ["Emmanuel", "Silva Navarro", "masculino"],
  ["Antonella", "Cortes Ruiz", "femenino"],
  ["Samuel", "Pineda Leon", "masculino"],
  ["Luciana", "Medina Alvarez", "femenino"],
  ["Juan Pablo", "Vega Cardenas", "masculino"],
  ["Sara", "Aguilar Salazar", "femenino"],
  ["Martin", "Quintero Mejia", "masculino"],
  ["Maria Jose", "Bermudez Ortega", "femenino"],
  ["Alejandro", "Arias Castillo", "masculino"],
  ["Manuela", "Mendoza Prieto", "femenino"],
  ["David", "Reyes Pardo", "masculino"],
  ["Sofia", "Camacho Gil", "femenino"],
  ["Tomas", "Fuentes Acosta", "masculino"],
  ["Laura", "Pena Blanco", "femenino"],
];

const loginUsers = [
  {
    rol: "administrador",
    nombres: "Admin",
    apellidos: "Principal",
    documento: "900000001",
    correo: "admin@colegio.com",
  },
  {
    rol: "profesor",
    nombres: "Diana Carolina",
    apellidos: "Martinez Rojas",
    documento: "810000001",
    correo: "diana.martinez@colegio.com",
  },
  {
    rol: "profesor",
    nombres: "Claudia Patricia",
    apellidos: "Gomez Herrera",
    documento: "810000003",
    correo: "claudia.gomez@colegio.com",
  },
  {
    rol: "estudiante",
    nombres: "Santiago",
    apellidos: "Lopez Garcia",
    documento: "71016501",
    correo: "estudiante.1a.01@colegio.com",
  },
  {
    rol: "estudiante",
    nombres: "Valentina",
    apellidos: "Rodriguez Perez",
    documento: "71016502",
    correo: "estudiante.1a.02@colegio.com",
  },
];

const cursoNombre = (grado, seccion) => `${grado}${seccion}`;

const nivelPorGrado = (grado) => {
  if (grado <= 5) return "Basica primaria";
  if (grado <= 9) return "Basica secundaria";
  return "Media academica";
};

const asignaturasPorGrado = (grado) => {
  const base = [
    "Espanol",
    "Matematicas",
    "Ingles",
    "Sociales",
    "Informatica",
    "Educacion Fisica",
    "Artistica",
    "Etica y Valores",
  ];

  if (grado <= 5) return [...base, "Ciencias Naturales"];
  if (grado <= 9) return [...base, "Ciencias Naturales", "Biologia"];
  return [...base, "Biologia", "Quimica", "Fisica", "Filosofia"];
};

const ubicacionSalon = (grado) => {
  if (grado <= 5) return `Bloque Primaria - Piso ${Math.ceil(grado / 2)}`;
  if (grado <= 9) return `Bloque Secundaria - Piso ${Math.ceil((grado - 5) / 2)}`;
  return `Bloque Media - Piso ${grado - 9}`;
};

const capacidadPorGrado = (grado) => (grado <= 5 ? 30 : grado <= 9 ? 32 : 28);

const fechaNacimientoPorGrado = (grado, index) => {
  const edad = grado + 5;
  const year = ANIO_ACADEMICO - edad;
  const month = String((index % 12) + 1).padStart(2, "0");
  const day = String(((index * 3) % 27) + 1).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const notaDeterministica = (studentIndex, subjectIndex, periodoIndex, grado) => {
  const value = 1 + (((studentIndex + 3) * (subjectIndex + 5) * (periodoIndex + 2) + grado) % 41) / 10;
  return Number(Math.min(5, value).toFixed(2));
};

const observacionNota = (nota) => {
  if (nota < 3) return "Requiere refuerzo academico y acompanamiento.";
  if (nota >= 4.5) return "Desempeno superior durante el periodo.";
  if (nota >= 4) return "Buen desempeno y participacion constante.";
  return "Proceso academico estable, con oportunidades de mejora.";
};

const execute = async (sql, params = []) => {
  await pool.query(sql, params);
};

const fetchOne = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows[0] || null;
};

const ensureRole = async (nombre, descripcion) => {
  await execute(
    `INSERT INTO roles (nombre, descripcion)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion), updated_at = CURRENT_TIMESTAMP`,
    [nombre, descripcion]
  );
  return fetchOne(`SELECT id FROM roles WHERE nombre = ? LIMIT 1`, [nombre]);
};

const ensureGrado = async ([nombre, numericLevel, educationLevel]) => {
  await execute(
    `INSERT INTO grados (nombre, numeric_level, education_level, status)
     VALUES (?, ?, ?, 'activo')
     ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), numeric_level = VALUES(numeric_level),
       education_level = VALUES(education_level), status = 'activo', updated_at = CURRENT_TIMESTAMP`,
    [nombre, numericLevel, educationLevel]
  );
  return fetchOne(`SELECT id, numeric_level FROM grados WHERE numeric_level = ? LIMIT 1`, [
    numericLevel,
  ]);
};

const ensurePersona = async ({
  nombres,
  apellidos,
  tipoDocumento = "CC",
  documento,
  fechaNacimiento = null,
  genero = null,
  telefono = null,
  correo = null,
  direccion = null,
}) => {
  const lookupParams = [documento];
  let lookupSql = `SELECT id FROM personas WHERE documento = ?`;

  if (correo) {
    lookupSql += ` OR correo = ?`;
    lookupParams.push(correo);
  }

  const current = await fetchOne(`${lookupSql} LIMIT 1`, lookupParams);

  if (current) {
    await execute(
      `UPDATE personas
       SET nombres = ?, apellidos = ?, tipo_documento = ?, documento = ?, fecha_nacimiento = ?, genero = ?,
           telefono = ?, correo = ?, direccion = ?, estado = 'activo', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        nombres,
        apellidos,
        tipoDocumento,
        documento,
        fechaNacimiento,
        genero,
        telefono,
        correo,
        direccion,
        current.id,
      ]
    );
    return current.id;
  }

  const [result] = await pool.query(
    `INSERT INTO personas
      (nombres, apellidos, tipo_documento, documento, fecha_nacimiento, genero, telefono, correo, direccion, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo')`,
    [nombres, apellidos, tipoDocumento, documento, fechaNacimiento, genero, telefono, correo, direccion]
  );

  return result.insertId;
};

const ensurePersonaRole = async (personaId, rolId) => {
  await execute(
    `INSERT INTO persona_roles (persona_id, rol_id, estado)
     VALUES (?, ?, 'activo')
     ON DUPLICATE KEY UPDATE estado = 'activo', updated_at = CURRENT_TIMESTAMP`,
    [personaId, rolId]
  );
};

const ensureUsuario = async ({ personaId, rolId, password }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const current = await fetchOne(`SELECT id FROM usuarios WHERE persona_id = ? LIMIT 1`, [personaId]);

  if (current) {
    await execute(
      `UPDATE usuarios SET password_hash = ?, estado = 'activo', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [passwordHash, current.id]
    );
    return current.id;
  }

  const [result] = await pool.query(
    `INSERT INTO usuarios (persona_id, password_hash, estado) VALUES (?, ?, 'activo')`,
    [personaId, passwordHash]
  );
  await ensurePersonaRole(personaId, rolId);
  return result.insertId;
};

const ensureLoginPersona = async (user) => {
  const current = await fetchOne(
    `SELECT id FROM personas WHERE documento = ? OR correo = ? LIMIT 1`,
    [user.documento, user.correo]
  );

  if (current) return current.id;

  return ensurePersona({
    nombres: user.nombres,
    apellidos: user.apellidos,
    documento: user.documento,
    correo: user.correo,
    tipoDocumento: user.rol === "estudiante" ? "TI" : "CC",
  });
};

const ensureCurso = async (grado, seccion, gradeId) => {
  const nombre = cursoNombre(grado, seccion);
  const nivel = nivelPorGrado(grado);
  await execute(
    `INSERT INTO cursos (grade_id, nomenclature, full_name, nombre, nivel, max_students, estado)
     VALUES (?, ?, ?, ?, ?, ?, 'activo')
     ON DUPLICATE KEY UPDATE grade_id = VALUES(grade_id), nomenclature = VALUES(nomenclature),
       full_name = VALUES(full_name), nivel = VALUES(nivel), max_students = VALUES(max_students),
       estado = 'activo', updated_at = CURRENT_TIMESTAMP`,
    [gradeId, seccion, nombre, nombre, nivel, capacidadPorGrado(grado)]
  );
  return fetchOne(`SELECT id, nombre FROM cursos WHERE nombre = ? LIMIT 1`, [nombre]);
};

const ensureSalon = async (grado, seccion) => {
  const nombre = `Salon ${cursoNombre(grado, seccion)}`;
  await execute(
    `INSERT INTO salones (nombre, ubicacion, capacidad, estado)
     VALUES (?, ?, ?, 'activo')
     ON DUPLICATE KEY UPDATE ubicacion = VALUES(ubicacion), capacidad = VALUES(capacidad),
       estado = 'activo', updated_at = CURRENT_TIMESTAMP`,
    [nombre, ubicacionSalon(grado), capacidadPorGrado(grado)]
  );
  return fetchOne(`SELECT id, nombre FROM salones WHERE nombre = ? LIMIT 1`, [nombre]);
};

const ensureArea = async ({ nombre, descripcion }) => {
  await execute(
    `INSERT INTO areas (nombre, descripcion, estado)
     VALUES (?, ?, 'activo')
     ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion), estado = 'activo', updated_at = CURRENT_TIMESTAMP`,
    [nombre, descripcion]
  );
  return fetchOne(`SELECT id FROM areas WHERE nombre = ? LIMIT 1`, [nombre]);
};

const ensureAsignatura = async ({ areaId, nombre }) => {
  await execute(
    `INSERT INTO asignaturas (area_id, nombre, descripcion, estado)
     VALUES (?, ?, ?, 'activo')
     ON DUPLICATE KEY UPDATE area_id = VALUES(area_id), descripcion = VALUES(descripcion),
       estado = 'activo', updated_at = CURRENT_TIMESTAMP`,
    [areaId, nombre, `Asignatura de ${nombre}`]
  );
  return fetchOne(`SELECT id, nombre FROM asignaturas WHERE nombre = ? LIMIT 1`, [nombre]);
};

const ensurePeriodo = async ([nombre, fechaInicio, fechaFin, estado]) => {
  await execute(
    `INSERT INTO periodos_academicos (nombre, fecha_inicio, fecha_fin, estado)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE fecha_inicio = VALUES(fecha_inicio), fecha_fin = VALUES(fecha_fin),
       estado = VALUES(estado), updated_at = CURRENT_TIMESTAMP`,
    [nombre, fechaInicio, fechaFin, estado]
  );
  return fetchOne(`SELECT id, nombre FROM periodos_academicos WHERE nombre = ? LIMIT 1`, [nombre]);
};

const ensurePeriodoAsignaturas = async () => {
  const table = await fetchOne(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'periodo_asignaturas'
     LIMIT 1`
  );

  if (!table) return 0;

  const [result] = await pool.query(
    `INSERT IGNORE INTO periodo_asignaturas (periodo_id, asignatura_id, estado, observacion)
     SELECT pa.id, a.id, 'activo', 'Asignatura habilitada para el periodo.'
     FROM periodos_academicos pa
     CROSS JOIN asignaturas a
     WHERE pa.estado = 'activo'
       AND a.estado = 'activo'`
  );

  return result.affectedRows || 0;
};

const ensureProfesor = async (profesor, roleByName) => {
  const [nombres, apellidos, documento, correo, telefono, especialidad, titulo] = profesor;
  const personaId = await ensurePersona({
    nombres,
    apellidos,
    documento,
    correo,
    telefono,
    tipoDocumento: "CC",
  });

  await ensurePersonaRole(personaId, roleByName.profesor);
  await execute(
    `INSERT INTO profesores (persona_id, especialidad, titulo, estado)
     VALUES (?, ?, ?, 'activo')
     ON DUPLICATE KEY UPDATE especialidad = VALUES(especialidad), titulo = VALUES(titulo),
       estado = 'activo', updated_at = CURRENT_TIMESTAMP`,
    [personaId, especialidad, titulo]
  );

  return fetchOne(
    `SELECT pr.id, pr.especialidad
     FROM profesores pr
     WHERE pr.persona_id = ?
     LIMIT 1`,
    [personaId]
  );
};

const ensureEstudiante = async ({ grado, seccion, cursoId, index, base, roleByName }) => {
  const [nombres, apellidos, genero] = base;
  const curso = cursoNombre(grado, seccion);
  const consecutivo = String(index + 1).padStart(2, "0");
  const documento = `71${String(grado).padStart(2, "0")}${seccion.charCodeAt(0)}${consecutivo}`;
  const codigo = `EST-${ANIO_ACADEMICO}-${curso}-${consecutivo}`;
  const correo = `estudiante.${curso.toLowerCase()}.${consecutivo}@colegio.com`;
  const direccion = `Barrio Escolar ${grado}, casa ${index + 10}`;

  const personaId = await ensurePersona({
    nombres,
    apellidos,
    documento,
    correo,
    genero,
    direccion,
    tipoDocumento: grado <= 7 ? "TI" : "CC",
    fechaNacimiento: fechaNacimientoPorGrado(grado, index),
  });

  await ensurePersonaRole(personaId, roleByName.estudiante);
  await execute(
    `INSERT INTO estudiantes (persona_id, curso_id, codigo_estudiante, estado)
     VALUES (?, ?, ?, 'activo')
     ON DUPLICATE KEY UPDATE curso_id = VALUES(curso_id), codigo_estudiante = VALUES(codigo_estudiante),
       estado = 'activo', updated_at = CURRENT_TIMESTAMP`,
    [personaId, cursoId, codigo]
  );

  const estudiante = await fetchOne(
    `SELECT id, persona_id, curso_id FROM estudiantes WHERE persona_id = ? LIMIT 1`,
    [personaId]
  );

  await execute(
    `INSERT INTO matriculas (estudiante_id, curso_id, anio, fecha_matricula, estado, observacion)
     VALUES (?, ?, ?, '2026-01-18', 'activa', ?)
     ON DUPLICATE KEY UPDATE curso_id = VALUES(curso_id), estado = 'activa',
       observacion = VALUES(observacion), updated_at = CURRENT_TIMESTAMP`,
    [estudiante.id, cursoId, ANIO_ACADEMICO, `Matricula academica ${ANIO_ACADEMICO} para ${curso}`]
  );

  return { ...estudiante, grado, seccion, curso };
};

const seedCatalogos = async () => {
  const roleByName = {};
  for (const role of roles) {
    const saved = await ensureRole(role[0], role[1]);
    roleByName[role[0]] = saved.id;
  }

  const gradoByLevel = {};
  for (const grado of grados) {
    const saved = await ensureGrado(grado);
    gradoByLevel[saved.numeric_level] = saved.id;
  }

  const cursoByName = {};
  const salonByName = {};
  for (let grado = 1; grado <= 11; grado += 1) {
    for (const seccion of ["A", "B", "C"]) {
      const curso = await ensureCurso(grado, seccion, gradoByLevel[grado]);
      const salon = await ensureSalon(grado, seccion);
      cursoByName[curso.nombre] = curso.id;
      salonByName[salon.nombre] = salon.id;
    }
  }

  const asignaturaByName = {};
  for (const area of areas) {
    const savedArea = await ensureArea(area);
    for (const nombre of area.asignaturas) {
      const asignatura = await ensureAsignatura({ areaId: savedArea.id, nombre });
      asignaturaByName[nombre] = asignatura.id;
      asignaturaByName[asignatura.nombre] = asignatura.id;
    }
  }

  const periodoByName = {};
  for (const periodo of periodos) {
    const saved = await ensurePeriodo(periodo);
    periodoByName[saved.nombre] = saved.id;
  }

  const periodoAsignaturas = await ensurePeriodoAsignaturas();

  return { roleByName, cursoByName, salonByName, asignaturaByName, periodoByName, periodoAsignaturas };
};

const seedProfesores = async (roleByName, asignaturaByName) => {
  const profesorByEspecialidad = {};
  for (const profesor of profesores) {
    const saved = await ensureProfesor(profesor, roleByName);
    profesorByEspecialidad[saved.especialidad] = saved.id;
  }

  for (const [especialidad, profesorId] of Object.entries(profesorByEspecialidad)) {
    const asignaturaId = asignaturaByName[especialidad] || asignaturaByName.Matematicas;
    await execute(
      `INSERT INTO profesor_asignatura (profesor_id, asignatura_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
      [profesorId, asignaturaId]
    );
  }

  return profesorByEspecialidad;
};

const seedEstudiantes = async (roleByName, cursoByName) => {
  const estudiantes = [];
  for (let grado = 1; grado <= 11; grado += 1) {
    for (const seccion of ["A", "B", "C"]) {
      const curso = cursoNombre(grado, seccion);
      const offset = ((grado - 1) * 3 + (seccion.charCodeAt(0) - 65)) % estudiantesBase.length;

      for (let index = 0; index < 6; index += 1) {
        const base = estudiantesBase[(offset + index) % estudiantesBase.length];
        const estudiante = await ensureEstudiante({
          grado,
          seccion,
          cursoId: cursoByName[curso],
          index,
          base,
          roleByName,
        });
        estudiantes.push(estudiante);
      }
    }
  }

  return estudiantes;
};

const seedUsuariosDePrueba = async (roleByName) => {
  for (const user of loginUsers) {
    const personaId = await ensureLoginPersona(user);

    await ensurePersonaRole(personaId, roleByName[user.rol]);
    await ensureUsuario({
      personaId,
      rolId: roleByName[user.rol],
      password: DEFAULT_PASSWORDS[user.rol],
    });
  }
};

const seedNotas = async ({ estudiantes, asignaturaByName, profesorByEspecialidad, periodoByName }) => {
  const periodosConNotas = ["Periodo 1 - 2026", "Periodo 2 - 2026"];
  let totalNotas = 0;

  for (let studentIndex = 0; studentIndex < estudiantes.length; studentIndex += 1) {
    const estudiante = estudiantes[studentIndex];
    const asignaturas = asignaturasPorGrado(estudiante.grado);

    for (let subjectIndex = 0; subjectIndex < asignaturas.length; subjectIndex += 1) {
      const asignaturaNombre = asignaturas[subjectIndex];
      const asignaturaId = asignaturaByName[asignaturaNombre];
      const profesorId = profesorByEspecialidad[asignaturaNombre] || profesorByEspecialidad.Matematicas;

      for (let periodoIndex = 0; periodoIndex < periodosConNotas.length; periodoIndex += 1) {
        const periodoNombre = periodosConNotas[periodoIndex];
        const nota = notaDeterministica(studentIndex, subjectIndex, periodoIndex, estudiante.grado);
        await execute(
          `INSERT INTO notas
            (estudiante_id, curso_id, asignatura_id, profesor_id, periodo_id, nota, observacion, fecha_registro)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE nota = VALUES(nota), profesor_id = VALUES(profesor_id),
             curso_id = VALUES(curso_id), observacion = VALUES(observacion),
             fecha_registro = VALUES(fecha_registro), updated_at = CURRENT_TIMESTAMP`,
          [
            estudiante.id,
            estudiante.curso_id,
            asignaturaId,
            profesorId,
            periodoByName[periodoNombre],
            nota,
            observacionNota(nota),
            periodoIndex === 0 ? "2026-03-20" : "2026-06-05",
          ]
        );
        totalNotas += 1;
      }
    }
  }

  return totalNotas;
};

const seedHorarios = async ({ cursoByName, salonByName, asignaturaByName, profesorByEspecialidad }) => {
  // Cada curso tiene su propio salon y su propio horario semanal.
  const cursos = [];
  for (let grado = 1; grado <= 11; grado += 1) {
    for (const seccion of ["A", "B", "C"]) {
      const nombre = cursoNombre(grado, seccion);
      const cursoId = cursoByName[nombre];
      const salonId = salonByName[`Salon ${nombre}`];
      if (!cursoId || !salonId) continue;

      // Solo asignaturas que tengan profesor y registro de asignatura disponibles.
      const subjects = asignaturasPorGrado(grado).filter(
        (s) => profesorByEspecialidad[s] && asignaturaByName[s]
      );

      cursos.push({ grado, seccion, nombre, cursoId, salonId, subjects, rot: 0, count: 0 });
    }
  }

  // Estado limpio: regeneramos por completo los horarios cada vez que se siembra.
  await execute(`DELETE FROM horarios`);

  let total = 0;

  for (const dia of DIAS_CLASE) {
    for (const [horaInicio, horaFin] of BLOQUES_HORARIO) {
      // Un profesor no puede dictar en dos cursos en el mismo dia/hora (uq_horario_profesor).
      const profesoresOcupados = new Set();

      // En cada bloque damos prioridad al curso con menos clases asignadas hasta el momento,
      // para repartir los profesores de forma equilibrada entre todos los cursos.
      const orden = [...cursos].sort((a, b) => a.count - b.count || a.cursoId - b.cursoId);

      for (const curso of orden) {
        const { subjects } = curso;
        if (subjects.length === 0) continue;

        for (let k = 0; k < subjects.length; k += 1) {
          const idx = (curso.rot + k) % subjects.length;
          const subjectName = subjects[idx];
          const profesorId = profesorByEspecialidad[subjectName];

          if (profesoresOcupados.has(profesorId)) continue;

          await execute(
            `INSERT INTO horarios
              (curso_id, profesor_id, asignatura_id, salon_id, dia_semana, hora_inicio, hora_fin, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'activo')`,
            [
              curso.cursoId,
              profesorId,
              asignaturaByName[subjectName],
              curso.salonId,
              dia,
              horaInicio,
              horaFin,
            ]
          );

          profesoresOcupados.add(profesorId);
          curso.rot = (idx + 1) % subjects.length;
          curso.count += 1;
          total += 1;
          break;
        }
      }
    }
  }

  return total;
};

const seed = async () => {
  try {
    console.log("Iniciando seeding completo...\n");

    const catalogos = await seedCatalogos();
    console.log("Catalogos listos: roles, cursos 1A-11C, salones, areas, asignaturas y periodos.");
    if (catalogos.periodoAsignaturas) {
      console.log(`Asignaturas por periodo listas: ${catalogos.periodoAsignaturas}.`);
    }

    const profesorByEspecialidad = await seedProfesores(
      catalogos.roleByName,
      catalogos.asignaturaByName
    );
    console.log(`Profesores listos: ${Object.keys(profesorByEspecialidad).length}.`);

    const estudiantes = await seedEstudiantes(catalogos.roleByName, catalogos.cursoByName);
    console.log(`Estudiantes y matriculas listas: ${estudiantes.length}.`);

    const totalHorarios = await seedHorarios({
      cursoByName: catalogos.cursoByName,
      salonByName: catalogos.salonByName,
      asignaturaByName: catalogos.asignaturaByName,
      profesorByEspecialidad,
    });
    console.log(`Horarios listos: ${totalHorarios}.`);

    await seedUsuariosDePrueba(catalogos.roleByName);
    console.log("Usuarios de prueba listos.");

    const totalNotas = await seedNotas({
      estudiantes,
      asignaturaByName: catalogos.asignaturaByName,
      profesorByEspecialidad,
      periodoByName: catalogos.periodoByName,
    });
    console.log(`Notas listas: ${totalNotas}.`);

    console.log("\nSeeding completado.");
    console.log("Credenciales de prueba:");
    console.log("  Admin: admin@colegio.com / Admin123*");
    console.log("  Profesor: diana.martinez@colegio.com / Docente123*");
    console.log("  Profesor: claudia.gomez@colegio.com / Docente123*");
    console.log("  Estudiante: estudiante.1a.01@colegio.com / Estudiante123*");
    console.log("  Estudiante: estudiante.1a.02@colegio.com / Estudiante123*");
  } catch (error) {
    console.error("Error en seeding:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

seed();
