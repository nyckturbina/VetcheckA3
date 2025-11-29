document.addEventListener('DOMContentLoaded', function(){

  function showMessage(msg){
    if(window.f7) f7.dialog.alert(msg); else alert(msg);
  }

  const btnLogin = document.getElementById('btnLogin');
  const btnRegister = document.getElementById('btnRegister');

  // Registrar
  if(btnRegister) btnRegister.addEventListener('click', async function(){
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if(!email || !password) return showMessage("Preencha e-mail e senha.");

    try{
      // Registro com Supabase Auth
      await Auth.register("", email, password); 
      showMessage("Registro efetuado com sucesso.");
    }catch(err){
      showMessage(err.message || String(err));
    }
  });

  // Login
  if(btnLogin) btnLogin.addEventListener('click', async function(){
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try{
      const user = await Auth.login(email, password);
      showMessage("Bem-vindo, " + (user.name || user.email));

      window.location.href = "agendamento.html";

    }catch(err){
      showMessage(err.message || String(err));
    }
  });
});
