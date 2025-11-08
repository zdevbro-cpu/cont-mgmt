// ========================================
// 확장 가능한 계약서 자동 분석 시스템
// ========================================

/**
 * 핵심 개념:
 * 1. 템플릿 기반 분석 (알려진 계약서)
 * 2. AI 자동 학습 (신규 계약서)
 * 3. 사용자 검증 및 템플릿 등록
 */

// ========================================
// 1. 데이터베이스 스키마 추가
// ========================================

-- 계약서 템플릿 테이블
CREATE TABLE contract_templates (
  id SERIAL PRIMARY KEY,
  contract_type_id INTEGER REFERENCES contract_types(id),
  template_name TEXT NOT NULL,
  template_version TEXT DEFAULT '1.0',
  
  -- AI 분석 프롬프트
  analysis_prompt TEXT,
  
  -- 추출 필드 정의 (JSON)
  extraction_fields JSONB NOT NULL,
  /* 예시:
  {
    "contractor_name": {
      "type": "text",
      "required": true,
      "regex_pattern": "이하.*칭함\\)와\\s*([가-힣]+)"
    },
    "investment_amount": {
      "type": "number",
      "required": true,
      "regex_pattern": "투자.*금액.*([0-9,]+).*원"
    },
    "payment_schedule": {
      "type": "object",
      "calculation_rules": {...}
    }
  }
  */
  
  -- 지급 조건 계산 로직 (JSON)
  payment_calculation_rules JSONB,
  /* 예시:
  {
    "base_payment": {
      "10000000": {"monthly": 500000},
      "30000000": {"monthly": 1500000}
    },
    "bonus_payment": {
      "member_revenue": {"rate": 0.20}
    }
  }
  */
  
  -- 특별 조건 (JSON 배열)
  special_conditions JSONB,
  
  -- 유효성 검증 규칙
  validation_rules JSONB,
  
  -- 메타데이터
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  accuracy_rate NUMERIC(5,2) DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 계약서 분석 이력 테이블
CREATE TABLE contract_analysis_history (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER REFERENCES contracts(id),
  template_id INTEGER REFERENCES contract_templates(id),
  
  -- 원본 파일 정보
  file_path TEXT NOT NULL,
  
  -- AI 분석 결과 (JSON)
  ai_extraction JSONB,
  
  -- 사용자 수정 결과 (JSON)
  user_correction JSONB,
  
  -- 분석 신뢰도
  confidence_score NUMERIC(5,2),
  
  -- 분석 방법
  analysis_method TEXT CHECK (analysis_method IN ('template', 'ai', 'hybrid')),
  
  -- 분석 시간 (ms)
  processing_time INTEGER,
  
  -- 검증 상태
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 학습 데이터 테이블 (AI 개선용)
CREATE TABLE contract_learning_data (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES contract_templates(id),
  
  -- 입력 데이터 (PDF 텍스트)
  input_text TEXT NOT NULL,
  
  -- 정답 데이터 (사용자 검증 완료)
  ground_truth JSONB NOT NULL,
  
  -- 학습 우선순위
  priority INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_contract_templates_type ON contract_templates(contract_type_id);
CREATE INDEX idx_contract_analysis_contract ON contract_analysis_history(contract_id);
CREATE INDEX idx_contract_analysis_template ON contract_analysis_history(template_id);

-- ========================================
// 2. 백엔드 API 구조
// ========================================

/**
 * POST /api/contracts/analyze
 * 
 * 계약서 자동 분석 API
 * - 템플릿 매칭 시도
 * - AI 분석 실행
 * - 신뢰도 기반 사용자 확인 요청
 */

// server/src/services/contractAnalysis.js

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

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
   * 계약서 분석 메인 함수
   */
  async analyzeContract(filePath, userId) {
    const startTime = Date.now();

    try {
      // 1단계: 템플릿 매칭 시도
      const template = await this.findMatchingTemplate(filePath);

      // 2단계: 분석 방법 결정
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

      // 3단계: 신뢰도 계산
      const confidence = this.calculateConfidence(result);

      // 4단계: 이력 저장
      await this.saveAnalysisHistory({
        file_path: filePath,
        template_id: template?.id,
        ai_extraction: result.data,
        confidence_score: confidence,
        analysis_method: result.method,
        processing_time: Date.now() - startTime
      });

      return {
        success: true,
        data: result.data,
        confidence: confidence,
        method: result.method,
        template: template?.template_name,
        needsReview: confidence < 85
      };

    } catch (error) {
      console.error('계약서 분석 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 템플릿 매칭
   */
  async findMatchingTemplate(filePath) {
    const text = await this.extractTextFromPDF(filePath);
    
    // 모든 활성 템플릿 가져오기
    const { data: templates } = await this.supabase
      .from('contract_templates')
      .select('*')
      .eq('is_active', true)
      .order('accuracy_rate', { ascending: false });

    if (!templates || templates.length === 0) {
      return null;
    }

    // 각 템플릿과 유사도 계산
    for (const template of templates) {
      const matchScore = this.calculateTemplateMatch(text, template);
      if (matchScore > 0.7) {
        return template;
      }
    }

    return null;
  }

  /**
   * 템플릿 기반 분석
   */
  async analyzeWithTemplate(filePath, template) {
    const text = await this.extractTextFromPDF(filePath);
    const fields = template.extraction_fields;
    const extractedData = {};

    // 필드별 정규식 매칭
    for (const [fieldName, fieldConfig] of Object.entries(fields)) {
      if (fieldConfig.regex_pattern) {
        const regex = new RegExp(fieldConfig.regex_pattern, 'g');
        const match = text.match(regex);
        extractedData[fieldName] = match ? match[0] : null;
      }
    }

    // 지급 조건 계산
    if (template.payment_calculation_rules) {
      extractedData.calculated_payments = this.calculatePayments(
        extractedData,
        template.payment_calculation_rules
      );
    }

    return {
      data: extractedData,
      template_used: template.id
    };
  }

  /**
   * AI 기반 분석 (Claude API)
   */
  async analyzeWithAI(filePath, referenceTemplate = null) {
    const imageBuffer = await fs.readFile(filePath);
    const base64Image = imageBuffer.toString('base64');

    // 동적 프롬프트 생성
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
                media_type: 'application/pdf',
                data: base64Image
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
    const extractedData = JSON.parse(responseText);

    return {
      data: extractedData,
      ai_used: true
    };
  }

  /**
   * 동적 AI 프롬프트 생성
   */
  buildAIPrompt(template) {
    const basePrompt = `
당신은 계약서 분석 전문가입니다. 제공된 계약서를 분석하여 JSON 형식으로 정보를 추출하세요.

**기본 추출 정보:**
- contract_type: 계약 종류
- contract_name: 계약명
- contractor_name: 계약자 이름
- phone_number: 전화번호
- address: 주소
- email: 이메일
- contract_date: 계약일 (YYYY-MM-DD)
- investment_amount: 투자금액 (숫자만)
- payment_method: 결제 방법
- bank_name: 금융기관
- account_number: 계좌번호
- first_payment_date: 최초 지급일 (YYYY-MM-DD)

**지급 조건 분석:**
- payment_frequency: 지급 주기 (monthly/quarterly/annual)
- payment_day: 지급일 (매월 N일)
- base_payment_amount: 기본 지급액
- bonus_conditions: 성과금 조건 (배열)

**특별 조건 추출:**
- special_conditions: 특별 조건 배열
- contract_period: 계약 기간
- penalty_clauses: 위약 조건

**계약서 유형 판별:**
아래 패턴으로 계약서 종류를 판별하세요:
- "KF-COOP" 또는 "COOP" 포함 → type: "c"
- "LAS-COOP" 포함 → type: "l"
- "점주" 포함 → type: "o"
- "제너럴매스" 또는 "교재 발간" 포함 → type: "p"
- 그 외 → type: "unknown"
`;

    // 템플릿이 있으면 추가 힌트 제공
    if (template) {
      return basePrompt + `\n\n**참고 템플릿:**
이 계약서는 "${template.template_name}" 유형일 가능성이 높습니다.
다음 필드들에 특히 주의하세요:
${JSON.stringify(template.extraction_fields, null, 2)}
`;
    }

    return basePrompt + '\n\nJSON 형식으로만 답변하세요.';
  }

  /**
   * 신뢰도 계산
   */
  calculateConfidence(result) {
    const data = result.data;
    const requiredFields = [
      'contract_name',
      'contractor_name',
      'phone_number',
      'contract_date',
      'investment_amount'
    ];

    let filledCount = 0;
    for (const field of requiredFields) {
      if (data[field] && data[field] !== null && data[field] !== '') {
        filledCount++;
      }
    }

    return (filledCount / requiredFields.length) * 100;
  }

  /**
   * 지급액 계산
   */
  calculatePayments(extractedData, rules) {
    const amount = parseFloat(extractedData.investment_amount);
    const payments = {};

    // 기본 지급액
    if (rules.base_payment) {
      const amountKey = amount.toString();
      payments.base = rules.base_payment[amountKey] || null;
    }

    // 성과금
    if (rules.bonus_payment) {
      payments.bonus = {};
      for (const [key, config] of Object.entries(rules.bonus_payment)) {
        payments.bonus[key] = config;
      }
    }

    return payments;
  }
}

export default new ContractAnalysisService();

// ========================================
// 3. 템플릿 관리 API
// ========================================

/**
 * POST /api/admin/contract-templates
 * 새 계약서 템플릿 등록
 */

// server/src/routes/admin/templates.js

router.post('/contract-templates', isAdmin, async (req, res) => {
  const {
    contract_type_id,
    template_name,
    extraction_fields,
    payment_calculation_rules,
    special_conditions
  } = req.body;

  try {
    const { data, error } = await supabase
      .from('contract_templates')
      .insert({
        contract_type_id,
        template_name,
        extraction_fields,
        payment_calculation_rules,
        special_conditions,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      template: data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/contract-templates/:id
 * 템플릿 수정
 */

router.put('/contract-templates/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const { data, error } = await supabase
      .from('contract_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      template: data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/contracts/:id/verify
 * 사용자가 AI 분석 결과 검증
 */

router.post('/contracts/:id/verify', authenticate, async (req, res) => {
  const { id } = req.params;
  const { corrections, is_correct } = req.body;

  try {
    // 1. 분석 이력 업데이트
    await supabase
      .from('contract_analysis_history')
      .update({
        user_correction: corrections,
        is_verified: true,
        verified_by: req.user.id,
        verified_at: new Date().toISOString()
      })
      .eq('contract_id', id);

    // 2. 학습 데이터로 저장 (AI 개선용)
    if (corrections && Object.keys(corrections).length > 0) {
      await supabase
        .from('contract_learning_data')
        .insert({
          template_id: req.body.template_id,
          input_text: req.body.original_text,
          ground_truth: corrections,
          priority: is_correct ? 1 : 5
        });
    }

    res.json({
      success: true,
      message: '검증이 완료되었습니다.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 4. 프론트엔드 컴포넌트
// ========================================

// client/src/components/ContractUpload.jsx

import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function ContractUpload({ onComplete }) {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setAnalyzing(true);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const response = await fetch('/api/contracts/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('분석 오류:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 파일 업로드 */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleUpload}
          className="mt-4"
        />
        <p className="mt-2 text-sm text-gray-600">
          PDF 또는 이미지 파일을 선택하세요
        </p>
      </div>

      {/* 분석 중 */}
      {analyzing && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">AI가 계약서를 분석하고 있습니다...</p>
        </div>
      )}

      {/* 분석 결과 */}
      {result && !analyzing && (
        <ContractAnalysisResult
          result={result}
          onConfirm={onComplete}
        />
      )}
    </div>
  );
}

// client/src/components/ContractAnalysisResult.jsx

export default function ContractAnalysisResult({ result, onConfirm }) {
  const [edits, setEdits] = useState({});

  const handleEdit = (field, value) => {
    setEdits({ ...edits, [field]: value });
  };

  const handleConfirm = async () => {
    // 수정사항 포함하여 저장
    await onConfirm({ ...result.data, ...edits });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* 신뢰도 표시 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">분석 완료</h3>
          <p className="text-sm text-gray-600">
            방법: {result.method === 'template' ? '템플릿' : 'AI 분석'}
          </p>
        </div>
        <div className="flex items-center">
          {result.confidence >= 85 ? (
            <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
          ) : (
            <AlertCircle className="w-6 h-6 text-yellow-500 mr-2" />
          )}
          <span className="font-semibold">신뢰도 {result.confidence}%</span>
        </div>
      </div>

      {/* 검토 필요 알림 */}
      {result.needsReview && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            ⚠️ 신뢰도가 낮습니다. 추출된 정보를 확인해주세요.
          </p>
        </div>
      )}

      {/* 추출된 데이터 편집 폼 */}
      <div className="space-y-4">
        <EditableField
          label="계약자 이름"
          value={result.data.contractor_name}
          onChange={(v) => handleEdit('contractor_name', v)}
        />
        <EditableField
          label="전화번호"
          value={result.data.phone_number}
          onChange={(v) => handleEdit('phone_number', v)}
        />
        <EditableField
          label="투자금액"
          value={result.data.investment_amount}
          type="number"
          onChange={(v) => handleEdit('investment_amount', v)}
        />
        {/* 기타 필드들... */}
      </div>

      {/* 확인 버튼 */}
      <button
        onClick={handleConfirm}
        className="mt-6 w-full bg-primary text-white py-3 rounded-lg"
      >
        확인 및 저장
      </button>
    </div>
  );
}