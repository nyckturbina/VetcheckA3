// Appointments helper: create table, add appointment, list appointments for owner
(function(){
  async function init(){
    const sql = `CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id INTEGER NOT NULL,
      vet_name TEXT,
      type TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      duration INTEGER DEFAULT 20,
      status TEXT DEFAULT 'agendado',
      notes TEXT,
      owner_id INTEGER
    )`;
    try{ await DB.execute(sql); }catch(e){ console.warn('appointments init', e); }
    // add duration column if missing (silently ignore errors)
    try{ await DB.execute('ALTER TABLE appointments ADD COLUMN duration INTEGER DEFAULT 20'); }catch(e){}
  }

  async function addAppointment(appt){
    // appt: {pet_id, vet_name, type, date, time, duration, status, notes, owner_id}
    const params = [appt.pet_id, appt.vet_name, appt.type, appt.date, appt.time, appt.duration || 20, appt.status||'agendado', appt.notes||'', appt.owner_id||null];
    const res = await DB.execute(`INSERT INTO appointments (pet_id, vet_name, type, date, time, duration, status, notes, owner_id) VALUES (?,?,?,?,?,?,?,?,?)`, params);
    return res;
  }

  async function listAppointmentsByOwner(owner_id){
    const rows = await DB.query(`SELECT * FROM appointments WHERE owner_id = ? ORDER BY date, time`, [owner_id]);
    return rows;
  }

  async function listAllAppointments(){
    const rows = await DB.query(`SELECT * FROM appointments ORDER BY date, time`, []);
    return rows;
  }

  async function updateAppointment(id, appt){
    // appt: fields to update (pet_id, vet_name, type, date, time, duration, notes, status, owner_id)
    const params = [appt.pet_id, appt.vet_name, appt.type, appt.date, appt.time, appt.duration || 20, appt.status||'agendado', appt.notes||'', appt.owner_id||null, id];
    const sql = `UPDATE appointments SET pet_id=?, vet_name=?, type=?, date=?, time=?, duration=?, status=?, notes=?, owner_id=? WHERE id=?`;
    const res = await DB.execute(sql, params);
    return res;
  }

  window.Appointments = { init, addAppointment, listAppointmentsByOwner, listAllAppointments };
})();
