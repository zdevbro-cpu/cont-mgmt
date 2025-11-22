import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    // 디렉토리가 없으면 생성
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 파일명 중복 방지를 위해 타임스탬프 추가
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('PDF 파일만 업로드 가능합니다.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  }
});

// PDF 파일 업로드
router.post('/upload-pdf', upload.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    // 클라이언트에서 접근 가능한 URL 경로 반환
    // server.js에서 '/uploads' 경로를 정적 파일로 서빙하도록 설정했으므로
    // http://localhost:5000/uploads/파일명 형태로 접근 가능
    const filePath = `http://localhost:5000/uploads/${req.file.filename}`;

    res.json({
      success: true,
      filePath: filePath,
      fileName: req.file.originalname
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: '파일 업로드 실패' });
  }
});

// 템플릿 목록 조회
router.get('/', async (req, res) => {
  try {
    const { contract_type_id, is_available } = req.query;

    let query = req.supabase
      .from('contract_templates')
      .select(`
        *,
        contract_types (
          id,
          name,
          code
        ),
        profiles:created_by (
          id,
          full_name,
          email
        )
      `)
      .order('effective_date', { ascending: false });

    if (contract_type_id) {
      query = query.eq('contract_type_id', contract_type_id);
    }

    if (is_available !== undefined) {
      query = query.eq('is_available', is_available === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: error.message });
  }
});

// 특정 템플릿 조회
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('contract_templates')
      .select(`
        *,
        contract_types (
          id,
          name,
          code
        ),
        profiles:created_by (
          id,
          full_name,
          email
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: error.message });
  }
});

// 템플릿 등록
router.post('/', async (req, res) => {
  try {
    const {
      contract_type_id,
      version,
      name,
      description,
      contract_period,
      first_payment_months,
      payment_interval,
      unit_amount,
      monthly_payment_amount,
      other_support_amount,
      required_fields,
      field_rules,
      special_conditions_template,
      template_file_url,
      pdf_file_path,
      memo,
      is_available,
      effective_date,
      end_date,
      created_by
    } = req.body;

    const insertData = {
      contract_type_id,
      version,
      name,
      description,
      contract_period,
      first_payment_months,
      payment_interval,
      unit_amount,
      monthly_payment_amount,
      other_support_amount,
      required_fields,
      field_rules,
      special_conditions_template,
      template_file_url,
      pdf_file_path,
      memo,
      is_available,
      effective_date,
      created_by
    };

    // end_date가 있을 때만 추가
    if (end_date) {
      insertData.end_date = end_date;
    }

    const { data, error } = await req.supabase
      .from('contract_templates')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // 변경 이력 기록
    await req.supabase
      .from('template_change_logs')
      .insert({
        template_id: data.id,
        changed_by: created_by,
        change_type: 'created',
        change_description: '새 템플릿 생성',
        new_data: data
      });

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: error.message });
  }
});

// 템플릿 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      version,
      name,
      description,
      contract_period,
      first_payment_months,
      payment_interval,
      unit_amount,
      monthly_payment_amount,
      other_support_amount,
      required_fields,
      field_rules,
      special_conditions_template,
      template_file_url,
      pdf_file_path,
      memo,
      is_available,
      effective_date,
      end_date,
      changed_by
    } = req.body;

    // 기존 데이터 조회
    const { data: oldData } = await req.supabase
      .from('contract_templates')
      .select('*')
      .eq('id', id)
      .single();

    const updateData = {
      version,
      name,
      description,
      contract_period,
      first_payment_months,
      payment_interval,
      unit_amount,
      monthly_payment_amount,
      other_support_amount,
      required_fields,
      field_rules,
      special_conditions_template,
      template_file_url,
      pdf_file_path,
      memo,
      is_available,
      effective_date,
      updated_at: new Date().toISOString()
    };

    // end_date가 있을 때만 추가
    if (end_date !== undefined) {
      updateData.end_date = end_date;
    }

    // 템플릿 수정
    const { data, error } = await req.supabase
      .from('contract_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // 변경 이력 기록
    await req.supabase
      .from('template_change_logs')
      .insert({
        template_id: id,
        changed_by,
        change_type: 'updated',
        change_description: '템플릿 정보 수정',
        previous_data: oldData,
        new_data: data
      });

    res.json(data);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: error.message });
  }
});

// 템플릿 선택 가능 여부 변경
router.patch('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available, changed_by } = req.body;

    const { data, error } = await req.supabase
      .from('contract_templates')
      .update({
        is_available,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // 변경 이력 기록
    await req.supabase
      .from('template_change_logs')
      .insert({
        template_id: id,
        changed_by,
        change_type: 'availability_changed',
        change_description: `선택 가능 여부 변경: ${is_available ? '활성' : '비활성'}`,
        new_data: { is_available }
      });

    res.json(data);
  } catch (error) {
    console.error('Error updating template availability:', error);
    res.status(500).json({ error: error.message });
  }
});

// 템플릿 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { changed_by } = req.body;

    // 기존 데이터 조회
    const { data: oldData } = await req.supabase
      .from('contract_templates')
      .select('*')
      .eq('id', id)
      .single();

    // 변경 이력 기록
    await req.supabase
      .from('template_change_logs')
      .insert({
        template_id: id,
        changed_by,
        change_type: 'deleted',
        change_description: '템플릿 삭제',
        previous_data: oldData
      });

    // 템플릿 삭제
    const { error } = await req.supabase
      .from('contract_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: '템플릿이 삭제되었습니다.' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;