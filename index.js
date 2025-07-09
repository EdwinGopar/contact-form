require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db/connection'); // adaptado a mysql2
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Frontend estático
app.use(express.static(path.join(__dirname, '../contac_form-back-frony/public')));

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.send('API CRM operativa 🚀');
});

// POST /api/contact - Insertar mensaje
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;

  console.log('📨 Nueva solicitud recibida:', { name, email, phone, message });

  try {
    const [result] = await pool.execute(
      `INSERT INTO messages (name, email, phone, message) VALUES (?, ?, ?, ?)`,
      [name, email, phone, message]
    );

    const newId = result.insertId;
    if (!newId) {
      return res.status(500).json({ error: 'No se pudo obtener el ID del mensaje insertado' });
    }

    console.log(`✅ Mensaje insertado con ID ${newId}`);
    res.status(201).json({ message: 'Mensaje enviado correctamente', id: newId });
  } catch (err) {
    console.error('❌ Error al guardar mensaje:', err);
    res.status(500).json({ error: 'Error al guardar el mensaje' });
  }
});

// GET /api/contact - Obtener todos los mensajes
app.get('/api/contact', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM messages ORDER BY created_at DESC');
    res.status(200).json(rows);
  } catch (err) {
    console.error('❌ Error al obtener mensajes:', err);
    res.status(500).json({ error: 'Error al obtener los mensajes' });
  }
});

// PUT /api/contact/:id - Actualizar mensaje o solo el estado
app.put('/api/contact/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, message, status } = req.body;

  try {
    // Si solo se envía status (ej: desde dashboard.js)
    if (!name && !email && !phone && !message && status) {
      const [result] = await pool.execute(
        `UPDATE messages SET status = ? WHERE id = ?`,
        [status, id]
      );
      return res.status(200).json({ message: 'Estado actualizado correctamente' });
    }

    // Actualización completa (ej: desde admin)
    const [result] = await pool.execute(
      `UPDATE messages SET 
        name = IF(? != '', ?, name),
        email = IF(? != '', ?, email),
        phone = IF(? != '', ?, phone),
        message = IF(? != '', ?, message),
        status = ?
       WHERE id = ?`,
      [
        name || '', name,
        email || '', email,
        phone || '', phone,
        message || '', message,
        status || 'nuevo',
        id
      ]
    );

    res.status(200).json({ message: 'Lead actualizado correctamente' });
  } catch (err) {
    console.error('❌ Error al actualizar lead:', err);
    res.status(500).json({ error: 'Error al actualizar el lead' });
  }
});

// DELETE /api/contact/:id - Eliminar mensaje
app.delete('/api/contact/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.execute('DELETE FROM messages WHERE id = ?', [id]);
    res.status(200).json({ message: 'Mensaje eliminado correctamente' });
  } catch (err) {
    console.error('❌ Error al eliminar mensaje:', err);
    res.status(500).json({ error: 'Error al eliminar el mensaje' });
  }
});

// Lanzar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
