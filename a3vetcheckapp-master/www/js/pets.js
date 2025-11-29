// Pets helper usando Supabase
(function(){

  // Cadastrar um novo pet
  async function addPet(data){
    // data: {name, species, breed, age, weight, owner_id}
    
    const { data: result, error } = await supabase
      .from("pets")
      .insert({
        name: data.name,
        species: data.species,
        breed: data.breed,
        age: data.age || null,
        weight: data.weight || null,
        owner_id: data.owner_id
      })
      .select()
      .single();

    if(error) throw error;

    return result;
  }

  // Listar pets do dono
  async function listPetsByOwner(owner_id){
    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .eq("owner_id", owner_id);

    if(error) throw error;

    return data;
  }

  // Listar todos os pets (modo admin)
  async function listAllPets(){
    const { data, error } = await supabase
      .from("pets")
      .select("*");

    if(error) throw error;

    return data;
  }

  window.Pets = { addPet, listPetsByOwner, listAllPets };
})();
