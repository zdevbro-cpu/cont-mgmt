-- 테스트용 지급 스케줄 생성 (오늘, 이번주, 이번달)
-- Supabase SQL Editor에서 실행하세요

-- 1. 오늘 날짜로 테스트 데이터 생성
INSERT INTO payment_schedules (
  contract_id,
  payment_number,
  scheduled_date,
  amount,
  payment_status,
  recipient_name,
  recipient_bank,
  recipient_account
)
SELECT 
  c.id,
  99, -- 테스트용 payment_number
  CURRENT_DATE, -- 오늘
  COALESCE(c.monthly_payment, 100000),
  'pending',
  COALESCE(c.recipient_name, c.contractor_name, '테스트'),
  COALESCE(c.recipient_bank, '테스트은행'),
  COALESCE(c.recipient_account, '123-456-789')
FROM contracts c
LIMIT 3
ON CONFLICT (contract_id, payment_number) DO UPDATE
SET scheduled_date = CURRENT_DATE;

-- 2. 이번주 날짜로 테스트 데이터 생성
INSERT INTO payment_schedules (
  contract_id,
  payment_number,
  scheduled_date,
  amount,
  payment_status,
  recipient_name,
  recipient_bank,
  recipient_account
)
SELECT 
  c.id,
  98, -- 테스트용 payment_number
  CURRENT_DATE + 3, -- 3일 후
  COALESCE(c.monthly_payment, 150000),
  'pending',
  COALESCE(c.recipient_name, c.contractor_name, '테스트'),
  COALESCE(c.recipient_bank, '테스트은행'),
  COALESCE(c.recipient_account, '123-456-789')
FROM contracts c
LIMIT 3
ON CONFLICT (contract_id, payment_number) DO UPDATE
SET scheduled_date = CURRENT_DATE + 3;

-- 3. 이번달 날짜로 테스트 데이터 생성
INSERT INTO payment_schedules (
  contract_id,
  payment_number,
  scheduled_date,
  amount,
  payment_status,
  recipient_name,
  recipient_bank,
  recipient_account
)
SELECT 
  c.id,
  97, -- 테스트용 payment_number
  CURRENT_DATE + 15, -- 15일 후
  COALESCE(c.monthly_payment, 200000),
  'pending',
  COALESCE(c.recipient_name, c.contractor_name, '테스트'),
  COALESCE(c.recipient_bank, '테스트은행'),
  COALESCE(c.recipient_account, '123-456-789')
FROM contracts c
LIMIT 3
ON CONFLICT (contract_id, payment_number) DO UPDATE
SET scheduled_date = CURRENT_DATE + 15;

-- 4. 생성된 데이터 확인
SELECT 
  ps.scheduled_date,
  c.contract_number,
  c.contractor_name,
  ps.amount,
  ps.payment_status,
  CASE 
    WHEN ps.scheduled_date = CURRENT_DATE THEN '오늘'
    WHEN ps.scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7 THEN '7일이내'
    WHEN ps.scheduled_date BETWEEN DATE_TRUNC('month', CURRENT_DATE) 
         AND (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day') THEN '이번달'
    ELSE '기타'
  END as 구분
FROM payment_schedules ps
JOIN contracts c ON ps.contract_id = c.id
WHERE ps.scheduled_date >= CURRENT_DATE
  AND ps.payment_status = 'pending'
ORDER BY ps.scheduled_date
LIMIT 20;
