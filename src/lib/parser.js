import { MAX_FILE_MB } from './constants';

const EXT = ['pdf', 'docx', 'txt'];

export function validateFile(file) {
  if (!file) return 'No file selected.';
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'doc') return 'Old .doc files are not supported. Please save it as .docx or PDF.';
  if (!EXT.includes(ext)) return 'Unsupported file type. Please upload a PDF or DOCX file.';
  if (file.size === 0) return 'This file is empty.';
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `File is too large. The limit is ${MAX_FILE_MB} MB.`;
  return null;
}

export function cleanText(text) {
  return text
    .replace(/\u0000/g, '')
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function readPdf(file) {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    let line = '';
    let lastY = null;
    const lines = [];
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const y = item.transform?.[5];
      if (lastY !== null && Math.abs(y - lastY) > 2 && line) {
        lines.push(line);
        line = '';
      }
      line += (line && !line.endsWith(' ') && item.str && !item.str.startsWith(' ') ? ' ' : '') + item.str;
      if (item.hasEOL) {
        lines.push(line);
        line = '';
      }
      lastY = y;
    }
    if (line) lines.push(line);
    pages.push(lines.join('\n'));
  }
  return pages.join('\n\n');
}

async function readDocx(file) {
  const mod = await import('mammoth/mammoth.browser.js');
  const mammoth = mod.default || mod;
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return value;
}

export async function extractText(file) {
  const err = validateFile(file);
  if (err) throw new Error(err);
  const ext = file.name.split('.').pop().toLowerCase();
  let raw;
  try {
    raw = ext === 'pdf' ? await readPdf(file) : ext === 'docx' ? await readDocx(file) : await file.text();
  } catch (e) {
    console.error(e);
    throw new Error('We couldn’t read this file. It may be corrupted or password-protected. Try another file or paste your resume text.');
  }
  const text = cleanText(raw);
  if (text.length < 80) {
    throw new Error(
      ext === 'pdf'
        ? 'We found almost no text in this PDF. It may be a scanned image. Please paste your resume text instead.'
        : 'We found almost no text in this file. Please paste your resume text instead.'
    );
  }
  return text;
}
