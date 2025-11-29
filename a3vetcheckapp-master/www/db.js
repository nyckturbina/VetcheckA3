// www/js/db.js
var DB = (function () {
  var db;
  var db = window.sqlitePlugin.openDatabase({
  name: 'vet_agenda.db',
  location: 'default',
  createFromLocation: 1 // usa o banco pronto
});

  function open() {
    return new Promise(function (resolve, reject) {
      document.addEventListener('deviceready', function () {
        db = window.sqlitePlugin.openDatabase({ name: 'vet_agenda.db', location: 'default' });
        resolve(db);
      }, false);
    });
  }

  function init() {
    return executeBatch([
      `CREATE TABLE IF NOT EXISTS users (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         name TEXT NOT NULL,
         email TEXT UNIQUE NOT NULL,
         password_hash TEXT NOT NULL,
         role TEXT CHECK(role IN ('cliente','admin')) NOT NULL DEFAULT 'cliente'
       );`,
      `CREATE TABLE IF NOT EXISTS pets (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         name TEXT NOT NULL,
         species TEXT,
         breed TEXT,
         age INTEGER,
         weight REAL,
         owner_id INTEGER NOT NULL,
         FOREIGN KEY(owner_id) REFERENCES users(id)
       );`,
      `CREATE TABLE IF NOT EXISTS appointments (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         pet_id INTEGER NOT NULL,
         vet_name TEXT,
         type TEXT,
         date TEXT NOT NULL,        -- ISO string (YYYY-MM-DD)
         time TEXT NOT NULL,        -- HH:mm
         status TEXT DEFAULT 'agendado',
         notes TEXT,
         FOREIGN KEY(pet_id) REFERENCES pets(id)
       );`,
      `CREATE TABLE IF NOT EXISTS anamnesis (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         appointment_id INTEGER NOT NULL,
         chief_complaint TEXT,
         history TEXT,
         physical_exam TEXT,
         diagnostic_hypotheses TEXT,
         plan TEXT,
         created_at TEXT,
         FOREIGN KEY(appointment_id) REFERENCES appointments(id)
       );`
    ]);
  }

  function executeBatch(sqlArray) {
    return new Promise(function (resolve, reject) {
      db.sqlBatch(sqlArray, resolve, reject);
    });
  }

  function query(sql, params) {
    return new Promise(function (resolve, reject) {
      db.executeSql(sql, params || [], function (res) {
        var rows = [];
        for (var i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
        resolve(rows);
      }, reject);
    });
  }

  function run(sql, params) {
    return new Promise(function (resolve, reject) {
      db.executeSql(sql, params || [], function (res) {
        resolve({ rowsAffected: res.rowsAffected, insertId: res.insertId });
      }, reject);
    });
  }

  return { open, init, query, run };
})();