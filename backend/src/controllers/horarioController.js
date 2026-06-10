const horarioModel = require("../models/horarioModel");

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

    if (data.diaSemana && !DIAS.includes(data.diaSemana)) {
      return res.status(400).json({ ok: false, message: "Dia de la semana invalido." });
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

module.exports = {
  getAllHorarios,
  getHorarioById,
  createHorario,
  updateHorario,
  deleteHorario,
  getHorarioCatalog,
};
