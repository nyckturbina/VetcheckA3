// Minimal anamnesis helper placeholder
(function(){
  async function init(){
    const sql = `CREATE TABLE IF NOT EXISTS anamnesis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER,
      owner_id INTEGER,
      chief_complaint TEXT,
      history TEXT,
      physical_exam TEXT,
      diagnostic_hypotheses TEXT,
      plan TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`;
    try{ await DB.execute(sql); }catch(e){ console.warn('anamnesis init', e); }
  }

  async function addOrUpdateForAppointment(appointmentId, ownerId, data){
    // try find existing
    try{
      const rows = await DB.query('SELECT id FROM anamnesis WHERE appointment_id = ? LIMIT 1', [appointmentId]);
      if(rows && rows.length>0){
        const id = rows[0].id;
        const params = [data.chief_complaint||'', data.history||'', data.physical_exam||'', data.diagnostic_hypotheses||'', data.plan||'', id];
        await DB.execute('UPDATE anamnesis SET chief_complaint=?, history=?, physical_exam=?, diagnostic_hypotheses=?, plan=? WHERE id=?', params);
        return { updated: true, id };
      } else {
        const params = [appointmentId, ownerId||null, data.chief_complaint||'', data.history||'', data.physical_exam||'', data.diagnostic_hypotheses||'', data.plan||''];
        const res = await DB.execute('INSERT INTO anamnesis (appointment_id, owner_id, chief_complaint, history, physical_exam, diagnostic_hypotheses, plan) VALUES (?,?,?,?,?,?,?)', params);
        return res;
      }
    }catch(e){ console.error('anamnesis save failed', e); throw e; }
  }

  async function getByAppointment(appointmentId){
    try{ const rows = await DB.query('SELECT * FROM anamnesis WHERE appointment_id = ? LIMIT 1', [appointmentId]); return rows && rows.length? rows[0] : null; }catch(e){ return null; }
  }

  window.Anamnesis = { init, addOrUpdateForAppointment, getByAppointment };
})();
