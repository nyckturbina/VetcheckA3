// Pets helper: create table, add pet, list pets for current user
(function(){
  async function init(){
    const sql = `CREATE TABLE IF NOT EXISTS pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      species TEXT,
      breed TEXT,
      age INTEGER,
      weight REAL,
      owner_id INTEGER NOT NULL
    )`;
    try{ await DB.execute(sql); }catch(e){ console.warn('pets init', e); }
  }

  async function addPet(data){
    // data: {name,species,breed,age,weight,owner_id}
    const params = [data.name, data.species, data.breed, data.age||null, data.weight||null, data.owner_id];
    const res = await DB.execute(`INSERT INTO pets (name,species,breed,age,weight,owner_id) VALUES (?,?,?,?,?,?)`, params);
    return res;
  }

  async function listPetsByOwner(owner_id){
    const rows = await DB.query(`SELECT * FROM pets WHERE owner_id = ?`, [owner_id]);
    return rows;
  }

  async function listAllPets(){
    const rows = await DB.query(`SELECT * FROM pets`, []);
    return rows;
  }

  window.Pets = { init, addPet, listPetsByOwner, listAllPets };
})();
