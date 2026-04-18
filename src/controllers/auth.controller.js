const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
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

function normalizeString(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

async function findSpecialtyForDoctor(connection, especialidadTexto) {
  const clean = normalizeString(especialidadTexto);

  if (clean) {
    const [exactRows] = await connection.execute(
      `
        SELECT id, nombre
        FROM specialties
        WHERE activo = 1
          AND LOWER(nombre) = LOWER(?)
        LIMIT 1
      `,
      [clean]
    );

    if (exactRows[0]) {
      return exactRows[0];
    }

    const [likeRows] = await connection.execute(
      `
        SELECT id, nombre
        FROM specialties
        WHERE activo = 1
          AND LOWER(nombre) LIKE LOWER(?)
        ORDER BY id ASC
        LIMIT 1
      `,
      [`%${clean}%`]
    );

    if (likeRows[0]) {
      return likeRows[0];
    }
  }

  const [fallbackRows] = await connection.execute(
    `
      SELECT id, nombre
      FROM specialties
      WHERE activo = 1
      ORDER BY id ASC
      LIMIT 1
    `
  );

  return fallbackRows[0] || null;
}

async function findDefaultConsultorio(connection) {
  const [rows] = await connection.execute(
    `
      SELECT id
      FROM consultorios
      WHERE activo = 1
      ORDER BY id ASC
      LIMIT 1
    `
  );

  return rows[0] || null;
}

async function register(req, res) {
  const connection = await db.getConnection();

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
      codigoAdmin,
    } = req.body;

    const cleanNombre = normalizeString(nombre);
    const cleanApellidos = normalizeString(apellidos);
    const cleanEmail = normalizeString(email).toLowerCase();
    const cleanPassword = normalizeString(password);
    const cleanRole = normalizeString(role).toLowerCase();
    const cleanTelefono = normalizeString(telefono) || null;
    const cleanCedula = normalizeString(cedula) || null;
    const cleanEspecialidad = normalizeString(especialidad);

    if (!cleanNombre || !cleanEmail || !cleanPassword || !cleanRole) {
      return res.status(400).json({
        ok: false,
        message: 'Todos los campos obligatorios deben ser completados.',
      });
    }

    const allowedRoles = ['paciente', 'medico', 'admin'];

    if (!allowedRoles.includes(cleanRole)) {
      return res.status(400).json({
        ok: false,
        message: 'Rol no válido.',
      });
    }

    if (!cleanApellidos) {
      return res.status(400).json({
        ok: false,
        message: 'Los apellidos son obligatorios.',
      });
    }

    if (cleanRole === 'paciente') {
      if (!normalizeString(matricula) || !normalizeString(carrera)) {
        return res.status(400).json({
          ok: false,
          message: 'Para paciente debes capturar nombre, apellidos, matrícula y carrera.',
        });
      }
    }

    if (cleanRole === 'medico') {
      if (!cleanCedula || !cleanEspecialidad) {
        return res.status(400).json({
          ok: false,
          message: 'Para médico debes capturar nombre, apellidos, cédula y especialidad.',
        });
      }
    }

    if (cleanRole === 'admin') {
      if (!normalizeString(codigoAdmin)) {
        return res.status(400).json({
          ok: false,
          message: 'Para administrador debes capturar nombre, apellidos y código de administrador.',
        });
      }
    }

    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [cleanEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'El correo ya está registrado.',
      });
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    await connection.beginTransaction();

    const [userResult] = await connection.execute(
      `
        INSERT INTO users (
          nombre,
          apellidos,
          email,
          password,
          telefono,
          role,
          activo,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
      `,
      [
        cleanNombre,
        cleanApellidos,
        cleanEmail,
        hashedPassword,
        cleanTelefono,
        cleanRole,
      ]
    );

    const userId = userResult.insertId;

    if (cleanRole === 'medico') {
      const specialty = await findSpecialtyForDoctor(connection, cleanEspecialidad);
      const consultorio = await findDefaultConsultorio(connection);

      if (!specialty) {
        throw new Error('No existe una especialidad activa para asignar al médico.');
      }

      if (!consultorio) {
        throw new Error('No existe un consultorio activo para asignar al médico.');
      }

      await connection.execute(
        `
          INSERT INTO doctors (
            user_id,
            specialty_id,
            consultorio_id,
            cedula,
            duracion_cita_minutos,
            activo,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, 30, 1, NOW(), NOW())
        `,
        [
          Number(userId),
          Number(specialty.id),
          Number(consultorio.id),
          cleanCedula,
        ]
      );
    }

    await connection.commit();

    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    const savedUser = rows[0];
    const token = generateToken(savedUser);

    return res.status(201).json({
      ok: true,
      message: 'Usuario registrado correctamente.',
      data: {
        token,
        user: sanitizeUser(savedUser),
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error en register:', error);

    return res.status(500).json({
      ok: false,
      message: 'Error interno al registrar usuario.',
      error: error.message,
    });
  } finally {
    connection.release();
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const cleanEmail = normalizeString(email).toLowerCase();
    const cleanPassword = normalizeString(password);

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({
        ok: false,
        message: 'Correo y contraseña son obligatorios.',
      });
    }

    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [cleanEmail]
    );

    const user = rows[0];

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

    const isValidPassword = await bcrypt.compare(cleanPassword, user.password);

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
    console.error('Error en login:', error);

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