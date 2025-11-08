-- ========================================
-- 계약관리시스템 데이터베이스 초기화 및 재생성
-- ========================================

-- ========================================
-- 1단계: 기존 테이블 및 함수 삭제 (역순)
-- ========================================

-- 트리거 삭제
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles CASCADE;
DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts CASCADE;

-- 함수 삭제
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_contract_number(TEXT, TEXT, DATE) CASCADE;

-- 테이블 삭제 (참조 관계 역순)
DROP TABLE IF EXISTS payment_schedules CASCADE;
DROP TABLE IF EXISTS contract_files CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS contract_types CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ========================================
-- 2단계: 테이블 생성
-- ========================================

-- 1. 사용자 프로필 테이블
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 계약 종류 테이블
CREATE TABLE contract_types (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 계약 종류 데이터 삽입
INSERT INTO contract_types (code, name, description) VALUES
  ('p', '사과나무', '사과나무 계약'),
  ('c', 'COOP', 'COOP 계약'),
  ('l', 'LAS COOP', 'LAS COOP 계약'),
  ('o', '점주', '점주 계약'),
  ('m', '점장', '점장 계약'),
  ('a', '모니터링요원', '모니터링요원 계약'),
  ('t', '계약근무', '계약근무 계약');

-- 3. 계약 테이블
CREATE TABLE contracts (
  id SERIAL PRIMARY KEY,
  contract_number TEXT UNIQUE NOT NULL,
  
  -- 계약 기본 정보
  contract_name TEXT NOT NULL,
  contractor_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  address TEXT,
  email TEXT,
  contract_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- 금융 정보
  payment_method TEXT CHECK (payment_method IN ('현금', '카드', '입금')),
  amount NUMERIC(15, 2),
  bank_name TEXT,
  account_number TEXT,
  
  -- 수익금 지급 정보
  first_payment_date DATE,
  
  -- 메모
  memo TEXT,
  
  -- 계약 종류 및 담당자
  contract_type_id INTEGER REFERENCES contract_types(id),
  manager_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- 메타데이터
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 제약조건
  CONSTRAINT valid_phone CHECK (phone_number ~ '^[0-9-]+$')
);

-- 4. 계약서 파일 테이블 (스캔본)
CREATE TABLE contract_files (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 지급 스케줄 테이블
CREATE TABLE payment_schedules (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3단계: 인덱스 생성
-- ========================================
CREATE INDEX idx_contracts_contract_date ON contracts(contract_date);
CREATE INDEX idx_contracts_contractor_name ON contracts(contractor_name);
CREATE INDEX idx_contracts_phone_number ON contracts(phone_number);
CREATE INDEX idx_contracts_contract_type ON contracts(contract_type_id);
CREATE INDEX idx_contracts_manager ON contracts(manager_id);
CREATE INDEX idx_payment_schedules_date ON payment_schedules(payment_date);

-- ========================================
-- 4단계: Row Level Security (RLS) 설정
-- ========================================

-- profiles 테이블 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- contracts 테이블 RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contracts" ON contracts 
  FOR SELECT USING (
    auth.uid() = manager_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert own contracts" ON contracts 
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own contracts" ON contracts 
  FOR UPDATE USING (
    auth.uid() = manager_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete contracts" ON contracts 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- contract_files 테이블 RLS
ALTER TABLE contract_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contract files" ON contract_files 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contracts 
      WHERE contracts.id = contract_files.contract_id 
      AND (contracts.manager_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Users can upload contract files" ON contract_files 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM contracts 
      WHERE contracts.id = contract_files.contract_id 
      AND (contracts.manager_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- payment_schedules 테이블 RLS
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payment schedules" ON payment_schedules 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contracts 
      WHERE contracts.id = payment_schedules.contract_id 
      AND (contracts.manager_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- contract_types 테이블 RLS
ALTER TABLE contract_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view contract types" ON contract_types 
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage contract types" ON contract_types 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ========================================
-- 5단계: 함수 생성
-- ========================================

-- 계약번호 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_contract_number(
  p_contract_type_code TEXT,
  p_contractor_name TEXT,
  p_contract_date DATE
) RETURNS TEXT AS $$
DECLARE
  v_sequence INTEGER;
  v_date_str TEXT;
  v_contract_number TEXT;
BEGIN
  -- 같은 종류의 계약 중 최대 일련번호 찾기
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(contract_number, '_', 2) AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM contracts
  WHERE contract_number LIKE 'c' || p_contract_type_code || '_%';
  
  -- 날짜 포맷: YYYYMMDD
  v_date_str := TO_CHAR(p_contract_date, 'YYYYMMDD');
  
  -- 계약번호 생성: c#_일련번호_계약종류_이름_날짜
  v_contract_number := 'c' || p_contract_type_code || '_' || 
                       LPAD(v_sequence::TEXT, 4, '0') || '_' || 
                       p_contract_type_code || '_' || 
                       p_contractor_name || '_' || 
                       v_date_str;
  
  RETURN v_contract_number;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6단계: 트리거 생성
-- ========================================

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at 
  BEFORE UPDATE ON contracts
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 완료 메시지
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '데이터베이스 초기화 완료!';
  RAISE NOTICE '생성된 테이블: profiles, contract_types, contracts, contract_files, payment_schedules';
  RAISE NOTICE '기본 계약 종류 7개 삽입 완료';
END $$;