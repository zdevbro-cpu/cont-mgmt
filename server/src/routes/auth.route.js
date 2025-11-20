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