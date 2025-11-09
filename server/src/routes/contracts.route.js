import express from 'express';
import multer from 'multer';
import fs from 'fs';
import dotenv from 'dotenv';
import vision from '@google-cloud/vision';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 환경변수 로드
dotenv.config();

console.log('🔑 Google Vision 키 파일 경로:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

// Google Vision 클라이언트 초기화
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

// Multer 설정
const upload = multer({
  dest: 'uploads/contracts/',
  limits: { fileSize: 10 * 1024 * 1024 },
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
 * POST /api/contracts/parse-pdf
 */
router.post('/parse-pdf', upload.single('pdf'), async (req, res) => {
  const tempImagePaths = [];
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF 파일이 필요합니다' });
    }

    console.log('📄 PDF 파싱 시작:', req.file.originalname);
    console.log('📂 PDF 파일 경로:', req.file.path);
    const startTime = Date.now();

    // 1. PDF 페이지 수 확인
    const gmPath = 'C:\\Program Files\\GraphicsMagick-1.3.46-Q16\\gm.exe';
    const identifyCommand = `"${gmPath}" identify "${req.file.path}"`;
    
    let pageCount = 1;
    try {
      const { stdout } = await execAsync(identifyCommand);
      const lines = stdout.trim().split('\n');
      pageCount = lines.length;
      console.log('📄 PDF 페이지 수:', pageCount);
    } catch (err) {
      console.log('⚠️ 페이지 수 확인 실패, 기본값 사용');
    }

    // 2. 모든 페이지를 이미지로 변환
    console.log('🔄 PDF → 이미지 변환 중 (모든 페이지)...');
    const allTexts = [];
    
    for (let i = 0; i < pageCount; i++) {
      const tempImagePath = `${req.file.path}_page${i}.png`;
      tempImagePaths.push(tempImagePath);
      
      const command = `"${gmPath}" convert -density 200 "${req.file.path}[${i}]" "${tempImagePath}"`;
      
      try {
        await execAsync(command);
        console.log(`✅ 페이지 ${i + 1}/${pageCount} 변환 완료`);
        
        if (!fs.existsSync(tempImagePath)) {
          throw new Error(`페이지 ${i + 1} 이미지 파일이 생성되지 않았습니다`);
        }
        
        // 각 페이지 OCR
        console.log(`🔍 페이지 ${i + 1} OCR 시작...`);
        const [apiResult] = await visionClient.textDetection(tempImagePath);

        if (apiResult.error) {
          console.error(`❌ 페이지 ${i + 1} OCR 오류:`, apiResult.error);
          continue;
        }

        const detections = apiResult.textAnnotations;
        if (detections && detections.length > 0) {
          const pageText = detections[0].description;
          allTexts.push(pageText);
          console.log(`✅ 페이지 ${i + 1} OCR 완료 (${pageText.length}자)`);
        }
        
      } catch (pageError) {
        console.error(`❌ 페이지 ${i + 1} 처리 오류:`, pageError.message);
        continue;
      }
    }

    if (allTexts.length === 0) {
      throw new Error('모든 페이지에서 텍스트를 추출할 수 없습니다.');
    }

    // 3. 모든 페이지 텍스트 합치기
    const fullText = allTexts.join('\n\n');
    
    console.log('✅ 전체 OCR 성공!');
    console.log('📝 추출된 텍스트 길이:', fullText.length);
    console.log('📄 텍스트 샘플 (처음 500자):\n', fullText.substring(0, 500));
    console.log('📄 텍스트 샘플 (마지막 500자):\n', fullText.substring(fullText.length - 500));

    // 4. 텍스트 파싱
    const extractedData = parseContractText(fullText);

    // 5. 임시 파일 삭제
    fs.unlinkSync(req.file.path);
    tempImagePaths.forEach(path => {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
    });

    const processingTime = Date.now() - startTime;
    console.log(`✅ 파싱 완료! (${processingTime}ms)`);

    res.json({
      success: true,
      data: extractedData,
      engine: 'google-vision',
      processingTime: processingTime,
      pagesProcessed: allTexts.length
    });

  } catch (error) {
    console.error('❌ 파싱 오류:', error.message);
    console.error('스택:', error.stack);
    
    // 임시 파일 삭제
    try {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      tempImagePaths.forEach(path => {
        if (fs.existsSync(path)) {
          fs.unlinkSync(path);
        }
      });
    } catch (cleanupError) {
      console.error('파일 삭제 오류:', cleanupError);
    }
    
    res.status(500).json({ 
      error: '파싱 실패',
      message: error.message
    });
  }
});

/**
 * 텍스트에서 계약 정보 추출 (피드백 반영 개선 버전)
 */
function parseContractText(text) {
  const data = {};

  console.log('\n🔍 파싱 시작...');

  // 1. 계약종류 - 추출된 값 그대로 사용 (매핑 없음)
  const typeMatch = text.match(/(KF-COOP|LAS-COOP|점주|COOP)/);
  
  data.계약종류 = {
    value: typeMatch ? typeMatch[1] : null,
    confidence: typeMatch ? 95 : 0
  };
  console.log('계약종류:', data.계약종류);

  // 2. 계약일 - "826" 같은 월일 패턴만 추출 (8월 1일은 버전이므로 제외)
  let contractDate = null;
  let dateConfidence = 0;
  
  // "을" 섹션에서만 날짜 찾기 (버전 날짜 제외)
  const eulMatch = text.match(/[""]을[""][\s\S]*$/);
  const eulText = eulMatch ? eulMatch[0] : text;
  
  // 패턴 1: "2024년\n826\n" 형태
  const yearInDoc = text.match(/(\d{4})\s*년/);
  const mdInEul = eulText.match(/\n\s*(\d{3,4})\s*\n/);
  
  if (yearInDoc && mdInEul) {
    const year = yearInDoc[1];
    const md = mdInEul[1];
    
    if (md.length === 3) {
      // 826 -> 8월 26일
      const month = md.substring(0, 1).padStart(2, '0');
      const day = md.substring(1);
      contractDate = `${year}-${month}-${day}`;
      dateConfidence = 90;
    } else if (md.length === 4) {
      // 1026 -> 10월 26일
      const month = md.substring(0, 2);
      const day = md.substring(2);
      contractDate = `${year}-${month}-${day}`;
      dateConfidence = 90;
    }
  }
  
  // 패턴 2: "을" 섹션 내의 정상적인 날짜 형식
  if (!contractDate) {
    const dateMatch = eulText.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    if (dateMatch) {
      const year = dateMatch[1];
      const month = String(dateMatch[2]).padStart(2, '0');
      const day = String(dateMatch[3]).padStart(2, '0');
      contractDate = `${year}-${month}-${day}`;
      dateConfidence = 95;
    }
  }
  
  data.계약일 = { value: contractDate, confidence: dateConfidence };
  console.log('계약일:', data.계약일);

  console.log('"을" 섹션 길이:', eulText.length);

  // 3. 계약자명
  const namePatterns = [
    /성명\s*[:：]\s*\([^)]*\)?\s*([가-힣]{2,4})/,
    /성명\s*[:：]\s*([가-힣]{2,4})/,
    /\(예금주\)\s*([가-힣]{2,4})/,  // 예금주에서도 이름 추출
  ];
  
  let nameMatch = null;
  for (const pattern of namePatterns) {
    nameMatch = eulText.match(pattern);
    if (nameMatch && nameMatch[1] && nameMatch[1] !== '이예현' && nameMatch[1] !== '안재찬') {
      break;
    }
    nameMatch = null;
  }
  
  data.계약자명 = {
    value: nameMatch ? nameMatch[1] : null,
    confidence: nameMatch ? 90 : 0
  };
  console.log('계약자명:', data.계약자명);

  // 4. 연락처 - "연락전화" 라벨이 있는 것만 찾기
  const phonePatterns = [
    /연락전화\s*[:：]\s*(010[-\s]?\d{4}[-\s]?\d{4,5})/,
    /연락처\s*[:：]\s*(010[-\s]?\d{4}[-\s]?\d{4,5})/,
  ];
  
  let phoneMatch = null;
  for (const pattern of phonePatterns) {
    phoneMatch = eulText.match(pattern);
    if (phoneMatch) break;
  }
  
  data.연락처 = {
    value: phoneMatch ? phoneMatch[1].replace(/\s/g, '') : null,
    confidence: phoneMatch ? 95 : 0
  };
  console.log('연락처:', data.연락처);

  // 5. 주소
  const addressPatterns = [
    /주소\s*[:：]\s*([^\n]+(?:동|구|시|로|길|아파트)[^\n]*)/,
    /주소\s*[:：]\s*([가-힣0-9\s-]+)/
  ];
  
  let addressMatch = null;
  for (const pattern of addressPatterns) {
    addressMatch = eulText.match(pattern);
    if (addressMatch && !addressMatch[1].includes('서초구')) break;
    addressMatch = null;
  }
  
  data.주소 = {
    value: addressMatch ? addressMatch[1].trim() : null,
    confidence: addressMatch ? 85 : 0
  };
  console.log('주소:', data.주소);

  // 6. 은행명 - OCR 오류 "(44) 은행" 대응
  // "수령 계좌: (숫자) 은행" 또는 "수령 계좌: 은행명 은행" 패턴
  const bankPatterns = [
    /수령\s*계좌\s*[:：]?\s*\([^)]*\)\s*([가-힣]+)\s*은행/,  // "(44) 농협 은행"
    /수령\s*계좌\s*[:：]?\s*([가-힣]{2,4})\s*은행/,        // "농협 은행"
    /계좌\s*[:：]?\s*\([^)]*\)\s*([가-힣]+)\s*은행/,
  ];
  
  let bankMatch = null;
  let bankName = null;
  
  for (const pattern of bankPatterns) {
    bankMatch = eulText.match(pattern);
    if (bankMatch && bankMatch[1] !== '우리') {
      bankName = bankMatch[1];
      // OCR 오류로 숫자가 들어간 경우 무시
      if (!/\d/.test(bankName)) {
        break;
      }
    }
    bankMatch = null;
  }
  
  // 은행명을 못 찾았으면 예금주 근처에서 찾기
  if (!bankName) {
    const nearDepositPattern = /\(예금주\)[^\n]*\n\s*(\d{3}[-]\d{3,8}[-]\d{4,8})/;
    const nearMatch = eulText.match(nearDepositPattern);
    if (nearMatch) {
      // 예금주와 계좌번호 사이에 은행명이 있을 수 있음
      const betweenText = eulText.match(/\(예금주\)[^\n]*([가-힣]{2,4})\s*\n/);
      if (betweenText && betweenText[1]) {
        bankName = betweenText[1];
      }
    }
  }
  
  data.은행명 = {
    value: bankName ? bankName + '은행' : null,
    confidence: bankName ? 75 : 0
  };
  console.log('은행명:', data.은행명);

  // 7. 계좌번호 - 전화번호 패턴 제외, 예금주 근처에서 찾기
  // "418-910337-94407" 형태
  const accountPatterns = [
    /\(예금주\)[^\n]*\n[^\n]*\n\s*(\d{3,4}[-]\d{5,8}[-]\d{4,8})/,  // 예금주 아래 2줄
    /\(예금주\)[^\n]*\n\s*(\d{3,4}[-]\d{5,8}[-]\d{4,8})/,          // 예금주 아래 1줄
    /수령\s*계좌[^\n]*\n[^\n]*\n\s*(\d{3,4}[-]\d{5,8}[-]\d{4,8})/, // 수령계좌 아래
  ];
  
  let accountMatch = null;
  for (const pattern of accountPatterns) {
    accountMatch = eulText.match(pattern);
    if (accountMatch) {
      const account = accountMatch[1];
      // 전화번호 패턴 제외 (010으로 시작하거나 중간이 4자리)
      if (!account.startsWith('010') && !account.match(/\d{3,4}[-]\d{4}[-]\d{4}/)) {
        break;
      }
    }
    accountMatch = null;
  }
  
  data.계좌번호 = {
    value: accountMatch ? accountMatch[1] : null,
    confidence: accountMatch ? 90 : 0
  };
  console.log('계좌번호:', data.계좌번호);

  // 8. 투자금액
  let amount = null;
  let amountConfidence = 0;
  
  const amountPatterns = [
    { pattern: /(\d{1,3}(?:,\d{3})+)\s*원/, multiplier: 1, conf: 95 },
    { pattern: /(\d+)\s*천\s*만\s*원/, multiplier: 10000000, conf: 90 },
    { pattern: /(\d+)\s*억/, multiplier: 100000000, conf: 90 }
  ];
  
  for (const { pattern, multiplier, conf } of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      amount = parseInt(match[1].replace(/,/g, '')) * multiplier;
      amountConfidence = conf;
      break;
    }
  }
  
  data.투자금액 = { value: amount, confidence: amountConfidence };
  console.log('투자금액:', data.투자금액);

  // 9. 계약기간 - "5년" 패턴 추가
  const periodPatterns = [
    /계약\s*기간\s*[:：]?\s*(\d+)\s*년/,
    /제\s*\d+\s*조[^\n]*계약[^\n]*\n[^\n]*(\d+)\s*년/,  // "제6조 ... 5년"
    /(\d+)\s*년[^\n]*연장/,  // "5년으로 하되 연장"
  ];
  
  let periodMatch = null;
  for (const pattern of periodPatterns) {
    periodMatch = text.match(pattern);
    if (periodMatch) break;
  }
  
  data.계약기간_년수 = {
    value: periodMatch ? parseInt(periodMatch[1]) : null,
    confidence: periodMatch ? 90 : 0
  };
  console.log('계약기간:', data.계약기간_년수);

  // 10. 계약종료일
  if (data.계약일.value && data.계약기간_년수.value) {
    const startDate = new Date(data.계약일.value);
    const endDate = new Date(startDate);
    endDate.setFullYear(startDate.getFullYear() + data.계약기간_년수.value);
    endDate.setDate(endDate.getDate() - 1);
    data.계약종료일 = {
      value: endDate.toISOString().split('T')[0],
      confidence: 90
    };
  } else {
    data.계약종료일 = { value: null, confidence: 0 };
  }
  console.log('계약종료일:', data.계약종료일);

  // 11. 기타
  data.이메일 = { value: null, confidence: 0 };
  data.매월지급액 = { value: null, confidence: 0 };
  data.결제방법 = { value: null, confidence: 0 };

  console.log('🔍 파싱 완료\n');

  return data;
}

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