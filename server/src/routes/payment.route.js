// ========================================
// 지급 관리 API
// server/src/routes/payment.route.js
// ========================================

import express from 'express';

const router = express.Router();

/**
 * GET /api/payments/today
 * 오늘 지급할 목록
 */
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: payments, error } = await req.supabase
      .from('payment_schedules')
      .select(`
        *,
        contracts(
          contract_number,
          contract_name,
          contractor_name,
          contract_type_name,
          phone_number,
          email
        )
      `)
      .eq('scheduled_date', today)
      .eq('payment_status', 'pending')
      .order('scheduled_date', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      date: today,
      payments: payments || [],
      total_amount: payments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0,
      count: payments?.length || 0
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * GET /api/payments/upcoming
 * 다가오는 지급 목록 (7일 이내)
 */
router.get('/upcoming', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data: payments, error } = await req.supabase
      .from('payment_schedules')
      .select(`
        *,
        contracts(
          contract_number,
          contract_name,
          contractor_name,
          contract_type_name,
          phone_number
        )
      `)
      .gte('scheduled_date', today)
      .lte('scheduled_date', sevenDaysLater)
      .eq('payment_status', 'pending')
      .order('scheduled_date', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      start_date: today,
      end_date: sevenDaysLater,
      payments: payments || [],
      total_amount: payments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0,
      count: payments?.length || 0
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * GET /api/payments/schedule/:contractId
 * 특정 계약의 지급 스케줄
 */
router.get('/schedule/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;

    const { data: schedules, error } = await req.supabase
      .from('payment_schedules')
      .select('*')
      .eq('contract_id', contractId)
      .order('payment_number', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      contract_id: contractId,
      schedules: schedules || [],
      total_amount: schedules?.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0) || 0,
      paid_count: schedules?.filter(s => s.payment_status === 'paid').length || 0,
      pending_count: schedules?.filter(s => s.payment_status === 'pending').length || 0
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * PUT /api/payments/:id/status
 * 지급 상태 변경
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paid_date, paid_amount, note } = req.body;

    const updateData = {
      payment_status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'paid') {
      updateData.paid_date = paid_date || new Date().toISOString().split('T')[0];
      updateData.paid_amount = paid_amount;
    }

    if (note !== undefined) {
      updateData.note = note;
    }

    const { data: payment, error } = await req.supabase
      .from('payment_schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      payment: payment
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * GET /api/payments/monthly/:year/:month
 * 월별 지급 통계
 */
router.get('/monthly/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data: payments, error } = await req.supabase
      .from('payment_schedules')
      .select(`
        *,
        contracts(
          contract_number,
          contractor_name,
          contract_type_name
        )
      `)
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;

    // 통계 계산
    const stats = {
      total_scheduled: payments?.length || 0,
      total_amount: payments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0,
      paid_count: payments?.filter(p => p.payment_status === 'paid').length || 0,
      paid_amount: payments?.filter(p => p.payment_status === 'paid').reduce((sum, p) => sum + parseFloat(p.paid_amount || p.amount || 0), 0) || 0,
      pending_count: payments?.filter(p => p.payment_status === 'pending').length || 0,
      pending_amount: payments?.filter(p => p.payment_status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0,
      overdue_count: payments?.filter(p => p.payment_status === 'overdue').length || 0,
      overdue_amount: payments?.filter(p => p.payment_status === 'overdue').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0
    };

    res.json({
      success: true,
      year,
      month,
      stats,
      payments: payments || []
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * POST /api/payments/export
 * 엑셀 다운로드용 데이터
 */
router.post('/export', async (req, res) => {
  try {
    const { date, status } = req.body;

    let query = req.supabase
      .from('payment_schedules')
      .select(`
        *,
        contracts(
          contract_number,
          contract_name,
          contractor_name,
          contract_type_name,
          phone_number,
          email
        )
      `)
      .order('scheduled_date', { ascending: true });

    if (date) {
      query = query.eq('scheduled_date', date);
    }

    if (status) {
      query = query.eq('payment_status', status);
    }

    const { data: payments, error } = await query;

    if (error) throw error;

    // 엑셀용 데이터 포맷
    const exportData = payments?.map(p => ({
      지급일: p.scheduled_date,
      계약번호: p.contracts?.contract_number,
      계약명: p.contracts?.contract_name,
      계약자명: p.contracts?.contractor_name || p.recipient_name,
      전화번호: p.contracts?.phone_number,
      이메일: p.contracts?.email,
      지급금액: p.amount,
      수령자명: p.recipient_name,
      은행: p.recipient_bank,
      계좌번호: p.recipient_account,
      상태: p.payment_status === 'paid' ? '지급완료' : 
            p.payment_status === 'pending' ? '지급대기' : 
            p.payment_status === 'overdue' ? '연체' : '취소',
      실제지급일: p.paid_date,
      실제지급액: p.paid_amount,
      메모: p.note
    })) || [];

    res.json({
      success: true,
      data: exportData,
      count: exportData.length,
      total_amount: payments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;