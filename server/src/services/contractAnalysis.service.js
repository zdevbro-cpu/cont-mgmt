// ========================================
// 계약서 자동 분석 서비스
// server/src/services/contractAnalysis.js
// ========================================

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

class ContractAnalysisService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }

  /**
   * 메인 분석 함수
   */
  async analyzeContract(filePath, userId) {
    const startTime = Date.now();

    try {
      console.log('📄 계약서 분석 시작:', filePath);

      // 1. 템플릿 매칭 시도
      const template = await this.findMatchingTemplate(filePath);
      console.log('🔍 템플릿 매칭:', template ? template.template_name : '없음');

      // 2. 분석 실행
      let result;
      if (template && template.accuracy_rate > 80) {
        // 템플릿 기반 분석
        result = await this.analyzeWithTemplate(filePath, template);
        result.method = 'template';
      } else {
        // AI 기반 분석
        result = await this.analyzeWithAI(filePath, template);
        result.method = 'ai';
      }

      // 3. 신뢰도 계산
      const confidence = this.calculateConfidence(result.data);

      // 4. 처리 시간
      const processingTime = Date.now() - startTime;

      console.log('✅ 분석 완료 - 방법:', result.method, '신뢰도:', confidence);

      return {
        success: true,
        data: result.data,
        confidence: confidence,
        method: result.method,
        template: template?.template_name,
        needsReview: confidence < 85,
        processingTime: processingTime
      };

    } catch (error) {
      console.error('❌ 계약서 분석 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * PDF에서 텍스트 추출
   */
  async extractTextFromPDF(filePath) {
    try {
      console.log('⚠️ PDF 파싱 임시 우회 - 빈 텍스트 반환');
      
      // 임시: PDF 파싱 우회
      // TODO: pdf-parse 문제 해결 후 실제 구현
      return `
        계약서 샘플 텍스트
        
        계약명: 투자 계약서
        계약자: 홍길동
        전화번호: 010-1234-5678
        이메일: test@example.com
        주소: 서울시 강남구 테헤란로 123
        계약일: 2025-01-15
        투자금액: 50,000,000원
        결제방법: 현금
        금융기관: 신한은행
        계좌번호: 110-123-456789
        최초지급일: 2025-02-15
      `.trim();
      
    } catch (error) {
      console.error('PDF 텍스트 추출 오류:', error);
      throw error;
    }
  }

  /**
   * 템플릿 매칭
   */
  async findMatchingTemplate(filePath) {
    const text = await this.extractTextFromPDF(filePath);
    
    // 활성 템플릿 가져오기
    const { data: templates, error } = await this.supabase
      .from('contract_templates')
      .select('*, contract_types(code, name)')
      .eq('is_active', true)
      .order('accuracy_rate', { ascending: false });

    if (error || !templates || templates.length === 0) {
      return null;
    }

    // 키워드 매칭으로 템플릿 찾기
    for (const template of templates) {
      const score = this.calculateTemplateMatch(text, template);
      if (score > 0.7) {
        return template;
      }
    }

    return null;
  }

  /**
   * 템플릿 유사도 계산
   */
  calculateTemplateMatch(text, template) {
    const keywords = [
      template.template_name,
      template.contract_types?.name,
      ...(template.special_conditions || [])
    ];

    let matchCount = 0;
    for (const keyword of keywords) {
      if (keyword && text.includes(keyword)) {
        matchCount++;
      }
    }

    return matchCount / keywords.length;
  }

  /**
   * 템플릿 기반 분석
   */
  async analyzeWithTemplate(filePath, template) {
    const text = await this.extractTextFromPDF(filePath);
    const fields = template.extraction_fields || {};
    const extractedData = {};

    // 정규식 매칭
    for (const [fieldName, fieldConfig] of Object.entries(fields)) {
      if (fieldConfig.regex_pattern) {
        const regex = new RegExp(fieldConfig.regex_pattern, 'g');
        const matches = text.match(regex);
        extractedData[fieldName] = matches ? matches[0] : null;
      }
    }

    // 계약 종류 설정
    extractedData.contract_type_id = template.contract_type_id;

    return {
      data: extractedData,
      template_id: template.id
    };
  }

  /**
   * AI 기반 분석
   */
  async analyzeWithAI(filePath, referenceTemplate = null) {
    console.log('⚠️ AI 분석 임시 우회 - 목 데이터 반환');
    
    // 임시: Claude API 호출 우회
    // TODO: API 크레딧 충전 후 실제 구현
    
    // 목(Mock) 데이터 반환
    const mockData = {
      contract_type_name: 'KF-COOP', // 계약 종류 추가
      contract_name: '투자 계약서',
      contractor_name: '홍길동',
      phone_number: '010-1234-5678',
      email: 'hong@example.com',
      address: '서울시 강남구 테헤란로 123',
      contract_date: '2025-01-15',
      amount: 50000000,
      payment_method: '현금',
      bank_name: '신한은행',
      account_number: '110-123-456789',
      first_payment_date: '2025-02-15',
      memo: 'AI 분석 테스트 - 목 데이터',
      contract_type_id: null,
      payment_months: 2 // 지급 개월 수 추가 (AI가 파악)
    };

    return {
      data: mockData,
      template_id: null
    };
    
    /* 실제 AI 분석 코드 (크레딧 충전 후 사용)
    const fileBuffer = await fs.readFile(filePath);
    const base64File = fileBuffer.toString('base64');
    const ext = path.extname(filePath).toLowerCase();
    
    const mediaType = ext === '.pdf' ? 'application/pdf' : 'image/jpeg';

    const prompt = this.buildAIPrompt(referenceTemplate);

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64File
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    });

    const responseText = message.content[0].text;
    
    // JSON 추출
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI 응답에서 JSON을 찾을 수 없습니다.');
    }
    
    const extractedData = JSON.parse(jsonMatch[0]);

    return {
      data: extractedData,
      ai_used: true
    };
    */
  }

  /**
   * AI 프롬프트 생성
   */
  buildAIPrompt(template) {
    let prompt = `
당신은 한국 계약서 분석 전문가입니다. 제공된 계약서를 분석하여 JSON 형식으로 정보를 추출하세요.

**추출할 정보:**
{
  "contract_type": "계약 종류 (KF-COOP/LAS-COOP/점주/제너럴매스/기타)",
  "contract_name": "계약명",
  "contractor_name": "계약자 이름",
  "phone_number": "전화번호",
  "address": "주소",
  "email": "이메일",
  "contract_date": "계약일 (YYYY-MM-DD 형식)",
  "payment_method": "결제 방법 (현금/카드/입금)",
  "amount": "투자금액 또는 보증금 (숫자만, 쉼표 제거)",
  "bank_name": "금융기관",
  "account_number": "계좌번호",
  "first_payment_date": "최초 수익금 지급일 (YYYY-MM-DD)",
  "payment_frequency": "지급 주기 (monthly/quarterly/annual)",
  "payment_day": "지급일 (숫자)",
  "base_payment_amount": "기본 수익금 (월/분기)",
  "special_conditions": ["특별 조건들 배열"],
  "contract_period_years": "계약 기간 (연 단위)",
  "memo": "기타 메모"
}

**중요 규칙:**
1. 날짜는 반드시 YYYY-MM-DD 형식으로 변환
2. 금액은 숫자만 추출 (쉼표, '원', '만원' 제거)
3. 정보가 없으면 null 반환
4. 반드시 유효한 JSON만 반환

**계약서 종류 판별:**
- "KF-COOP" 또는 "교육 사업 투자" 포함 → "KF-COOP"
- "LAS-COOP" 포함 → "LAS-COOP"
- "점주" 또는 "매장" 포함 → "점주"
- "제너럴매스" 또는 "교재 발간" 포함 → "제너럴매스"
`;

    if (template) {
      prompt += `\n\n**참고:** 이 계약서는 "${template.template_name}" 유형일 가능성이 높습니다.`;
    }

    return prompt;
  }

  /**
   * 신뢰도 계산
   */
  calculateConfidence(data) {
    const requiredFields = [
      'contract_name',
      'contractor_name',
      'phone_number',
      'contract_date',
      'amount'
    ];

    let filledCount = 0;
    for (const field of requiredFields) {
      if (data[field] && data[field] !== null && data[field] !== '') {
        filledCount++;
      }
    }

    return Math.round((filledCount / requiredFields.length) * 100);
  }

  /**
   * 분석 이력 저장
   */
  async saveAnalysisHistory(historyData) {
    const { error } = await this.supabase
      .from('contract_analysis_history')
      .insert(historyData);

    if (error) {
      console.error('분석 이력 저장 오류:', error);
    }
  }

  /**
   * 검증 및 학습 데이터 저장
   */
  async verifyAndLearn(contractId, corrections, userId) {
    try {
      // 1. 분석 이력 업데이트
      const { error: updateError } = await this.supabase
        .from('contract_analysis_history')
        .update({
          user_correction: corrections,
          is_verified: true,
          verified_by: userId,
          verified_at: new Date().toISOString()
        })
        .eq('contract_id', contractId);

      if (updateError) throw updateError;

      // 2. 학습 데이터 저장 (수정사항이 있을 경우)
      if (corrections && Object.keys(corrections).length > 0) {
        // 원본 텍스트 가져오기
        const { data: history } = await this.supabase
          .from('contract_analysis_history')
          .select('file_path, template_id')
          .eq('contract_id', contractId)
          .single();

        if (history) {
          const text = await this.extractTextFromPDF(history.file_path);
          
          await this.supabase
            .from('contract_learning_data')
            .insert({
              template_id: history.template_id,
              input_text: text,
              ground_truth: corrections,
              priority: 5 // 수정사항이 있으면 높은 우선순위
            });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('검증 및 학습 저장 오류:', error);
      return { success: false, error: error.message };
    }
  }
}

export default ContractAnalysisService;