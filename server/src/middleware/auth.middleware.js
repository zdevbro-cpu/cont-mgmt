// ========================================
// 인증 미들웨어
// server/src/middleware/auth.js
// ========================================

import jwt from 'jsonwebtoken';

/**
 * 인증 확인 미들웨어
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const token = authHeader.split(' ')[1];

    // JWT 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Supabase에서 사용자 정보 가져오기
    const { data: user, error } = await req.supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('인증 오류:', error);
    return res.status(401).json({ error: '인증에 실패했습니다.' });
  }
};

/**
 * 관리자 권한 확인 미들웨어
 */
export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }
  next();
};