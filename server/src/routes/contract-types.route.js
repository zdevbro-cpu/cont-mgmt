import express from 'express';

const router = express.Router();

// 계약종류 목록 조회
router.get('/', async (req, res) => {
  try {
    const { data: types, error } = await req.supabase
      .from('contract_types')
      .select('*')
      .order('code', { ascending: true });

    if (error) throw error;

    res.json({ types });

  } catch (error) {
    console.error('계약종류 조회 오류:', error);
    res.status(500).json({ error: '계약종류 조회 실패' });
  }
});

// 계약종류 생성
router.post('/', async (req, res) => {
  try {
    const { code, name, description, is_active } = req.body;

    // 유효성 검사
    if (!code || !name) {
      return res.status(400).json({ error: '코드와 이름은 필수입니다' });
    }

    if (code.length !== 1) {
      return res.status(400).json({ error: '코드는 1글자여야 합니다' });
    }

    // 중복 코드 확인
    const { data: existing } = await req.supabase
      .from('contract_types')
      .select('id')
      .eq('code', code)
      .single();

    if (existing) {
      return res.status(400).json({ error: '이미 존재하는 코드입니다' });
    }

    // 생성
    const { data: newType, error } = await req.supabase
      .from('contract_types')
      .insert([
        {
          code,
          name,
          description: description || null,
          is_active: is_active !== undefined ? is_active : true
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ type: newType });

  } catch (error) {
    console.error('계약종류 생성 오류:', error);
    res.status(500).json({ error: '계약종류 생성 실패' });
  }
});

// 계약종류 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    // 유효성 검사
    if (!name) {
      return res.status(400).json({ error: '이름은 필수입니다' });
    }

    // 수정
    const { data: updatedType, error } = await req.supabase
      .from('contract_types')
      .update({
        name,
        description: description || null,
        is_active: is_active !== undefined ? is_active : true
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!updatedType) {
      return res.status(404).json({ error: '계약종류를 찾을 수 없습니다' });
    }

    res.json({ type: updatedType });

  } catch (error) {
    console.error('계약종류 수정 오류:', error);
    res.status(500).json({ error: '계약종류 수정 실패' });
  }
});

// 계약종류 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 해당 계약종류를 사용하는 계약이 있는지 확인
    const { data: contracts } = await req.supabase
      .from('contracts')
      .select('id')
      .eq('contract_type_id', id)
      .limit(1);

    if (contracts && contracts.length > 0) {
      return res.status(400).json({
        error: '이 계약종류를 사용하는 계약이 있어 삭제할 수 없습니다'
      });
    }

    // 삭제
    const { error } = await req.supabase
      .from('contract_types')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: '계약종류가 삭제되었습니다' });

  } catch (error) {
    console.error('계약종류 삭제 오류:', error);
    res.status(500).json({ error: '계약종류 삭제 실패' });
  }
});

export default router;