const notaModel = require("../models/notaModel");

const getPersonaIdFromRequest = async (req) => {
  if (req.user?.personaId) return req.user.personaId;
  if (!req.user?.id) return null;
  return notaModel.findPersonaIdByUsuarioId(req.user.id);
};

const toDateString = (value) => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value || "").slice(0, 10);
};

const todayString = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
};

const getNotasPorCurso = async (req, res, next) => {
  try {
    if (!["profesor", "administrador"].includes(req.user?.rol)) {
      return res.status(403).json({ ok: false, message: "No tienes permiso para consultar notas." });
    }

    const personaId = await getPersonaIdFromRequest(req);
    const cursoId = req.query.cursoId ? Number(req.query.cursoId) : null;
    const asignaturaId = req.query.asignaturaId ? Number(req.query.asignaturaId) : null;
    const periodoId = req.query.periodoId ? Number(req.query.periodoId) : null;

    if (req.user?.rol === "administrador" && (!cursoId || !asignaturaId)) {
      return res.json({
        ok: true,
        data: await notaModel.findNotasFinalesPorCurso({ periodoId }),
      });
    }

    if (!cursoId || !asignaturaId || !periodoId) {
      return res.json({ ok: true, data: null });
    }

    const data = await notaModel.findPorCurso({
      periodoId,
      cursoId,
      asignaturaId,
      profesorPersonaId: req.user?.rol === "profesor" ? personaId : null,
    });

    if (!data) {
      return res.status(req.user?.rol === "profesor" ? 403 : 404).json({
        ok: false,
        message: "No hay asignacion activa para el curso y asignatura seleccionados.",
      });
    }

    return res.json({
      ok: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

const getAllNotas = async (req, res, next) => {
  try {
    return res.json({
      ok: true,
      data: await notaModel.findAll({
        q: req.query.q?.trim() || null,
        estudianteId: req.query.estudianteId ? Number(req.query.estudianteId) : null,
        cursoId: req.query.cursoId ? Number(req.query.cursoId) : null,
        asignaturaId: req.query.asignaturaId ? Number(req.query.asignaturaId) : null,
        periodoId: req.query.periodoId ? Number(req.query.periodoId) : null,
        limit: req.query.limit || null,
      }),
    });
  } catch (error) {
    return next(error);
  }
};

const getNotaById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: "ID invalido." });

    const nota = await notaModel.findById(id);
    if (!nota) return res.status(404).json({ ok: false, message: "Nota no encontrada." });

    return res.json({ ok: true, data: nota });
  } catch (error) {
    return next(error);
  }
};

const getNotaCatalog = async (req, res, next) => {
  try {
    if (!["profesor", "administrador"].includes(req.user?.rol)) {
      return res.status(403).json({ ok: false, message: "No tienes permiso para consultar el catalogo de notas." });
    }

    const personaId = await getPersonaIdFromRequest(req);

    return res.json({
      ok: true,
      data: await notaModel.getCatalog({
        profesorPersonaId: req.user?.rol === "profesor" ? personaId : null,
      }),
    });
  } catch (error) {
    return next(error);
  }
};

const createActividad = async (req, res, next) => {
  try {
    if (!["profesor", "administrador"].includes(req.user?.rol)) {
      return res.status(403).json({ ok: false, message: "No tienes permiso para crear actividades." });
    }

    const titulo = req.body.titulo?.trim() || req.body.nombre?.trim();
    const fecha = req.body.fecha || req.body.activityDate;
    const cursoId = Number(req.body.cursoId);
    const asignaturaId = Number(req.body.asignaturaId);
    const periodoId = Number(req.body.periodoId);
    let profesorId = Number(req.body.profesorId);

    if (!titulo || !fecha || !cursoId || !asignaturaId || !periodoId) {
      return res.status(400).json({
        ok: false,
        message: "titulo, fecha, cursoId, asignaturaId y periodoId son obligatorios.",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
      return res.status(400).json({ ok: false, message: "La fecha debe tener formato YYYY-MM-DD." });
    }

    const periodo = await notaModel.findPeriodoById(periodoId);
    if (!periodo) {
      return res.status(400).json({ ok: false, message: "El periodo academico no existe." });
    }

    if (periodo.estado !== "activo") {
      return res.status(400).json({
        ok: false,
        message: "Solo puedes crear actividades dentro del periodo academico activo.",
      });
    }

    const fechaActividad = String(fecha).slice(0, 10);
    if (fechaActividad < todayString()) {
      return res.status(400).json({
        ok: false,
        message: "La fecha de la actividad no puede ser anterior a la fecha actual.",
      });
    }

    const fechaInicio = toDateString(periodo.fecha_inicio);
    const fechaFin = toDateString(periodo.fecha_fin);
    if (fechaActividad < fechaInicio || fechaActividad > fechaFin) {
      return res.status(400).json({
        ok: false,
        message: `La fecha debe estar dentro del periodo academico activo (${fechaInicio} a ${fechaFin}).`,
      });
    }

    if (req.user?.rol === "profesor") {
      const personaId = await getPersonaIdFromRequest(req);
      const profesor = personaId ? await notaModel.findProfesorByPersonaId(personaId) : null;
      if (!profesor) {
        return res.status(403).json({
          ok: false,
          message: "Tu usuario no tiene un perfil de profesor activo asociado.",
        });
      }
      profesorId = profesor.id;
    } else if (!profesorId) {
      return res.status(400).json({ ok: false, message: "profesorId es obligatorio para administrador." });
    }

    const profesorAsignado = await notaModel.profesorTieneClase({ profesorId, cursoId, asignaturaId });
    if (!profesorAsignado) {
      return res.status(403).json({
        ok: false,
        message: "El profesor seleccionado no tiene asignado ese curso y asignatura.",
      });
    }

    const asignaturaHabilitada = await notaModel.asignaturaPertenecePeriodo({ periodoId, asignaturaId });
    if (!asignaturaHabilitada) {
      return res.status(400).json({
        ok: false,
        message: "La asignatura seleccionada no esta habilitada para este periodo academico.",
      });
    }

    const id = await notaModel.createActividad({
      titulo,
      fecha,
      cursoId,
      asignaturaId,
      periodoId,
      profesorId,
      descripcion: req.body.descripcion?.trim() || null,
    });

    return res.status(201).json({
      ok: true,
      message: "Actividad creada correctamente.",
      data: await notaModel.findActividadById(id),
    });
  } catch (error) {
    return next(error);
  }
};

const deleteActividad = async (req, res, next) => {
  try {
    if (!["profesor", "administrador"].includes(req.user?.rol)) {
      return res.status(403).json({ ok: false, message: "No tienes permiso para eliminar actividades." });
    }

    const actividadId = Number(req.params.actividadId);
    if (!actividadId) {
      return res.status(400).json({ ok: false, message: "ID de actividad invalido." });
    }

    const actividad = await notaModel.findActividadById(actividadId);
    if (!actividad) {
      return res.status(404).json({ ok: false, message: "Actividad no encontrada." });
    }

    if (req.user?.rol === "profesor") {
      const personaId = await getPersonaIdFromRequest(req);
      if (actividad.profesor_persona_id !== personaId) {
        return res.status(403).json({
          ok: false,
          message: "Solo puedes eliminar actividades creadas para tus asignaciones.",
        });
      }
    }

    await notaModel.deleteActividad(actividadId);

    return res.json({
      ok: true,
      message: "Actividad eliminada correctamente.",
    });
  } catch (error) {
    return next(error);
  }
};

const upsertNotaActividad = async (req, res, next) => {
  try {
    if (!["profesor", "administrador"].includes(req.user?.rol)) {
      return res.status(403).json({ ok: false, message: "No tienes permiso para registrar notas." });
    }

    const actividadId = Number(req.params.actividadId);
    const estudianteId = Number(req.body.estudianteId);
    const notaNum = Number(String(req.body.nota ?? "").replace(",", "."));

    if (!actividadId || !estudianteId || req.body.nota === undefined || req.body.nota === "") {
      return res.status(400).json({
        ok: false,
        message: "actividadId, estudianteId y nota son obligatorios.",
      });
    }

    if (isNaN(notaNum) || notaNum < 1 || notaNum > 5) {
      return res.status(400).json({ ok: false, message: "La nota debe ser un numero entre 1.0 y 5.0." });
    }

    const actividad = await notaModel.findActividadById(actividadId);
    if (!actividad) {
      return res.status(404).json({ ok: false, message: "Actividad no encontrada." });
    }

    if (req.user?.rol === "profesor") {
      const personaId = await getPersonaIdFromRequest(req);
      if (actividad.profesor_persona_id !== personaId) {
        return res.status(403).json({
          ok: false,
          message: "Solo puedes editar notas de actividades creadas para tus asignaciones.",
        });
      }
    }

    const estudianteValido = await notaModel.estudiantePerteneceCurso(estudianteId, actividad.curso_id);
    if (!estudianteValido) {
      return res.status(400).json({
        ok: false,
        message: "El estudiante no pertenece al curso de la actividad.",
      });
    }

    const id = await notaModel.upsertNotaActividad({
      actividadId,
      estudianteId,
      nota: notaNum,
      observacion: req.body.observacion?.trim() || null,
    });

    return res.json({
      ok: true,
      message: "Nota guardada correctamente.",
      data: await notaModel.findNotaActividadById(id),
    });
  } catch (error) {
    return next(error);
  }
};

const createNota = async (req, res, next) => {
  try {
    if (req.user?.rol !== "profesor") {
      return res.status(403).json({
        ok: false,
        message: "Solo un profesor puede registrar notas desde su salon asignado.",
      });
    }

    const personaId = await getPersonaIdFromRequest(req);
    const profesor = personaId ? await notaModel.findProfesorByPersonaId(personaId) : null;
    if (!profesor) {
      return res.status(403).json({
        ok: false,
        message: "Tu usuario no tiene un perfil de profesor activo asociado.",
      });
    }

    const { estudianteId, cursoId, asignaturaId, periodoId, nota, observacion } = req.body;

    if (!estudianteId || !cursoId || !asignaturaId || !periodoId || nota === undefined || nota === "") {
      return res.status(400).json({
        ok: false,
        message: "estudianteId, cursoId, asignaturaId, periodoId y nota son obligatorios.",
      });
    }

    const notaNum = Number(nota);
    if (isNaN(notaNum) || notaNum < 1 || notaNum > 5) {
      return res.status(400).json({ ok: false, message: "La nota debe ser un numero entre 1.0 y 5.0." });
    }

    const estudianteValido = await notaModel.estudiantePerteneceCurso(
      Number(estudianteId),
      Number(cursoId)
    );
    if (!estudianteValido) {
      return res.status(400).json({
        ok: false,
        message: "El estudiante seleccionado no pertenece al salon indicado.",
      });
    }

    const profesorAsignado = await notaModel.profesorTieneClase({
      profesorId: profesor.id,
      cursoId: Number(cursoId),
      asignaturaId: Number(asignaturaId),
    });
    if (!profesorAsignado) {
      return res.status(403).json({
        ok: false,
        message: "Solo puedes registrar notas en salones y asignaturas que tengas asignados.",
      });
    }

    const asignaturaHabilitada = await notaModel.asignaturaPertenecePeriodo({
      periodoId: Number(periodoId),
      asignaturaId: Number(asignaturaId),
    });
    if (!asignaturaHabilitada) {
      return res.status(400).json({
        ok: false,
        message: "La asignatura seleccionada no esta habilitada para este periodo academico.",
      });
    }

    const id = await notaModel.create({
      estudianteId: Number(estudianteId),
      cursoId: Number(cursoId),
      asignaturaId: Number(asignaturaId),
      profesorId: profesor.id,
      periodoId: Number(periodoId),
      nota: notaNum,
      observacion,
    });

    return res.status(201).json({
      ok: true,
      message: "Nota registrada correctamente.",
      data: await notaModel.findById(id),
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        ok: false,
        message: "Ya existe una nota para este estudiante, asignatura y periodo.",
      });
    }
    return next(error);
  }
};

const updateNota = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: "ID invalido." });

    const existing = await notaModel.findById(id);
    if (!existing) return res.status(404).json({ ok: false, message: "Nota no encontrada." });

    if (req.body.nota !== undefined && req.body.nota !== "") {
      const notaNum = Number(req.body.nota);
      if (isNaN(notaNum) || notaNum < 1 || notaNum > 5) {
        return res.status(400).json({ ok: false, message: "La nota debe ser un numero entre 1.0 y 5.0." });
      }
      req.body.nota = notaNum;
    }

    const updated = await notaModel.update(id, {
      estudianteId: req.body.estudianteId ? Number(req.body.estudianteId) : undefined,
      cursoId: req.body.cursoId ? Number(req.body.cursoId) : undefined,
      asignaturaId: req.body.asignaturaId ? Number(req.body.asignaturaId) : undefined,
      profesorId: req.body.profesorId ? Number(req.body.profesorId) : undefined,
      periodoId: req.body.periodoId ? Number(req.body.periodoId) : undefined,
      nota: req.body.nota,
      observacion: req.body.observacion,
    });

    if (!updated) return res.status(400).json({ ok: false, message: "No hay cambios." });

    return res.json({
      ok: true,
      message: "Nota actualizada correctamente.",
      data: await notaModel.findById(id),
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        ok: false,
        message: "Ya existe una nota para ese estudiante, asignatura y periodo.",
      });
    }
    return next(error);
  }
};

const deleteNota = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: "ID invalido." });

    const existing = await notaModel.findById(id);
    if (!existing) return res.status(404).json({ ok: false, message: "Nota no encontrada." });

    await notaModel.deleteNota(id);
    return res.json({ ok: true, message: "Nota eliminada correctamente." });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllNotas,
  getNotaById,
  getNotaCatalog,
  getNotasPorCurso,
  createActividad,
  deleteActividad,
  upsertNotaActividad,
  createNota,
  updateNota,
  deleteNota,
};
