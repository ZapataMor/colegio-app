const pool = require("../config/db");

const DIAS_CLASE = ["lunes", "martes", "miercoles", "jueves", "viernes"];

const BLOQUES = {
  primaria: [
    ["06:00:00", "07:00:00"],
    ["07:00:00", "08:00:00"],
    ["08:00:00", "09:00:00"],
    ["09:00:00", "10:00:00"],
    ["10:00:00", "11:00:00"],
    ["11:00:00", "12:00:00"],
  ],
  secundaria: [
    ["12:30:00", "13:30:00"],
    ["13:30:00", "14:30:00"],
    ["14:30:00", "15:30:00"],
    ["15:30:00", "16:30:00"],
    ["16:30:00", "17:30:00"],
    ["17:30:00", "18:30:00"],
  ],
};

const AREAS = [
  {
    nombre: "Matematicas",
    descripcion: "Pensamiento numerico, geometrico y variacional.",
    asignaturas: [
      "Matematicas",
      "Matematicas Basicas",
      "Aritmetica",
      "Geometria",
      "Estadistica",
      "Trigonometria",
      "Algebra",
    ],
  },
  {
    nombre: "Lenguaje",
    descripcion: "Lengua castellana, lectura critica y comprension lectora.",
    asignaturas: ["Espanol", "Lectura Critica", "Comprension Lectora"],
  },
  {
    nombre: "Ciencias Naturales",
    descripcion: "Ciencias, biologia, fisica, quimica y medio ambiente.",
    asignaturas: ["Ciencias Naturales", "Biologia", "Fisica", "Quimica"],
  },
  {
    nombre: "Ciencias Sociales",
    descripcion: "Historia, geografia, ciudadania, politica y economia.",
    asignaturas: ["Sociales", "Historia", "Geografia", "Politica y Economia"],
  },
  {
    nombre: "Humanidades",
    descripcion: "Filosofia, etica, valores y religion.",
    asignaturas: ["Filosofia", "Etica y Valores", "Religion"],
  },
  {
    nombre: "Idiomas",
    descripcion: "Lenguas extranjeras.",
    asignaturas: ["Ingles"],
  },
  {
    nombre: "Tecnologia",
    descripcion: "Informatica, tecnologia y competencias digitales.",
    asignaturas: ["Informatica", "Tecnologia"],
  },
  {
    nombre: "Educacion Fisica",
    descripcion: "Deporte, salud, movimiento y bienestar.",
    asignaturas: ["Educacion Fisica"],
  },
  {
    nombre: "Artistica",
    descripcion: "Arte, expresion y cultura.",
    asignaturas: ["Arte"],
  },
];

const PROFESORES_BASE = [
  {
    documento: "810000001",
    nombres: "Diana Carolina",
    apellidos: "Martinez Rojas",
    correo: "diana.martinez@colegio.com",
    especialidad: "Matematicas",
    titulo: "Licenciada en Matematicas",
    asignaturas: ["Matematicas", "Matematicas Basicas", "Aritmetica", "Geometria", "Trigonometria", "Algebra"],
  },
  {
    documento: "810000002",
    nombres: "Andres Felipe",
    apellidos: "Ramirez Torres",
    correo: "andres.ramirez@colegio.com",
    especialidad: "Estadistica",
    titulo: "Magister en Educacion Matematica",
    asignaturas: ["Estadistica", "Matematicas", "Matematicas Basicas"],
  },
  {
    documento: "810000003",
    nombres: "Claudia Patricia",
    apellidos: "Gomez Herrera",
    correo: "claudia.gomez@colegio.com",
    especialidad: "Espanol",
    titulo: "Licenciada en Lengua Castellana",
    asignaturas: ["Espanol", "Lectura Critica", "Comprension Lectora"],
  },
  {
    documento: "810000004",
    nombres: "Julian Andres",
    apellidos: "Castro Mejia",
    correo: "julian.castro@colegio.com",
    especialidad: "Ingles",
    titulo: "Licenciado en Lenguas Modernas",
    asignaturas: ["Ingles"],
  },
  {
    documento: "810000005",
    nombres: "Natalia",
    apellidos: "Herrera Vargas",
    correo: "natalia.herrera@colegio.com",
    especialidad: "Ciencias Naturales",
    titulo: "Licenciada en Ciencias Naturales",
    asignaturas: ["Ciencias Naturales", "Biologia"],
  },
  {
    documento: "810000006",
    nombres: "Camilo",
    apellidos: "Sanchez Moreno",
    correo: "camilo.sanchez@colegio.com",
    especialidad: "Biologia",
    titulo: "Biologo",
    asignaturas: ["Biologia", "Ciencias Naturales"],
  },
  {
    documento: "810000007",
    nombres: "Paola Andrea",
    apellidos: "Morales Diaz",
    correo: "paola.morales@colegio.com",
    especialidad: "Quimica",
    titulo: "Quimica",
    asignaturas: ["Quimica", "Ciencias Naturales"],
  },
  {
    documento: "810000008",
    nombres: "Sergio",
    apellidos: "Pineda Salazar",
    correo: "sergio.pineda@colegio.com",
    especialidad: "Fisica",
    titulo: "Fisico",
    asignaturas: ["Fisica", "Ciencias Naturales"],
  },
  {
    documento: "810000009",
    nombres: "Marcela",
    apellidos: "Rincon Alvarez",
    correo: "marcela.rincon@colegio.com",
    especialidad: "Sociales",
    titulo: "Licenciada en Ciencias Sociales",
    asignaturas: ["Sociales", "Historia", "Geografia", "Politica y Economia"],
  },
  {
    documento: "810000010",
    nombres: "Oscar",
    apellidos: "Navarro Cardenas",
    correo: "oscar.navarro@colegio.com",
    especialidad: "Filosofia",
    titulo: "Filosofo",
    asignaturas: ["Filosofia", "Etica y Valores"],
  },
  {
    documento: "810000011",
    nombres: "Laura Vanessa",
    apellidos: "Ortega Leon",
    correo: "laura.ortega@colegio.com",
    especialidad: "Informatica",
    titulo: "Ingeniera de Sistemas",
    asignaturas: ["Informatica", "Tecnologia"],
  },
  {
    documento: "810000012",
    nombres: "Rafael",
    apellidos: "Bermudez Silva",
    correo: "rafael.bermudez@colegio.com",
    especialidad: "Educacion Fisica",
    titulo: "Licenciado en Educacion Fisica",
    asignaturas: ["Educacion Fisica"],
  },
  {
    documento: "810000013",
    nombres: "Monica",
    apellidos: "Vega Molina",
    correo: "monica.vega@colegio.com",
    especialidad: "Arte",
    titulo: "Maestra en Artes",
    asignaturas: ["Arte"],
  },
  {
    documento: "810000014",
    nombres: "Hector",
    apellidos: "Quintero Ruiz",
    correo: "hector.quintero@colegio.com",
    especialidad: "Etica y Valores",
    titulo: "Licenciado en Filosofia y Etica",
    asignaturas: ["Etica y Valores", "Religion"],
  },
  {
    documento: "810000015",
    nombres: "Patricia",
    apellidos: "Cortes Aguilar",
    correo: "patricia.cortes@colegio.com",
    especialidad: "Religion",
    titulo: "Licenciada en Educacion Religiosa",
    asignaturas: ["Religion", "Etica y Valores"],
  },
];

const APOYOS = Array.from({ length: 24 }, (_, index) => {
  const numero = String(index + 1).padStart(2, "0");
  return {
    documento: `8200000${numero}`,
    nombres: `Docente Apoyo ${numero}`,
    apellidos: "Horario Escolar",
    correo: `docente.apoyo${numero}@colegio.com`,
    especialidad: "Apoyo Academico",
    titulo: "Docente de apoyo academico",
    asignaturas: AREAS.flatMap((area) => area.asignaturas),
  };
});

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ã¡/gi, "a")
    .replace(/Ã©/gi, "e")
    .replace(/Ã­/gi, "i")
    .replace(/Ã³/gi, "o")
    .replace(/Ãº/gi, "u")
    .replace(/Ã±/gi, "n")
    .replace(/ñ/gi, "n")
    .toLowerCase()
    .trim();

const parseCurso = (nombre) => {
  const match = /^(\d+)([A-Za-z])$/.exec(String(nombre || "").trim());
  if (!match) return null;
  return { grado: Number(match[1]), seccion: match[2].toUpperCase() };
};

const jornadaPorGrado = (grado) => (grado <= 5 ? "primaria" : "secundaria");

const planPorGrado = (grado) => {
  if (grado <= 3) {
    return [
      ["Matematicas Basicas", 5],
      ["Espanol", 5],
      ["Ciencias Naturales", 3],
      ["Sociales", 3],
      ["Ingles", 3],
      ["Informatica", 2],
      ["Educacion Fisica", 2],
      ["Arte", 2],
      ["Comprension Lectora", 2],
      ["Tecnologia", 1],
      ["Etica y Valores", 1],
      ["Religion", 1],
    ];
  }

  if (grado <= 5) {
    return [
      ["Aritmetica", 4],
      ["Geometria", 2],
      ["Espanol", 5],
      ["Ciencias Naturales", 3],
      ["Sociales", 3],
      ["Ingles", 3],
      ["Informatica", 2],
      ["Educacion Fisica", 2],
      ["Arte", 2],
      ["Comprension Lectora", 2],
      ["Etica y Valores", 1],
      ["Religion", 1],
    ];
  }

  if (grado <= 7) {
    return [
      ["Matematicas", 4],
      ["Espanol", 4],
      ["Ciencias Naturales", 3],
      ["Sociales", 3],
      ["Ingles", 3],
      ["Geometria", 2],
      ["Estadistica", 2],
      ["Informatica", 2],
      ["Educacion Fisica", 2],
      ["Arte", 2],
      ["Religion", 2],
      ["Etica y Valores", 1],
    ];
  }

  if (grado <= 9) {
    return [
      ["Algebra", 4],
      ["Espanol", 4],
      ["Biologia", 3],
      ["Sociales", 2],
      ["Ingles", 3],
      ["Geometria", 2],
      ["Estadistica", 2],
      ["Fisica", 2],
      ["Quimica", 2],
      ["Informatica", 2],
      ["Educacion Fisica", 2],
      ["Etica y Valores", 1],
      ["Religion", 1],
    ];
  }

  return [
    ["Trigonometria", 4],
    ["Espanol", 3],
    ["Fisica", 3],
    ["Quimica", 3],
    ["Politica y Economia", 2],
    ["Ingles", 3],
    ["Estadistica", 2],
    ["Biologia", 2],
    ["Filosofia", 2],
    ["Informatica", 2],
    ["Educacion Fisica", 2],
    ["Etica y Valores", 1],
    ["Religion", 1],
  ];
};

const horasEntre = (inicio, fin) => {
  const [hi, mi] = inicio.split(":").map(Number);
  const [hf, mf] = fin.split(":").map(Number);
  return (hf * 60 + mf - (hi * 60 + mi)) / 60;
};

const sameTimeKey = (dia, inicio) => `${dia}-${inicio}`;

const compareCurso = (a, b) => {
  const pa = parseCurso(a.nombre);
  const pb = parseCurso(b.nombre);
  return (pa?.grado ?? 99) - (pb?.grado ?? 99) || (pa?.seccion || "").localeCompare(pb?.seccion || "");
};

const getRoleId = async (connection, nombre) => {
  const [rows] = await connection.query(`SELECT id FROM roles WHERE nombre = ? LIMIT 1`, [nombre]);
  return rows[0]?.id || null;
};

const ensureArea = async (connection, area) => {
  const [existing] = await connection.query(`SELECT id, nombre FROM areas`);
  const current = existing.find((item) => normalize(item.nombre) === normalize(area.nombre));
  if (current) return current.id;

  const [result] = await connection.query(
    `INSERT INTO areas (nombre, descripcion, estado) VALUES (?, ?, 'activo')`,
    [area.nombre, area.descripcion]
  );
  return result.insertId;
};

const ensureAsignatura = async (connection, areaId, nombre) => {
  const [existing] = await connection.query(`SELECT id, nombre FROM asignaturas`);
  const current = existing.find((item) => normalize(item.nombre) === normalize(nombre));
  if (current) {
    await connection.query(
      `UPDATE asignaturas SET area_id = ?, estado = 'activo', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [areaId, current.id]
    );
    return current.id;
  }

  const [result] = await connection.query(
    `INSERT INTO asignaturas (area_id, nombre, descripcion, estado)
     VALUES (?, ?, ?, 'activo')`,
    [areaId, nombre, `Asignatura de ${nombre}`]
  );
  return result.insertId;
};

const ensureCursosYSalones = async (connection) => {
  for (let grado = 1; grado <= 11; grado += 1) {
    for (const seccion of ["A", "B", "C"]) {
      const nombre = `${grado}${seccion}`;
      const nivel = grado <= 5 ? "Basica primaria" : grado <= 9 ? "Basica secundaria" : "Media academica";
      if (grado <= 5) {
        await connection.query(
          `INSERT INTO cursos (nombre, nivel, estado)
           VALUES (?, ?, 'activo')
           ON DUPLICATE KEY UPDATE nivel = VALUES(nivel), estado = 'activo',
             updated_at = CURRENT_TIMESTAMP`,
          [nombre, nivel]
        );
      } else {
        await connection.query(
          `INSERT INTO cursos (nombre, nivel, jornada, estado)
           VALUES (?, ?, 'tarde', 'activo')
           ON DUPLICATE KEY UPDATE nivel = VALUES(nivel), jornada = 'tarde',
             estado = 'activo', updated_at = CURRENT_TIMESTAMP`,
          [nombre, nivel]
        );
      }
    }
  }

  for (let numero = 1; numero <= 33; numero += 1) {
    const bloque =
      numero <= 15
        ? `Bloque Primaria - Piso ${Math.ceil(numero / 6)}`
        : numero <= 27
          ? `Bloque Secundaria - Piso ${Math.ceil((numero - 15) / 6)}`
          : `Bloque Media - Piso ${Math.ceil((numero - 27) / 3)}`;

    await connection.query(
      `INSERT INTO salones (nombre, ubicacion, capacidad, estado)
       VALUES (?, ?, 20, 'activo')
       ON DUPLICATE KEY UPDATE ubicacion = VALUES(ubicacion), capacidad = 20,
         estado = 'activo', updated_at = CURRENT_TIMESTAMP`,
      [`Salon ${numero}`, bloque]
    );
  }
};

const ensureProfesor = async (connection, profesor, rolProfesorId) => {
  const [personas] = await connection.query(
    `SELECT id FROM personas WHERE documento = ? OR correo = ? LIMIT 1`,
    [profesor.documento, profesor.correo]
  );

  let personaId = personas[0]?.id || null;
  if (!personaId) {
    const [result] = await connection.query(
      `INSERT INTO personas (nombres, apellidos, tipo_documento, documento, correo, estado)
       VALUES (?, ?, 'CC', ?, ?, 'activo')`,
      [profesor.nombres, profesor.apellidos, profesor.documento, profesor.correo]
    );
    personaId = result.insertId;
  } else {
    await connection.query(
      `UPDATE personas SET nombres = ?, apellidos = ?, documento = ?, correo = ?,
        estado = 'activo', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [profesor.nombres, profesor.apellidos, profesor.documento, profesor.correo, personaId]
    );
  }

  if (rolProfesorId) {
    await connection.query(
      `INSERT INTO persona_roles (persona_id, rol_id, estado)
       VALUES (?, ?, 'activo')
       ON DUPLICATE KEY UPDATE estado = 'activo', updated_at = CURRENT_TIMESTAMP`,
      [personaId, rolProfesorId]
    );
  }

  await connection.query(
    `INSERT INTO profesores (persona_id, especialidad, titulo, estado)
     VALUES (?, ?, ?, 'activo')
     ON DUPLICATE KEY UPDATE especialidad = VALUES(especialidad), titulo = VALUES(titulo),
       estado = 'activo', updated_at = CURRENT_TIMESTAMP`,
    [personaId, profesor.especialidad, profesor.titulo]
  );

  const [profesores] = await connection.query(
    `SELECT id FROM profesores WHERE persona_id = ? LIMIT 1`,
    [personaId]
  );
  return profesores[0].id;
};

const ensureCatalogosAcademicos = async (connection) => {
  await ensureCursosYSalones(connection);

  const asignaturaByName = new Map();
  for (const area of AREAS) {
    const areaId = await ensureArea(connection, area);
    for (const asignatura of area.asignaturas) {
      const asignaturaId = await ensureAsignatura(connection, areaId, asignatura);
      asignaturaByName.set(normalize(asignatura), asignaturaId);
    }
  }

  const rolProfesorId = await getRoleId(connection, "profesor");
  const profesores = [...PROFESORES_BASE, ...APOYOS];
  for (const profesor of profesores) {
    const profesorId = await ensureProfesor(connection, profesor, rolProfesorId);
    for (const asignatura of profesor.asignaturas) {
      const asignaturaId = asignaturaByName.get(normalize(asignatura));
      if (!asignaturaId) continue;
      await connection.query(
        `INSERT INTO profesor_asignatura (profesor_id, asignatura_id)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
        [profesorId, asignaturaId]
      );
    }
  }
};

const loadGenerationData = async (connection) => {
  const [cursos] = await connection.query(
    `SELECT id, nombre, nivel, jornada FROM cursos WHERE estado = 'activo'`
  );
  const [salones] = await connection.query(
    `SELECT id, nombre FROM salones WHERE estado = 'activo'`
  );
  const [asignaturas] = await connection.query(
    `SELECT a.id, a.nombre, ar.nombre AS area_nombre
     FROM asignaturas a
     INNER JOIN areas ar ON ar.id = a.area_id
     WHERE a.estado = 'activo'`
  );
  const [profesores] = await connection.query(
    `SELECT
       pr.id,
       pa.asignatura_id,
       CONCAT(p.nombres, ' ', p.apellidos) AS nombre
     FROM profesor_asignatura pa
     INNER JOIN profesores pr ON pr.id = pa.profesor_id
     INNER JOIN personas p ON p.id = pr.persona_id
     WHERE pr.estado = 'activo'`
  );

  const asignaturaByName = new Map();
  for (const asignatura of asignaturas) {
    asignaturaByName.set(normalize(asignatura.nombre), asignatura);
  }

  const profesoresByAsignatura = new Map();
  for (const profesor of profesores) {
    const current = profesoresByAsignatura.get(profesor.asignatura_id) || [];
    current.push(profesor);
    profesoresByAsignatura.set(profesor.asignatura_id, current);
  }

  return {
    cursos: cursos.filter((curso) => parseCurso(curso.nombre)).sort(compareCurso),
    salones: [...salones].sort((a, b) => {
      const na = Number(String(a.nombre).replace(/\D/g, ""));
      const nb = Number(String(b.nombre).replace(/\D/g, ""));
      return na - nb;
    }),
    asignaturaByName,
    profesoresByAsignatura,
  };
};

const pickSubjectForSlot = (remaining, dailyCounts, slotIndex) => {
  const candidates = remaining
    .filter((item) => item.restantes > 0)
    .sort((a, b) => {
      const dayA = dailyCounts.get(a.nombre) || 0;
      const dayB = dailyCounts.get(b.nombre) || 0;
      const penaltyA = dayA >= 1 ? 3 : 0;
      const penaltyB = dayB >= 1 ? 3 : 0;
      return b.restantes - penaltyB - (a.restantes - penaltyA) || a.nombre.localeCompare(b.nombre);
    });

  const preferred = candidates.find((item) => (dailyCounts.get(item.nombre) || 0) === 0);
  if (preferred) return preferred;
  return candidates.find((item) => (dailyCounts.get(item.nombre) || 0) < 2) || candidates[slotIndex % candidates.length];
};

const pickProfesor = ({ profesores, busyTeachers, dia, horaInicio }) => {
  const key = sameTimeKey(dia, horaInicio);
  return profesores.find((profesor) => !busyTeachers.has(`${profesor.id}-${key}`)) || null;
};

const buildEntries = ({ cursos, salones, asignaturaByName, profesoresByAsignatura }) => {
  const entries = [];
  const busyTeachers = new Set();
  const errors = [];

  for (let cursoIndex = 0; cursoIndex < cursos.length; cursoIndex += 1) {
    const curso = cursos[cursoIndex];
    const parsed = parseCurso(curso.nombre);
    const salon = salones[cursoIndex];
    const bloques = BLOQUES[jornadaPorGrado(parsed.grado)];
    const plan = planPorGrado(parsed.grado).map(([nombre, horas]) => ({ nombre, restantes: horas }));

    if (!salon) {
      errors.push(`No hay salon disponible para el curso ${curso.nombre}.`);
      continue;
    }

    for (const dia of DIAS_CLASE) {
      const dailyCounts = new Map();
      for (let slotIndex = 0; slotIndex < bloques.length; slotIndex += 1) {
        const [horaInicio, horaFin] = bloques[slotIndex];
        const subjectPlan = pickSubjectForSlot(plan, dailyCounts, slotIndex);

        if (!subjectPlan) {
          errors.push(`No se pudo completar ${curso.nombre} el dia ${dia}.`);
          continue;
        }

        const asignatura = asignaturaByName.get(normalize(subjectPlan.nombre));
        if (!asignatura) {
          errors.push(`La asignatura ${subjectPlan.nombre} no existe o no tiene area.`);
          continue;
        }

        const profesores = profesoresByAsignatura.get(asignatura.id) || [];
        const profesor = pickProfesor({ profesores, busyTeachers, dia, horaInicio });
        if (!profesor) {
          errors.push(`No hay profesor disponible para ${subjectPlan.nombre} en ${curso.nombre}, ${dia} ${horaInicio}.`);
          continue;
        }

        entries.push({
          cursoId: curso.id,
          cursoNombre: curso.nombre,
          profesorId: profesor.id,
          profesorNombre: profesor.nombre,
          asignaturaId: asignatura.id,
          asignaturaNombre: asignatura.nombre,
          salonId: salon.id,
          salonNombre: salon.nombre,
          diaSemana: dia,
          horaInicio,
          horaFin,
        });

        busyTeachers.add(`${profesor.id}-${sameTimeKey(dia, horaInicio)}`);
        subjectPlan.restantes -= horasEntre(horaInicio, horaFin);
        dailyCounts.set(subjectPlan.nombre, (dailyCounts.get(subjectPlan.nombre) || 0) + 1);
      }
    }

    const incompletas = plan.filter((item) => item.restantes !== 0);
    if (incompletas.length > 0) {
      errors.push(
        `El curso ${curso.nombre} quedo con cargas incompletas: ${incompletas
          .map((item) => `${item.nombre} (${item.restantes})`)
          .join(", ")}.`
      );
    }
  }

  return { entries, errors };
};

const limpiarHorarios = async () => {
  const [result] = await pool.query(`DELETE FROM horarios`);
  return result.affectedRows;
};

const generarHorarios = async ({ limpiar = true } = {}) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await ensureCatalogosAcademicos(connection);

    const data = await loadGenerationData(connection);
    const { entries, errors } = buildEntries(data);

    if (errors.length > 0) {
      throw Object.assign(new Error("No se pudo generar un horario valido."), {
        statusCode: 409,
        details: errors.slice(0, 20),
      });
    }

    if (entries.length !== data.cursos.length * DIAS_CLASE.length * 6) {
      throw Object.assign(new Error("El horario generado quedo incompleto."), {
        statusCode: 409,
      });
    }

    if (limpiar) {
      await connection.query(`DELETE FROM horarios`);
    }

    for (const item of entries) {
      await connection.query(
        `INSERT INTO horarios
          (curso_id, profesor_id, asignatura_id, salon_id, dia_semana, hora_inicio, hora_fin, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'activo')`,
        [
          item.cursoId,
          item.profesorId,
          item.asignaturaId,
          item.salonId,
          item.diaSemana,
          item.horaInicio,
          item.horaFin,
        ]
      );
    }

    await connection.commit();
    const validation = await validarConflictos();

    return {
      totalHorarios: entries.length,
      totalCursos: data.cursos.length,
      totalProfesoresApoyo: APOYOS.length,
      validation,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const addConflict = (conflicts, type, item, message) => {
  conflicts.push({
    type,
    message,
    profesor: item.profesor_nombre || null,
    curso: item.curso_nombre || null,
    dia: item.dia_semana || null,
    horaInicio: item.hora_inicio || null,
    horaFin: item.hora_fin || null,
    asignatura: item.asignatura_nombre || null,
  });
};

const validarConflictos = async () => {
  const [horarios] = await pool.query(
    `SELECT
      h.id,
      h.curso_id,
      h.profesor_id,
      h.asignatura_id,
      h.salon_id,
      h.dia_semana,
      h.hora_inicio,
      h.hora_fin,
      c.nombre AS curso_nombre,
      a.nombre AS asignatura_nombre,
      ar.nombre AS area_nombre,
      s.nombre AS salon_nombre,
      CONCAT(p.nombres, ' ', p.apellidos) AS profesor_nombre
    FROM horarios h
    INNER JOIN cursos c ON c.id = h.curso_id
    INNER JOIN asignaturas a ON a.id = h.asignatura_id
    LEFT JOIN areas ar ON ar.id = a.area_id
    INNER JOIN salones s ON s.id = h.salon_id
    INNER JOIN profesores pr ON pr.id = h.profesor_id
    INNER JOIN personas p ON p.id = pr.persona_id
    WHERE h.estado = 'activo'
    ORDER BY c.nombre, h.dia_semana, h.hora_inicio`
  );

  const [cursos] = await pool.query(`SELECT id, nombre FROM cursos WHERE estado = 'activo'`);
  const [asignaturasSinArea] = await pool.query(
    `SELECT a.id, a.nombre
     FROM asignaturas a
     LEFT JOIN areas ar ON ar.id = a.area_id
     WHERE ar.id IS NULL OR ar.estado != 'activo'`
  );
  const [asignaturasSinProfesor] = await pool.query(
    `SELECT a.id, a.nombre
     FROM asignaturas a
     LEFT JOIN profesor_asignatura pa ON pa.asignatura_id = a.id
     WHERE a.estado = 'activo' AND pa.id IS NULL`
  );

  const conflicts = [];

  for (let i = 0; i < horarios.length; i += 1) {
    for (let j = i + 1; j < horarios.length; j += 1) {
      const a = horarios[i];
      const b = horarios[j];
      if (a.dia_semana !== b.dia_semana) continue;
      const overlap = a.hora_inicio < b.hora_fin && a.hora_fin > b.hora_inicio;
      if (!overlap) continue;

      if (a.profesor_id === b.profesor_id) {
        addConflict(conflicts, "profesor", a, `El profesor ${a.profesor_nombre} tiene dos clases al tiempo.`);
      }
      if (a.curso_id === b.curso_id) {
        addConflict(conflicts, "curso", a, `El curso ${a.curso_nombre} tiene dos asignaturas al tiempo.`);
      }
      if (a.salon_id === b.salon_id) {
        addConflict(conflicts, "salon", a, `El salon ${a.salon_nombre} esta ocupado por dos clases al tiempo.`);
      }
    }
  }

  for (const curso of cursos.filter((item) => parseCurso(item.nombre))) {
    const parsed = parseCurso(curso.nombre);
    const plan = new Set(planPorGrado(parsed.grado).map(([nombre]) => normalize(nombre)));
    const cursoHorarios = horarios.filter((item) => item.curso_id === curso.id);
    const horas = cursoHorarios.reduce((total, item) => total + horasEntre(item.hora_inicio, item.hora_fin), 0);
    const dias = new Set(cursoHorarios.map((item) => item.dia_semana));

    if (horas !== 30 || DIAS_CLASE.some((dia) => !dias.has(dia))) {
      conflicts.push({
        type: "incompleto",
        message: `El curso ${curso.nombre} no tiene horario completo de lunes a viernes.`,
        curso: curso.nombre,
        horas,
      });
    }

    for (const item of cursoHorarios) {
      if (!plan.has(normalize(item.asignatura_nombre))) {
        addConflict(conflicts, "asignatura_grado", item, `${item.asignatura_nombre} no corresponde al grado ${parsed.grado}.`);
      }
      if (!item.area_nombre) {
        addConflict(conflicts, "asignatura_area", item, `${item.asignatura_nombre} no tiene area academica activa.`);
      }
    }
  }

  const horariosPorGrado = new Map();
  for (const curso of cursos.filter((item) => parseCurso(item.nombre))) {
    const parsed = parseCurso(curso.nombre);
    const subjects = new Set(
      horarios
        .filter((item) => item.curso_id === curso.id)
        .map((item) => normalize(item.asignatura_nombre))
    );
    const current = horariosPorGrado.get(parsed.grado) || [];
    current.push({ curso: curso.nombre, subjects });
    horariosPorGrado.set(parsed.grado, current);
  }

  for (const [, grupos] of horariosPorGrado) {
    const base = grupos[0];
    for (const grupo of grupos.slice(1)) {
      const baseKey = [...base.subjects].sort().join("|");
      const groupKey = [...grupo.subjects].sort().join("|");
      if (baseKey !== groupKey) {
        conflicts.push({
          type: "grado_asignaturas",
          message: `Los cursos ${base.curso} y ${grupo.curso} no tienen las mismas asignaturas del grado.`,
          curso: grupo.curso,
        });
      }
    }
  }

  for (const item of asignaturasSinArea) {
    conflicts.push({
      type: "asignatura_area",
      message: `La asignatura ${item.nombre} no tiene area academica activa.`,
      asignatura: item.nombre,
    });
  }

  for (const item of asignaturasSinProfesor) {
    conflicts.push({
      type: "asignatura_profesor",
      message: `La asignatura ${item.nombre} no tiene profesor disponible.`,
      asignatura: item.nombre,
    });
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
    resumen: {
      horarios: horarios.length,
      cursos: cursos.filter((item) => parseCurso(item.nombre)).length,
      conflictos: conflicts.length,
    },
  };
};

module.exports = {
  generarHorarios,
  limpiarHorarios,
  validarConflictos,
};
