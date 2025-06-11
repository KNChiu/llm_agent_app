// import { Document, Page, pdfjs, getDocument } from 'react-pdf';

// 支援的圖片格式
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

// 最大檔案大小 (5MB)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// 處理檔案變更的函式 - Updated signature
export const handleFileChange = async (e, setFileContent) => {
  const file = e.target.files[0];
  if (file) {
    let fileText = '';
    if (file.type === 'application/pdf') {
      fileText = await extractTextFromPDF(file);
    } else if (file.type === 'text/plain') {
      fileText = await extractTextFromTXT(file);
    } else {
      alert('請選擇 PDF 或 TXT 檔案');
      return;
    }
    
    setFileContent(fileText); // 更新檔案內容
    // 如果希望在選擇檔案後立即發送檔案內容，可以在這裡調用 handleSendMessage(fileText);
    e.target.value = null; // 清空選擇的檔案
  }
};

// 驗證圖片檔案
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: '請選擇一個檔案' };
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: '不支援的檔案格式。請選擇 JPG、PNG、GIF 或 WebP 格式的圖片。' 
    };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return { 
      valid: false, 
      error: `檔案大小超過限制。請選擇小於 ${MAX_IMAGE_SIZE / (1024 * 1024)}MB 的圖片。` 
    };
  }

  return { valid: true };
};

// 將圖片轉換為 Base64
export const convertImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// 處理圖片拖曳上傳
export const handleImageDrop = async (files, onImageAdd, onError) => {
  const imageFiles = Array.from(files).filter(file => 
    SUPPORTED_IMAGE_TYPES.includes(file.type)
  );

  if (imageFiles.length === 0) {
    onError('請拖曳有效的圖片檔案 (JPG, PNG, GIF, WebP)');
    return;
  }

  try {
    const processedImages = [];
    
    for (const file of imageFiles) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        onError(validation.error);
        continue;
      }

      const base64Data = await convertImageToBase64(file);
      processedImages.push({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        base64: base64Data,
        preview: base64Data // 用於預覽
      });
    }

    if (processedImages.length > 0) {
      onImageAdd(processedImages);
    }
  } catch (error) {
    onError('圖片處理失敗: ' + error.message);
  }
};

// 處理圖片選擇 (點擊上傳)
export const handleImageSelect = async (e, onImageAdd, onError) => {
  const files = e.target.files;
  if (files && files.length > 0) {
    await handleImageDrop(files, onImageAdd, onError);
    e.target.value = ''; // 清空選擇
  }
};

// 提取 PDF 檔案中的文字
const extractTextFromPDF = async (file) => {
  const pdfData = await file.arrayBuffer();
  const pdf = await getDocument({ data: pdfData }).promise;
  let textContent = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();
    textContent += text.items.map(item => item.str).join(' ') + '\n';
  }

  return textContent;
};

// 提取 TXT 檔案中的文字
export const extractTextFromTXT = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
