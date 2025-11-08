import Tesseract from 'tesseract.js';
import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

/**
 * PDF를 텍스트로 변환 (pdf-parse 사용)
 */
const extractTextFromPDF = async (pdfPath) => {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF 텍스트 추출 오류:', error);
    return null;
  }
};

/**
 * 텍스트에서 정규식으로 필드 추출
 */
const extractFieldsFromText = (text) => {
  const fields = {};

  // 이름 추출
  const nameMatch = text.match(/계약자[:\s]*([가-힣]{2,4})/);
  fields.계약자명 = nameMatch ? { value: nameMatch[1], confidence: 85 } : { value: null, confidence: 0 };

  // 연락처 추출
  const phoneMatch = text.match(/(\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{4})/);
  fields.연락처 = phoneMatch ? { value: phoneMatch[1], confidence: 90 } : { value: null, confidence: 0 };

  // 이메일 추출
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  fields.이메일 = emailMatch ? { value: emailMatch[1], confidence: 95 } : { value: null, confidence: 0 };

  // 날짜 추출 (계약일)
  const dateMatch = text.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (dateMatch) {
    const year = dateMatch[1];
    const month = dateMatch[2].padStart(2, '0');
    const day = dateMatch[3].padStart(2, '0');
    fields.계약일 = { value: `${year}-${month}-${day}`, confidence: 95 };
  } else {
    fields.계약일 = { value: null, confidence: 0 };
  }

  // 금액 추출 (투자금액)
  const amountMatch = text.match(/(\d{1,3}(?:,\d{3})*)\s*(?:만원|원)/);
  if (amountMatch) {
    const amount = amountMatch[1].replace(/,/g, '');
    fields.투자금액 = { value: amount, confidence: 85 };
  } else {
    fields.투자금액 = { value: null, confidence: 0 };
  }

  // 은행명 추출
  const bankMatch = text.match(/(신한|국민|우리|하나|농협|기업|SC제일|씨티|카카오|토스|케이)은행/);
  fields.은행명 = bankMatch ? { value: bankMatch[0], confidence: 90 } : { value: null, confidence: 0 };

  // 계좌번호 추출
  const accountMatch = text.match(/(\d{2,4}[-\s]?\d{2,4}[-\s]?\d{4,8})/);
  fields.계좌번호 = accountMatch ? { value: accountMatch[1], confidence: 80 } : { value: null, confidence: 0 };

  // 주소 추출
  const addressMatch = text.match(/(?:서울|경기|인천|부산|대구|광주|대전|울산|세종|강원|충북|충남|전북|전남|경북|경남|제주)[시도군구\s가-힣]+/);
  fields.주소 = addressMatch ? { value: addressMatch[0], confidence: 70 } : { value: null, confidence: 0 };

  // 기본값 설정
  fields.생년월일 = { value: null, confidence: 0 };
  fields.계약시작일 = { value: null, confidence: 0 };
  fields.계약종료일 = { value: null, confidence: 0 };
  fields.투자대상지역 = { value: null, confidence: 0 };

  return fields;
};

/**
 * Tesseract.js로 계약서 파싱
 */
export const parseContractWithTesseract = async (pdfPath) => {
  try {
    console.log('📄 PDF 텍스트 추출 시작...');
    
    // 1. PDF에서 텍스트 추출 시도
    let extractedText = await extractTextFromPDF(pdfPath);
    
    if (!extractedText || extractedText.trim().length < 100) {
      // 텍스트가 없으면 OCR 시도 (스캔된 이미지 PDF)
      console.log('🔍 텍스트가 부족합니다. Tesseract OCR 실행...');
      
      // 이 부분은 PDF를 이미지로 변환한 후 OCR이 필요
      // 현재는 pdf-parse로 추출된 텍스트만 사용
      console.log('⚠️ 스캔된 PDF는 현재 지원하지 않습니다. 텍스트 기반 PDF만 가능합니다.');
    }

    console.log('📝 추출된 텍스트 길이:', extractedText?.length || 0);

    // 2. 텍스트에서 필드 추출
    const parsedData = extractFieldsFromText(extractedText || '');

    console.log('✅ 파싱 완료:', parsedData);

    return {
      success: true,
      data: parsedData,
      engine: 'tesseract-free',
      cost: 0,
      extractedText: extractedText?.substring(0, 500) // 디버깅용
    };

  } catch (error) {
    console.error('Tesseract 파싱 오류:', error);
    
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * 신뢰도에 따른 상태 분류
 */
export const getFieldStatus = (confidence) => {
  if (confidence >= 85) return 'high';      // ✅ 높음
  if (confidence >= 60) return 'medium';    // ⚠️ 중간
  return 'low';                             // ❌ 낮음
};

/**
 * OCR 사용량 기록
 */
export const logOCRUsage = async (supabase, data) => {
  try {
    const { error } = await supabase
      .from('ocr_usage_log')
      .insert({
        contract_id: data.contractId,
        ocr_engine: data.engine,
        page_count: data.pageCount || 1,
        cost_krw: data.cost || 0,
        accuracy_score: data.accuracyScore || null,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('OCR 사용량 기록 오류:', error);
    }
  } catch (error) {
    console.error('OCR 사용량 기록 실패:', error);
  }
};