// Talks to the backend. When AI is unavailable (no key, server down, or the
// user picked demo mode) it falls back to the local demo engine.

import { analyzeLocal, matchLocal, generateLocal, regenerateLocal, evaluateLocal, reportLocal } from './demoEngine';

let healthCache = null;

export async function getHealth(force = false) {
  if (healthCache && !force) return healthCache;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch('/api/health', { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    healthCache = { serverUp: true, aiEnabled: Boolean(data.aiEnabled), model: data.model };
  } catch {
    healthCache = { serverUp: false, aiEnabled: false, model: null };
  }
  return healthCache;
}

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function post(path, body) {
  let res;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Could not reach the server.', 0, 'NETWORK');
  }
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* empty */
  }
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data.code);
  return data;
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Runs `remote` when AI mode is active, otherwise `local`.
 * If the server says AI is disabled or is unreachable, falls back to `local`
 * and reports source: 'demo' so the UI can tell the user.
 */
async function run(mode, remote, local, demoDelay = 700) {
  const health = await getHealth();
  const useAI = mode !== 'demo' && health.aiEnabled;
  if (!useAI) {
    await delay(demoDelay);
    return { ...(await local()), source: 'demo' };
  }
  try {
    return { ...(await remote()), source: 'ai' };
  } catch (e) {
    if (e.code === 'AI_DISABLED' || e.code === 'NETWORK') {
      healthCache = null;
      return { ...(await local()), source: 'demo', fellBack: true };
    }
    throw e;
  }
}

export const api = {
  analyze: (mode, { resumeText }) =>
    run(mode, () => post('/api/analyze', { resumeText }), () => ({ analysis: analyzeLocal(resumeText) }), 900),

  match: (mode, { resumeText, analysis, jobTitle, company, jobDescription }) =>
    run(
      mode,
      () => post('/api/match', { resumeText, analysis, jobTitle, company, jobDescription }),
      () => ({ match: matchLocal(analysis, jobDescription) }),
      300
    ),

  generate: (mode, payload) =>
    run(
      mode,
      () => post('/api/generate', payload),
      () => ({
        questions: generateLocal({
          analysis: payload.analysis,
          job: { title: payload.jobTitle, company: payload.company, missingSkills: payload.missingSkills || [] },
          categories: payload.categories,
          difficulty: payload.difficulty,
          count: payload.count,
        }),
      }),
      1400
    ),

  regenerate: (mode, payload) =>
    run(
      mode,
      () => post('/api/regenerate', payload),
      () => ({
        question: regenerateLocal({
          analysis: payload.analysis,
          job: { title: payload.jobTitle, company: payload.company },
          question: payload.question,
          existing: payload.existing,
        }),
      }),
      600
    ),

  evaluate: (mode, payload) =>
    run(mode, () => post('/api/evaluate', payload), () => ({ evaluation: evaluateLocal(payload) }), 900),

  report: (mode, payload) => run(mode, () => post('/api/report', payload), () => ({ report: reportLocal(payload) }), 400),
};
