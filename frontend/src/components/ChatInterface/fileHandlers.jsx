import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { marked } from 'marked';

// 設定 PDF.js 的 workerSrc
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// 處理檔案變更的函式
export const handleFileChange = async (e, handleSendMessage, setFileContent) => {
  const file = e.target.files[0];
  
  if (file) {
    let fileText = '';
    // 檢查副檔名和 MIME 類型
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    // 以副檔名和 MIME 類型共同判斷
    if (file.type === 'application/pdf' || fileExtension === 'pdf') {
      fileText = await extractTextFromPDF(file);
    } else if (file.type === 'text/plain' || fileExtension === 'txt') {
      fileText = await extractTextFromTXT(file);
    } else if (['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                'application/vnd.ms-excel'].includes(file.type) || 
                ['xlsx', 'xls'].includes(fileExtension)) {
      fileText = await extractTextFromExcel(file);
    } else if (['text/markdown', 'text/x-markdown', 'text/md', 'application/markdown'].includes(file.type) || 
                fileExtension === 'md') {
      fileText = await extractTextFromMarkdown(file);
    } else {
      alert('請選擇 PDF、TXT、Excel 或 Markdown 檔案');
      return;
    }
    
    setFileContent(fileText);
    e.target.value = null;
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

// 提取 Excel 檔案中的文字
const extractTextFromExcel = async (file) => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  let textContent = '';

  // 遍歷所有工作表
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const sheetText = XLSX.utils.sheet_to_txt(worksheet, { rawNumbers: true });
    textContent += `=== ${sheetName} ===\n${sheetText}\n\n`;
  });

  return textContent;
};

// 提取 Markdown 檔案中的文字
const extractTextFromMarkdown = async (file) => {
  const text = await file.text();
  // 將 Markdown 轉換為純文字（移除 HTML 標籤）
  const htmlContent = marked(text);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  return tempDiv.textContent || tempDiv.innerText;
};

// 提取文字檔案中的文字
const extractTextFromTXT = async (file) => {
  return await file.text();
};