document.addEventListener('DOMContentLoaded', async function(){
  try{
    await Auth.init();
  }catch(err){
    console.error('DB init error', err);
  }

  function showMessage(msg){
    if(window.f7) f7.dialog.alert(msg); else alert(msg);
  }

  const btnLogin = document.getElementById('btnLogin');
  const btnRegister = document.getElementById('btnRegister');

  if(btnRegister) btnRegister.addEventListener('click', async function(){
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    try{
      await Auth.register(email, password);
      showMessage('Registro efetuado. Você já está logado.');
    }catch(err){
      showMessage(err.message || String(err));
    }
  });

  if(btnLogin) btnLogin.addEventListener('click', async function(){
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    try{
      const user = await Auth.login(email, password);
      showMessage('Bem-vindo, '+(user.name||user.email));
      // After successful login, navigate to agendamento page which contains client/dashboard
      try{
        window.location.href = 'agendamento.html';
      }catch(navErr){ console.error('Navigation error', navErr); }
    }catch(err){
      showMessage(err.message || String(err));
    }
  });
});
