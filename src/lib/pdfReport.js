// PDF exports built with jsPDF (loaded on demand).

const BRAND = [102, 52, 239];
const NAVY = [15, 23, 46];
const MUTED = [90, 102, 130];

// jsPDF's built-in fonts only cover Latin-1; normalize everything else.
function clean(s = '') {
  return String(s)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/→/g, '->')
    .replace(/×/g, 'x')
    .replace(/[•●▪◦]/g, '-')
    .replace(/[^\x00-\xFF]/g, '');
}

async function createDoc() {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = M;

  const ensure = (h) => {
    if (y + h > H - M) {
      doc.addPage();
      y = M;
    }
  };
  const text = (str, { size = 10, color = NAVY, bold = false, indent = 0, gap = 4 } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(clean(str), W - M * 2 - indent);
    const lh = size * 1.35;
    for (const line of lines) {
      ensure(lh);
      doc.text(line, M + indent, y + size);
      y += lh;
    }
    y += gap;
  };
  const bullets = (items = [], opts = {}) => items.forEach((it) => text(`- ${it}`, { indent: 10, gap: 1, ...opts }));
  const rule = () => {
    ensure(12);
    doc.setDrawColor(225, 229, 240);
    doc.line(M, y + 4, W - M, y + 4);
    y += 14;
  };
  const header = (title, subtitle) => {
    doc.setFillColor(...BRAND);
    doc.rect(0, 0, W, 6, 'F');
    text('InterviewPrep AI', { size: 9, color: BRAND, bold: true, gap: 2 });
    text(title, { size: 20, bold: true, gap: 2 });
    if (subtitle) text(subtitle, { size: 10, color: MUTED, gap: 8 });
    rule();
  };
  const footer = () => {
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(`Page ${i} of ${n}`, W - M, H - 24, { align: 'right' });
      doc.text('Generated with InterviewPrep AI', M, H - 24);
    }
  };
  return { doc, text, bullets, rule, header, footer, ensure, getY: () => y, addY: (d) => (y += d) };
}

const fileSafe = (s) => clean(s).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'report';

export async function downloadQuestionsReport({ session, analysis }) {
  const p = await createDoc();
  const date = new Date(session.createdAt).toLocaleDateString();
  p.header(`Interview Prep: ${session.jobTitle || 'General'}`, `${session.company ? session.company + ' · ' : ''}${session.difficulty} · ${session.questions.length} questions · ${date}`);

  if (analysis) {
    p.text('Resume summary', { size: 13, bold: true });
    p.text(analysis.summary, { color: MUTED });
    if (analysis.strongSkills?.length) p.text(`Strong skills: ${analysis.strongSkills.join(', ')}`, { size: 9.5 });
    if (session.match) {
      p.text(`Job match: ${session.match.matchScore}%`, { size: 9.5, bold: true, gap: 1 });
      if (session.match.missingSkills?.length) p.text(`Skills to prepare: ${session.match.missingSkills.join(', ')}`, { size: 9.5 });
    }
    p.rule();
  }

  session.questions.forEach((q, i) => {
    p.ensure(80);
    p.text(`${q.category.toUpperCase()} · ${q.difficulty}`, { size: 8, color: BRAND, bold: true, gap: 1 });
    p.text(`${i + 1}. ${q.question}`, { size: 12, bold: true, gap: 4 });
    if (q.whyAsked) p.text(`Why they ask: ${q.whyAsked}`, { size: 9.5, color: MUTED });
    p.text('Sample answer', { size: 10, bold: true, gap: 1 });
    p.text(q.sampleAnswer, { size: 10 });
    if (q.keyPoints?.length) {
      p.text('Key points', { size: 10, bold: true, gap: 1 });
      p.bullets(q.keyPoints, { size: 9.5 });
      p.addY(3);
    }
    if (q.mistakesToAvoid?.length) {
      p.text('Mistakes to avoid', { size: 10, bold: true, gap: 1 });
      p.bullets(q.mistakesToAvoid, { size: 9.5 });
      p.addY(3);
    }
    if (q.followUps?.length) {
      p.text('Likely follow-ups', { size: 10, bold: true, gap: 1 });
      p.bullets(q.followUps, { size: 9.5 });
    }
    p.rule();
  });
  p.footer();
  p.doc.save(`interview-prep-${fileSafe(session.jobTitle || 'questions')}.pdf`);
}

export async function downloadMockReport({ mock }) {
  const p = await createDoc();
  const date = new Date(mock.createdAt).toLocaleDateString();
  p.header('Mock Interview Report', `${mock.jobTitle || 'General'} · ${mock.results.length} questions · ${date}`);
  p.text(`Overall score: ${mock.avgScore.toFixed(1)} / 10`, { size: 16, bold: true, color: BRAND });
  if (mock.report) {
    p.text(mock.report.overallSummary);
    p.text('Strengths', { size: 11, bold: true, gap: 1 });
    p.bullets(mock.report.strengths);
    p.addY(4);
    p.text('Focus areas', { size: 11, bold: true, gap: 1 });
    p.bullets(mock.report.focusAreas);
    p.addY(4);
    p.text('Next steps', { size: 11, bold: true, gap: 1 });
    p.bullets(mock.report.nextSteps);
  }
  p.rule();
  mock.results.forEach((r, i) => {
    const e = r.evaluation;
    p.ensure(90);
    p.text(`${r.category.toUpperCase()} · Score ${e.score}/10`, { size: 8, color: BRAND, bold: true, gap: 1 });
    p.text(`${i + 1}. ${r.question}`, { size: 12, bold: true });
    p.text(`Clarity ${e.clarity} · Relevance ${e.relevance} · Confidence ${e.confidence} · Structure ${e.structure}`, { size: 9, color: MUTED });
    p.text('Your answer', { size: 10, bold: true, gap: 1 });
    p.text(r.answer, { size: 9.5, color: MUTED });
    p.text('Feedback', { size: 10, bold: true, gap: 1 });
    p.text(e.summary, { size: 9.5 });
    p.bullets(e.improvements, { size: 9.5 });
    p.addY(3);
    p.text('Improved answer', { size: 10, bold: true, gap: 1 });
    p.text(e.improvedAnswer, { size: 9.5 });
    p.rule();
  });
  p.footer();
  p.doc.save(`mock-interview-${fileSafe(mock.jobTitle || 'report')}.pdf`);
}
