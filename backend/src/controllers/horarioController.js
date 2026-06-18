const horarioModel = require("../models/horarioModel");
const horarioGeneratorService = require("../services/horarioGeneratorService");

const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

const getAllHorarios = async (req, res, next) => {
  try {
    const horarios = await horarioModel.findAll({
      cursoId: req.query.cursoId || null,
      profesorId: req.query.profesorId || null,
      profesorPersonaId: req.query.profesorPersonaId || null,
      dia: req.query.dia || null,
      estado: req.query.estado || null,
      q: req.query.q?.trim() || null,
      limit: req.query.limit || null,
    });

    return res.json({
      ok: true,
      message: "Horarios obtenidos correctamente.",
      data: horarios,
    });
  } catch (error) {
    return next(error);
  }
};

const getHorarioById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, message: "ID de horario invalido." });
    }

    const horario = await horarioModel.findById(id);
    if (!horario) {
      return res.status(404).json({ ok: false, message: "Horario no encontrado." });
    }

    return res.json({ ok: true, data: horario });
  } catch (error) {
    return next(error);
  }
};

const createHorario = async (req, res, next) => {
  try {
    const { cursoId, profesorId, asignaturaId, salonId, diaSemana, horaInicio, horaFin, estado } =
      req.body;

    if (!cursoId || !profesorId || !asignaturaId || !salonId || !diaSemana || !horaInicio || !horaFin) {
      return res.status(400).json({
        ok: false,
        message: "cursoId, profesorId, asignaturaId, salonId, diaSemana, horaInicio y horaFin son obligatorios.",
      });
    }

    if (!DIAS.includes(diaSemana)) {
      return res.status(400).json({ ok: false, message: "Dia de la semana invalido." });
    }

    if (horaFin <= horaInicio) {
      return res.status(400).json({ ok: false, message: "La hora final debe ser mayor que la inicial." });
    }

    if (horaInicio < "06:00:00" || horaFin > "22:00:00") {
      return res.status(400).json({
        ok: false,
        message: "No se puede registrar un horario fuera del horario institucional (6:00am - 10:00pm).",
      });
    }

    const exactMatch = await horarioModel.findExactHorario({
      cursoId,
      profesorId,
      asignaturaId,
      salonId,
      diaSemana,
      horaInicio,
      horaFin,
    });

    if (exactMatch) {
      return res.status(409).json({
        ok: false,
        message: "Ya existe un horario exactamente igual (mismo día, hora, profesor, salón y grupo).",
      });
    }

    const sameSubjectDay = await horarioModel.findSameAsignaturaDay({
      cursoId,
      asignaturaId,
      diaSemana,
    });

    if (sameSubjectDay) {
      if (sameSubjectDay.profesor_id === Number(profesorId)) {
        return res.status(409).json({
          ok: false,
          message: "No se puede asignar el mismo profesor a la misma materia dos veces en el mismo grupo.",
        });
      }

      return res.status(409).json({
        ok: false,
        message: "La misma materia ya tiene horario registrado en ese día para ese grupo.",
      });
    }

    const profesorOverlap = await horarioModel.findOverlapsByField({
      field: "profesor_id",
      value: profesorId,
      diaSemana,
      horaInicio,
      horaFin,
    });

    if (profesorOverlap.length > 0) {
      return res.status(409).json({
        ok: false,
        message: "El profesor ya tiene clase a esa hora en otro grupo.",
      });
    }

    const salonOverlap = await horarioModel.findOverlapsByField({
      field: "salon_id",
      value: salonId,
      diaSemana,
      horaInicio,
      horaFin,
    });

    if (salonOverlap.length > 0) {
      return res.status(409).json({
        ok: false,
        message: "El salón ya está ocupado a esa hora.",
      });
    }

    const cursoOverlap = await horarioModel.findOverlapsByField({
      field: "curso_id",
      value: cursoId,
      diaSemana,
      horaInicio,
      horaFin,
    });

    if (cursoOverlap.length > 0) {
      return res.status(409).json({
        ok: false,
        message: "El grupo ya tiene clase a esa hora.",
      });
    }

    const horarioId = await horarioModel.create({
      cursoId,
      profesorId,
      asignaturaId,
      salonId,
      diaSemana,
      horaInicio,
      horaFin,
      estado,
    });

    return res.status(201).json({
      ok: true,
      message: "Horario creado correctamente.",
      data: await horarioModel.findById(horarioId),
    });
  } catch (error) {
    if (error && error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        ok: false,
        message: "Existe un conflicto de horario para el curso, profesor o salon en esa hora.",
      });
    }
    return next(error);
  }
};

const updateHorario = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, message: "ID de horario invalido." });
    }

    const current = await horarioModel.findById(id);
    if (!current) {
      return res.status(404).json({ ok: false, message: "Horario no encontrado." });
    }

    const data = {
      cursoId: req.body.cursoId,
      profesorId: req.body.profesorId,
      asignaturaId: req.body.asignaturaId,
      salonId: req.body.salonId,
      diaSemana: req.body.diaSemana,
      horaInicio: req.body.horaInicio,
      horaFin: req.body.horaFin,
      estado: req.body.estado,
    };

    const horaInicio = data.horaInicio ?? current.hora_inicio;
    const horaFin = data.horaFin ?? current.hora_fin;
    if (horaFin <= horaInicio) {
      return res.status(400).json({ ok: false, message: "La hora final debe ser mayor que la inicial." });
    }

    if (horaInicio < "06:00:00" || horaFin > "22:00:00") {
      return res.status(400).json({
        ok: false,
        message: "No se puede registrar un horario fuera del horario institucional (6:00am - 10:00pm).",
      });
    }

    if (data.diaSemana && !DIAS.includes(data.diaSemana)) {
      return res.status(400).json({ ok: false, message: "Dia de la semana invalido." });
    }

    const finalDiaSemana = data.diaSemana ?? current.dia_semana;
    const finalCursoId = data.cursoId ?? current.curso_id;
    const finalProfesorId = data.profesorId ?? current.profesor_id;
    const finalAsignaturaId = data.asignaturaId ?? current.asignatura_id;
    const finalSalonId = data.salonId ?? current.salon_id;

    const exactMatch = await horarioModel.findExactHorario({
      cursoId: finalCursoId,
      profesorId: finalProfesorId,
      asignaturaId: finalAsignaturaId,
      salonId: finalSalonId,
      diaSemana: finalDiaSemana,
      horaInicio,
      horaFin,
      excludeId: id,
    });

    if (exactMatch) {
      return res.status(409).json({
        ok: false,
        message: "Ya existe un horario exactamente igual (mismo día, hora, profesor, salón y grupo).",
      });
    }

    const sameSubjectDay = await horarioModel.findSameAsignaturaDay({
      cursoId: finalCursoId,
      asignaturaId: finalAsignaturaId,
      diaSemana: finalDiaSemana,
      excludeId: id,
    });

    if (sameSubjectDay) {
      if (sameSubjectDay.profesor_id === Number(finalProfesorId)) {
        return res.status(409).json({
          ok: false,
          message: "No se puede asignar el mismo profesor a la misma materia dos veces en el mismo grupo.",
        });
      }

      return res.status(409).json({
        ok: false,
        message: "La misma materia ya tiene horario registrado en ese día para ese grupo.",
      });
    }

    const profesorOverlap = await horarioModel.findOverlapsByField({
      field: "profesor_id",
      value: finalProfesorId,
      diaSemana: finalDiaSemana,
      horaInicio,
      horaFin,
      excludeId: id,
    });

    if (profesorOverlap.length > 0) {
      return res.status(409).json({
        ok: false,
        message: "El profesor ya tiene clase a esa hora en otro grupo.",
      });
    }

    const salonOverlap = await horarioModel.findOverlapsByField({
      field: "salon_id",
      value: finalSalonId,
      diaSemana: finalDiaSemana,
      horaInicio,
      horaFin,
      excludeId: id,
    });

    if (salonOverlap.length > 0) {
      return res.status(409).json({
        ok: false,
        message: "El salón ya está ocupado a esa hora.",
      });
    }

    const cursoOverlap = await horarioModel.findOverlapsByField({
      field: "curso_id",
      value: finalCursoId,
      diaSemana: finalDiaSemana,
      horaInicio,
      horaFin,
      excludeId: id,
    });

    if (cursoOverlap.length > 0) {
      return res.status(409).json({
        ok: false,
        message: "El grupo ya tiene clase a esa hora.",
      });
    }

    const updated = await horarioModel.update(id, data);
    if (!updated) {
      return res.status(400).json({ ok: false, message: "No hay cambios para actualizar." });
    }

    return res.json({
      ok: true,
      message: "Horario actualizado correctamente.",
      data: await horarioModel.findById(id),
    });
  } catch (error) {
    if (error && error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        ok: false,
        message: "Existe un conflicto de horario para el curso, profesor o salon en esa hora.",
      });
    }
    return next(error);
  }
};

const deleteHorario = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, message: "ID de horario invalido." });
    }

    const current = await horarioModel.findById(id);
    if (!current) {
      return res.status(404).json({ ok: false, message: "Horario no encontrado." });
    }

    await horarioModel.deleteHorario(id);
    return res.json({ ok: true, message: "Horario eliminado correctamente." });
  } catch (error) {
    return next(error);
  }
};

const getHorarioCatalog = async (req, res, next) => {
  try {
    return res.json({ ok: true, data: await horarioModel.getCatalog() });
  } catch (error) {
    return next(error);
  }
};

const generateHorarios = async (req, res, next) => {
  try {
    const result = await horarioGeneratorService.generarHorarios({
      limpiar: req.body?.limpiar !== false,
    });

    return res.status(201).json({
      ok: true,
      message: "Horarios generados correctamente.",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        ok: false,
        message: error.message,
        data: { details: error.details || [] },
      });
    }
    return next(error);
  }
};

const validateHorarios = async (req, res, next) => {
  try {
    const result = await horarioGeneratorService.validarConflictos();
    return res.json({
      ok: true,
      message: result.valid ? "El horario es valido y no tiene conflictos." : "Se encontraron conflictos en el horario.",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const clearHorarios = async (req, res, next) => {
  try {
    const deleted = await horarioGeneratorService.limpiarHorarios();
    return res.json({
      ok: true,
      message: "Horarios eliminados correctamente.",
      data: { deleted },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllHorarios,
  getHorarioById,
  createHorario,
  updateHorario,
  deleteHorario,
  getHorarioCatalog,
  generateHorarios,
  validateHorarios,
  clearHorarios,
};
