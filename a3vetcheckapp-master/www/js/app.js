document.addEventListener('DOMContentLoaded', async function(){
  // initialize DB and modules
  try{ await Auth.init(); }catch(e){ console.warn('Auth init', e); }
  try{ await Pets.init(); }catch(e){ console.warn('Pets init', e);} 
  try{ await Appointments.init(); }catch(e){ console.warn('Appts init', e); }
  try{ await Anamnesis.init(); }catch(e){ console.warn('Anamnesis init', e); }

  const loginView = document.getElementById('loginView');
  const clientView = document.getElementById('clientView');
  const dashboardView = document.getElementById('dashboardView');
  const authMsg = document.getElementById('authMsg');

  function showView(view){
    const fromView = loginView || clientView;
    if(view==='dashboard'){
      try{ if(fromView) fromView.classList.add('hidden'); }catch(e){}
      try{
        if(dashboardView){
          dashboardView.classList.remove('hidden');
          // ensure it's not display:none from other code
          dashboardView.style.display = '';
          // if there's saved local user data, prefill the fields so user sees values
          try{
            const saved = window.localStorage && window.localStorage.vetuser ? JSON.parse(window.localStorage.vetuser) : null;
            if(saved){ try{ if(document.getElementById('regName')) document.getElementById('regName').value = saved.name || ''; }catch(e){}
              try{ if(document.getElementById('regEmail')) document.getElementById('regEmail').value = saved.email || ''; }catch(e){}
              try{ if(document.getElementById('regPhone')) document.getElementById('regPhone').value = saved.phone || ''; }catch(e){}
              try{ if(document.getElementById('regCpf')) document.getElementById('regCpf').value = saved.cpf || ''; }catch(e){}
              try{ if(document.getElementById('regAddress')) document.getElementById('regAddress').value = saved.address || ''; }catch(e){}
            }
          }catch(e){/* ignore parse errors */}
          // scroll into view so the user sees the inputs immediately
          try{ setTimeout(()=>{ dashboardView.scrollIntoView({behavior:'smooth', block:'start'}); const f = document.getElementById('regName'); if(f && typeof f.focus==='function') f.focus(); }, 120); }catch(e){}
        }
      }catch(e){}
    } else {
      try{ if(dashboardView) dashboardView.classList.add('hidden'); }catch(e){}
      try{ if(fromView) fromView.classList.remove('hidden'); }catch(e){}
    }
  }

  // CPF validator: returns true for valid CPF (11 digits, proper check digits)
  function isValidCPF(cpf){
    if(!cpf) return false;
    const s = String(cpf).replace(/[^0-9]/g,'');
    if(s.length !== 11) return false;
    // reject same digit sequences
    if(/^([0-9])\1{10}$/.test(s)) return false;
    const digits = s.split('').map(d=>parseInt(d,10));
    // first check digit
    let sum = 0; for(let i=0;i<9;i++) sum += digits[i] * (10 - i);
    let rev = 11 - (sum % 11); if(rev >= 10) rev = 0; if(rev !== digits[9]) return false;
    // second check digit
    sum = 0; for(let i=0;i<10;i++) sum += digits[i] * (11 - i);
    rev = 11 - (sum % 11); if(rev >= 10) rev = 0; if(rev !== digits[10]) return false;
    return true;
  }

  // format CPF as 000.000.000-00
  function formatCPF(v){
    if(!v) return '';
    const s = String(v).replace(/\D/g,'').slice(0,11);
    const part1 = s.slice(0,3);
    const part2 = s.slice(3,6);
    const part3 = s.slice(6,9);
    const part4 = s.slice(9,11);
    let out = part1;
    if(part2) out += '.'+part2;
    if(part3) out += '.'+part3;
    if(part4) out += '-'+part4;
    return out;
  }

  function setCPFError(msg){
    const el = document.getElementById('regCpf');
    const err = document.getElementById('cpfError');
    if(el){ if(msg) el.classList.add('input-error'); else el.classList.remove('input-error'); }
    if(err) err.textContent = msg || '';
  }

  // Helper: append full anamnesis fields to a parent element
  function appendAnamnesisDetails(parentEl, anam){
    if(!parentEl || !anam) return;
    try{
      const container = document.createElement('div'); container.className = 'anam-full';
      const fields = [
        ['Queixa principal', 'chief_complaint'],
        ['Histórico', 'history'],
        ['Exame físico', 'physical_exam'],
        ['Hipóteses diagnósticas', 'diagnostic_hypotheses'],
        ['Plano', 'plan']
      ];
      fields.forEach(([label, key])=>{
        const val = anam[key];
        if(val && String(val).trim()){
          const row = document.createElement('div'); row.className = 'anam-field';
          const lab = document.createElement('div'); lab.className = 'anam-label'; lab.textContent = label;
          const valEl = document.createElement('div'); valEl.className = 'anam-value'; valEl.textContent = val;
          row.appendChild(lab); row.appendChild(valEl); container.appendChild(row);
        }
      });
      if(container.children.length) parentEl.appendChild(container);
    }catch(e){ console.warn('appendAnamnesisDetails failed', e); }
  }

  // Helper: append full client fields to a parent element
  function appendClientDetails(parentEl, client){
    if(!parentEl || !client) return;
    try{
      const container = document.createElement('div'); container.className = 'client-full';
      const fields = [
        ['Nome', 'name'],
        ['E-mail', 'email'],
        ['Telefone', 'phone'],
        ['CPF', 'cpf'],
        ['Endereço', 'address']
      ];
      fields.forEach(([label, key])=>{
        const val = client[key];
        if(val && String(val).trim()){
          const row = document.createElement('div'); row.className = 'client-field';
          const lab = document.createElement('div'); lab.className = 'client-label'; lab.textContent = label;
          const valEl = document.createElement('div'); valEl.className = 'client-value'; valEl.textContent = val;
          row.appendChild(lab); row.appendChild(valEl); container.appendChild(row);
        }
      });
      if(container.children.length) parentEl.appendChild(container);
    }catch(e){ console.warn('appendClientDetails failed', e); }
  }

  function attachCPFHandlers(){
    const el = document.getElementById('regCpf');
    if(!el) return;
    el.addEventListener('input', function(e){
      const pos = el.selectionStart;
      const raw = el.value;
      const formatted = formatCPF(raw);
      el.value = formatted;
      // only validate when length == 14 (formatted) i.e. 11 digits
      const digits = formatted.replace(/\D/g,'');
      if(digits.length === 11){ if(!isValidCPF(formatted)) setCPFError('CPF inválido'); else setCPFError(''); } else { setCPFError(''); }
    });
    el.addEventListener('blur', function(){ const digits = el.value.replace(/\D/g,''); if(digits && digits.length===11 && !isValidCPF(el.value)) { setCPFError('CPF inválido'); } });
  }
  
  // Refresh agenda for today: show time, pet name and veterinarian for the clinic (all appointments)
  async function refreshTodayAgenda(dateParam){
    const rows = await Appointments.listAllAppointments();
    const pets = await Pets.listAllPets();
    // map pet id -> pet
    const petMap = {};
    pets.forEach(p=>{ petMap[p.id] = p; });
    // map users id -> full client object
    let users = [];
    try{ users = await DB.query('SELECT * FROM users', []); }catch(e){ users = []; }
    const userMap = {};
    users.forEach(u=>{ userMap[u.id] = u; });

    const container = document.getElementById('todayAgenda'); if(!container) return;
    container.innerHTML = '';
    
    // Use provided date or today
    const selectedDate = dateParam || new Date();
    selectedDate.setHours(0, 0, 0, 0); // Normalize to start of day
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth()+1).padStart(2,'0');
    const dd = String(selectedDate.getDate()).padStart(2,'0');
    const dateIso = `${yyyy}-${mm}-${dd}`;
    
    // Add header with selected date
    const headerDiv = document.createElement('div');
    headerDiv.style.marginBottom = '12px';
    const weekday = selectedDate.toLocaleDateString(undefined, { weekday:'short' }).toLowerCase();
    const dayOfMonth = selectedDate.toLocaleDateString(undefined, { day:'2-digit', month:'short' });
    headerDiv.innerHTML = `<div style="font-size:12px;color:#6b7280;text-transform:lowercase">${weekday}.</div><div style="font-size:16px;font-weight:700">${dayOfMonth}</div>`;
    container.appendChild(headerDiv);
    
    // Filter appointments for the selected date (handle date comparison more robustly)
    const appointments = (rows||[]).filter(r => {
      if(!r.date) return false;
      const apptDateStr = String(r.date).trim().substring(0, 10); // Extract first 10 chars (YYYY-MM-DD)
      return apptDateStr === dateIso;
    });
    
    if(appointments.length===0){
      const li = document.createElement('li'); li.textContent = 'Nenhuma consulta neste dia.'; li.style.opacity = 0.8; container.appendChild(li); return;
    }
    // sort by time
    appointments.sort((a,b)=> (a.time||'').localeCompare(b.time||''));
    // find next upcoming appointment (for selected date, >= now if it's today)
    const now = new Date();
    let nextApptId = null;
    const nowIso = `${String(now.getFullYear()).padStart(4,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const isToday = dateIso === nowIso;
    const future = appointments.filter(r => !isToday || new Date((r.date||'') + 'T' + (r.time||'00:00')) >= now);
    if(future.length){ future.sort((a,b)=> new Date((a.date||'') + 'T' + (a.time||'00:00')) - new Date((b.date||'') + 'T' + (b.time||'00:00'))); nextApptId = future[0].id; }
    // fetch anamnesis for all appointments in parallel (if any)
    const anamnesisList = await Promise.all(appointments.map(a=> Anamnesis.getByAppointment(a.id).catch(()=>null)));
    appointments.forEach((r, idx)=>{
      const li = document.createElement('li');
      const pet = petMap[r.pet_id] || null;
      const owner = pet ? userMap[pet.owner_id] : null;
      const petName = pet ? (pet.name || ('Pet '+pet.id)) : ('Pet '+(r.pet_id||''));
      const ownerName = owner ? (owner.name || '') : '';
      const time = r.time || '';
      const vet = r.vet_name || '—';
      // main line: time — pet (owner) • type • vet
      let mainLine = `<strong>${time}</strong> — ${petName}` + (ownerName? ` <em style=\"color:#6b7280\">(${ownerName})</em>`:'') + (r.type ? ` <span style=\"color:#6b7280\">• ${r.type}</span>` : '') + ` <span style=\"color:#6b7280\">• ${vet}</span>`;
      li.innerHTML = mainLine;
      // highlight if this is the next appointment
      try{ if(nextApptId != null && String(r.id) === String(nextApptId)) li.classList.add('next-appt'); }catch(e){}
      // attach full client fields if present
      try{ if(owner){ appendClientDetails(li, owner); li.classList.add('has-client'); } }catch(e){}
      // attach full anamnesis fields if present
      try{
        const anam = anamnesisList[idx];
        if(anam){ appendAnamnesisDetails(li, anam); li.classList.add('has-anamnesis'); }
      }catch(e){}
      container.appendChild(li);
    });
  }

  // --- Weekly grid rendering (clinic-wide) ---
  let currentWeekStart = null; // Date object (Sunday)
  let currentSelectedDay = new Date(); // Track the currently selected day

  function startOfWeek(dt){
    const d = new Date(dt);
    const day = d.getDay(); // 0 Sun
    d.setDate(d.getDate() - day);
    d.setHours(0,0,0,0);
    return d;
  }

  function formatDayHeader(d){
    const opts = { weekday:'short', day:'2-digit', month:'short' };
    return d.toLocaleDateString(undefined, opts);
  }

  // Mini calendar state
  let miniCalendarDate = new Date();

  async function renderMiniCalendar(){
    const mcMonthYear = document.getElementById('mcMonthYear');
    const mcGrid = document.getElementById('mcGrid');
    if(!mcMonthYear || !mcGrid) return;

    const year = miniCalendarDate.getFullYear();
    const month = miniCalendarDate.getMonth();
    
    // Update header
    const monthName = miniCalendarDate.toLocaleDateString(undefined, { month:'long', year:'numeric' }).toUpperCase();
    mcMonthYear.textContent = monthName;

    // Get all appointments for marking
    const rows = await Appointments.listAllAppointments();
    const apptDates = new Set();
    rows.forEach(r=>{
      if(r.date) apptDates.add(r.date);
    });

    // Build calendar grid
    mcGrid.innerHTML = '';
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    for(let i=0; i<42; i++){
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      
      const dayDiv = document.createElement('div');
      dayDiv.className = 'mc-day';
      dayDiv.textContent = d.getDate();
      
      // Check if it's today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dCompare = new Date(d);
      dCompare.setHours(0, 0, 0, 0);
      if(dCompare.getTime() === today.getTime()){
        dayDiv.classList.add('today');
      }
      
      // Check if it has appointments
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if(apptDates.has(dateStr)){
        dayDiv.classList.add('has-appt');
      }
      
      // Different styling for other months
      if(d.getMonth() !== month){
        dayDiv.style.opacity = '0.4';
      }
      
      // Click to navigate to week and show agenda for selected day
      dayDiv.addEventListener('click', async ()=>{
        await renderWeek(d);
        await refreshTodayAgenda(d);
      });
      
      mcGrid.appendChild(dayDiv);
    }
  }

  function buildWeekGrid(container){
    // time column + 7 days header + time rows
    const hoursStart = 8; const hoursEnd = 18; const slotMinutes = 20;
    const slotsPerHour = 60/slotMinutes;
    const totalSlots = (hoursEnd - hoursStart) * slotsPerHour;
    const grid = document.createElement('div');
    grid.className = 'week-grid';
    // header row: blank + day headers
    const headerCols = document.createElement('div'); headerCols.className='time-col day-header'; headerCols.textContent='Horário'; grid.appendChild(headerCols);
    for(let c=0;c<7;c++){
      const dh = document.createElement('div'); dh.className='day-header'; grid.appendChild(dh);
    }
    // rows
    for(let r=0;r<totalSlots;r++){
      // time column
      const minutesFromStart = r * slotMinutes;
      const hour = Math.floor(minutesFromStart/60) + hoursStart;
      const minute = String(minutesFromStart%60).padStart(2,'0');
      const timeLabel = `${String(hour).padStart(2,'0')}:${minute}`;
      const tc = document.createElement('div'); tc.className='time-col time-cell'; tc.textContent = timeLabel; grid.appendChild(tc);
      // 7 day cells
      for(let c=0;c<7;c++){
        const cell = document.createElement('div'); cell.className='day-cell';
        cell.dataset.slot = r; cell.dataset.day = c; grid.appendChild(cell);
      }
    }
    // clear and append
    container.innerHTML = '';
    container.appendChild(grid);
  }

  async function renderWeek(date){
    const selectedDate = date || new Date();
    currentSelectedDay = new Date(selectedDate); // Store the actual selected day
    const start = startOfWeek(selectedDate);
    currentWeekStart = start;
    const container = document.getElementById('weekGrid'); if(!container) return;
    buildWeekGrid(container);
    // fill headers (weekday + date)
    const headers = container.querySelectorAll('.day-header');
    for(let i=0;i<7;i++){
      const d = new Date(start); d.setDate(start.getDate()+i);
      const weekday = d.toLocaleDateString(undefined, { weekday:'short' });
      const dateText = d.toLocaleDateString(undefined, { day:'2-digit', month:'short' });
      if(headers[i]) headers[i].innerHTML = `<div class="weekday">${weekday}</div><div class="date">${dateText}</div>`;
    }
    // load appointments and pets
    const rows = await Appointments.listAllAppointments();
    const pets = await Pets.listAllPets(); const petMap = {}; pets.forEach(p=> petMap[p.id]=p);
    let users = [];
    try{ users = await DB.query('SELECT * FROM users', []); }catch(e){ users = []; }
    const userMap = {}; users.forEach(u=>{ userMap[u.id]=u; });
    // map vet colors
    const vetNames = Array.from(new Set((rows||[]).map(r=>r.vet_name).filter(Boolean)));
    const colorPalette = ['#ef4444','#f97316','#f59e0b','#10b981','#06b6d4','#3b82f6','#8b5cf6','#ec4899'];
    const vetColor = {}; vetNames.forEach((v,i)=> vetColor[v]=colorPalette[i % colorPalette.length]);
    // define week end once so it can be used for filtering
    const weekEnd = new Date(start); weekEnd.setDate(start.getDate()+7);

    // determine next upcoming appointment within this week (to highlight)
    const nowForWeek = new Date();
    let nextApptIdForWeek = null;
    const weekFutures = (rows||[]).filter(r=>{
      if(!r.date) return false;
      const dt = new Date(r.date + 'T' + (r.time||'00:00'));
      return dt >= nowForWeek && dt >= start && dt < weekEnd;
    });
    if(weekFutures.length){ weekFutures.sort((a,b)=> new Date(a.date+'T'+(a.time||'00:00')) - new Date(b.date+'T'+(b.time||'00:00'))); nextApptIdForWeek = weekFutures[0].id; }

    // iterate appointments falling within the week
    const hoursStart = 8; const slotMinutes=20;
    const weekStartIso = (d=> `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)(start);
    // prepare grid geometry for absolute positioning of blocks
    const gridEl = container.querySelector('.week-grid');
    if(gridEl){
      gridEl.style.position = 'relative';
      const headerEl = gridEl.querySelector('.day-header');
      const headerHeight = headerEl ? headerEl.offsetHeight : 48;
      const timeCellEl = gridEl.querySelector('.time-cell');
      const slotHeight = timeCellEl ? timeCellEl.offsetHeight : 48;
      const timeColEl = gridEl.querySelector('.time-col');
      const timeColWidth = timeColEl ? timeColEl.offsetWidth : 100;
      const dayCellEl = gridEl.querySelector('.day-cell');
      const dayWidth = dayCellEl ? dayCellEl.offsetWidth : 120;

      // mark today's column cells
      try{
        const today = new Date();
        const todayIndex = Math.floor((today - start)/(24*3600*1000));
        if(todayIndex>=0 && todayIndex<7){
          const todayCells = gridEl.querySelectorAll(`.day-cell[data-day="${todayIndex}"]`);
          todayCells.forEach(c=> c.classList.add('today-col'));
        }
      }catch(e){ }

      // prefetch anamnesis for appointments in this week to display indicator/summary
      const weekAppointments = (rows||[]).filter(r2=>{
        if(!r2.date) return false;
        const dt = new Date(r2.date + 'T' + (r2.time||'00:00'));
        return dt >= start && dt < weekEnd;
      });
      const anamForWeekArr = await Promise.all(weekAppointments.map(a=> Anamnesis.getByAppointment(a.id).catch(()=>null)));
      const anamMap = {};
      weekAppointments.forEach((a, i)=>{ if(anamForWeekArr[i]) anamMap[a.id] = anamForWeekArr[i]; });

      (rows||[]).forEach(r=>{
        if(!r.date) return;
        const dt = new Date(r.date + 'T' + (r.time||'00:00'));
        if(dt < start || dt >= weekEnd) return;
        const dayIndex = Math.floor((dt - start)/(24*3600*1000));
        const minutesSinceStart = (dt.getHours()*60 + dt.getMinutes()) - (hoursStart*60);
        if(minutesSinceStart < 0) return;
        const slotIndex = Math.floor(minutesSinceStart/slotMinutes);
        // compute spans based on duration
        const duration = parseInt(r.duration) || 20;
        const spans = Math.max(1, Math.ceil(duration / slotMinutes));
        // compute geometry
        const left = timeColWidth + (dayIndex * dayWidth) + 6;
        const top = headerHeight + (slotIndex * slotHeight) + 2;
        const width = Math.max(60, dayWidth - 12);
        const height = Math.max(32, spans * slotHeight - 6);

        const pet = petMap[r.pet_id];
        const owner = pet ? userMap[pet.owner_id] : null;
        const petName = pet ? pet.name : ('Pet '+r.pet_id);
        const div = document.createElement('div'); div.className='appt-block';
        div.style.position = 'absolute';
        div.style.left = left + 'px';
        div.style.top = top + 'px';
        div.style.width = width + 'px';
        div.style.height = height + 'px';
        div.style.boxSizing = 'border-box';
        // border-left color indicates vet
        div.style.borderLeft = '6px solid ' + (vetColor[r.vet_name] || '#2563eb');
        // include anamnesis indicator/summary if available
        let inner = `<div style="font-weight:700">${petName}</div><div class="meta">${r.time||''} • ${r.vet_name||''}${r.type ? ' • ' + r.type : ''}${r.duration ? ' • ' + r.duration + 'm' : ''}</div>`;
        try{
          div.innerHTML = inner;
          // append client details if present
          if(owner){
            appendClientDetails(div, owner);
            div.classList.add('has-client');
            const cf = div.querySelector('.client-full'); if(cf){ cf.classList.add('client-inline'); }
          }
          // append anamnesis details if present
          const am = anamMap[r.id];
          if(am){
            div.classList.add('has-anamnesis');
            appendAnamnesisDetails(div, am);
            const af = div.querySelector('.anam-full'); if(af){ af.classList.add('anam-inline'); }
          }
        }catch(e){ div.innerHTML = inner; }
        // highlight if this is the next appointment in the week
        try{ if(nextApptIdForWeek != null && String(r.id) === String(nextApptIdForWeek)) div.classList.add('next-appt'); }catch(e){}
        // attach appt id and click handler for edit
        try{ div.dataset.apptId = r.id; div.addEventListener('click', async function(evt){ evt.stopPropagation(); try{ await populateAppointmentEditor(r); }catch(e){console.warn('open appt editor failed',e);} }); }catch(e){}
        gridEl.appendChild(div);
      });

      // now-indicator: single horizontal line across today's column at current time
      function updateNowIndicator(){
        try{
          const now = new Date();
          const todayIndex = Math.floor((now - start)/(24*3600*1000));
          const indicatorId = 'nowIndicator';
          let ind = gridEl.querySelector('#'+indicatorId);
          if(todayIndex < 0 || todayIndex > 6){ if(ind) ind.remove(); return; }
          const minutesSinceStart = (now.getHours()*60 + now.getMinutes()) - (hoursStart*60);
          if(minutesSinceStart < 0 || minutesSinceStart > ((10*60)+1)) { if(ind) ind.remove(); return; }
          const fractionalSlot = minutesSinceStart / slotMinutes;
          const topPos = headerHeight + (fractionalSlot * slotHeight);
          const dayLeft = timeColWidth + (todayIndex * dayWidth) + 4;
          const dayRight = dayLeft + (dayWidth - 8);
          if(!ind){ ind = document.createElement('div'); ind.id = indicatorId; ind.className = 'now-indicator'; gridEl.appendChild(ind); }
          ind.style.left = dayLeft + 'px';
          ind.style.width = (dayWidth - 8) + 'px';
          ind.style.top = (topPos - 1) + 'px';
        }catch(e){ console.warn('now indicator update failed', e); }
      }
      updateNowIndicator();
      // refresh every 30s (keep single timer)
      try{ if(window._nowIndicatorTimer) clearInterval(window._nowIndicatorTimer); window._nowIndicatorTimer = setInterval(updateNowIndicator, 30000); }catch(e){}
    }
    // fill professionals list from vetNames
    const profList = document.getElementById('professionalsList'); if(profList){ profList.innerHTML=''; vetNames.forEach(v=>{ const li=document.createElement('li'); li.innerHTML=`<span class="prof-color" style="background:${vetColor[v]}"></span> ${v}`; profList.appendChild(li); }) }
    // update title
    const title = document.getElementById('weekTitle'); if(title){ const end = new Date(start); end.setDate(start.getDate()+6); title.textContent = `${start.toLocaleDateString()} — ${end.toLocaleDateString()}` }
    
    // update mini calendar to highlight the current week's month
    miniCalendarDate = new Date(start);
    await renderMiniCalendar();
  }

  // week navigation handlers (day-by-day)
  const btnPrev = document.getElementById('weekPrev'); if(btnPrev) btnPrev.addEventListener('click', async ()=>{ 
    const prev = new Date(currentSelectedDay);
    prev.setDate(prev.getDate() - 1);
    currentSelectedDay = new Date(prev);
    await renderWeek(prev);
    await refreshTodayAgenda(prev);
  });
  const btnNext = document.getElementById('weekNext'); if(btnNext) btnNext.addEventListener('click', async ()=>{ 
    const next = new Date(currentSelectedDay);
    next.setDate(next.getDate() + 1);
    currentSelectedDay = new Date(next);
    await renderWeek(next);
    await refreshTodayAgenda(next);
  });
  const btnToday = document.getElementById('todayBtn'); if(btnToday) btnToday.addEventListener('click', async ()=>{ 
    const today = new Date(); 
    today.setHours(0, 0, 0, 0);
    currentSelectedDay = new Date(today);
    await renderWeek(today); 
    await refreshTodayAgenda(today); 
  });
  const btnRefresh = document.getElementById('refreshBtn'); if(btnRefresh) btnRefresh.addEventListener('click', async ()=>{ await renderWeek(currentSelectedDay); });

  // mini calendar navigation handlers
  const mcPrev = document.getElementById('mcPrev');
  if(mcPrev) mcPrev.addEventListener('click', async ()=>{
    miniCalendarDate.setMonth(miniCalendarDate.getMonth() - 1);
    await renderMiniCalendar();
  });
  
  const mcNext = document.getElementById('mcNext');
  if(mcNext) mcNext.addEventListener('click', async ()=>{
    miniCalendarDate.setMonth(miniCalendarDate.getMonth() + 1);
    await renderMiniCalendar();
  });

  // Do not show the dashboard by default: agenda view is the first page. Populate fields if user exists.
  const current = Auth.currentUser();
  if(current){
    const un = document.getElementById('userName'); if(un) un.textContent = current.email || current.name || '';
    try{
      const rn = document.getElementById('regName'); if(rn) rn.value = current.name || '';
      const re = document.getElementById('regEmail'); if(re) { re.value = ''; re.disabled = false; }
      const rp = document.getElementById('regPhone'); if(rp) rp.value = current.phone || '';
      const rcpf = document.getElementById('regCpf'); if(rcpf) rcpf.value = current.cpf || '';
      const ra = document.getElementById('regAddress'); if(ra) ra.value = current.address || '';
    }catch(e){ console.warn('populate client fields failed', e); }
  }
  // attach CPF handlers to the input
  attachCPFHandlers();
  // wire open scheduler button
  const openSchedulerBtn = document.getElementById('openSchedulerBtn');
  if(openSchedulerBtn) openSchedulerBtn.addEventListener('click', function(){
    try{
      setCPFError('');
      // create backdrop if not present
      let bd = document.getElementById('schedulerBackdrop');
      if(!bd){ bd = document.createElement('div'); bd.id = 'schedulerBackdrop'; bd.className = 'scheduler-backdrop'; bd.addEventListener('click', closeScheduler); document.body.appendChild(bd); }
      if(dashboardView){
        dashboardView.classList.remove('hidden');
        dashboardView.style.display = '';
        dashboardView.classList.add('overlayed');
        const inputs = dashboardView.querySelectorAll('input, textarea, select, button');
        inputs.forEach(i=>{ i.style.display = ''; i.disabled = false; });
        const first = document.getElementById('regName') || dashboardView.querySelector('input, textarea, select');
        if(first){ try{ setTimeout(()=>{ first.focus(); },120); }catch(e){} }
        try{ setTimeout(()=>{ dashboardView.scrollIntoView({behavior:'smooth', block:'center'}); }, 80); }catch(e){}
      } else {
        // fallback to navigate to agendamento.html if dashboard not present
        try{ window.location.href = 'agendamento.html'; }catch(e){ console.warn('redirect failed', e); }
      }
    }catch(e){ console.warn('open scheduler failed', e); try{ window.location.href = 'agendamento.html'; }catch(e2){} }
  });

  function closeScheduler(){
    try{
      const bd = document.getElementById('schedulerBackdrop'); if(bd) bd.remove();
      if(dashboardView){ dashboardView.classList.add('hidden'); dashboardView.classList.remove('overlayed'); dashboardView.style.display='none'; }
    }catch(e){ console.warn('close scheduler failed', e); }
  }
  // close button handler
  const closeSchedulerBtn = document.getElementById('closeSchedulerBtn'); if(closeSchedulerBtn) closeSchedulerBtn.addEventListener('click', closeScheduler);

  // login / register (if present in this page)
  const btnLogin = document.getElementById('btnLogin');
  // old register/button behavior replaced by single 'Cadastrar Agendamento' button
  const btnCadastrar = document.getElementById('btnCadastrarAgendamento');
  if(btnCadastrar){
    btnCadastrar.addEventListener('click', async function(){
      try{
        // 1) ensure user: register if not logged
        let current = Auth.currentUser();
        if(!current){
          const name = document.getElementById('regName').value.trim();
          const email = document.getElementById('regEmail').value.trim();
            const phone = document.getElementById('regPhone') ? document.getElementById('regPhone').value.trim() : null;
            const cpf = document.getElementById('regCpf') ? document.getElementById('regCpf').value.trim() : null;
            if(cpf && !isValidCPF(cpf)) { setCPFError('CPF inválido. Verifique e tente novamente.'); const cpfEl = document.getElementById('regCpf'); if(cpfEl) cpfEl.focus(); return; }
            const address = document.getElementById('regAddress') ? document.getElementById('regAddress').value.trim() : null;
          // password field removed from form; register without explicit password (Auth will generate one)
            const user = await Auth.register(email, undefined, name, phone, address, cpf);
          current = user;
        }

        // 2) add pet
        const petName = document.getElementById('petName').value.trim();
        const petSpecies = document.getElementById('petSpecies').value.trim();
        const petBreed = document.getElementById('petBreed').value.trim();
        const petAge = parseInt(document.getElementById('petAge').value) || null;
        const petWeight = parseFloat(document.getElementById('petWeight').value) || null;
        const petRes = await Pets.addPet({name: petName, species: petSpecies, breed: petBreed, age: petAge, weight: petWeight, owner_id: current.id});
        // petRes may contain insertId
        const petId = petRes && (petRes.insertId || (petRes.rows && petRes.rows.insertId)) ? (petRes.insertId || petRes.rows.insertId) : null;

        // 3) add appointment
        const apptPetId = petId || parseInt(document.getElementById('apptPet').value) || null;
        const appt = {
          pet_id: apptPetId,
          vet_name: document.getElementById('apptVet').value.trim(),
          type: document.getElementById('apptType').value.trim(),
          date: document.getElementById('apptDate').value,
          time: document.getElementById('apptTime').value,
          duration: parseInt(document.getElementById('apptDuration') ? document.getElementById('apptDuration').value : 20) || 20,
          notes: document.getElementById('apptNotes').value.trim(),
          owner_id: current.id
        };
        await Appointments.addAppointment(appt);

        // refresh lists and show dashboard
        setCPFError('');
        await refreshPets();
        await refreshAppts();
        alert('Agendamento cadastrado com sucesso.');
        // after registering and creating, show dashboard view
        try{ showView('dashboard'); const un = document.getElementById('userName'); if(un) un.textContent = current.email || current.name || ''; }catch(e){}
        // scroll to anamnesis/questions section so user can continue filling details
        try{
          const target = document.getElementById('chiefComplaint') || document.getElementById('anamAppt') || document.getElementById('apptsList');
          if(target){ target.scrollIntoView({behavior:'smooth', block:'center'}); if(typeof target.focus === 'function') target.focus(); }
        }catch(scerr){ console.warn('scroll to anamnesis failed', scerr); }
      }catch(err){
        console.error('Cadastro agendamento erro', err); alert(err.message || String(err));
      }
    });
  }
  if(btnLogin){ btnLogin.addEventListener('click', async function(){
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    try{
      const user = await Auth.login(email, password);
      if(window.app && typeof window.app.showView === 'function'){
        window.app.showView('dashboard');
        if(typeof window.app.refreshPets === 'function') await window.app.refreshPets();
        if(typeof window.app.refreshAppts === 'function') await window.app.refreshAppts();
        const un = document.getElementById('userName'); if(un) un.textContent = user.name || user.email || '';
      } else {
        // fallback to reload (will initialize app if agendamento content is in the page)
        window.location.reload();
      }
    }catch(err){ authMsg.textContent = err.message; }
  })}

  // logout
  const btnLogout = document.getElementById('btnLogout');
  if(btnLogout) btnLogout.addEventListener('click', function(){ Auth.logout(); window.location.href = 'index.html'; });

  // pets add
  const btnAddPet = document.getElementById('btnAddPet');
  async function refreshPets(){
    const cur = Auth.currentUser(); if(!cur) return;
    const pets = await Pets.listPetsByOwner(cur.id);
    const petsList = document.getElementById('petsList'); petsList.innerHTML = '';
    const apptPet = document.getElementById('apptPet'); apptPet.innerHTML = '';
    pets.forEach(p=>{
      const li = document.createElement('li'); li.textContent = p.name + ' ('+(p.species||'')+')'; petsList.appendChild(li);
      const opt = document.createElement('option'); opt.value = p.id; opt.textContent = p.name; apptPet.appendChild(opt);
    });
  }
  if(btnAddPet) btnAddPet.addEventListener('click', async function(){
    const cur = Auth.currentUser(); if(!cur){ alert('Faça login'); return; }
    const data = { name: document.getElementById('petName').value.trim(), species: document.getElementById('petSpecies').value.trim(), breed: document.getElementById('petBreed').value.trim(), age: parseInt(document.getElementById('petAge').value)||null, weight: parseFloat(document.getElementById('petWeight').value)||null, owner_id: cur.id };
    try{ await Pets.addPet(data); await refreshPets(); }catch(e){ console.error(e); }
  });

  // 'Salvar cliente' flow removed; client data is handled during scheduling

  // appointments add
  const btnAddAppt = document.getElementById('btnAddAppt');
  async function refreshAppts(){
    const cur = Auth.currentUser(); if(!cur) return;
    const rows = await Appointments.listAppointmentsByOwner(cur.id);
      const list = document.getElementById('apptsList'); list.innerHTML = '';
      const anamSelect = document.getElementById('anamAppt'); if(anamSelect) anamSelect.innerHTML = '';
      // fetch anamnesis entries and client data in parallel
      const anamArr = await Promise.all((rows||[]).map(r=> Anamnesis.getByAppointment(r.id).catch(()=>null)));
      const pets = await Pets.listAllPets();
      let users = [];
      try{ users = await DB.query('SELECT * FROM users', []); }catch(e){ users = []; }
      const petMap = {}; pets.forEach(p=>{ petMap[p.id]=p; });
      const userMap = {}; users.forEach(u=>{ userMap[u.id]=u; });
      rows.forEach((r, idx)=>{
        const li = document.createElement('li');
        li.textContent = (r.date||'')+' '+(r.time||'')+' - '+(r.type||'')+ ' / Pet ID: '+(r.pet_id||'');
        // add full client fields if present
        try{
          const pet = petMap[r.pet_id];
          const owner = pet ? userMap[pet.owner_id] : null;
          if(owner){ appendClientDetails(li, owner); li.classList.add('has-client'); }
        }catch(e){}
        // add full anamnesis fields if present
        try{
          const am = anamArr[idx];
          if(am){ appendAnamnesisDetails(li, am); li.classList.add('has-anamnesis'); }
        }catch(e){}
        list.appendChild(li);
        if(anamSelect){
          const opt = document.createElement('option'); opt.value = r.id; opt.textContent = (r.date||'')+' '+(r.time||'')+' - '+(r.type||''); anamSelect.appendChild(opt);
        }
      });
  }
  // expose small app API so other scripts (login) can reveal/update UI without a full reload
  window.app = {
    showView: showView,
    refreshPets: refreshPets,
    refreshAppts: refreshAppts,
    refreshTodayAgenda: refreshTodayAgenda
  };
  if(btnAddAppt) btnAddAppt.addEventListener('click', async function(){
    const cur = Auth.currentUser(); if(!cur){ alert('Faça login'); return; }
    const appt = {
      pet_id: parseInt(document.getElementById('apptPet').value)||null,
      vet_name: document.getElementById('apptVet').value.trim(),
      type: document.getElementById('apptType').value.trim(),
      date: document.getElementById('apptDate').value,
      time: document.getElementById('apptTime').value,
      duration: parseInt(document.getElementById('apptDuration') ? document.getElementById('apptDuration').value : 20) || 20,
      notes: document.getElementById('apptNotes').value.trim(),
      owner_id: cur.id
    };
    try{ await Appointments.addAppointment(appt); await refreshAppts(); await renderWeek(currentWeekStart||new Date()); }catch(e){ console.error(e); }
  });

  // unified schedule button (bottom bar)
  const btnSchedule = document.getElementById('btnSchedule');
  if(btnSchedule) btnSchedule.addEventListener('click', async function(){
    try{
      // if the dashboard/form is hidden, open scheduler first to let user fill data
      if(dashboardView && dashboardView.classList && dashboardView.classList.contains('hidden')){
        console.info('Scheduler hidden — opening scheduler before scheduling');
        try{ if(openSchedulerBtn) openSchedulerBtn.click(); }catch(e){ console.warn('openSchedulerBtn click failed', e); }
        // focus first input after a short delay
        setTimeout(()=>{ const f = document.getElementById('regName'); if(f) try{ f.focus(); }catch(e){} }, 150);
        return;
      }
      // ensure user
      let current = Auth.currentUser();
      if(!current){
        const name = document.getElementById('regName') ? document.getElementById('regName').value.trim() : '';
        const email = document.getElementById('regEmail') ? document.getElementById('regEmail').value.trim() : '';
        const phone = document.getElementById('regPhone') ? document.getElementById('regPhone').value.trim() : '';
        const cpf = document.getElementById('regCpf') ? document.getElementById('regCpf').value.trim() : '';
        if(cpf && !isValidCPF(cpf)){ setCPFError('CPF inválido. Corrija antes de agendar.'); const cpfEl = document.getElementById('regCpf'); if(cpfEl) cpfEl.focus(); return; }
        const address = document.getElementById('regAddress') ? document.getElementById('regAddress').value.trim() : '';
        if(!email){ alert('Informe o e-mail do cliente antes de agendar.'); return; }
        current = await Auth.register(email, undefined, name, phone, address, cpf);
      }

      // add pet if user filled pet fields (and no selection)
      let petId = null;
      const selectedPet = document.getElementById('apptPet') ? document.getElementById('apptPet').value : null;
      if(selectedPet) petId = parseInt(selectedPet) || null;
      const petName = document.getElementById('petName') ? document.getElementById('petName').value.trim() : '';
      if(!petId && petName){
        const petSpecies = document.getElementById('petSpecies') ? document.getElementById('petSpecies').value.trim() : '';
        const petBreed = document.getElementById('petBreed') ? document.getElementById('petBreed').value.trim() : '';
        const petAge = parseInt(document.getElementById('petAge') ? document.getElementById('petAge').value : '') || null;
        const petWeight = parseFloat(document.getElementById('petWeight') ? document.getElementById('petWeight').value : '') || null;
        const petRes = await Pets.addPet({ name: petName, species: petSpecies, breed: petBreed, age: petAge, weight: petWeight, owner_id: current.id });
        // try to extract id
        petId = petRes && (petRes.insertId || (petRes.rows && petRes.rows.insertId)) ? (petRes.insertId || petRes.rows.insertId) : null;
        if(!petId){
          // fallback: refresh pet list and pick newly added by name
          await refreshPets();
          const pets = await Pets.listPetsByOwner(current.id);
          const match = pets.find(p=>p.name===petName);
          if(match) petId = match.id;
        }
      }

      // create or update appointment depending on edit state
      const appt = {
        pet_id: petId || (document.getElementById('apptPet') ? parseInt(document.getElementById('apptPet').value) : null),
        vet_name: document.getElementById('apptVet') ? document.getElementById('apptVet').value.trim() : '',
        type: document.getElementById('apptType') ? document.getElementById('apptType').value.trim() : '',
        date: document.getElementById('apptDate') ? document.getElementById('apptDate').value : '',
        time: document.getElementById('apptTime') ? document.getElementById('apptTime').value : '',
        duration: parseInt(document.getElementById('apptDuration') ? document.getElementById('apptDuration').value : 20) || 20,
        notes: document.getElementById('apptNotes') ? document.getElementById('apptNotes').value.trim() : '',
        owner_id: current.id
      };

      // if editing an appointment, update it
      let savedApptId = null;
      if(window._editingApptId){
        try{
          await Appointments.updateAppointment(window._editingApptId, appt);
          savedApptId = window._editingApptId;
        }catch(e){ console.error('update appt failed', e); throw e; }
      } else {
        const res = await Appointments.addAppointment(appt);
        // try to get insert id
        if(res && (res.insertId || (res.rows && res.rows.insertId))){ savedApptId = res.insertId || res.rows.insertId; }
        // fallback: query for appointment by owner/date/time/pet
        if(!savedApptId){
          const rows2 = await DB.query('SELECT id FROM appointments WHERE owner_id=? AND date=? AND time=? AND pet_id=? LIMIT 1', [current.id, appt.date, appt.time, appt.pet_id]);
          if(rows2 && rows2.length) savedApptId = rows2[0].id;
        }
      }

      // save anamnesis to DB linked to the appointment
      try{
        const anamData = {
          chief_complaint: document.getElementById('chiefComplaint') ? document.getElementById('chiefComplaint').value.trim() : '',
          history: document.getElementById('history') ? document.getElementById('history').value.trim() : '',
          physical_exam: document.getElementById('physicalExam') ? document.getElementById('physicalExam').value.trim() : '',
          diagnostic_hypotheses: document.getElementById('diagnosticHypotheses') ? document.getElementById('diagnosticHypotheses').value.trim() : '',
          plan: document.getElementById('plan') ? document.getElementById('plan').value.trim() : ''
        };
        if(savedApptId){ await Anamnesis.addOrUpdateForAppointment(savedApptId, current.id, anamData); const anamMsgEl = document.getElementById('anamMsg'); if(anamMsgEl) anamMsgEl.textContent = 'Anamnese salva.'; }
      }catch(e){ console.warn('save anamnesis failed', e); }

      // refresh
      setCPFError('');
      await refreshPets();
      await refreshAppts();
      await renderWeek(currentWeekStart||new Date());
      // Update agenda to show the newly created appointment
      await refreshTodayAgenda(currentSelectedDay);

      alert('Agendamento cadastrado com sucesso.');
      try{ showView('dashboard'); const un = document.getElementById('userName'); if(un) un.textContent = current.email || current.name || ''; }catch(e){}
      // scroll to anamnesis area
      try{ const target = document.getElementById('chiefComplaint') || document.getElementById('anamAppt') || document.getElementById('apptsList'); if(target){ target.scrollIntoView({behavior:'smooth', block:'center'}); if(typeof target.focus === 'function') target.focus(); } }catch(e){}
    }catch(err){ console.error('Erro ao agendar', err); alert(err.message || String(err)); }
  });

  // anamnesis save placeholder
  const btnSaveAnam = document.getElementById('btnSaveAnam');
  if(btnSaveAnam) btnSaveAnam.addEventListener('click', function(){ document.getElementById('anamMsg').textContent = 'Salvo (demo).'; });

  // helper: populate appointment fields for editing
  async function populateAppointmentEditor(appt){
    try{
      // if appt is an object with fields, otherwise fetch by id
      let a = appt;
      if(!appt || !appt.id){
        if(appt && appt.id) a = appt; else return;
      }
      // set editing id
      window._editingApptId = a.id;
      // populate fields
      const apptPet = document.getElementById('apptPet'); if(apptPet){ apptPet.value = a.pet_id || ''; }
      const apptDate = document.getElementById('apptDate'); if(apptDate) apptDate.value = a.date || '';
      const apptTime = document.getElementById('apptTime'); if(apptTime) apptTime.value = a.time || '';
      const apptType = document.getElementById('apptType'); if(apptType) apptType.value = a.type || '';
      const apptDuration = document.getElementById('apptDuration'); if(apptDuration) apptDuration.value = a.duration || '20';
      const apptVet = document.getElementById('apptVet'); if(apptVet) apptVet.value = a.vet_name || '';
      const apptNotes = document.getElementById('apptNotes'); if(apptNotes) apptNotes.value = a.notes || '';
      // ensure selected day is the appointment date
      try{
        if(a.date){ const d = new Date(a.date); d.setHours(0,0,0,0); currentSelectedDay = d; }
      }catch(e){}
      // open the scheduler panel so the user can see/edit anamnesis
      try{
        let bd = document.getElementById('schedulerBackdrop');
        if(!bd){ bd = document.createElement('div'); bd.id = 'schedulerBackdrop'; bd.className = 'scheduler-backdrop'; bd.addEventListener('click', closeScheduler); document.body.appendChild(bd); }
        if(dashboardView){
          dashboardView.classList.remove('hidden');
          dashboardView.style.display = '';
          dashboardView.classList.add('overlayed');
          const inputs = dashboardView.querySelectorAll('input, textarea, select, button');
          inputs.forEach(i=>{ i.style.display = ''; i.disabled = false; });
        }
      }catch(e){ console.warn('open scheduler for appt failed', e); }
      // fetch anamnesis for this appointment
      try{ const am = await Anamnesis.getByAppointment(a.id); if(am){ if(document.getElementById('chiefComplaint')) document.getElementById('chiefComplaint').value = am.chief_complaint || ''; if(document.getElementById('history')) document.getElementById('history').value = am.history || ''; if(document.getElementById('physicalExam')) document.getElementById('physicalExam').value = am.physical_exam || ''; if(document.getElementById('diagnosticHypotheses')) document.getElementById('diagnosticHypotheses').value = am.diagnostic_hypotheses || ''; if(document.getElementById('plan')) document.getElementById('plan').value = am.plan || ''; }
      }catch(e){ console.warn('load anamnesis failed', e); }
      // focus the form area
      try{ const target = document.getElementById('chiefComplaint') || document.getElementById('apptsList'); if(target){ setTimeout(()=>{ try{ target.scrollIntoView({behavior:'smooth', block:'center'}); if(typeof target.focus==='function') target.focus(); }catch(e2){} },120); } }catch(e){}
    }catch(e){ console.warn('populate editor error', e); }
  }

  // initial loads
  if (Auth.currentUser()){ 
    await refreshPets(); 
    await refreshAppts();
    const today = new Date();
    // Force set currentSelectedDay before rendering
    currentSelectedDay = new Date(today);
    currentSelectedDay.setHours(0, 0, 0, 0);
    await renderWeek(today); 
    await refreshTodayAgenda(today); 
  }
});
