/* Authentication helper using Web Crypto PBKDF2 and local DB
   Exports: Auth.init(), Auth.register(email,password), Auth.login(email,password), Auth.currentUser(), Auth.logout()
*/
(function(global){
  const Auth = {};

  function toHex(buffer){
    return Array.from(new Uint8Array(buffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  function fromHex(hex){
    const bytes = new Uint8Array(hex.length/2);
    for(let i=0;i<bytes.length;i++) bytes[i]=parseInt(hex.substr(i*2,2),16);
    return bytes.buffer;
  }

  function genSalt(){
    const s = window.crypto.getRandomValues(new Uint8Array(16));
    return toHex(s.buffer);
  }

  async function hashPassword(password, saltHex){
    const enc = new TextEncoder();
    const passKey = enc.encode(password);
    const salt = new Uint8Array(fromHex(saltHex));
    const keyMaterial = await window.crypto.subtle.importKey('raw', passKey, {name:'PBKDF2'}, false, ['deriveBits']);
    const derived = await window.crypto.subtle.deriveBits({name:'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256'}, keyMaterial, 256);
    return toHex(derived);
  }

  Auth.init = async function(){
    // create tables if not exists (users includes profile fields)
    const usersSql = `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      name TEXT,
      phone TEXT,
      address TEXT,
      cpf TEXT,
      role TEXT DEFAULT 'cliente'
    )`;
    await DB.execute(usersSql);
    // ensure cpf column exists for older DBs
    try{
      const cols = await DB.query("PRAGMA table_info(users)");
      const hasCpf = Array.isArray(cols) && cols.some(c => (c.name || c.COLUMN_NAME || c.field) === 'cpf');
      if(!hasCpf){
        try{ await DB.execute('ALTER TABLE users ADD COLUMN cpf TEXT'); }catch(e){ /* ignore */ }
      }
    }catch(e){ /* ignore */ }
  };

  // register(email, password?, name, phone, address) -> returns user {id,email,...}
  // If password is not provided, a strong random password is generated automatically.
  function genRandomPassword(len=12){
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    const arr = new Uint8Array(len);
    window.crypto.getRandomValues(arr);
    return Array.from(arr).map(n => charset[n % charset.length]).join('');
  }

  Auth.register = async function(email, password, name, phone, address, cpf){
    if(!email) throw new Error('Preencha e-mail');
    // if password missing, generate one
    const pwd = password && password.length ? password : genRandomPassword(14);
    
    // Try cloud registration first if available
    if(window.CloudDB && CloudDB.isActive()){
      try{
        const user = await CloudDB.signUp(email, pwd, name, phone, address, cpf);
        localStorage.setItem('vetuser', JSON.stringify(user));
        return user;
      }catch(err){
        console.warn('Cloud registration failed, falling back to local DB', err.message);
        // fall through to local DB
      }
    }
    
    // Fallback to local DB
    const salt = genSalt();
    const hash = await hashPassword(pwd, salt);
    try{
      const res = await DB.execute(`INSERT INTO users (email, password_hash, salt, name, phone, address, cpf, role) VALUES (?,?,?,?,?,?,?,?)`, [email, hash, salt, name||null, phone||null, address||null, cpf||null, 'cliente']);
      // try to obtain inserted id; if not present, query by email to retrieve full row
      let id = res && (res.insertId || (res.rows && res.rows.insertId)) ? (res.insertId || res.rows.insertId) : null;
      if (!id) {
        const rows = await DB.query(`SELECT * FROM users WHERE email = ?`, [email]);
        if (rows && rows.length) id = rows[0].id;
      }
      const user = {id: id, email: email, name: name||null, phone: phone||null, address: address||null, cpf: cpf||null, role: 'cliente'};
      localStorage.setItem('vetuser', JSON.stringify(user));
      return user;
    }catch(err){
      if (/UNIQUE/i.test(err.message)) throw new Error('E-mail já cadastrado');
      throw err;
    }
  };

  Auth.login = async function(email, password){
    if(!email || !password) throw new Error('Preencha e-mail e senha');
    
    // Try cloud login first if available
    if(window.CloudDB && CloudDB.isActive()){
      try{
        const user = await CloudDB.signIn(email, password);
        localStorage.setItem('vetuser', JSON.stringify(user));
        return user;
      }catch(err){
        console.warn('Cloud login failed, falling back to local DB', err.message);
        // fall through to local DB
      }
    }
    
    // Fallback to local DB
    const rows = await DB.query(`SELECT * FROM users WHERE email = ?`, [email]);
    if(rows.length===0) throw new Error('Usuário não encontrado');
    const user = rows[0];
    const hash = await hashPassword(password, user.salt);
    if(hash !== user.password_hash) throw new Error('Senha inválida');
    // store full profile in localStorage so name/phone/address/cpf are available
    const profile = {id: user.id, email: user.email, name: user.name || null, phone: user.phone || null, address: user.address || null, cpf: user.cpf || null, role: user.role || 'cliente'};
    localStorage.setItem('vetuser', JSON.stringify(profile));
    return profile;
  };

  Auth.currentUser = function(){
    const s = localStorage.getItem('vetuser');
    return s ? JSON.parse(s) : null;
  };

  Auth.logout = function(){
    // Sign out from cloud if available
    if(window.CloudDB && CloudDB.isActive()){
      try{ CloudDB.signOut().catch(e => console.warn('Cloud signout failed', e)); }catch(e){}
    }
    localStorage.removeItem('vetuser');
  };

  Auth.updateProfile = async function(id, name, phone, address, cpf, email){
    if(!id) throw new Error('No user id');
    
    // Try cloud update first if available
    if(window.CloudDB && CloudDB.isActive()){
      try{
        await CloudDB.updateUser(id, name, phone, address, cpf, email);
        // refresh localStorage
        const user = Auth.currentUser() || {};
        const updated = {...user, name: name||user.name, phone: phone||user.phone, address: address||user.address, cpf: cpf||user.cpf, email: email||user.email};
        localStorage.setItem('vetuser', JSON.stringify(updated));
        return updated;
      }catch(err){
        console.warn('Cloud profile update failed, falling back to local DB', err.message);
        // fall through to local DB
      }
    }
    
    // Fallback to local DB
    try{
      if(email){
        await DB.execute(`UPDATE users SET email = ?, name = ?, phone = ?, address = ?, cpf = ? WHERE id = ?`, [email, name||null, phone||null, address||null, cpf||null, id]);
      } else {
        await DB.execute(`UPDATE users SET name = ?, phone = ?, address = ?, cpf = ? WHERE id = ?`, [name||null, phone||null, address||null, cpf||null, id]);
      }
    }catch(e){
      // convert unique constraint to friendly message
      if(/UNIQUE/i.test(String(e.message)) || /constraint/i.test(String(e.message))){
        throw new Error('E-mail já cadastrado por outro usuário');
      }
      throw e;
    }
    const rows = await DB.query(`SELECT * FROM users WHERE id = ?`, [id]);
    if(rows && rows.length){
      const u = rows[0];
      const profile = {id: u.id, email: u.email, name: u.name||null, phone: u.phone||null, address: u.address||null, cpf: u.cpf||null, role: u.role||'cliente'};
      localStorage.setItem('vetuser', JSON.stringify(profile));
      return profile;
    }
    return null;
  };

  global.Auth = Auth;
})(window);
