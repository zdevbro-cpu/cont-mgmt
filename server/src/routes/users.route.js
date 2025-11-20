import express from 'express';

const router = express.Router();

// 사용자 목록 조회
router.get('/', async (req, res) => {
  try {
    const { data: users, error } = await req.supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ users });

  } catch (error) {
    console.error('사용자 조회 오류:', error);
    res.status(500).json({ error: '사용자 조회 실패' });
  }
});

// 사용자 정보 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, role } = req.body;

    // 업데이트할 필드 구성
    const updateData = {};

    if (full_name !== undefined) {
      updateData.full_name = full_name;
    }

    if (role !== undefined) {
      updateData.role = role;
    }

    // 최소 하나의 필드는 업데이트되어야 함
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: '수정할 내용이 없습니다' });
    }

    // profiles 테이블 수정
    const { data: updatedProfile, error: profileError } = await req.supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (profileError) throw profileError;

    if (!updatedProfile) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    res.json({ user: updatedProfile });

  } catch (error) {
    console.error('사용자 수정 오류:', error);
    res.status(500).json({ error: '사용자 수정 실패' });
  }
});

// 비밀번호 초기화
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // 유효성 검사
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: '비밀번호는 최소 6자 이상이어야 합니다' });
    }

    // 사용자 존재 확인
    const { data: user } = await req.supabase
      .from('profiles')
      .select('email')
      .eq('id', id)
      .single();

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // 비밀번호 업데이트 (Supabase Admin API 필요)
    // 주의: 실제로는 Supabase Admin SDK의 updateUserById를 사용해야 합니다
    // const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
    //   password: newPassword
    // });

    // 임시 응답 (실제 구현 필요)
    res.json({
      message: '비밀번호가 초기화되었습니다',
      note: '실제 환경에서는 Supabase Admin API 구현이 필요합니다'
    });

  } catch (error) {
    console.error('비밀번호 초기화 오류:', error);
    res.status(500).json({ error: '비밀번호 초기화 실패' });
  }
});

// 사용자 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 해당 사용자가 작성한 계약이 있는지 확인
    const { data: contracts } = await req.supabase
      .from('contracts')
      .select('id')
      .eq('created_by', id)
      .limit(1);

    if (contracts && contracts.length > 0) {
      return res.status(400).json({
        error: '이 사용자가 작성한 계약이 있어 삭제할 수 없습니다'
      });
    }

    // profiles 삭제
    const { error: profileError } = await req.supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileError) throw profileError;

    // auth.users 삭제 (Supabase Admin API 필요)
    // const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    res.json({
      message: '사용자가 삭제되었습니다',
      note: '실제 환경에서는 auth.users 삭제도 필요합니다'
    });

  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    res.status(500).json({ error: '사용자 삭제 실패' });
  }
});

export default router;