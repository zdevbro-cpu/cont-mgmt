import * as pdfjsLib from 'pdfjs-dist';

// PDF.js worker 설정 - https 사용
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * PDF 파일을 이미지(Blob)로 변환
 * @param {File} pdfFile - PDF 파일
 * @returns {Promise<Blob>} - PNG 이미지 Blob
 */
export async function convertPdfToImage(pdfFile) {
  try {
    console.log('🔄 PDF 변환 시작...');
    
    // PDF 파일을 ArrayBuffer로 읽기
    const arrayBuffer = await pdfFile.arrayBuffer();
    console.log('✅ ArrayBuffer 로드 완료:', arrayBuffer.byteLength, 'bytes');
    
    // PDF 문서 로드
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log('✅ PDF 문서 로드 완료, 페이지 수:', pdf.numPages);
    
    // 첫 번째 페이지 가져오기
    const page = await pdf.getPage(1);
    console.log('✅ 첫 페이지 로드 완료');
    
    // 뷰포트 설정 (scale을 높이면 해상도 향상)
    const scale = 2.0;
    const viewport = page.getViewport({ scale });
    console.log('✅ 뷰포트 크기:', viewport.width, 'x', viewport.height);
    
    // Canvas 생성
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // PDF 페이지를 Canvas에 렌더링
    console.log('🔄 Canvas 렌더링 중...');
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    console.log('✅ 렌더링 완료');
    
    // Canvas를 Blob으로 변환
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('✅ Blob 변환 완료:', blob.size, 'bytes');
          resolve(blob);
        } else {
          reject(new Error('이미지 변환 실패'));
        }
      }, 'image/png', 0.95);
    });
    
  } catch (error) {
    console.error('❌ PDF → 이미지 변환 오류:', error);
    console.error('상세:', error.message);
    throw new Error('PDF를 이미지로 변환하는데 실패했습니다: ' + error.message);
  }
}

/**
 * PDF 파싱 API 호출 (이미지로 변환 후 전송)
 * @param {File} pdfFile - PDF 파일
 * @returns {Promise<Object>} - 파싱 결과
 */
export async function parsePdfContract(pdfFile) {
  try {
    console.log('📄 PDF 파싱 시작...');
    
    // PDF를 이미지로 변환
    console.log('🔄 PDF → 이미지 변환 중...');
    const imageBlob = await convertPdfToImage(pdfFile);
    console.log('✅ 이미지 변환 완료');
    
    // FormData 생성
    const formData = new FormData();
    formData.append('pdf', imageBlob, 'contract.png');
    
    // API 호출
    console.log('📤 서버로 전송 중...');
    const response = await fetch('http://localhost:5000/api/contracts/parse-pdf', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '파싱 실패');
    }
    
    const result = await response.json();
    console.log('✅ 파싱 완료:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ PDF 파싱 오류:', error);
    throw error;
  }
}