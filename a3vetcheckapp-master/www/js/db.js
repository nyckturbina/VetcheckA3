/* DB wrapper: use Cordova sqlite plugin if available, otherwise WebSQL (openDatabase)
   Provides simple run/query helpers returning Promises.
*/
(function(global){
  const DB = {};
  let db = null;

  function open() {
    if (db) return Promise.resolve(db);
    return new Promise((resolve, reject) => {
      if (window.sqlitePlugin && window.sqlitePlugin.openDatabase) {
        try {
          db = window.sqlitePlugin.openDatabase({name: 'vetcheck.db', location: 'default'});
          resolve(db);
        } catch (err) { reject(err) }
      } else if (window.openDatabase) {
        try {
          db = window.openDatabase('vetcheck', '1.0', 'VetCheck DB', 5 * 1024 * 1024);
          resolve(db);
        } catch (err) { reject(err) }
      } else if (window.indexedDB) {
        // Fallback to IndexedDB - attempt to ensure object stores exist; if missing, reopen with bumped version
        const requiredStores = ['users','pets','appointments','anamnesis'];
        const openIdb = (ver) => {
          if (typeof ver === 'number') return window.indexedDB.open('vetcheck', ver);
          return window.indexedDB.open('vetcheck');
        };

        // open without forcing a version so we don't request a lower version than existing
        const initialReq = openIdb();
        initialReq.onupgradeneeded = function(event){
          const idb = event.target.result;
          if (!idb.objectStoreNames.contains('users')){
            const store = idb.createObjectStore('users', {keyPath: 'id', autoIncrement: true});
            store.createIndex('email', 'email', {unique: true});
          }
          if (!idb.objectStoreNames.contains('pets')){
            const s2 = idb.createObjectStore('pets', {keyPath: 'id', autoIncrement: true});
            s2.createIndex('owner_id','owner_id', {unique: false});
          }
          if (!idb.objectStoreNames.contains('appointments')){
            const s3 = idb.createObjectStore('appointments', {keyPath: 'id', autoIncrement: true});
            s3.createIndex('owner_id','owner_id', {unique:false});
            s3.createIndex('pet_id','pet_id', {unique:false});
          }
          if (!idb.objectStoreNames.contains('anamnesis')){
            idb.createObjectStore('anamnesis', {keyPath: 'id', autoIncrement: true});
          }
        };
        initialReq.onsuccess = function(ev){
          const raw = ev.target.result;
          const missing = requiredStores.filter(s => !raw.objectStoreNames.contains(s));
          if (missing.length === 0){
            db = {type: 'indexeddb', raw: raw};
            resolve(db);
            return;
          }
          // need to upgrade DB to create missing stores
          try { raw.close(); } catch(e){}
          const newVer = (raw.version || 1) + 1;
          const req2 = openIdb(newVer);
          req2.onupgradeneeded = function(event){
            const idb = event.target.result;
            if (!idb.objectStoreNames.contains('users')){
              const store = idb.createObjectStore('users', {keyPath: 'id', autoIncrement: true});
              store.createIndex('email', 'email', {unique: true});
            }
            if (!idb.objectStoreNames.contains('pets')){
              const s2 = idb.createObjectStore('pets', {keyPath: 'id', autoIncrement: true});
              s2.createIndex('owner_id','owner_id', {unique: false});
            }
            if (!idb.objectStoreNames.contains('appointments')){
              const s3 = idb.createObjectStore('appointments', {keyPath: 'id', autoIncrement: true});
              s3.createIndex('owner_id','owner_id', {unique:false});
              s3.createIndex('pet_id','pet_id', {unique:false});
            }
            if (!idb.objectStoreNames.contains('anamnesis')){
              idb.createObjectStore('anamnesis', {keyPath: 'id', autoIncrement: true});
            }
          };
          req2.onsuccess = function(ev2){ db = {type: 'indexeddb', raw: ev2.target.result}; resolve(db); };
          req2.onerror = function(ev2){ reject(ev2.target.error || new Error('IndexedDB upgrade error')); };
        };
        initialReq.onerror = function(ev){ reject(ev.target.error || new Error('IndexedDB open error')) };
      } else {
        reject(new Error('No supported database API available'));
      }
    });
  }

  DB.execute = function(sql, params) {
    return open().then(dbObj => {
      // if using indexedDB fallback
      if (dbObj && dbObj.type === 'indexeddb') {
        const idb = dbObj.raw;
        // handle only minimal SQL patterns used by app
        const rawSql = sql.trim();
        const s = rawSql.toUpperCase();
        return new Promise((resolve, reject) => {
          if (s.startsWith('CREATE TABLE')) {
            // already created at open time
            resolve({});
            return;
          }
          if (s.startsWith('INSERT INTO USERS')) {
            const tx = idb.transaction(['users'], 'readwrite');
            const store = tx.objectStore('users');
            const obj = { email: params[0], password_hash: params[1], salt: params[2], role: params[3] };
            const req = store.add(obj);
            req.onsuccess = function(ev){ resolve({insertId: ev.target.result}); };
            req.onerror = function(ev){ reject(ev.target.error || new Error('IndexedDB insert error')); };
            return;
          }
          if (s.startsWith('INSERT INTO PETS')){
            const tx = idb.transaction(['pets'],'readwrite');
            const store = tx.objectStore('pets');
            // expected params: name, species, breed, age, weight, owner_id
            const obj = {name: params[0], species: params[1], breed: params[2], age: params[3], weight: params[4], owner_id: params[5]};
            const req = store.add(obj);
            req.onsuccess = function(ev){ resolve({insertId: ev.target.result}); };
            req.onerror = function(ev){ reject(ev.target.error||new Error('IndexedDB insert pets error')); };
            return;
          }
          if (s.startsWith('INSERT INTO APPOINTMENTS')){
            const tx = idb.transaction(['appointments'],'readwrite');
            const store = tx.objectStore('appointments');
            // expected params: pet_id, vet_name, type, date, time, status, notes, owner_id(optional)
            const obj = {pet_id: params[0], vet_name: params[1], type: params[2], date: params[3], time: params[4], status: params[5] || 'agendado', notes: params[6] || '', owner_id: params[7] || null};
            const req = store.add(obj);
            req.onsuccess = function(ev){ resolve({insertId: ev.target.result}); };
            req.onerror = function(ev){ reject(ev.target.error||new Error('IndexedDB insert appt error')); };
            return;
          }
          if (s.startsWith('INSERT INTO ANAMNESIS')){
            const tx = idb.transaction(['anamnesis'],'readwrite');
            const store = tx.objectStore('anamnesis');
            // params: appointment_id, owner_id, chief_complaint, history, physical_exam, diagnostic_hypotheses, plan
            const obj = { appointment_id: params[0], owner_id: params[1], chief_complaint: params[2], history: params[3], physical_exam: params[4], diagnostic_hypotheses: params[5], plan: params[6] };
            const req = store.add(obj);
            req.onsuccess = function(ev){ resolve({insertId: ev.target.result}); };
            req.onerror = function(ev){ reject(ev.target.error||new Error('IndexedDB insert anamnesis error')); };
            return;
          }
          if (s.startsWith('UPDATE ANAMNESIS')){
            // expected params: chief_complaint, history, physical_exam, diagnostic_hypotheses, plan, id
            const tx = idb.transaction(['anamnesis'],'readwrite');
            const store = tx.objectStore('anamnesis');
            const id = params[5];
            const getReq = store.get(Number(id));
            getReq.onsuccess = function(ev){
              const rec = ev.target.result || {};
              rec.chief_complaint = params[0];
              rec.history = params[1];
              rec.physical_exam = params[2];
              rec.diagnostic_hypotheses = params[3];
              rec.plan = params[4];
              const putReq = store.put(rec);
              putReq.onsuccess = function(pe){ resolve({rowsAffected:1}); };
              putReq.onerror = function(pe){ reject(pe.target.error||new Error('IndexedDB anamnesis update error')); };
            };
            getReq.onerror = function(ev){ reject(ev.target.error||new Error('IndexedDB anamnesis get for update error')); };
            return;
          }
          if (s.startsWith('SELECT') && s.indexOf('FROM USERS')!==-1) {
            // support WHERE email = ?
            const tx = idb.transaction(['users'], 'readonly');
            const store = tx.objectStore('users');
            if (s.indexOf('WHERE EMAIL =')!==-1) {
              const email = params[0];
              const idx = store.index('email');
              const req = idx.getAll(email);
              req.onsuccess = function(ev){
                const rows = ev.target.result || [];
                // mimic WebSQL result
                resolve({rows: {length: rows.length, item: i => rows[i]}});
              };
              req.onerror = function(ev){ reject(ev.target.error || new Error('IndexedDB query error')) };
              return;
            }
            // fallback: return all
            const reqAll = store.getAll();
            reqAll.onsuccess = function(ev){ const rows = ev.target.result||[]; resolve({rows:{length:rows.length, item:i=>rows[i]}}); };
            reqAll.onerror = function(ev){ reject(ev.target.error||new Error('IndexedDB getAll error')) };
            return;
          }
          if (s.indexOf('FROM PETS')!==-1){
            const tx = idb.transaction(['pets'],'readonly');
            const store = tx.objectStore('pets');
            if (s.indexOf('WHERE OWNER_ID')!==-1){
              const owner = params[0];
              const idx = store.index('owner_id');
              const req = idx.getAll(owner);
              req.onsuccess = function(ev){ const rows = ev.target.result||[]; resolve({rows:{length:rows.length, item:i=>rows[i]}}); };
              req.onerror = function(ev){ reject(ev.target.error||new Error('IndexedDB pets query error')); };
              return;
            }
            const reqAll = store.getAll(); reqAll.onsuccess=function(ev){const rows=ev.target.result||[];resolve({rows:{length:rows.length,item:i=>rows[i]}})}; reqAll.onerror=function(ev){reject(ev.target.error||new Error('IndexedDB pets getAll err'))};
            return;
          }
          if (s.indexOf('FROM APPOINTMENTS')!==-1){
            const tx = idb.transaction(['appointments'],'readonly');
            const store = tx.objectStore('appointments');
            if (s.indexOf('WHERE OWNER_ID')!==-1){
              const owner = params[0];
              const idx = store.index('owner_id');
              const req = idx.getAll(owner);
              req.onsuccess=function(ev){const rows=ev.target.result||[];resolve({rows:{length:rows.length,item:i=>rows[i]}})};
              req.onerror=function(ev){reject(ev.target.error||new Error('IndexedDB appts query err'))};
              return;
            }
            if (s.indexOf('WHERE PET_ID')!==-1){
              const pet = params[0];
              const idx = store.index('pet_id');
              const req = idx.getAll(pet);
              req.onsuccess=function(ev){const rows=ev.target.result||[];resolve({rows:{length:rows.length,item:i=>rows[i]}})};
              req.onerror=function(ev){reject(ev.target.error||new Error('IndexedDB appts by pet err'))};
              return;
            }
            const reqAll = store.getAll(); reqAll.onsuccess=function(ev){const rows=ev.target.result||[];resolve({rows:{length:rows.length,item:i=>rows[i]}})}; reqAll.onerror=function(ev){reject(ev.target.error||new Error('IndexedDB appts getAll err'))};
            return;
          }
          if (s.indexOf('FROM ANAMNESIS')!==-1){
            const tx = idb.transaction(['anamnesis'],'readonly');
            const store = tx.objectStore('anamnesis');
            if (s.indexOf('WHERE APPOINTMENT_ID')!==-1){
              const appt = params[0];
              // since we didn't create index on appointment_id, use getAll and filter
              const reqAll = store.getAll();
              reqAll.onsuccess = function(ev){ const rows = (ev.target.result||[]).filter(r => String(r.appointment_id) === String(appt)); resolve({rows:{length:rows.length,item:i=>rows[i]}}); };
              reqAll.onerror = function(ev){ reject(ev.target.error||new Error('IndexedDB anamnesis query error')); };
              return;
            }
            const reqAll2 = store.getAll(); reqAll2.onsuccess=function(ev){const rows=ev.target.result||[];resolve({rows:{length:rows.length,item:i=>rows[i]}})}; reqAll2.onerror=function(ev){reject(ev.target.error||new Error('IndexedDB anamnesis getAll err'))};
            return;
          }
          // handle generic UPDATE <table> SET col1 = ?, col2 = ? ... WHERE id = ?
          if (s.startsWith('UPDATE ')){
            const m = rawSql.match(/UPDATE\s+([^\s]+)\s+SET\s+(.+?)\s+WHERE\s+ID\s*=\s*\?/i);
            if (m){
              try{
                const table = m[1].replace(/[\"'`]/g,'').toLowerCase();
                const setPart = m[2];
                const cols = setPart.split(',').map(p => p.split('=')[0].trim().replace(/[\"'`]/g,''));
                const id = params[cols.length];
                console.info('IndexedDB fallback: UPDATE', table, 'cols=', cols, 'id=', id);
                const tx = idb.transaction([table],'readwrite');
                const store = tx.objectStore(table);
                const getReq = store.get(Number(id));
                getReq.onsuccess = function(ev){
                  const rec = ev.target.result || {};
                  cols.forEach((c, i) => { rec[c] = params[i]; });
                  const putReq = store.put(rec);
                  putReq.onsuccess = function(){ resolve({rowsAffected:1}); };
                  putReq.onerror = function(pe){ reject(pe.target.error || new Error('IndexedDB update put error')); };
                };
                getReq.onerror = function(ev){ reject(ev.target.error || new Error('IndexedDB get for update error')); };
                return;
              } catch (ex) { reject(ex); return; }
            }
          }

          // unsupported SQL pattern
          reject(new Error('Unsupported SQL on IndexedDB fallback: '+sql));
        });
      }

      return new Promise((resolve, reject) => {
        // sqlitePlugin's executeSql interface is similar to WebSQL tx.executeSql
        if (dbObj.transaction) {
          dbObj.transaction(tx => {
            tx.executeSql(sql, params || [], (tx, res) => resolve(res), (tx, err) => reject(err));
          }, err => reject(err));
        } else if (dbObj.executeSql) {
          dbObj.executeSql(sql, params || [], res => resolve(res), err => reject(err));
        } else {
          reject(new Error('Unsupported DB object'));
        }
      });
    });
  };

  DB.query = function(sql, params) {
    return DB.execute(sql, params).then(res => {
      const rows = [];
      if (res && res.rows) {
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
      }
      return rows;
    });
  };

  // convenience: run many statements in a single transaction for WebSQL
  DB.transaction = function(callback) {
    return open().then(db => new Promise((resolve, reject) => {
      if (db.transaction) {
        db.transaction(tx => {
          callback(tx);
        }, err => reject(err), () => resolve());
      } else if (db.executeSql) {
        // sqlitePlugin may not expose transaction; execute statements directly
        try { callback({executeSql: db.executeSql.bind(db)}); resolve(); } catch(e){reject(e)}
      } else reject(new Error('Unsupported DB object'));
    }));
  };

  global.DB = DB;
})(window);
