import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * PDF를 Base64로 변환
 */
const pdfToBase64 = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  return fileBuffer.toString('base64');
};

/**
 * Claude Vision으로 계약서 파싱
 */
export const parseContractWithClaude = async (pdfPath) => {
  try {
    const pdfBase64 = pdfToBase64(pdfPath);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            },
            {
              type: 'text',
              text: `이 계약서 PDF에서 다음 정보를 추출해주세요. 각 필드마다 신뢰도 점수(0-100)도 함께 제공해주세요.

추출할 정보:
1. 계약자명 (이름)
2. 계약일 (날짜)
3. 생년월일 또는 성명 (자필 서명)
4. 연락처 (전화번호)
5. 주소
6. 이메일
7. 은행명
8. 계좌번호
9. 투자금액 또는 계약금액
10. 계약 시작일
11. 계약 종료일 (만기일)
12. 투자 대상 지역 (시/군/구)

**중요:**
- 응답은 반드시 JSON 형식으로만 제공하세요.
- 수기로 작성된 부분도 최선을 다해 읽어주세요.
- 확실하지 않은 정보는 신뢰도 점수를 낮게 주세요.
- 정보가 없으면 null로 표시하세요.

JSON 형식:
{
  "계약자명": { "value": "홍길동", "confidence": 95 },
  "계약일": { "value": "2024-10-31", "confidence": 100 },
  "생년월일": { "value": "1990-01-01", "confidence": 70 },
  "연락처": { "value": "010-1234-5678", "confidence": 90 },
  "주소": { "value": "서울시 강남구...", "confidence": 60 },
  "이메일": { "value": "test@example.com", "confidence": 95 },
  "은행명": { "value": "신한은행", "confidence": 100 },
  "계좌번호": { "value": "110-123-456789", "confidence": 85 },
  "투자금액": { "value": "20000000", "confidence": 95 },
  "계약시작일": { "value": "2024-10-01", "confidence": 100 },
  "계약종료일": { "value": "2025-10-01", "confidence": 100 },
  "투자대상지역": { "value": "서울시 강남구", "confidence": 80 }
}

응답은 오직 JSON만 작성하고, 다른 설명은 추가하지 마세요.`
            }
          ]
        }
      ]
    });

    // Claude 응답에서 JSON 추출
    let responseText = message.content[0].text;
    
    // JSON 블록 제거 (```json ... ``` 형식)
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // JSON 파싱
    const parsedData = JSON.parse(responseText);

    return {
      success: true,
      data: parsedData,
      engine: 'claude-vision',
      cost: 0
    };

  } catch (error) {
    console.error('Claude Vision 파싱 오류:', error);
    
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