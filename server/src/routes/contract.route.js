// ========================================
// 계약서 API 라우트
// server/src/routes/contracts.js
// ========================================

import express from 'express';
import multer from 'multer';
import path from 'path';
import ContractAnalysisService from '../services/contractAnalysis.service.js';
import { authenticate, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * GET /api/contracts
 * 계약서 목록 조회
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 계약서 목록 조회 요청');

    const { data: contracts, error } = await req.supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 목록 조회 오류:', error);
      throw error;
    }

    console.log(`✅ 계약서 ${contracts.length}건 조회 성공`);

    res.json({
      success: true,
      contracts: contracts
    });

  } catch (error) {
    console.error('계약서 목록 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/contracts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('PDF, JPG, PNG 파일만 업로드 가능합니다.'));
    }
  }
});

/**
 * POST /api/contracts/analyze
 * 계약서 자동 분석
 */
router.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    console.log('📤 파일 업로드됨:', req.file.filename);

    // 계약서 분석 (매번 새 인스턴스 생성)
    const contractAnalysisService = new ContractAnalysisService();
    const result = await contractAnalysisService.analyzeContract(
      req.file.path,
      'temp-user-id' // 임시 사용자 ID
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data,
      confidence: result.confidence,
      method: result.method,
      template: result.template,
      needsReview: result.needsReview,
      filePath: req.file.path
    });

  } catch (error) {
    console.error('계약서 분석 API 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/contracts
 * 계약서 저장 (분석 후)
 */
router.post('/', async (req, res) => {
  try {
    console.log('📨 받은 요청 데이터:', JSON.stringify(req.body, null, 2));
    
    const {
      contract_number,
      contract_name,
      contractor_name,
      phone_number,
      address,
      email,
      contract_date,
      payment_method,
      amount,
      bank_name,
      account_number,
      first_payment_date,
      memo,
      contract_type_id,
      analysis_file_path,
      analysis_method,
      confidence_score
    } = req.body;

    console.log('🔍 추출된 contract_number:', contract_number);

    // 임시 사용자 ID
    const tempUserId = '00000000-0000-0000-0000-000000000000';

    // 계약 번호 자동 생성 (없으면)
    let finalContractNumber = contract_number;
    if (!finalContractNumber) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const timestamp = Date.now().toString().slice(-6);
      finalContractNumber = `C${year}${month}${day}-${timestamp}`;
    }

    // 계약 번호 중복 체크
    const { data: existingContract } = await req.supabase
      .from('contracts')
      .select('id, contract_number')
      .eq('contract_number', finalContractNumber)
      .single();

    if (existingContract) {
      console.log('⚠️ 중복된 계약 번호:', finalContractNumber);
      return res.status(400).json({ 
        error: '이미 존재하는 계약 번호입니다.',
        duplicate: true,
        existingContractNumber: finalContractNumber
      });
    }

    // 같은 계약 내용 중복 체크 (계약자 + 전화번호 + 계약일)
    if (contractor_name && phone_number && contract_date) {
      const { data: duplicateContracts } = await req.supabase
        .from('contracts')
        .select('id, contract_number, contractor_name, amount')
        .eq('contractor_name', contractor_name)
        .eq('phone_number', phone_number)
        .eq('contract_date', contract_date);

      if (duplicateContracts && duplicateContracts.length > 0) {
        const duplicate = duplicateContracts[0];
        console.log('⚠️ 유사한 계약 발견:', duplicate.contract_number);
        return res.status(400).json({ 
          error: `동일한 계약자의 같은 날짜 계약이 이미 존재합니다.\n\n계약번호: ${duplicate.contract_number}\n계약자: ${duplicate.contractor_name}\n금액: ${duplicate.amount?.toLocaleString()}원`,
          duplicateContent: true,
          existingContract: duplicate
        });
      }
    }

    console.log('💾 계약 저장 시도:', finalContractNumber);

    // Supabase에 계약 저장
    // 임시: manager_id, created_by를 NULL로 (인증 시스템 구현 전)
    const { data: contract, error } = await req.supabase
      .from('contracts')
      .insert({
        contract_number: finalContractNumber,
        contract_name,
        contractor_name,
        phone_number,
        address,
        email,
        contract_date,
        payment_method,
        amount,
        bank_name,
        account_number,
        first_payment_date,
        memo,
        contract_type_id
        // manager_id, created_by는 생략 (NULL)
      })
      .select()
      .single();

    if (error) {
      console.error('❌ 계약 저장 오류:', error);
      throw error;
    }

    console.log('✅ 계약 저장 성공:', contract.id);

    // 분석 이력 저장
    if (analysis_file_path) {
      await req.supabase
        .from('contract_analysis_history')
        .insert({
          contract_id: contract.id,
          file_path: analysis_file_path,
          ai_extraction: req.body.original_data || {},
          confidence_score: confidence_score,
          analysis_method: analysis_method
        });
    }

    res.status(201).json({
      success: true,
      contract: contract
    });

  } catch (error) {
    console.error('계약서 저장 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/contracts/:id/verify
 * 분석 결과 검증
 */
router.post('/:id/verify', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { corrections } = req.body;

    const result = await contractAnalysisService.verifyAndLearn(
      id,
      corrections,
      req.user.id
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: '검증이 완료되었습니다.'
    });

  } catch (error) {
    console.error('검증 API 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/contracts
 * 계약서 목록 조회
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      paymentMethod,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;
    
    const offset = (page - 1) * limit;

    let query = req.supabase
      .from('contracts')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1);

    // 텍스트 검색
    if (search) {
      query = query.or(`contractor_name.ilike.%${search}%,contract_number.ilike.%${search}%,phone_number.ilike.%${search}%`);
    }

    // 날짜 범위 필터
    if (startDate) {
      query = query.gte('contract_date', startDate);
    }
    if (endDate) {
      query = query.lte('contract_date', endDate);
    }

    // 금액 범위 필터
    if (minAmount) {
      query = query.gte('amount', parseFloat(minAmount));
    }
    if (maxAmount) {
      query = query.lte('amount', parseFloat(maxAmount));
    }

    // 결제 방법 필터
    if (paymentMethod && paymentMethod !== 'all') {
      query = query.eq('payment_method', paymentMethod);
    }

    // 정렬
    const validSortFields = ['created_at', 'contract_date', 'amount', 'contractor_name'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const ascending = sortOrder === 'asc';
    query = query.order(sortField, { ascending });

    const { data: contracts, error, count } = await query;

    if (error) {
      console.error('❌ 목록 조회 오류:', error);
      throw error;
    }

    console.log(`✅ 계약서 목록 조회 성공: ${contracts?.length}개 (필터: ${Object.keys(req.query).length}개)`);

    res.json({
      success: true,
      contracts: contracts || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      filters: {
        search,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        paymentMethod,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('계약서 목록 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/contracts/:id
 * 계약서 상세 조회
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔍 계약서 상세 조회:', id);

    const { data: contract, error } = await req.supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ 조회 오류:', error);
      throw error;
    }

    if (!contract) {
      return res.status(404).json({ error: '계약서를 찾을 수 없습니다.' });
    }

    console.log('✅ 계약서 조회 성공:', contract.contract_number);

    res.json({
      success: true,
      contract: contract
    });

  } catch (error) {
    console.error('계약서 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/contracts/:id
 * 계약서 수정
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      contract_name,
      contractor_name,
      phone_number,
      address,
      email,
      contract_date,
      payment_method,
      amount,
      bank_name,
      account_number,
      first_payment_date,
      memo,
      contract_type_id
    } = req.body;

    console.log('✏️ 계약서 수정 시도:', id);

    // 수정할 데이터만 포함
    const updateData = {};
    if (contract_name !== undefined) updateData.contract_name = contract_name;
    if (contractor_name !== undefined) updateData.contractor_name = contractor_name;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (address !== undefined) updateData.address = address;
    if (email !== undefined) updateData.email = email;
    if (contract_date !== undefined) updateData.contract_date = contract_date;
    if (payment_method !== undefined) updateData.payment_method = payment_method;
    if (amount !== undefined) updateData.amount = amount;
    if (bank_name !== undefined) updateData.bank_name = bank_name;
    if (account_number !== undefined) updateData.account_number = account_number;
    if (first_payment_date !== undefined) updateData.first_payment_date = first_payment_date;
    if (memo !== undefined) updateData.memo = memo;
    if (contract_type_id !== undefined) updateData.contract_type_id = contract_type_id;

    // updated_at 자동 갱신
    updateData.updated_at = new Date().toISOString();

    const { data: contract, error } = await req.supabase
      .from('contracts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ 수정 오류:', error);
      throw error;
    }

    console.log('✅ 계약서 수정 성공:', contract.contract_number);

    res.json({
      success: true,
      contract: contract,
      message: '계약서가 수정되었습니다.'
    });

  } catch (error) {
    console.error('계약서 수정 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/contracts/:id
 * 계약서 삭제
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ 계약서 삭제 시도:', id);

    // 먼저 계약서 존재 확인
    const { data: existingContract, error: checkError } = await req.supabase
      .from('contracts')
      .select('contract_number')
      .eq('id', id)
      .single();

    if (checkError || !existingContract) {
      return res.status(404).json({ error: '계약서를 찾을 수 없습니다.' });
    }

    // 삭제 실행
    const { error } = await req.supabase
      .from('contracts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ 삭제 오류:', error);
      throw error;
    }

    console.log('✅ 계약서 삭제 성공:', existingContract.contract_number);

    res.json({
      success: true,
      message: '계약서가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('계약서 삭제 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;