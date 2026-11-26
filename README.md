# InterviewPrep AI

Turn your resume into your interview superpower. Upload a resume (PDF or DOCX), and InterviewPrep AI predicts the questions recruiters will ask, writes personalized sample answers, and runs AI-scored mock interviews.

Built with React, Tailwind CSS, Lucide icons, an Express backend and the Clae API.

## Features

- **Resume upload**: drag-and-drop PDF/DOCX, or paste text. Shows the file name and status, lets you view and edit the extracted text, and replace or remove the resume.
- **Resume analysis**: skills, strong skills, experience, projects, education, certifications, and "what interviewers will notice".
- **Job matching**: paste a job description to see a match score plus matched and missing skills.
- **Question generator**: 10 categories, 4 difficulty levels, and 10/20/30/50 questions per set.
- **Coaching for every question**: a sample answer, why it's asked, key points, mistakes to avoid, and follow-up questions. Missing personal details appear as highlighted `[ADD: …]` placeholders. The app never invents experience.
- **Mock interview**: one question at a time, with a timer and hints. Each answer gets a score out of 10, sub-scores for clarity, relevance, confidence and structure, feedback, and an improved answer. You get a final report at the end.
- **Dashboard**: progress, resume summary, strong and missing skills, areas to improve, and recent sessions.
- **Extras**: bookmarks, copy answer, regenerate one question, filter and search, PDF export, history, backup import/export, and a mobile-friendly layout.
- **Demo mode**: works with no API key, using an offline engine (template questions and rule-based scoring).

## Quick start

Requires **Node.js 18+**.

```bash
npm install
cp .env.example .env      # then add your ANTHROPIC_API_KEY to .env
npm run dev
```

Open **http://localhost:5173**.

`npm run dev` starts two processes:
- the Vite frontend on port 5173
- the API server on port 8787 (Vite proxies `/api` to it)

Without an API key, the app runs in **demo mode** automatically. The sidebar shows which mode is active. You can force demo mode in **Settings**.

### Production

```bash
npm run build   # builds the frontend into dist/
npm start       # serves dist/ and the API on http://localhost:8787
```

## Configuration (`.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | none | Your Claude API key. If it's missing, the app uses demo mode. |
| `CLAUDE_MODEL` | `claude-sonnet-5-5` | The model used for every AI task. |
| `PORT` | `8787` | API server port. |
| `RATE_LIMIT_PER_MIN` | `30` | Requests allowed per IP per minute. |

## Project structure

```
server/
  index.js        Express API: routes, validation, rate limiting, batching
  claude.js       Claude client with structured JSON outputs (and a fallback)
  prompts.js      Recruiter/coach persona and prompts for every task
  schemas.js      JSON schemas for analysis, match, questions, evaluation, report
src/
  pages/          Landing, Dashboard, Upload, Generate, SessionView,
                  MockInterview, MockReport, Saved, History, Settings
  components/     UI kit, layout/sidebar, QuestionCard, filters, ResumeSummary
  context/        App state (useReducer) persisted to localStorage
  lib/
    api.js        Backend calls with automatic demo fallback
    parser.js     PDF (pdf.js) and DOCX (mammoth) text extraction + validation
    demoEngine.js Offline analysis, questions, scoring and reports
    pdfReport.js  PDF export (jsPDF)
    sampleData.js Fictional sample resume and job used by "Try a Demo"
```

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Server status and whether AI is enabled |
| POST | `/api/analyze` | Resume text → structured profile |
| POST | `/api/match` | Resume + job description → match score and skill gaps |
| POST | `/api/generate` | Profile + options → questions with coaching (batched in groups of 10) |
| POST | `/api/regenerate` | Replace one question |
| POST | `/api/evaluate` | Score a mock interview answer |
| POST | `/api/report` | Final mock interview summary |

## Security and privacy

- The API key lives only on the server (`.env`) and is never sent to the browser.
- Resume files are parsed in the browser. Only the extracted text is sent to the server, and only for AI calls. The server stores nothing.
- Sessions, bookmarks and mock interviews are kept in the browser's localStorage. Users can export or clear them in Settings.
- Inputs are validated and size-limited, requests are rate-limited, and prompts tell the model to treat resume and job text as data, not instructions.

## Ideas for next steps

- Voice answers in mock interviews (speech-to-text)
- User accounts with a database (e.g. Postgres or Supabase) instead of localStorage
- Streaming generation so questions appear as they are written
- Deploy (Render, Railway or Fly.io for the Node server, or serverless functions on Vercel)
