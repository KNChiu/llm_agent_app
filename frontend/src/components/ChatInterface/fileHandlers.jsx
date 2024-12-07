// import { Document, Page, pdfjs, getDocument } from 'react-pdf';

// 處理檔案變更的函式
export const handleFileChange = async (e, handleSendMessage, setFileContent) => {
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