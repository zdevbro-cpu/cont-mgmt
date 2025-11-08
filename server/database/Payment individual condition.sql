-- ========================================
-- 개별 계약 지급 조건 처리 함수
-- ========================================

-- 기존 함수 개선: 개별 지급 조건 우선 처리
CREATE OR REPLACE FUNCTION generate_payment_schedule(
  p_contract_id INTEGER,
  p_contract_date DATE,
  p_total_amount DECIMAL,
  p_contract_type_name VARCHAR,
  p_payment_months INTEGER DEFAULT NULL  -- 개별 지급 개월 추가
) RETURNS void AS $$
DECLARE
  v_rule RECORD;
  v_payment_amount DECIMAL;
  v_start_date DATE;
  v_schedule_date DATE;
  v_recipient_name VARCHAR(100);
  v_recipient_bank VARCHAR(100);
  v_recipient_account VARCHAR(100);
  v_payment_months INTEGER;
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
  
  -- 개별 지급 개월이 지정되었으면 우선 사용
  IF p_payment_months IS NOT NULL THEN
    v_payment_months := p_payment_months;
  ELSE
    v_payment_months := v_rule.payment_months;
  END IF;
  
  -- 최초 지급일 계산
  v_start_date := p_contract_date + (v_payment_months || ' months')::INTERVAL;
  
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

-- 확인
SELECT '개별 지급 조건 처리 함수 업데이트 완료' as status;
