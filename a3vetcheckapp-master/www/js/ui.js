// Basic interactions for the UI mock screens
document.addEventListener('DOMContentLoaded', function(){
  // chips toggle
  document.querySelectorAll('.chip').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'))
      btn.classList.add('active')
    })
  })

  // add appointment button
  var add = document.getElementById('addAppointment')
  if(add){
    add.addEventListener('click', function(){
      alert('Novo agendamento (demo)')
    })
  }

  // timeline item highlight
  document.querySelectorAll('.timeline-item').forEach(function(item){
    item.addEventListener('click', function(){
      document.querySelectorAll('.timeline-item .panel').forEach(p=>p.style.boxShadow='0 8px 18px rgba(36,48,58,0.06)')
      this.querySelector('.panel').style.boxShadow = '0 18px 36px rgba(76,92,255,0.16)'
    })
  })
})
