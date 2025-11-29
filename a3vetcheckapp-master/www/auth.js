// www/js/auth.js
// bcryptjs para hash local (adicione <script src="https://cdn.jsdelivr.net/npm/bcryptjs@2.4.3/dist/bcrypt.min.js"></script> no index.html)
var Auth = (function () {
  var secureStorage;

  function initSecure() {
    return new Promise(function (resolve, reject) {
      secureStorage = new cordova.plugins.SecureStorage(
        function () { resolve(); },
        function (err) { console.warn('SecureStorage fallback:', err); resolve(); },
        'vet_agenda_secure'
      );
    });
  }

  async function register(name, email, password, role) {
    var hash = dcodeIO.bcrypt.hashSync(password, 10);
    try {
      await DB.run(
        `INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)`,
        [name, email, hash, role || 'cliente']
      );
      return true;
    } catch (e) {
      if (/UNIQUE/.test(e.message)) throw new Error('E-mail já cadastrado.');
      throw e;
    }
  }

  async function login(email, password) {
    var users = await DB.query(`SELECT * FROM users WHERE email = ?`, [email]);
    if (users.length === 0) throw new Error('Usuário não encontrado.');
    var user = users[0];
    var ok = dcodeIO.bcrypt.compareSync(password, user.password_hash);
    if (!ok) throw new Error('Senha inválida.');

    var token = 'sess_' + new Date().getTime() + '_' + user.id;
    try {
      await new Promise((resolve, reject) => {
        secureStorage.set(
          function () { resolve(); },
          function (err) { console.warn('SecureStorage set error:', err); resolve(); },
          'session_token',
          token
        );
      });
    } catch (_) {}
    window.sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role, token: token };
    return window.sessionUser;
  }

  function logout() {
    return new Promise(function (resolve) {
      try {
        secureStorage.remove(function () { resolve(); }, function () { resolve(); }, 'session_token');
      } catch (_) { resolve(); }
      window.sessionUser = null;
    });
  }

  return { initSecure, register, login, logout };
})();