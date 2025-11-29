var Auth = (function () {

  async function register(name, email, password, role) {
    // Criar usuário no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Criar perfil no Supabase (tabela users)
    const user = data.user;

    const { error: insertErr } = await supabase
      .from('users')
      .insert({
        id: user.id,
        name,
        role: role || 'cliente'
      });

    if (insertErr) throw insertErr;

    return true;
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw new Error('Credenciais inválidas.');

    const session = data.session;

    // Buscar o perfil
    const { data: users, error: userErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userErr) throw userErr;

    window.sessionUser = {
      id: session.user.id,
      name: users.name,
      email: session.user.email,
      role: users.role,
      token: session.access_token
    };

    return window.sessionUser;
  }

  async function logout() {
    await supabase.auth.signOut();
    window.sessionUser = null;
  }

  return { register, login, logout };
})();
