import express from 'express';

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const { data, error } = await req.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }
      }
    });

    if (error) throw error;

    // Create profile entry if not handled by trigger
    if (data.user) {
      const { error: profileError } = await req.supabase
        .from('profiles')
        .insert([{ id: data.user.id, email, full_name: name, role: 'user' }]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Continue anyway as auth user is created
      }
    }

    res.status(201).json({ message: 'User created', user: data.user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await req.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    const user = data.user;
    let role = 'user';

    // Fetch profile to get role
    const { data: profile, error: profileError } = await req.supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (profile) {
      role = profile.role;
    }

    // Hardcode admin check for zdevbro@gmail.com as fallback or override
    if (email === 'zdevbro@gmail.com') {
      role = 'admin';
    }

    const userData = {
      id: user.id,
      email: user.email,
      name: profile?.full_name || user.user_metadata?.full_name,
      role: role
    };

    res.json({
      accessToken: data.session.access_token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

export default router;