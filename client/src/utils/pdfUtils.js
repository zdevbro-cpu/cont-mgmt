import * as pdfjsLib from 'pdfjs-dist';

// PDF.js worker ?¤ì • - https ?¬ìš©
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * PDF ?Œì¼???´ë?ì§€(Blob)ë¡?ë³€??
 * @param {File} pdfFile - PDF ?Œì¼
 * @returns {Promise<Blob>} - PNG ?´ë?ì§€ Blob
 */
export async function convertPdfToImage(pdfFile) {
  try {
    console.log('?”„ PDF ë³€???œì‘...');
    
    // PDF ?Œì¼??ArrayBufferë¡??½ê¸°
    const arrayBuffer = await pdfFile.arrayBuffer();
    console.log('??ArrayBuffer ë¡œë“œ ?„ë£Œ:', arrayBuffer.byteLength, 'bytes');
    
    // PDF ë¬¸ì„œ ë¡œë“œ
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log('??PDF ë¬¸ì„œ ë¡œë“œ ?„ë£Œ, ?˜ì´ì§€ ??', pdf.numPages);
    
    // ì²?ë²ˆì§¸ ?˜ì´ì§€ ê°€?¸ì˜¤ê¸?
    const page = await pdf.getPage(1);
    console.log('??ì²??˜ì´ì§€ ë¡œë“œ ?„ë£Œ');
    
    // ë·°í¬???¤ì • (scale???’ì´ë©??´ìƒ???¥ìƒ)
    const scale = 2.0;
    const viewport = page.getViewport({ scale });
    console.log('??ë·°í¬???¬ê¸°:', viewport.width, 'x', viewport.height);
    
    // Canvas ?ì„±
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // PDF ?˜ì´ì§€ë¥?Canvas???Œë”ë§?
    console.log('?”„ Canvas ?Œë”ë§?ì¤?..');
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    console.log('???Œë”ë§??„ë£Œ');
    
    // Canvasë¥?Blob?¼ë¡œ ë³€??
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('??Blob ë³€???„ë£Œ:', blob.size, 'bytes');
          resolve(blob);
        } else {
          reject(new Error('?´ë?ì§€ ë³€???¤íŒ¨'));
        }
      }, 'image/png', 0.95);
    });
    
  } catch (error) {
    console.error('??PDF ???´ë?ì§€ ë³€???¤ë¥˜:', error);
    console.error('?ì„¸:', error.message);
    throw new Error('PDFë¥??´ë?ì§€ë¡?ë³€?˜í•˜?”ë° ?¤íŒ¨?ˆìŠµ?ˆë‹¤: ' + error.message);
  }
}

/**
 * PDF ?Œì‹± API ?¸ì¶œ (?´ë?ì§€ë¡?ë³€?????„ì†¡)
 * @param {File} pdfFile - PDF ?Œì¼
 * @returns {Promise<Object>} - ?Œì‹± ê²°ê³¼
 */
export async function parsePdfContract(pdfFile) {
  try {
    console.log('?“„ PDF ?Œì‹± ?œì‘...');
    
    // PDFë¥??´ë?ì§€ë¡?ë³€??
    console.log('?”„ PDF ???´ë?ì§€ ë³€??ì¤?..');
    const imageBlob = await convertPdfToImage(pdfFile);
    console.log('???´ë?ì§€ ë³€???„ë£Œ');
    
    // FormData ?ì„±
    const formData = new FormData();
    formData.append('pdf', imageBlob, 'contract.png');
    
    // API ?¸ì¶œ
    console.log('?“¤ ?œë²„ë¡??„ì†¡ ì¤?..');
    const response = await fetch('${import.meta.env.VITE_API_URL}/api/contracts/parse-pdf', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '?Œì‹± ?¤íŒ¨');
    }
    
    const result = await response.json();
    console.log('???Œì‹± ?„ë£Œ:', result);
    
    return result;
    
  } catch (error) {
    console.error('??PDF ?Œì‹± ?¤ë¥˜:', error);
    throw error;
  }
}