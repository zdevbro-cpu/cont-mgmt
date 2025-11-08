import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

// 환경변수 로드
dotenv.config();

console.log('🔑 ANTHROPIC_API_KEY 확인:', process.env.ANTHROPIC_API_KEY ? '설정됨 ✅' : '없음 ❌');

// Anthropic 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Multer 설정
const upload = multer({
  dest: 'uploads/contracts/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('PDF 파일만 업로드 가능합니다'));
    }
  }
});

const router = express.Router();

/**
 * GET /api/contracts
 * 계약 목록 조회 (페이징, 필터링, 정렬)
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
      .select('*', { count: 'exact' });

    // 필터링
    if (startDate) {
      query = query.gte('contract_date', startDate);
    }

    if (minAmount) {
      query = query.gte('investment_amount', minAmount);
    }

    if (paymentMethod && paymentMethod !== 'all') {
      query = query.eq('payment_method', paymentMethod);
    }

    // 정렬
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // 페이징
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
 * 계약 상세 조회
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

    res.json({
      success: true,
      contract
    });

  } catch (error) {
    console.error('계약 상세 조회 오류:', error);
    res.status(500).json({ error: '상세 조회 실패' });
  }
});

/**
 * POST /api/contracts/parse-pdf
 * Claude API를 사용한 실제 PDF 파싱
 */
router.post('/parse-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF 파일이 필요합니다' });
    }

    console.log('📄 PDF 파싱 시작:', req.file.originalname);

    // PDF 파일을 base64로 인코딩
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfBase64 = pdfBuffer.toString('base64');

    // Claude API로 PDF 분석
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64
            }
          },
          {
            type: 'text',
            text: `이 계약서 PDF에서 다음 정보를 추출해주세요. 정보가 없으면 null로 표시하세요.

응답은 반드시 아래 JSON 형식으로만 작성하고, 다른 텍스트는 포함하지 마세요:

{
  "계약종류": "값 또는 null",
  "계약자명": "값 또는 null",
  "연락처": "값 또는 null",
  "이메일": "값 또는 null",
  "계약일": "YYYY-MM-DD 형식 또는 null",
  "계약종료일": "YYYY-MM-DD 형식 또는 null",
  "투자금액": "숫자만 (예: 60000000) 또는 null",
  "매월지급액": "숫자만 (예: 3000000) 또는 null",
  "은행명": "값 또는 null",
  "계좌번호": "값 또는 null",
  "주소": "값 또는 null"
}`
          }
        ]
      }],
      temperature: 0
    });

    // Claude 응답 파싱
    let responseText = message.content[0].text;
    
    // JSON 코드 블록 제거
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const extractedFields = JSON.parse(responseText);

    // confidence 추가
    const extractedData = {};
    Object.keys(extractedFields).forEach(key => {
      const value = extractedFields[key];
      extractedData[key] = {
        value: value === 'null' ? null : value,
        confidence: value && value !== 'null' ? 90 : 0
      };
    });

    // 업로드된 파일 삭제
    fs.unlinkSync(req.file.path);

    console.log('✅ PDF 파싱 완료');

    res.json({
      success: true,
      data: extractedData,
      engine: 'claude-api',
      cost: calculateCost(message.usage)
    });

  } catch (error) {
    console.error('PDF 파싱 오류:', error);
    
    // 파일 삭제 (에러 발생 시)
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'PDF 파싱 실패: ' + error.message });
  }
});

// 비용 계산 함수
function calculateCost(usage) {
  const inputCost = (usage.input_tokens / 1000000) * 3; // $3 per million
  const outputCost = (usage.output_tokens / 1000000) * 15; // $15 per million
  return {
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    total_usd: (inputCost + outputCost).toFixed(4)
  };
}

/**
 * POST /api/contracts
 * 계약 생성
 */
router.post('/', async (req, res) => {
  try {
    const contractData = req.body;

    // 1. 계약종류 코드 조회
    const { data: contractType, error: typeError } = await req.supabase
      .from('contract_types')
      .select('code')
      .eq('id', contractData.contract_type_id)
      .single();

    if (typeError || !contractType) {
      return res.status(400).json({ error: '유효하지 않은 계약종류입니다' });
    }

    // 2. 날짜를 YYYYMMDD 형식으로 변환
    const contractDate = new Date(contractData.contract_date);
    const dateStr = contractDate.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD

    // 3. 같은 날짜, 같은 계약종류의 마지막 계약번호 조회
    const contractNumberPrefix = `${contractType.code}-${dateStr}`;
    const { data: lastContract } = await req.supabase
      .from('contracts')
      .select('contract_number')
      .like('contract_number', `${contractNumberPrefix}%`)
      .order('contract_number', { ascending: false })
      .limit(1)
      .single();

    // 4. 일련번호 계산
    let serialNumber = 1;
    if (lastContract && lastContract.contract_number) {
      const lastNumber = lastContract.contract_number.split('-')[2];
      serialNumber = parseInt(lastNumber) + 1;
    }

    // 5. 계약번호 생성 (일련번호 3자리)
    const contractNumber = `${contractNumberPrefix}-${String(serialNumber).padStart(3, '0')}`;

    // 6. 계약 데이터에 계약번호 추가
    contractData.contract_number = contractNumber;

    // 7. 계약 생성
    const { data: newContract, error } = await req.supabase
      .from('contracts')
      .insert([contractData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      contract: newContract
    });

  } catch (error) {
    console.error('계약 생성 오류:', error);
    res.status(500).json({ error: '계약 생성 실패' });
  }
});

/**
 * PUT /api/contracts/:id
 * 계약 수정
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

    res.json({
      success: true,
      contract: updatedContract
    });

  } catch (error) {
    console.error('계약 수정 오류:', error);
    res.status(500).json({ error: '계약 수정 실패' });
  }
});

/**
 * DELETE /api/contracts/:id
 * 계약 삭제
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await req.supabase
      .from('contracts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: '계약이 삭제되었습니다'
    });

  } catch (error) {
    console.error('계약 삭제 오류:', error);
    res.status(500).json({ error: '계약 삭제 실패' });
  }
});

export default router;