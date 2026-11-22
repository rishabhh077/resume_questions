import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { askJson, aiEnabled, modelName } from './claude.js';
import {
  analyzeMessages,
  matchMessages,
  generateMessages,
  regenerateMessages,
  evaluateMessages,
  reportMessages,
} from './prompts.js';
import { analysisSchema, matchSchema, questionsSchema, evaluationSchema, reportSchema } from './schemas.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8787;

export const CATEGORIES = [
  'Personal Introduction',
  'HR Interview',
  'Technical',
  'Resume-Based',
  'Project-Based',
  'Behavioral',
  'Scenario-Based',
  'Problem-Solving',
  'Leadership & Teamwork',
  'Tricky Questions',
];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const COUNTS = [10, 20, 30, 50];

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

// ---------- Simple in-memory rate limiter (per IP, per minute) ----------
const LIMIT = Number(process.env.RATE_LIMIT_PER_MIN || 30);
const hits = new Map();
function rateLimit(req, res, next) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const entry = hits.get(key) || { count: 0, reset: now + 60_000 };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + 60_000;
  }
  entry.count += 1;
  hits.set(key, entry);
  if (entry.count > LIMIT) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
  }
  next();
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
}, 60_000).unref();

// ---------- Helpers ----------
class BadRequest extends Error {
  constructor(msg) {
    super(msg);
    this.status = 400;
  }
}

function requireAI() {
  if (!aiEnabled()) {
    const e = new Error('AI is not configured on the server. Add ANTHROPIC_API_KEY to .env, or use demo mode.');
    e.status = 503;
    e.code = 'AI_DISABLED';
    throw e;
  }
}

function requireText(value, field, min = 30, max = 60000) {
  if (typeof value !== 'string' || value.trim().length < min) {
    throw new BadRequest(`${field} is missing or too short.`);
  }
  if (value.length > max) throw new BadRequest(`${field} is too long.`);
  return value.trim();
}

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

let idCounter = 0;
const newId = () => `q_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;

function normalizeQuestion(q, fallback = {}) {
  const clampList = (a, n) => (Array.isArray(a) ? a.filter(Boolean).map(String).slice(0, n) : []);
  return {
    id: newId(),
    category: CATEGORIES.includes(q.category) ? q.category : fallback.category || 'Resume-Based',
    difficulty: DIFFICULTIES.includes(q.difficulty) ? q.difficulty : fallback.difficulty || 'Intermediate',
    question: String(q.question || '').trim(),
    resumeReference: String(q.resumeReference || ''),
    whyAsked: String(q.whyAsked || ''),
    sampleAnswer: String(q.sampleAnswer || ''),
    keyPoints: clampList(q.keyPoints, 6),
    mistakesToAvoid: clampList(q.mistakesToAvoid, 5),
    followUps: clampList(q.followUps, 4),
    needsPersonalDetails: Boolean(q.needsPersonalDetails) || /\[ADD:/i.test(q.sampleAnswer || ''),
  };
}

/** Split `count` questions across categories evenly, then pack into batches of up to `size`. */
function planBatches(categories, count, size = 10) {
  const per = Math.floor(count / categories.length);
  let extra = count % categories.length;
  const slots = [];
  categories.forEach((c) => {
    const n = per + (extra-- > 0 ? 1 : 0);
    for (let i = 0; i < n; i++) slots.push(c);
  });
  // Interleave so each batch covers several categories.
  const batches = [];
  const numBatches = Math.ceil(count / size);
  for (let b = 0; b < numBatches; b++) batches.push([]);
  slots.forEach((c, i) => batches[i % numBatches].push(c));
  return batches.map((batch) => {
    const counts = {};
    batch.forEach((c) => (counts[c] = (counts[c] || 0) + 1));
    return Object.entries(counts).map(([name, n]) => ({ name, n }));
  });
}

const ANGLES = [
  'draw mainly on the most recent role and the job description.',
  'draw mainly on projects and technical skills.',
  'draw mainly on earlier roles, education and certifications.',
  'draw mainly on achievements, metrics and career transitions.',
  'draw mainly on teamwork, ownership and soft skills evidence.',
];

async function runLimited(tasks, limit = 3) {
  const results = new Array(tasks.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  });
  await Promise.all(workers);
  return results;
}

// ---------- Routes ----------
app.get('/api/health', (req, res) => {
  res.json({ ok: true, aiEnabled: aiEnabled(), model: aiEnabled() ? modelName() : null });
});

app.use('/api', rateLimit);

app.post(
  '/api/analyze',
  wrap(async (req, res) => {
    requireAI();
    const resumeText = requireText(req.body?.resumeText, 'Resume text', 80);
    const analysis = await askJson({ ...analyzeMessages({ resumeText }), schema: analysisSchema, maxTokens: 4000 });
    res.json({ analysis });
  })
);

app.post(
  '/api/match',
  wrap(async (req, res) => {
    requireAI();
    const resumeText = requireText(req.body?.resumeText, 'Resume text', 80);
    const jobDescription = requireText(req.body?.jobDescription, 'Job description', 30, 20000);
    const match = await askJson({
      ...matchMessages({ ...req.body, resumeText, jobDescription }),
      schema: matchSchema,
      maxTokens: 1500,
    });
    match.matchScore = Math.max(0, Math.min(100, Math.round(match.matchScore || 0)));
    res.json({ match });
  })
);

app.post(
  '/api/generate',
  wrap(async (req, res) => {
    requireAI();
    const { analysis, jobTitle = '', company = '', jobDescription = '' } = req.body || {};
    const resumeText = requireText(req.body?.resumeText, 'Resume text', 80);
    const categories = (req.body?.categories || []).filter((c) => CATEGORIES.includes(c));
    const difficulty = DIFFICULTIES.includes(req.body?.difficulty) ? req.body.difficulty : 'Intermediate';
    const count = COUNTS.includes(Number(req.body?.count)) ? Number(req.body.count) : 10;
    if (!categories.length) throw new BadRequest('Select at least one category.');

    const batches = planBatches(categories, count);
    const tasks = batches.map((split, i) => () =>
      askJson({
        ...generateMessages({
          resumeText,
          analysis,
          jobTitle: String(jobTitle).slice(0, 120),
          company: String(company).slice(0, 120),
          jobDescription: String(jobDescription).slice(0, 20000),
          split,
          difficulty,
          angle: batches.length > 1 ? ANGLES[i % ANGLES.length] : '',
        }),
        schema: questionsSchema,
        maxTokens: 12000,
      })
    );
    const results = await runLimited(tasks, 3);

    const seen = new Set();
    const questions = [];
    for (const r of results) {
      for (const q of r?.questions || []) {
        const n = normalizeQuestion(q, { difficulty });
        const key = n.question.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80);
        if (!n.question || seen.has(key)) continue;
        seen.add(key);
        questions.push(n);
      }
    }
    if (!questions.length) throw new Error('No questions were generated. Please try again.');
    res.json({ questions });
  })
);

app.post(
  '/api/regenerate',
  wrap(async (req, res) => {
    requireAI();
    const resumeText = requireText(req.body?.resumeText, 'Resume text', 80);
    const question = req.body?.question;
    if (!question?.question) throw new BadRequest('Question is required.');
    const out = await askJson({
      ...regenerateMessages({ ...req.body, resumeText, question }),
      schema: questionsSchema,
      maxTokens: 3000,
    });
    const q = out?.questions?.[0];
    if (!q) throw new Error('Could not regenerate this question.');
    res.json({ question: normalizeQuestion(q, question) });
  })
);

app.post(
  '/api/evaluate',
  wrap(async (req, res) => {
    requireAI();
    const question = req.body?.question;
    if (!question?.question) throw new BadRequest('Question is required.');
    const answer = typeof req.body?.answer === 'string' ? req.body.answer : '';
    if (!answer.trim()) throw new BadRequest('Please type an answer first.');
    const ev = await askJson({
      ...evaluateMessages({ ...req.body, question, answer }),
      schema: evaluationSchema,
      maxTokens: 2500,
    });
    const c = (n) => Math.max(0, Math.min(10, Math.round(Number(n) || 0)));
    res.json({
      evaluation: { ...ev, score: c(ev.score), clarity: c(ev.clarity), relevance: c(ev.relevance), confidence: c(ev.confidence), structure: c(ev.structure) },
    });
  })
);

app.post(
  '/api/report',
  wrap(async (req, res) => {
    requireAI();
    const results = Array.isArray(req.body?.results) ? req.body.results.slice(0, 50) : [];
    if (!results.length) throw new BadRequest('No results to summarize.');
    const report = await askJson({ ...reportMessages({ jobTitle: req.body?.jobTitle, results }), schema: reportSchema, maxTokens: 1500 });
    res.json({ report });
  })
);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// ---------- Serve built frontend in production ----------
const dist = path.join(__dirname, '..', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// ---------- Error handler ----------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status && err.status < 600 ? err.status : 500;
  let message = err.message || 'Something went wrong.';
  if (err?.status === 401) message = 'The Claude API key was rejected. Check ANTHROPIC_API_KEY in .env.';
  if (err?.status === 429 && !err.code) message = 'The AI service is rate-limited right now. Please try again shortly.';
  if (err?.status === 529 || err?.status === 503) message = err.code === 'AI_DISABLED' ? message : 'The AI service is busy. Please try again shortly.';
  if (status >= 500) console.error('[api error]', err?.message || err);
  res.status(status).json({ error: message, code: err.code });
});

app.listen(PORT, () => {
  console.log(`\n  InterviewPrep AI API running on http://localhost:${PORT}`);
  console.log(aiEnabled() ? `  Claude enabled (model: ${modelName()})\n` : '  No ANTHROPIC_API_KEY found: the app will run in demo mode.\n');
});
