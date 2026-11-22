import { SAMPLE_RESUME, SAMPLE_ANALYSIS, SAMPLE_JOB } from './sampleData';
import { matchLocal, generateLocal } from './demoEngine';
import { useNavigate } from 'react-router-dom';
import { uid, useApp } from '../context/AppContext';

/** Fills the app with the fictional sample candidate so every screen has data. */
export function buildDemoState() {
  const analysis = structuredClone(SAMPLE_ANALYSIS);
  const match = matchLocal(analysis, SAMPLE_JOB.description);
  const categories = ['Personal Introduction', 'Technical', 'Resume-Based', 'Project-Based', 'Behavioral', 'Tricky Questions'];
  const questions = generateLocal({
    analysis,
    job: { ...SAMPLE_JOB, missingSkills: match.missingSkills },
    categories,
    difficulty: 'Intermediate',
    count: 12,
  });
  questions[0].practiced = true;
  questions[2].practiced = true;
  questions[3].bookmarked = true;
  questions[6].bookmarked = true;
  const session = {
    id: uid('s'),
    createdAt: new Date().toISOString(),
    jobTitle: SAMPLE_JOB.title,
    company: SAMPLE_JOB.company,
    difficulty: 'Intermediate',
    categories,
    questions,
    match,
    source: 'demo',
    isSample: true,
  };
  return {
    resume: { fileName: 'Aarav_Mehta_Resume.pdf', fileSize: 84_000, source: 'sample', text: SAMPLE_RESUME, uploadedAt: new Date().toISOString() },
    analysis,
    analysisSource: 'demo',
    job: { title: SAMPLE_JOB.title, company: SAMPLE_JOB.company, description: SAMPLE_JOB.description },
    match,
    session,
  };
}

/** Loads the sample candidate (once) and opens the sample question set. */
export function useLoadDemo() {
  const { state, dispatch, toast } = useApp();
  const navigate = useNavigate();
  return (to) => {
    const { session, ...rest } = buildDemoState();
    const existing = state.sessions.find((s) => s.isSample);
    dispatch({ type: 'LOAD_DEMO', payload: rest });
    if (!existing) dispatch({ type: 'ADD_SESSION', session });
    toast('Demo loaded with a sample resume');
    navigate(to || `/app/sessions/${(existing || session).id}`);
  };
}
