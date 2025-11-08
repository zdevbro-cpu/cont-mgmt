// ========================================
// 인증 라우트
// server/src/routes/auth.route.js
// ========================================

import express from 'express';

const router = express.Router();

/**
 * POST /api/auth/signup
 * 회원가입
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Supabase 회원가입
    const { data: authData, error: authError } = await req.supabase.auth.signUp({
      email,
      password
    });

    if (authError) throw authError;

    // 프로필 생성
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: name,
        role: 'user'
      });

    if (profileError) throw profileError;

    res.status(201).json({
      success: true,
      user: authData.user
    });

  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/login
 * 로그인
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await req.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    res.json({
      success: true,
      user: data.user,
      session: data.session
    });

  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(401).json({ error: error.message });
  }
});

/**
 * POST /api/auth/logout
 * 로그아웃
 */
router.post('/logout', async (req, res) => {
  try {
    const { error } = await req.supabase.auth.signOut();
    if (error) throw error;

    res.json({ success: true, message: '로그아웃되었습니다.' });

  } catch (error) {
    console.error('로그아웃 오류:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/auth/me
 * 현재 사용자 정보
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const { data: { user }, error } = await req.supabase.auth.getUser(token);
    if (error) throw error;

    // 프로필 정보 가져오기
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    res.json({
      success: true,
      user: {
        ...user,
        profile
      }
    });

  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(401).json({ error: error.message });
  }
});

// ✅ 중요: export default 필수!
export default router;