const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDb, writeDb } = require('../data/db');
const env = require('../config/env');

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

async function register(req, res) {
  try {
    const {
  nombre,
  email,
  password,
  role,
  telefono,
  apellidos,
  matricula,
  carrera,
  cedula,
  especialidad,
  codigoAdmin
} = req.body;

    if (!nombre || !email || !password || !role) {
      return res.status(400).json({
        ok: false,
        message: 'Todos los campos son obligatorios.',
      });
    }

    const allowedRoles = ['paciente', 'medico', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        ok: false,
        message: 'Rol no válido.',
      });
    }

    const db = readDb();
    db.users = db.users || [];

    const emailExists = db.users.some(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );

    if (emailExists) {
      return res.status(409).json({
        ok: false,
        message: 'El correo ya está registrado.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: db.users.length ? Math.max(...db.users.map((u) => u.id)) + 1 : 1,
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role,
      activo: true,

      telefono: telefono || '',
      apellidos: apellidos || '',
      matricula: matricula || '',
      carrera: carrera || '',
      cedula: cedula || '',
      especialidad: especialidad || '',
      codigoAdmin: codigoAdmin || ''
    };

    db.users.push(newUser);
    writeDb(db);

    const token = generateToken(newUser);

    return res.status(201).json({
      ok: true,
      message: 'Usuario registrado correctamente.',
      data: {
        token,
        user: sanitizeUser(newUser),
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error interno al registrar usuario.',
      error: error.message,
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: 'Correo y contraseña son obligatorios.',
      });
    }

    const db = readDb();
    db.users = db.users || [];

    const user = db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'Credenciales inválidas.',
      });
    }

    if (!user.activo) {
      return res.status(403).json({
        ok: false,
        message: 'Usuario inactivo.',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        ok: false,
        message: 'Credenciales inválidas.',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      ok: true,
      message: 'Inicio de sesión exitoso.',
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error interno al iniciar sesión.',
      error: error.message,
    });
  }
}

function me(req, res) {
  return res.status(200).json({
    ok: true,
    data: req.user,
  });
}

module.exports = {
  register,
  login,
  me,
};