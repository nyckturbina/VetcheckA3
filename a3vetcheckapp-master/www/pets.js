// www/js/pets.js
var Pets = {
  async create(data) {
    return DB.run(
      `INSERT INTO pets (name, species, breed, age, weight, owner_id) VALUES (?,?,?,?,?,?)`,
      [data.name, data.species, data.breed, data.age || null, data.weight || null, data.owner_id]
    );
  },
  async listByOwner(ownerId) {
    return DB.query(`SELECT * FROM pets WHERE owner_id = ? ORDER BY name`, [ownerId]);
  },
  async remove(id) {
    await DB.run(`DELETE FROM pets WHERE id = ?`, [id]);
  }
};

// www/js/appointments.js
var Appointments = {
  async create(data) {
    return DB.run(
      `INSERT INTO appointments (pet_id, vet_name, type, date, time, status, notes)
       VALUES (?,?,?,?,?,?,?)`,
      [data.pet_id, data.vet_name || null, data.type || null, data.date, data.time, 'agendado', data.notes || null]
    );
  },
  async listByOwner(ownerId) {
    return DB.query(
      `SELECT a.*, p.name AS pet_name
       FROM appointments a
       JOIN pets p ON p.id = a.pet_id
       WHERE p.owner_id = ?
       ORDER BY date, time`,
      [ownerId]
    );
  },
  async cancel(id) {
    return DB.run(`UPDATE appointments SET status = 'cancelado' WHERE id = ?`, [id]);
  }
};

// www/js/anamnesis.js
var Anamnesis = {
  async upsert(appointment_id, data) {
    var existing = await DB.query(`SELECT id FROM anamnesis WHERE appointment_id = ?`, [appointment_id]);
    var now = new Date().toISOString();
    if (existing.length) {
      return DB.run(
        `UPDATE anamnesis SET chief_complaint=?, history=?, physical_exam=?, diagnostic_hypotheses=?, plan=?, created_at=?
         WHERE appointment_id=?`,
        [data.chief_complaint, data.history, data.physical_exam, data.diagnostic_hypotheses, data.plan, now, appointment_id]
      );
    } else {
      return DB.run(
        `INSERT INTO anamnesis (appointment_id, chief_complaint, history, physical_exam, diagnostic_hypotheses, plan, created_at)
         VALUES (?,?,?,?,?,?,?)`,
        [appointment_id, data.chief_complaint, data.history, data.physical_exam, data.diagnostic_hypotheses, data.plan, now]
      );
    }
  },
  async getByAppointment(appointment_id) {
    var rows = await DB.query(`SELECT * FROM anamnesis WHERE appointment_id = ?`, [appointment_id]);
    return rows[0] || null;
  }
};