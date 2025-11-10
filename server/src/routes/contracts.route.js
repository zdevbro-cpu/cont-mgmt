import express from 'express';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

const router = express.Router();

/**
 * GET /api/contracts
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      minAmount,
      paymentMethod,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    let query = req.supabase
      .from('contracts')
      .select(`
        *,
        contract_types (
          name,
          code
        )
      `, { count: 'exact' });

    if (startDate) query = query.gte('contract_date', startDate);
    if (minAmount) query = query.gte('investment_amount', minAmount);
    if (paymentMethod && paymentMethod !== 'all') query = query.eq('payment_method', paymentMethod);

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    query = query.range(offset, offset + limit - 1);

    const { data: contracts, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      contracts: contracts || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('계약 목록 조회 오류:', error);
    res.status(500).json({ error: '목록 조회 실패' });
  }
});

/**
 * GET /api/contracts/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: contract, error } = await req.supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!contract) {
      return res.status(404).json({ error: '계약을 찾을 수 없습니다' });
    }

    res.json({ success: true, contract });

  } catch (error) {
    console.error('계약 상세 조회 오류:', error);
    res.status(500).json({ error: '상세 조회 실패' });
  }
});

/**
 * POST /api/contracts
 */
router.post('/', async (req, res) => {
  try {
    const contractData = req.body;

    const { data: contractType, error: typeError } = await req.supabase
      .from('contract_types')
      .select('code')
      .eq('id', contractData.contract_type_id)
      .single();

    if (typeError || !contractType) {
      return res.status(400).json({ error: '유효하지 않은 계약종류입니다' });
    }

    const contractDate = new Date(contractData.contract_date);
    const dateStr = contractDate.toISOString().split('T')[0].replace(/-/g, '');

    const contractNumberPrefix = `${contractType.code}-${dateStr}`;
    const { data: lastContract } = await req.supabase
      .from('contracts')
      .select('contract_number')
      .like('contract_number', `${contractNumberPrefix}%`)
      .order('contract_number', { ascending: false })
      .limit(1)
      .single();

    let serialNumber = 1;
    if (lastContract && lastContract.contract_number) {
      const lastNumber = lastContract.contract_number.split('-')[2];
      serialNumber = parseInt(lastNumber) + 1;
    }

    const contractNumber = `${contractNumberPrefix}-${String(serialNumber).padStart(3, '0')}`;
    contractData.contract_number = contractNumber;

    const { data: newContract, error } = await req.supabase
      .from('contracts')
      .insert([contractData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, contract: newContract });

  } catch (error) {
    console.error('계약 생성 오류:', error);
    res.status(500).json({ error: '계약 생성 실패' });
  }
});

/**
 * PUT /api/contracts/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data: updatedContract, error } = await req.supabase
      .from('contracts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!updatedContract) {
      return res.status(404).json({ error: '계약을 찾을 수 없습니다' });
    }

    res.json({ success: true, contract: updatedContract });

  } catch (error) {
    console.error('계약 수정 오류:', error);
    res.status(500).json({ error: '계약 수정 실패' });
  }
});

/**
 * DELETE /api/contracts/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await req.supabase
      .from('contracts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: '계약이 삭제되었습니다' });

  } catch (error) {
    console.error('계약 삭제 오류:', error);
    res.status(500).json({ error: '계약 삭제 실패' });
  }
});

export default router;