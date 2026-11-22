import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { DEFAULT_CATEGORIES } from '../lib/constants';
import { getHealth } from '../lib/api';

const KEY = 'interviewprep:v1';

const initialState = {
  resume: null, // { fileName, fileSize, source: 'file'|'paste'|'sample', text, uploadedAt }
  analysis: null,
  analysisSource: null,
  job: { title: '', company: '', description: '' },
  match: null,
  sessions: [], // generated question sets
  mocks: [], // mock interview runs
  settings: {
    mode: 'auto', // 'auto' uses AI when the server has a key; 'demo' forces demo
    defaultDifficulty: 'Intermediate',
    defaultCount: 10,
    defaultCategories: DEFAULT_CATEGORIES,
  },
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState;
    const saved = JSON.parse(raw);
    return { ...initialState, ...saved, settings: { ...initialState.settings, ...saved.settings } };
  } catch {
    return initialState;
  }
}

function updateQuestion(state, sessionId, questionId, fn) {
  return {
    ...state,
    sessions: state.sessions.map((s) =>
      s.id !== sessionId ? s : { ...s, questions: s.questions.map((q) => (q.id === questionId ? fn(q) : q)) }
    ),
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_RESUME':
      return { ...state, resume: action.resume, analysis: null, analysisSource: null, match: null };
    case 'CLEAR_RESUME':
      return { ...state, resume: null, analysis: null, analysisSource: null, match: null };
    case 'SET_ANALYSIS':
      return { ...state, analysis: action.analysis, analysisSource: action.source };
    case 'SET_JOB':
      return { ...state, job: { ...state.job, ...action.job } };
    case 'SET_MATCH':
      return { ...state, match: action.match };
    case 'ADD_SESSION':
      return { ...state, sessions: [action.session, ...state.sessions].slice(0, 40) };
    case 'DELETE_SESSION':
      return { ...state, sessions: state.sessions.filter((s) => s.id !== action.id) };
    case 'TOGGLE_BOOKMARK':
      return updateQuestion(state, action.sessionId, action.questionId, (q) => ({ ...q, bookmarked: !q.bookmarked }));
    case 'TOGGLE_PRACTICED':
      return updateQuestion(state, action.sessionId, action.questionId, (q) => ({ ...q, practiced: !q.practiced }));
    case 'MARK_PRACTICED':
      return updateQuestion(state, action.sessionId, action.questionId, (q) => ({ ...q, practiced: true }));
    case 'REPLACE_QUESTION':
      return updateQuestion(state, action.sessionId, action.questionId, (q) => ({ ...action.question, bookmarked: q.bookmarked }));
    case 'SAVE_MOCK': {
      const exists = state.mocks.some((m) => m.id === action.mock.id);
      return {
        ...state,
        mocks: exists ? state.mocks.map((m) => (m.id === action.mock.id ? action.mock : m)) : [action.mock, ...state.mocks].slice(0, 40),
      };
    }
    case 'DELETE_MOCK':
      return { ...state, mocks: state.mocks.filter((m) => m.id !== action.id) };
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'LOAD_DEMO':
      return { ...state, ...action.payload };
    case 'IMPORT':
      return { ...initialState, ...action.data, settings: { ...initialState.settings, ...action.data.settings } };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [health, setHealth] = useState({ serverUp: false, aiEnabled: false, model: null, checked: false });
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable */
    }
  }, [state]);

  const refreshHealth = useCallback(async () => {
    const h = await getHealth(true);
    setHealth({ ...h, checked: true });
    return h;
  }, []);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  const toast = useCallback((message, tone = 'default') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const aiActive = state.settings.mode !== 'demo' && health.aiEnabled;

  const value = useMemo(
    () => ({ state, dispatch, health, refreshHealth, aiActive, toast, toasts }),
    [state, health, refreshHealth, aiActive, toast, toasts]
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export const uid = (p = 'id') => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
