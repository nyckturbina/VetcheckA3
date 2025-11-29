(function(){

  async function addAppointment(appt){
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        pet_id: appt.pet_id,
        vet_name: appt.vet_name,
        type: appt.type,
        date: appt.date,
        time: appt.time,
        duration: appt.duration || 20,
        status: appt.status || 'agendado',
        notes: appt.notes || '',
        owner_id: appt.owner_id
      })
      .select()
      .single();

    if(error) throw error;

    return data;
  }

  async function listAppointmentsByOwner(owner_id){
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("owner_id", owner_id)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if(error) throw error;

    return data;
  }

  async function listAllAppointments(){
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if(error) throw error;

    return data;
  }

  async function updateAppointment(id, appt){
    const { data, error } = await supabase
      .from("appointments")
      .update({
        pet_id: appt.pet_id,
        vet_name: appt.vet_name,
        type: appt.type,
        date: appt.date,
        time: appt.time,
        duration: appt.duration || 20,
        status: appt.status || 'agendado',
        notes: appt.notes || '',
        owner_id: appt.owner_id
      })
      .eq("id", id)
      .select()
      .single();

    if(error) throw error;

    return data;
  }

  window.Appointments = { addAppointment, listAppointmentsByOwner, listAllAppointments, updateAppointment };
})();
