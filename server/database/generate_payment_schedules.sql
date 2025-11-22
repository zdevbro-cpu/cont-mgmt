-- 기존 지급 스케줄 확인 및 누락된 스케줄만 생성
-- 이 스크립트는 Supabase SQL Editor에서 실행하세요

-- 1. 먼저 현재 상태 확인
SELECT 
  '총 계약 수' as 구분,
  COUNT(*) as 개수
FROM contracts
UNION ALL
SELECT 
  '지급 스케줄이 있는 계약 수' as 구분,
  COUNT(DISTINCT contract_id) as 개수
FROM payment_schedules
UNION ALL
SELECT 
  '총 지급 스케줄 수' as 구분,
  COUNT(*) as 개수
FROM payment_schedules;

-- 2. 지급 스케줄이 없는 계약에 대해서만 생성
DO $$
DECLARE
  contract_record RECORD;
  month_num INT;
  total_months INT := 12;
BEGIN
  -- 지급 스케줄이 없는 계약만 처리
  FOR contract_record IN 
    SELECT 
      c.id, 
      c.contract_date, 
      c.monthly_payment, 
      c.amount, 
      c.contractor_name, 
      c.recipient_name, 
      c.recipient_bank, 
      c.recipient_account
    FROM contracts c
    WHERE NOT EXISTS (
      SELECT 1 FROM payment_schedules ps WHERE ps.contract_id = c.id
    )
  LOOP
    -- 12개월 치 스케줄 생성
    FOR month_num IN 1..total_months LOOP
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
        contract_record.id,
        month_num,
        contract_record.contract_date + (month_num || ' months')::INTERVAL,
        COALESCE(contract_record.monthly_payment, contract_record.amount / 12),
        'pending',
        COALESCE(contract_record.recipient_name, contract_record.contractor_name),
        COALESCE(contract_record.recipient_bank, '임시은행'),
        COALESCE(contract_record.recipient_account, '임시계좌번호')
      )
      ON CONFLICT (contract_id, payment_number) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE '계약 ID % 에 대한 스케줄 생성 완료', contract_record.id;
  END LOOP;
END $$;

-- 3. 생성 후 결과 확인
SELECT 
  c.contract_number,
  c.contractor_name,
  c.contract_date,
  COUNT(ps.id) as 지급스케줄수,
  SUM(ps.amount) as 총지급예정액,
  MIN(ps.scheduled_date) as 첫지급일,
  MAX(ps.scheduled_date) as 마지막지급일
FROM contracts c
LEFT JOIN payment_schedules ps ON c.id = ps.contract_id
GROUP BY c.id, c.contract_number, c.contractor_name, c.contract_date
ORDER BY c.contract_date DESC
LIMIT 10;

-- 4. 오늘 지급 예정 확인
SELECT 
  ps.scheduled_date as 지급일,
  c.contract_number as 계약번호,
  c.contractor_name as 계약자,
  ps.amount as 지급금액,
  ps.payment_status as 상태
FROM payment_schedules ps
JOIN contracts c ON ps.contract_id = c.id
WHERE ps.scheduled_date = CURRENT_DATE
  AND ps.payment_status = 'pending'
ORDER BY c.contract_number;
