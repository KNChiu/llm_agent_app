import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { remark } from 'remark';
import strip from 'strip-markdown';

// 設定 PDF.js 的 workerSrc
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const EXCEL_MIME_TYPES = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
const EXCEL_EXTENSIONS = ['xlsx', 'xls'];
const MARKDOWN_MIME_TYPES = ['text/markdown', 'text/x-markdown', 'text/md', 'application/markdown'];
const MARKDOWN_EXTENSIONS = ['md'];

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
    } else if (EXCEL_MIME_TYPES.includes(file.type) || EXCEL_EXTENSIONS.includes(fileExtension)) {
      fileText = await extractTextFromExcel(file);
    } else if (MARKDOWN_MIME_TYPES.includes(file.type) || MARKDOWN_EXTENSIONS.includes(fileExtension)) {
      fileText = await extractTextFromMarkdown(file);
    } else {
      alert('Unsupported file type. Please select a PDF, TXT, Excel, or Markdown file.');
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
  try {
    const text = await file.text();
    // 使用 remark 和 strip-markdown 移除 Markdown 格式
    const result = await remark()
      .use(strip)
      .process(text);
    
    return String(result);
  } catch (error) {
    console.error('解析 Markdown 時出錯:', error);
    return '';
  }
};

// 提取文字檔案中的文字
const extractTextFromTXT = async (file) => {
  return await file.text();
};