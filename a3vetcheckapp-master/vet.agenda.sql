-- Usuários
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  address TEXT,
  cpf TEXT,
  role TEXT DEFAULT 'cliente'
);

-- Pets
CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    species TEXT,
    breed TEXT,
    age INTEGER,
    weight REAL,
    owner_id INTEGER NOT NULL,
    FOREIGN KEY(owner_id) REFERENCES users(id)
);

-- Consultas
CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    vet_name TEXT,
    type TEXT,
    date TEXT NOT NULL,        -- formato ISO (YYYY-MM-DD)
    time TEXT NOT NULL,        -- HH:mm
    status TEXT DEFAULT 'agendado',
    notes TEXT,
    FOREIGN KEY(pet_id) REFERENCES pets(id)
);

-- Anamnese
CREATE TABLE IF NOT EXISTS anamnesis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    chief_complaint TEXT,
    history TEXT,
    physical_exam TEXT,
    diagnostic_hypotheses TEXT,
    plan TEXT,
    created_at TEXT,
    FOREIGN KEY(appointment_id) REFERENCES appointments(id)
);

async function register(email, password) {
  if (!email || !password) throw new Error('Preencha e-mail e senha');
  let hash = dcodeIO.bcrypt.hashSync(password, 10);
  await DB.run(
    `INSERT INTO users (email, password_hash, role) VALUES (?,?,?)`,
    [email, hash, 'cliente']
  );
  app.dialog.alert('Usuário registrado com sucesso!');
}

async function login(email, password) {
  let users = await DB.query(`SELECT * FROM users WHERE email = ?`, [email]);
  if (users.length === 0) throw new Error('Usuário não encontrado.');
  let user = users[0];
  let ok = dcodeIO.bcrypt.compareSync(password, user.password_hash);
  if (!ok) throw new Error('Senha inválida.');

  // Se login der certo, redireciona para agendamento
  mainView.router.navigate('/appointments/');
}