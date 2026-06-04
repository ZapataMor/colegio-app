const userModel = require("../models/userModel");
const personaModel = require("../models/personaModel");
const pool = require("../config/db");
const bcrypt = require("bcryptjs");

const getAllUsers = async (req, res, next) => {
  try {
    const { estado, rol, q } = req.query;

    const usuarios = await userModel.findAll({
      estado: estado || null,
      rol: rol || null,
      q: q?.trim() || null,
    });

    return res.json({
      ok: true,
      message: "Usuarios obtenidos correctamente.",
      data: usuarios,
    });
  } catch (error) {
    return next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de usuario inválido." });
    }

    const usuario = await userModel.findById(id);

    if (!usuario) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado." });
    }

    const roles = await userModel.getRolesForPersona(usuario.persona_id);

    return res.json({
      ok: true,
      message: "Usuario obtenido correctamente.",
      data: { ...usuario, roles_list: roles },
    });
  } catch (error) {
    return next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { personaId, rolId, contrasena } = req.body;

    if (!personaId || !rolId || !contrasena) {
      return res.status(400).json({
        ok: false,
        message: "personaId, rolId y contrasena son obligatorios.",
      });
    }

    if (contrasena.length < 6) {
      return res.status(400).json({
        ok: false,
        message: "La contraseña debe tener al menos 6 caracteres.",
      });
    }

    const persona = await personaModel.findById(personaId);

    if (!persona) {
      return res.status(404).json({ ok: false, message: "Persona no encontrada." });
    }

    if (persona.usuario_id) {
      return res.status(409).json({
        ok: false,
        message: "Esta persona ya tiene un usuario de acceso.",
      });
    }

    const [roles] = await pool.query(`SELECT id, nombre FROM roles WHERE id = ? LIMIT 1`, [rolId]);

    if (!roles[0]) {
      return res.status(400).json({ ok: false, message: "Rol no válido." });
    }

    const tienePerfil = await personaModel.hasProfileForRole(personaId, roles[0].nombre);

    if (!tienePerfil) {
      return res.status(400).json({
        ok: false,
        message: `La persona no tiene ficha de ${roles[0].nombre}. Créala primero en el módulo correspondiente.`,
      });
    }

    const usuarioConCorreo = persona.correo
      ? await userModel.findByCorreo(persona.correo.trim().toLowerCase())
      : null;

    if (usuarioConCorreo) {
      return res.status(409).json({
        ok: false,
        message: "Ya existe un usuario con el correo de esta persona.",
      });
    }

    const passwordHash = await bcrypt.hash(contrasena, 10);

    let userId;

    try {
      userId = await userModel.createUserFromPersona({
        personaId,
        rolId,
        passwordHash,
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return res.status(status).json({
        ok: false,
        message: error.message || "Error al crear el usuario.",
      });
    }

    const usuarioCreado = await userModel.findById(userId);

    return res.status(201).json({
      ok: true,
      message: "Usuario de acceso creado correctamente.",
      data: usuarioCreado,
    });
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      nombres,
      apellidos,
      correo,
      telefono,
      documento,
      tipoDocumento,
      estado,
      rolId,
      contrasena,
    } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de usuario inválido." });
    }

    const usuarioExistente = await userModel.findById(id);

    if (!usuarioExistente) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado." });
    }

    let passwordHash;
    if (contrasena !== undefined && contrasena !== null && contrasena !== "") {
      if (contrasena.length < 6) {
        return res.status(400).json({
          ok: false,
          message: "La contraseña debe tener al menos 6 caracteres.",
        });
      }
      passwordHash = await bcrypt.hash(contrasena, 10);
    }

    try {
      const actualizado = await userModel.updateUser(id, {
        nombres: nombres?.trim(),
        apellidos: apellidos?.trim(),
        correo: correo?.trim().toLowerCase(),
        telefono: telefono?.trim() || null,
        documento: documento?.trim(),
        tipoDocumento,
        estado,
        rolId,
        passwordHash,
      });

      if (!actualizado) {
        return res.status(400).json({ ok: false, message: "No hay campos para actualizar." });
      }
    } catch (error) {
      const status = error.statusCode || 500;
      return res.status(status).json({
        ok: false,
        message: error.message || "Error al actualizar el usuario.",
      });
    }

    const usuarioActualizado = await userModel.findById(id);

    return res.json({
      ok: true,
      message: "Usuario actualizado correctamente.",
      data: usuarioActualizado,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID de usuario inválido." });
    }

    const usuarioExistente = await userModel.findById(id);

    if (!usuarioExistente) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado." });
    }

    const eliminado = await userModel.deleteUser(id);

    if (!eliminado) {
      return res.status(500).json({ ok: false, message: "Error al eliminar el usuario." });
    }

    return res.json({ ok: true, message: "Usuario eliminado correctamente." });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
