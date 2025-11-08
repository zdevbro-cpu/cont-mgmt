-- ========================================
-- 1단계: 테이블 생성
-- ========================================

-- 1. 계약 종류별 지급 규칙 테이블
CREATE TABLE IF NOT EXISTS payment_rules (
  id SERIAL PRIMARY KEY,
  contract_type_name VARCHAR(100) NOT NULL UNIQUE,
  payment_months INTEGER NOT NULL DEFAULT 2,
  payment_frequency VARCHAR(20) NOT NULL DEFAULT 'monthly',
  payment_count INTEGER DEFAULT 1,
  payment_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 지급 스케줄 테이블
CREATE TABLE IF NOT EXISTS payment_schedules (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  payment_number INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  recipient_name VARCHAR(100),
  recipient_bank VARCHAR(100),
  recipient_account VARCHAR(100),
  paid_date DATE,
  paid_amount DECIMAL(15, 2),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(contract_id, payment_number)
);

-- 3. contracts 테이블에 컬럼 추가
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS contract_type_name VARCHAR(100);

ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(100);

ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS recipient_bank VARCHAR(100);

ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS recipient_account VARCHAR(100);

-- 확인
SELECT 'Step 1 완료: 테이블 생성됨' as status;


-- ========================================
-- 2단계: 인덱스 및 기본 데이터
-- ========================================

-- 1. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_payment_schedules_contract ON payment_schedules(contract_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_date ON payment_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_status ON payment_schedules(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_date_status ON payment_schedules(scheduled_date, payment_status);

-- 2. 기본 지급 규칙 데이터 입력
INSERT INTO payment_rules (contract_type_name, payment_months, payment_frequency, payment_count, payment_description)
VALUES 
  ('KF-COOP', 2, 'monthly', 12, '계약 후 2개월 후부터 매월 지급 (총 12회)'),
  ('LAS-COOP', 2, 'monthly', 12, '계약 후 2개월 후부터 매월 지급 (총 12회)'),
  ('점주', 3, 'monthly', 10, '계약 후 3개월 후부터 매월 지급 (총 10회)'),
  ('제너럴매스', 2, 'once', 1, '계약 후 2개월 후 일시불'),
  ('기타', 2, 'monthly', 1, '계약 후 2개월 후 지급')
ON CONFLICT (contract_type_name) DO NOTHING;

-- 확인
SELECT 'Step 2 완료: 인덱스 및 기본 데이터 생성됨' as status;
SELECT contract_type_name, payment_months, payment_frequency, payment_count 
FROM payment_rules 
ORDER BY id;


-- ========================================
-- 3단계: 함수 및 트리거
-- ========================================

-- 1. 지급 스케줄 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_payment_schedule(
  p_contract_id INTEGER,
  p_contract_date DATE,
  p_total_amount DECIMAL,
  p_contract_type_name VARCHAR
) RETURNS void AS $$
DECLARE
  v_rule RECORD;
  v_payment_amount DECIMAL;
  v_start_date DATE;
  v_schedule_date DATE;
  v_recipient_name VARCHAR(100);
  v_recipient_bank VARCHAR(100);
  v_recipient_account VARCHAR(100);
BEGIN
  -- 계약 정보 가져오기
  SELECT 
    COALESCE(recipient_name, contractor_name) as name,
    COALESCE(recipient_bank, bank_name) as bank,
    COALESCE(recipient_account, account_number) as account
  INTO v_recipient_name, v_recipient_bank, v_recipient_account
  FROM contracts
  WHERE id = p_contract_id;
  
  -- 지급 규칙 가져오기
  SELECT * INTO v_rule
  FROM payment_rules
  WHERE contract_type_name = COALESCE(p_contract_type_name, '기타')
    AND is_active = true
  LIMIT 1;
  
  -- 규칙이 없으면 '기타' 규칙 사용
  IF NOT FOUND THEN
    SELECT * INTO v_rule
    FROM payment_rules
    WHERE contract_type_name = '기타'
    LIMIT 1;
  END IF;
  
  -- 여전히 없으면 기본값 사용
  IF NOT FOUND THEN
    v_rule.payment_months := 2;
    v_rule.payment_frequency := 'monthly';
    v_rule.payment_count := 1;
  END IF;
  
  -- 최초 지급일 계산
  v_start_date := p_contract_date + (v_rule.payment_months || ' months')::INTERVAL;
  
  -- 지급 금액 계산
  v_payment_amount := p_total_amount / v_rule.payment_count;
  
  -- 스케줄 생성
  FOR i IN 1..v_rule.payment_count LOOP
    -- 지급일 계산
    IF v_rule.payment_frequency = 'monthly' THEN
      v_schedule_date := v_start_date + ((i - 1) || ' months')::INTERVAL;
    ELSIF v_rule.payment_frequency = 'weekly' THEN
      v_schedule_date := v_start_date + ((i - 1) * 7 || ' days')::INTERVAL;
    ELSE
      v_schedule_date := v_start_date;
    END IF;
    
    -- 스케줄 INSERT
    INSERT INTO payment_schedules (
      contract_id,
      payment_number,
      scheduled_date,
      amount,
      payment_status,
      recipient_name,
      recipient_bank,
      recipient_account
    ) VALUES (
      p_contract_id,
      i,
      v_schedule_date,
      v_payment_amount,
      'pending',
      v_recipient_name,
      v_recipient_bank,
      v_recipient_account
    )
    ON CONFLICT (contract_id, payment_number) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;


-- 2. 계약 생성 시 자동 스케줄 생성 트리거 함수
CREATE OR REPLACE FUNCTION trigger_generate_payment_schedule()
RETURNS TRIGGER AS $$
BEGIN
  -- 필수 정보가 있으면 스케줄 생성
  IF NEW.amount IS NOT NULL AND NEW.contract_date IS NOT NULL THEN
    PERFORM generate_payment_schedule(
      NEW.id,
      NEW.contract_date,
      NEW.amount,
      COALESCE(NEW.contract_type_name, '기타')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 3. 트리거 생성
DROP TRIGGER IF EXISTS after_contract_insert ON contracts;
CREATE TRIGGER after_contract_insert
  AFTER INSERT ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_payment_schedule();


-- 확인
SELECT 'Step 3 완료: 함수 및 트리거 생성됨' as status;