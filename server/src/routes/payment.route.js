import express from 'express';

const router = express.Router();

// GET /api/payments/test - 테스트용 엔드포인트
router.get('/test', async (req, res) => {
    try {
        const { data, error } = await req.supabase
            .from('payment_schedules')
            .select('*')
            .limit(10);

        if (error) {
            console.error('Test endpoint error:', error);
            return res.status(500).json({ error: error.message, details: error });
        }

        res.json({
            message: 'Test endpoint',
            count: data.length,
            data: data
        });
    } catch (error) {
        console.error('Test endpoint exception:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/payments/today - 오늘 지급 예정 목록
router.get('/today', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        console.log('🔍 Fetching today payments for date:', today);

        const { data, error } = await req.supabase
            .from('payment_schedules')
            .select(`
        *,
        contracts (
          contract_number,
          contract_date,
          contractor_name,
          contract_types (
            name
          )
        )
      `)
            .eq('scheduled_date', today)
            .eq('payment_status', 'pending')
            .order('scheduled_date', { ascending: true });

        if (error) {
            console.error('❌ Error fetching today payments:', error);
            throw error;
        }

        console.log('✅ Found payments:', data.length);
        if (data.length > 0) {
            console.log('Sample payment:', data[0]);
        }

        const total_amount = data.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        res.json({
            payments: data,
            count: data.length,
            total_amount
        });
    } catch (error) {
        console.error('Error fetching today payments:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/payments/upcoming - 7일 이내 지급 예정 (내일부터 7일간)
router.get('/upcoming', async (req, res) => {
    try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        console.log('🔍 Fetching upcoming payments from:', tomorrow.toISOString().split('T')[0], 'to:', nextWeek.toISOString().split('T')[0]);

        const { data, error } = await req.supabase
            .from('payment_schedules')
            .select(`
        *,
        contracts (
          contract_number,
          contract_date,
          contractor_name,
          contract_types (
            name
          )
        )
      `)
            .gte('scheduled_date', tomorrow.toISOString().split('T')[0])
            .lte('scheduled_date', nextWeek.toISOString().split('T')[0])
            .eq('payment_status', 'pending')
            .order('scheduled_date', { ascending: true });

        if (error) {
            console.error('❌ Error fetching upcoming payments:', error);
            throw error;
        }

        console.log('✅ Found upcoming payments:', data.length);

        const total_amount = data.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        res.json({
            payments: data,
            count: data.length,
            total_amount
        });
    } catch (error) {
        console.error('Error fetching upcoming payments:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/payments/this-week - 이번 주 지급
router.get('/this-week', async (req, res) => {
    try {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const { data, error } = await req.supabase
            .from('payment_schedules')
            .select(`
        *,
        contracts (
          contract_number,
          contract_date,
          contractor_name,
          contract_types (
            name
          )
        )
      `)
            .gte('scheduled_date', monday.toISOString().split('T')[0])
            .lte('scheduled_date', sunday.toISOString().split('T')[0])
            .eq('payment_status', 'pending')
            .order('scheduled_date', { ascending: true });

        if (error) throw error;

        const total_amount = data.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        res.json({
            payments: data,
            count: data.length,
            total_amount
        });
    } catch (error) {
        console.error('Error fetching this week payments:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/payments/this-month - 이번 달 지급
router.get('/this-month', async (req, res) => {
    try {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const { data, error } = await req.supabase
            .from('payment_schedules')
            .select(`
        *,
        contracts (
          contract_number,
          contract_date,
          contractor_name,
          contract_types (
            name
          )
        )
      `)
            .gte('scheduled_date', firstDay.toISOString().split('T')[0])
            .lte('scheduled_date', lastDay.toISOString().split('T')[0])
            .eq('payment_status', 'pending')
            .order('scheduled_date', { ascending: true });

        if (error) throw error;

        const total_amount = data.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        res.json({
            payments: data,
            count: data.length,
            total_amount
        });
    } catch (error) {
        console.error('Error fetching this month payments:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/payments/schedule/:id - 계약별 지급 스케줄 조회
router.get('/schedule/:id', async (req, res) => {
    try {
        const { id } = req.params;

        console.log('📅 Fetching payment schedule for contract:', id);

        const { data, error } = await req.supabase
            .from('payment_schedules')
            .select('*')
            .eq('contract_id', id)
            .order('payment_number', { ascending: true });

        if (error) {
            console.error('❌ Error fetching schedule:', error);
            throw error;
        }

        console.log('✅ Found schedules:', data.length);

        res.json({
            schedules: data || [],
            count: data.length
        });
    } catch (error) {
        console.error('Error fetching payment schedule:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/payments/by-date - 날짜별 지급 조회
router.get('/by-date', async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: 'Date parameter is required' });
        }

        const { data, error } = await req.supabase
            .from('payment_schedules')
            .select(`
        *,
        contracts (
          contract_number,
          contract_date,
          contractor_name,
          contract_types (
            name
          )
        )
      `)
            .eq('scheduled_date', date)
            .eq('payment_status', 'pending')
            .order('scheduled_date', { ascending: true });

        if (error) throw error;

        const total_amount = data.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        res.json({
            payments: data,
            count: data.length,
            total_amount
        });
    } catch (error) {
        console.error('Error fetching payments by date:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/payments/:id/status - 지급 상태 업데이트
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paid_date } = req.body;

        const { data, error } = await req.supabase
            .from('payment_schedules')
            .update({
                payment_status: status,
                paid_date,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();

        if (error) throw error;

        res.json({
            message: 'Payment status updated successfully',
            payment: data[0]
        });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/payments/export - 엑셀 다운로드용 데이터
router.post('/export', async (req, res) => {
    try {
        const { date, status } = req.body;

        let query = req.supabase
            .from('payment_schedules')
            .select(`
        *,
        contracts (
          contract_number,
          contract_date,
          contractor_name,
          contract_types (
            name
          )
        )
      `);

        if (date) {
            query = query.eq('scheduled_date', date);
        }

        if (status) {
            query = query.eq('payment_status', status);
        }

        const { data, error } = await query.order('scheduled_date', { ascending: true });

        if (error) throw error;

        // 엑셀용 데이터 포맷팅
        const exportData = data.map(payment => ({
            '계약번호': payment.contracts?.contract_number || '-',
            '계약종류': payment.contracts?.contract_types?.name || '-',
            '계약일자': payment.contracts?.contract_date || '-',
            '계약자명': payment.contracts?.contractor_name || '-',
            '수령자명': payment.recipient_name || '-',
            '은행': payment.recipient_bank || '-',
            '계좌번호': payment.recipient_account || '-',
            '지급금액': payment.amount || 0,
            '지급예정일': payment.scheduled_date || '-',
            '상태': payment.payment_status === 'paid' ? '완료' : '대기'
        }));

        res.json({
            data: exportData,
            count: exportData.length
        });
    } catch (error) {
        console.error('Error exporting payments:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
