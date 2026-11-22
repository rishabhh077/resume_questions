// Demo mode: a local, rule-based engine that works without the Claude API.
// It extracts what it can from the resume text and fills question templates,
// so every feature stays usable offline. AI mode gives far richer results.

import { SAMPLE_ANALYSIS, SAMPLE_RESUME } from './sampleData';
import { CATEGORY_NAMES } from './constants';

// ---------------------------------------------------------------- skills
const SKILLS = {
  technical: [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Golang', 'Rust', 'Kotlin', 'Swift', 'PHP', 'Ruby', 'Scala', 'R', 'SQL', 'HTML', 'CSS', 'Sass',
    'React', 'Redux', 'Next.js', 'Vue', 'Nuxt', 'Angular', 'Svelte', 'Tailwind CSS', 'Bootstrap', 'jQuery', 'React Native', 'Flutter',
    'Node.js', 'Express', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Spring', 'Laravel', 'Rails', '.NET', 'ASP.NET',
    'REST APIs', 'REST', 'GraphQL', 'gRPC', 'WebSockets', 'Microservices', 'System Design', 'Data Structures', 'Algorithms', 'OOP',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'DynamoDB', 'Cassandra', 'Elasticsearch', 'Firebase', 'Supabase', 'Kafka', 'RabbitMQ',
    'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'TensorFlow', 'PyTorch', 'scikit-learn', 'Pandas', 'NumPy', 'Spark', 'Hadoop', 'Airflow', 'dbt', 'ETL', 'LLM', 'Generative AI',
    'Power BI', 'Tableau', 'Excel', 'Data Analysis', 'Statistics', 'A/B Testing',
    'Accessibility', 'WCAG', 'Web Performance', 'Core Web Vitals', 'SEO', 'Design Systems', 'Storybook', 'Figma', 'UI/UX',
    'Linux', 'Bash', 'Networking', 'Security', 'OAuth', 'JWT',
  ],
  tools: [
    'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'CI/CD', 'Nginx', 'Git', 'Jira',
    'Jest', 'React Testing Library', 'Cypress', 'Playwright', 'Selenium', 'JUnit', 'PyTest', 'Mocha', 'Postman', 'Vercel', 'Netlify', 'Heroku', 'Salesforce', 'SAP', 'Chart.js',
  ],
  soft: [
    'Leadership', 'Mentoring', 'Communication', 'Teamwork', 'Collaboration', 'Stakeholder management', 'Project management', 'Agile', 'Scrum', 'Problem solving',
    'Public speaking', 'Negotiation', 'Customer service', 'Time management', 'Product management', 'Cross-functional',
  ],
};
const ALIASES = { golang: 'Go', 'node': 'Node.js', nodejs: 'Node.js', reactjs: 'React', 'react.js': 'React', nextjs: 'Next.js', 'vue.js': 'Vue', postgres: 'PostgreSQL', k8s: 'Kubernetes', 'ci/cd': 'CI/CD', mentored: 'Mentoring', 'scrum master': 'Scrum', sprints: 'Agile', 'rest api': 'REST APIs' };

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function findSkills(text) {
  const lower = ` ${text.toLowerCase()} `;
  const found = { technical: new Set(), tools: new Set(), soft: new Set() };
  for (const [group, list] of Object.entries(SKILLS)) {
    for (const skill of list) {
      const s = skill.toLowerCase();
      // Short tokens (Go, R, C#) need strict word boundaries and case match to avoid false hits.
      if (s.length <= 2) {
        const re = new RegExp(`(^|[^A-Za-z0-9])${escapeRe(skill)}([^A-Za-z0-9+#]|$)`);
        if (re.test(text)) found[group].add(skill);
        continue;
      }
      const re = new RegExp(`(^|[^a-z0-9])${escapeRe(s)}([^a-z0-9]|$)`);
      if (re.test(lower)) found[group].add(skill);
    }
  }
  for (const [alias, skill] of Object.entries(ALIASES)) {
    const re = new RegExp(`(^|[^a-z0-9])${escapeRe(alias)}([^a-z0-9]|$)`);
    if (re.test(lower)) {
      const g = SKILLS.tools.includes(skill) ? 'tools' : SKILLS.soft.includes(skill) ? 'soft' : 'technical';
      found[g].add(skill);
    }
  }
  if (found.technical.has('REST APIs')) found.technical.delete('REST');
  if (found.technical.has('Go') && found.technical.has('Golang')) found.technical.delete('Golang');
  return { technical: [...found.technical], tools: [...found.tools], soft: [...found.soft] };
}

// ---------------------------------------------------------------- analysis
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
const RANGE_RE = /(?:([A-Za-z]{3,9})\.?\s+)?((?:19|20)\d{2})\s*(?:-|–|—|to)\s*(?:([A-Za-z]{3,9})\.?\s+)?((?:19|20)\d{2}|present|current|now|till date)/gi;

const SECTION_RE = {
  summary: /^(summary|profile|professional summary|about me|objective|career objective)\b/i,
  experience: /^(experience|work experience|professional experience|employment|employment history|work history|internships?)\b/i,
  projects: /^(projects|personal projects|academic projects|key projects)\b/i,
  skills: /^(skills|technical skills|core skills|key skills|competencies|tech stack)\b/i,
  education: /^(education|academics|academic background|qualifications)\b/i,
  certifications: /^(certifications?|licenses|courses|certificates)\b/i,
  achievements: /^(achievements|awards|honors|honours|accomplishments)\b/i,
};

function splitSections(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const sections = { header: [] };
  let current = 'header';
  for (const line of lines) {
    if (!line) continue;
    const clean = line.replace(/[:#*_]/g, '').trim();
    const hit = clean.length < 40 && Object.entries(SECTION_RE).find(([, re]) => re.test(clean));
    if (hit) {
      current = hit[0];
      sections[current] = sections[current] || [];
      continue;
    }
    (sections[current] = sections[current] || []).push(line);
  }
  return sections;
}

const isBullet = (l) => /^[•\-*–▪●◦·]\s*/.test(l);
const stripBullet = (l) => l.replace(/^[•\-*–▪●◦·]\s*/, '').trim();

function parseYears(text) {
  const ranges = [];
  const now = new Date();
  let m;
  RANGE_RE.lastIndex = 0;
  while ((m = RANGE_RE.exec(text))) {
    const sm = MONTHS[(m[1] || '').slice(0, 4).toLowerCase()] ?? MONTHS[(m[1] || '').slice(0, 3).toLowerCase()] ?? 0;
    const start = Number(m[2]) * 12 + sm;
    let end;
    if (/^\d/.test(m[4])) {
      const em = MONTHS[(m[3] || '').slice(0, 3).toLowerCase()] ?? 11;
      end = Number(m[4]) * 12 + em;
    } else end = now.getFullYear() * 12 + now.getMonth();
    if (end >= start) ranges.push([start, end]);
  }
  return ranges;
}

function totalYears(ranges) {
  if (!ranges.length) return 0;
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  let total = 0;
  let [cs, ce] = sorted[0];
  for (const [s, e] of sorted.slice(1)) {
    if (s <= ce) ce = Math.max(ce, e);
    else {
      total += ce - cs;
      [cs, ce] = [s, e];
    }
  }
  total += ce - cs;
  return Math.round((total / 12) * 10) / 10;
}

function parseExperience(lines = []) {
  const out = [];
  let cur = null;
  for (const line of lines) {
    if (!isBullet(line) && (RANGE_RE.test(line) || /\s(at|@)\s/.test(line) || /[—|]/.test(line))) {
      RANGE_RE.lastIndex = 0;
      const dateMatch = line.match(RANGE_RE);
      RANGE_RE.lastIndex = 0;
      const duration = dateMatch ? dateMatch[0] : '';
      const head = line.replace(duration, '').replace(/[|,]\s*$/, '').trim();
      const parts = head.split(/\s+(?:—|–|-|\||at|@)\s+/);
      cur = { role: (parts[0] || head).replace(/[|]/g, '').trim(), company: (parts[1] || '').replace(/[|]/g, '').split(',')[0].trim(), duration, highlights: [] };
      out.push(cur);
    } else if (cur && isBullet(line)) {
      cur.highlights.push(stripBullet(line));
    } else if (cur && cur.highlights.length && !isBullet(line) && line.length > 40) {
      cur.highlights.push(line);
    }
  }
  return out.filter((e) => e.role).slice(0, 8);
}

function parseProjects(lines = []) {
  const out = [];
  let cur = null;
  for (const line of lines) {
    if (!isBullet(line) && line.length < 120) {
      const [name, ...rest] = line.split(/\s+[—–|:-]\s+/);
      cur = { name: name.trim(), description: rest.join(' — ').trim(), tech: [] };
      out.push(cur);
    } else if (cur) {
      const t = stripBullet(line);
      cur.description = cur.description ? `${cur.description}. ${t}` : t;
    }
  }
  return out
    .filter((p) => p.name && p.name.length > 1)
    .map((p) => ({ ...p, tech: findSkills(`${p.name} ${p.description}`).technical.concat(findSkills(p.description).tools).slice(0, 8) }))
    .slice(0, 6);
}

function parseEducation(lines = []) {
  return lines
    .filter((l) => !isBullet(l))
    .slice(0, 4)
    .map((l) => {
      const year = (l.match(/(?:19|20)\d{2}(?:\s*[-–]\s*(?:19|20)\d{2})?/) || [''])[0];
      const [degree, institution] = l.replace(year, '').split(/\s+[—–|,-]\s+|,\s*/);
      return { degree: (degree || l).replace(/[|]/g, '').trim(), institution: (institution || '').replace(/[|]/g, '').trim(), year };
    });
}

const sameText = (a, b) => a.replace(/\s+/g, ' ').trim() === b.replace(/\s+/g, ' ').trim();

export function analyzeLocal(resumeText) {
  if (sameText(resumeText, SAMPLE_RESUME)) return structuredClone(SAMPLE_ANALYSIS);

  const sections = splitSections(resumeText);
  const skills = findSkills(resumeText);
  const header = sections.header || [];
  const nameLine = header.find((l) => /^[A-Za-z][A-Za-z .'-]{2,40}$/.test(l) && l.split(' ').length <= 4) || '';
  const experience = parseExperience(sections.experience);
  const years = totalYears(parseYears((sections.experience || []).join('\n')));
  const projects = parseProjects(sections.projects);
  const education = parseEducation(sections.education);
  const certifications = (sections.certifications || []).map(stripBullet).slice(0, 8);
  const achievements = (sections.achievements || []).map(stripBullet).slice(0, 8);
  const allBullets = experience.flatMap((e) => e.highlights);
  const quantified = allBullets.filter((b) => /\d/.test(b));

  // Strong skills: mentioned most often across the resume
  const counted = [...skills.technical, ...skills.tools].map((s) => ({
    s,
    n: (resumeText.match(new RegExp(escapeRe(s), 'gi')) || []).length,
  }));
  const strongSkills = counted.sort((a, b) => b.n - a.n).slice(0, 6).map((x) => x.s);

  const seniority = years >= 12 ? 'Lead' : years >= 6 ? 'Senior' : years >= 2 ? 'Mid' : years > 0 ? 'Entry' : 'Student';
  const careerObservations = [];
  if (experience.length >= 2) careerObservations.push(`${experience.length} roles listed; expect questions on why you moved between them`);
  if (quantified.length) careerObservations.push(`${quantified.length} quantified achievements: interviewers will probe how you measured them`);
  if (!experience.length) careerObservations.push('No work experience section detected: projects and education will carry the interview');

  const improvementAreas = [];
  if (allBullets.length && quantified.length / allBullets.length < 0.4) improvementAreas.push('Most bullets lack numbers; prepare metrics for your key results');
  if (!skills.soft.length) improvementAreas.push('Few soft skills are evidenced; prepare stories about teamwork and ownership');
  if (!projects.length) improvementAreas.push('No projects section; prepare one or two project stories to discuss in depth');
  if (!certifications.length) improvementAreas.push('No certifications listed; be ready to show how you keep skills current');

  const summaryLine = (sections.summary || []).join(' ').slice(0, 320);

  return {
    name: nameLine,
    headline: [experience[0]?.role, years ? `${years} years` : '', strongSkills.slice(0, 3).join(', ')].filter(Boolean).join(' · '),
    summary:
      summaryLine ||
      `Candidate with ${years ? `about ${years} years of experience` : 'early-career experience'}${strongSkills.length ? `, strongest in ${strongSkills.slice(0, 3).join(', ')}` : ''}.`,
    yearsOfExperience: years,
    seniority,
    technicalSkills: skills.technical,
    softSkills: skills.soft,
    tools: skills.tools,
    strongSkills,
    experience,
    projects,
    education,
    certifications,
    achievements,
    careerObservations,
    improvementAreas,
    suggestedRoles: experience[0]?.role ? [experience[0].role] : [],
  };
}

// ---------------------------------------------------------------- job match
export function matchLocal(analysis, jobDescription) {
  const jd = findSkills(jobDescription);
  const required = [...new Set([...jd.technical, ...jd.tools, ...jd.soft])];
  const have = new Set([...analysis.technicalSkills, ...analysis.tools, ...analysis.softSkills, ...analysis.strongSkills].map((s) => s.toLowerCase()));
  const matchedSkills = required.filter((s) => have.has(s.toLowerCase()));
  const missingSkills = required.filter((s) => !have.has(s.toLowerCase()));
  const matchScore = required.length ? Math.round((matchedSkills.length / required.length) * 100) : 50;
  const recommendations = [
    ...missingSkills.slice(0, 3).map((s) => `Prepare an honest answer about ${s}: related experience you have and how you would ramp up.`),
    matchedSkills.length ? `Lead with your strongest overlap: ${matchedSkills.slice(0, 3).join(', ')}.` : 'Map each job requirement to a concrete example from your resume.',
    'Have two quantified stories ready that match the role’s main responsibilities.',
  ];
  return { matchScore, matchedSkills, missingSkills, recommendations };
}

// ---------------------------------------------------------------- questions
const pick = (arr, i) => (arr.length ? arr[i % arr.length] : undefined);

function context(analysis, job) {
  const skills = [...new Set([...(analysis.strongSkills || []), ...(analysis.technicalSkills || []), ...(analysis.tools || [])])];
  const highlights = (analysis.experience || []).flatMap((e) => e.highlights.map((h) => ({ h, role: e.role, company: e.company })));
  return {
    name: analysis.name || '',
    role: analysis.experience?.[0]?.role || 'your current role',
    company: analysis.experience?.[0]?.company || 'your current company',
    prevCompany: analysis.experience?.[1]?.company || '',
    years: analysis.yearsOfExperience || 0,
    skills: skills.length ? skills : ['your core skill'],
    projects: analysis.projects?.length ? analysis.projects : [{ name: 'your main project', description: '', tech: [] }],
    highlights: highlights.length ? highlights : [{ h: 'your biggest achievement', role: 'your role', company: 'your company' }],
    education: analysis.education?.[0],
    cert: analysis.certifications?.[0],
    observations: analysis.careerObservations || [],
    target: job?.title || analysis.suggestedRoles?.[0] || 'this role',
    targetCompany: job?.company || 'your company',
    missing: job?.missingSkills || [],
  };
}

// Each template: (ctx, i) => question fields. Sample answers stay honest:
// they reuse resume facts and mark everything else with [ADD: ...].
const T = {
  'Personal Introduction': [
    (c) => ({
      question: 'Tell me about yourself.',
      resumeReference: 'Summary and career path',
      whyAsked: 'The interviewer wants a two-minute story that connects your background to this role and sets the agenda for the rest of the interview.',
      sampleAnswer: `I'm a ${c.role}${c.years ? ` with about ${c.years} years of experience` : ''}, currently at ${c.company}. My strongest areas are ${c.skills.slice(0, 3).join(', ')}. Recently, ${did(c.highlights[0].h)}. ${c.prevCompany ? `Before that I worked at ${c.prevCompany}, where I [ADD: one result you're proud of]. ` : ''}I'm now looking for a ${c.target} role where I can [ADD: what you want to do next], which is why this position at ${c.targetCompany} stood out to me.`,
      keyPoints: ['Present → past → future structure', 'One or two quantified highlights', 'A clear link to this specific role', 'Keep it under two minutes'],
      mistakesToAvoid: ['Reciting your resume line by line', 'Starting from childhood or school', 'Ending without saying why you want this role'],
      followUps: ['What are you most proud of in your current role?', 'Why are you looking to move now?'],
    }),
    (c) => ({
      question: `Walk me through your career so far. How did you end up working with ${c.skills[0]}?`,
      resumeReference: `Skills: ${c.skills[0]}`,
      whyAsked: 'Tests whether your career has a coherent narrative and whether your choices were deliberate.',
      sampleAnswer: `${c.education ? `I studied ${c.education.degree}${c.education.institution ? ` at ${c.education.institution}` : ''}, ` : ''}and I got into ${c.skills[0]} through [ADD: how you first started using it]. At ${c.company} it became central to my work: ${did(c.highlights[0].h)}. Each move I've made has been toward [ADD: the theme of your career, e.g. owning bigger systems], and ${c.target} is the natural next step.`,
      keyPoints: ['A clear thread that connects your roles', 'Why each move made sense', 'Where you are heading next'],
      mistakesToAvoid: ['Making moves sound accidental', 'Speaking negatively about past employers'],
      followUps: ['What would you do differently in your career?', 'Which role taught you the most?'],
    }),
    (c) => ({
      question: 'What three words would your teammates use to describe you, and why?',
      resumeReference: 'General',
      whyAsked: 'Checks self-awareness and whether your claimed traits have real evidence behind them.',
      sampleAnswer: `I think they'd say [ADD: trait 1], [ADD: trait 2] and [ADD: trait 3]. For example, at ${c.company}, ${did(c.highlights[Math.min(1, c.highlights.length - 1)].h)} which needed [ADD: how one trait showed up]. [ADD: a short example for a second trait].`,
      keyPoints: ['Pick traits relevant to the role', 'Back each with a quick example', 'Stay authentic'],
      mistakesToAvoid: ['Generic words like "hardworking" with no proof', 'Listing traits without examples'],
      followUps: ['What would your manager say is your biggest area for growth?'],
    }),
  ],
  'HR Interview': [
    (c) => ({
      question: `Why do you want to work at ${c.targetCompany} as a ${c.target}?`,
      resumeReference: 'Job description',
      whyAsked: 'Assesses motivation, research and whether you are likely to stay and succeed.',
      sampleAnswer: `Two reasons. First, the role lines up with what I do best: ${c.skills.slice(0, 2).join(' and ')}. For example, ${did(c.highlights[0].h)}. Second, I'm drawn to [ADD: something specific about the company: product, mission, engineering culture]. I want to grow toward [ADD: your goal], and this role gives me [ADD: the opportunity it offers].`,
      keyPoints: ['Specific research about the company', 'Fit between your strengths and the role', 'What you want to learn'],
      mistakesToAvoid: ['Talking only about salary or perks', 'Generic praise that fits any company'],
      followUps: ['What do you know about our product?', 'Where else are you interviewing?'],
    }),
    (c) => ({
      question: 'What are your greatest strength and your biggest weakness?',
      resumeReference: `Strong skills: ${c.skills.slice(0, 2).join(', ')}`,
      whyAsked: 'Checks self-awareness and honesty, and whether your weakness is a deal-breaker for the role.',
      sampleAnswer: `My greatest strength is ${c.skills[0]}: for example, ${did(c.highlights[0].h)}. A weakness I'm working on is [ADD: a real but non-critical weakness]. To address it I've been [ADD: concrete steps you are taking], and I've already seen [ADD: early progress].`,
      keyPoints: ['A strength with evidence', 'A real weakness, not a disguised strength', 'Concrete steps to improve'],
      mistakesToAvoid: ['"I\'m a perfectionist" clichés', 'A weakness that is core to the job'],
      followUps: ['Can you give an example where that weakness hurt you?'],
    }),
    (c) => ({
      question: 'Where do you see yourself in five years?',
      resumeReference: 'Career path',
      whyAsked: 'Checks ambition and whether your goals align with what this role can offer.',
      sampleAnswer: `In five years I'd like to be [ADD: your goal, e.g. a senior engineer owning a product area]. I've already started down that path at ${c.company}, where ${did(c.highlights[0].h)}. In a ${c.target} role I'd focus on deepening ${c.skills[0]} and taking on [ADD: responsibility you want].`,
      keyPoints: ['Realistic, role-related goals', 'Link to the growth this role offers', 'Commitment to the company'],
      mistakesToAvoid: ['Saying you want the interviewer\'s job', 'Goals unrelated to the role'],
      followUps: ['What skills do you need to build to get there?'],
    }),
    (c) => ({
      question: `Why are you looking to leave ${c.company}?`,
      resumeReference: `Experience: ${c.company}`,
      whyAsked: 'Looks for red flags and whether your reasons will repeat here.',
      sampleAnswer: `I've learned a lot at ${c.company}: ${did(c.highlights[0].h)}. I'm looking for [ADD: the honest, forward-looking reason, e.g. larger scale or a product focus] and this ${c.target} role offers exactly that.`,
      keyPoints: ['Stay positive about your current employer', 'Focus on what you are moving toward', 'Keep it short'],
      mistakesToAvoid: ['Complaining about your manager or pay', 'Long explanations that sound defensive'],
      followUps: ['What would make you stay at your current company?'],
    }),
    () => ({
      question: 'What are your salary expectations?',
      resumeReference: 'General',
      whyAsked: 'Checks whether expectations fit the budget and how well you negotiate.',
      sampleAnswer: `Based on my research for this role and level in [ADD: city or market], and my experience, I'm looking for a range of [ADD: your researched range]. I'm open to discussing the full package, including [ADD: what matters to you, e.g. learning budget or flexibility].`,
      keyPoints: ['Give a researched range', 'Mention flexibility on the full package', 'Stay confident'],
      mistakesToAvoid: ['Naming a number with no research', 'Refusing to answer at all'],
      followUps: ['What is your current notice period?'],
    }),
  ],
  Technical: [
    (c, i) => {
      const s = pick(c.skills, i);
      return {
        question: `How would you explain the core concepts of ${s} to a new team member, and what are its main trade-offs?`,
        resumeReference: `Skills: ${s}`,
        whyAsked: `Tests depth of understanding of ${s} beyond surface use, and your ability to communicate it.`,
        sampleAnswer: `I'd start with the problem ${s} solves: [ADD: the core purpose]. The key concepts are [ADD: 2–3 core concepts]. In my work at ${c.company} I used it to [ADD: how you used ${s}]. The main trade-offs are [ADD: a strength] versus [ADD: a limitation], so I'd pick it when [ADD: when it fits] and avoid it when [ADD: when it doesn't].`,
        keyPoints: ['Purpose before features', 'Correct terminology', 'An honest trade-off', 'A real usage example'],
        mistakesToAvoid: ['Memorized definitions with no context', 'Claiming it has no downsides'],
        followUps: [`What's an alternative to ${s} and when would you choose it?`, `What's the hardest bug you hit with ${s}?`],
      };
    },
    (c, i) => {
      const s = pick(c.skills, i + 1);
      return {
        question: `Describe a performance or scalability problem you solved using ${s}. How did you find the bottleneck?`,
        resumeReference: `Skills: ${s}`,
        whyAsked: 'Tests hands-on debugging, measurement and optimization skills.',
        sampleAnswer: `At ${c.company}, [ADD: the symptom, e.g. slow page or API]. I measured it with [ADD: tool or method] and found the bottleneck was [ADD: root cause]. Using ${s}, I [ADD: the fix]. ${/\d/.test(c.highlights[0].h) ? `The result: ${did(c.highlights[0].h)}.` : 'The result was [ADD: measurable improvement].'}`,
        keyPoints: ['Measure before optimizing', 'Clear root cause', 'Quantified result', 'What you would monitor afterwards'],
        mistakesToAvoid: ['Guessing at causes without data', 'No numbers in the result'],
        followUps: ['How did you verify the fix in production?', 'What would you do if traffic grew 10x?'],
      };
    },
    (c, i) => {
      const s = pick(c.skills, i + 2);
      return {
        question: `What best practices do you follow for testing and code quality when working with ${s}?`,
        resumeReference: `Skills: ${s}`,
        whyAsked: 'Shows whether you build maintainable, reliable software rather than just working code.',
        sampleAnswer: `I follow [ADD: your testing approach, e.g. unit tests for logic, integration tests for APIs]. With ${s}, specifically I [ADD: practice]. In code review I look for [ADD: what you check]. ${c.highlights.find((h) => /test|coverage|review/i.test(h.h)) ? `For example, ${lowerFirst(c.highlights.find((h) => /test|coverage|review/i.test(h.h)).h)}.` : '[ADD: an example where testing caught a real issue].'}`,
        keyPoints: ['Testing pyramid awareness', 'Code review habits', 'A concrete example'],
        mistakesToAvoid: ['Saying "QA handles testing"', 'Listing tools without describing practice'],
        followUps: ['How do you decide what not to test?', 'How do you handle flaky tests?'],
      };
    },
    (c) => ({
      question: `How would you design a system for ${c.target === 'this role' ? 'a feature you recently built' : `a core feature a ${c.target} would own`}? Walk me through your architecture choices.`,
      resumeReference: 'Target role',
      whyAsked: 'Tests system design thinking: requirements, components, data flow and trade-offs.',
      sampleAnswer: `I'd start by clarifying requirements: [ADD: users, scale, latency]. Then I'd outline the components: [ADD: frontend, API, data store, cache, queue]. I'd choose ${c.skills.slice(0, 2).join(' and ')} because [ADD: reasons], similar to how I [ADD: related experience at ${c.company}]. Key trade-offs are [ADD: consistency vs. speed, cost vs. complexity], and I'd monitor [ADD: metrics].`,
      keyPoints: ['Clarify requirements first', 'Draw the data flow', 'Explain trade-offs', 'Mention failure handling and monitoring'],
      mistakesToAvoid: ['Jumping into tech choices before requirements', 'Ignoring failure cases'],
      followUps: ['Where is the single point of failure?', 'How would you handle 10x traffic?'],
    }),
    (c, i) => {
      const s = pick(c.skills, i + 3);
      return {
        question: `What's something about ${s} that you learned the hard way?`,
        resumeReference: `Skills: ${s}`,
        whyAsked: 'Separates real hands-on experience from tutorial knowledge.',
        sampleAnswer: `With ${s}, I once [ADD: the mistake or surprise]. It caused [ADD: the impact]. I fixed it by [ADD: the fix], and since then I always [ADD: the lesson or practice].`,
        keyPoints: ['A specific incident', 'The underlying technical reason', 'The lasting lesson'],
        mistakesToAvoid: ['Saying you never hit problems', 'A vague story with no technical detail'],
        followUps: ['How did you share that lesson with your team?'],
      };
    },
  ],
  'Resume-Based': [
    (c, i) => {
      const h = pick(c.highlights, i);
      return {
        question: `Your resume says: "${h.h}". Walk me through exactly how you did that.`,
        resumeReference: `${h.role}${h.company ? ` at ${h.company}` : ''}`,
        whyAsked: 'Interviewers verify headline claims and check how much of the work was personally yours.',
        sampleAnswer: `At ${h.company || 'that company'}, [ADD: the situation and why it mattered]. My part was [ADD: your specific responsibility]. I [ADD: the 2–3 key steps you took]. ${/\d/.test(h.h) ? `That's how we got to the result on my resume: ${did(h.h)}.` : 'The result was [ADD: a measurable outcome].'} I measured it using [ADD: how you measured it].`,
        keyPoints: ['Your individual contribution, using "I"', 'The steps, not just the outcome', 'How the result was measured'],
        mistakesToAvoid: ['Saying "we" for everything', 'Being unable to explain the numbers'],
        followUps: ['What would you do differently now?', 'Who else was involved and what did they do?'],
      };
    },
    (c, i) => {
      const h = pick(c.highlights, i + 1);
      return {
        question: `What was the hardest part of this: "${h.h}"?`,
        resumeReference: `${h.role}${h.company ? ` at ${h.company}` : ''}`,
        whyAsked: 'Probes depth of involvement and how you handle obstacles.',
        sampleAnswer: `The hardest part was [ADD: the main obstacle: technical, people or time]. I handled it by [ADD: what you did]. Looking back, it taught me [ADD: lesson], which I've applied since.`,
        keyPoints: ['A real obstacle', 'Your specific response', 'What you learned'],
        mistakesToAvoid: ['Saying it was easy', 'Blaming others for the difficulty'],
        followUps: ['How did you keep stakeholders informed?'],
      };
    },
    (c) => ({
      question: c.prevCompany ? `Why did you move from ${c.prevCompany} to ${c.company}?` : `What made you choose ${c.company}?`,
      resumeReference: 'Career transitions',
      whyAsked: 'Checks the reasoning behind your career decisions and looks for patterns.',
      sampleAnswer: `${c.prevCompany ? `At ${c.prevCompany} I learned [ADD: what you learned]. ` : ''}I joined ${c.company} because [ADD: the real, positive reason]. It's worked out well: ${did(c.highlights[0].h)}.`,
      keyPoints: ['A forward-looking reason', 'What you gained from each step', 'Evidence the move paid off'],
      mistakesToAvoid: ['Negativity about past employers', 'Sounding like you chase titles only'],
      followUps: ['Would you go back to your previous company?'],
    }),
    (c) => ({
      question: c.cert ? `You hold "${c.cert}". How have you applied it in real work?` : 'How do you keep your skills current?',
      resumeReference: c.cert ? `Certification: ${c.cert}` : 'General',
      whyAsked: 'Checks whether certifications and learning translate into practice.',
      sampleAnswer: c.cert
        ? `I earned it because [ADD: why you pursued it]. Since then I've applied it at ${c.company} by [ADD: a concrete application]. The most useful thing it taught me was [ADD: specific concept].`
        : `I [ADD: your learning habits, e.g. side projects, courses, reading]. Most recently I learned [ADD: a skill] and applied it to [ADD: where].`,
      keyPoints: ['Concrete application', 'Specific knowledge gained', 'Ongoing learning habits'],
      mistakesToAvoid: ['Treating certificates as proof by themselves'],
      followUps: ['What are you learning right now?'],
    }),
    (c) => ({
      question: c.observations[0] ? `I noticed: ${lowerFirst(c.observations[0])}. Can you tell me more?` : 'Is there anything on your resume you would like to explain further?',
      resumeReference: 'Career observations',
      whyAsked: 'Interviewers address anything unusual early to rule out concerns.',
      sampleAnswer: `Sure. [ADD: honest, concise context]. What I took from that period is [ADD: lesson or growth], and it's part of why I'm well prepared for a ${c.target} role.`,
      keyPoints: ['Brief, honest context', 'Focus on growth', 'Bring it back to the role'],
      mistakesToAvoid: ['Over-explaining or sounding defensive'],
      followUps: ['What did you do during that time to stay sharp?'],
    }),
  ],
  'Project-Based': [
    (c, i) => {
      const p = pick(c.projects, i);
      return {
        question: `Tell me about ${p.name}. What problem did it solve, and what was your role?`,
        resumeReference: `Project: ${p.name}`,
        whyAsked: 'Projects show initiative and how you think end to end.',
        sampleAnswer: `${p.name} ${p.description ? `is ${lowerFirst(p.description)}` : 'is [ADD: a one-line description]'}. I built it because [ADD: the problem or motivation]. I was responsible for [ADD: your scope]${p.tech.length ? ` and used ${p.tech.slice(0, 4).join(', ')}` : ''}. The outcome was [ADD: users, results or what you learned].`,
        keyPoints: ['The problem first', 'Your exact role', 'Tech choices and why', 'Outcome or learning'],
        mistakesToAvoid: ['Listing technologies without reasons', 'No result or reflection'],
        followUps: ['What would you change if you rebuilt it?', 'How did you test it?'],
      };
    },
    (c, i) => {
      const p = pick(c.projects, i + 1);
      const t = p.tech[0] || c.skills[0];
      return {
        question: `In ${p.name}, why did you choose ${t}? What alternatives did you consider?`,
        resumeReference: `Project: ${p.name}`,
        whyAsked: 'Tests whether your technical decisions were deliberate and well reasoned.',
        sampleAnswer: `I chose ${t} because [ADD: the main reasons, e.g. team familiarity, ecosystem, performance]. I considered [ADD: alternative] but it [ADD: why it fit less well]. In hindsight, [ADD: whether you'd make the same choice and why].`,
        keyPoints: ['Requirements drove the choice', 'At least one real alternative', 'Honest hindsight'],
        mistakesToAvoid: ['"It\'s what I knew" as the only reason'],
        followUps: [`What limitations of ${t} did you hit?`],
      };
    },
    (c, i) => {
      const p = pick(c.projects, i + 2);
      return {
        question: `What was the biggest technical challenge in ${p.name}, and how did you solve it?`,
        resumeReference: `Project: ${p.name}`,
        whyAsked: 'Shows problem-solving under real constraints.',
        sampleAnswer: `The biggest challenge was [ADD: the challenge]. I first tried [ADD: first approach], which didn't work because [ADD: reason]. I then [ADD: final solution]. The result was [ADD: outcome].`,
        keyPoints: ['A specific technical challenge', 'Iteration: what failed first', 'Why the final solution worked'],
        mistakesToAvoid: ['A generic challenge like "time management"'],
        followUps: ['How would this approach hold up at larger scale?'],
      };
    },
    (c, i) => {
      const p = pick(c.projects, i + 3);
      return {
        question: `If ${p.name} suddenly had 100 times more users, what would break first?`,
        resumeReference: `Project: ${p.name}`,
        whyAsked: 'Tests scalability thinking using a system you know well.',
        sampleAnswer: `The first thing to break would probably be [ADD: bottleneck, e.g. database writes or a single server]. I'd address it by [ADD: caching, horizontal scaling, queueing, indexing]. I'd also add [ADD: monitoring/alerting] so we'd see problems before users do.`,
        keyPoints: ['Identify the real bottleneck', 'Prioritized fixes', 'Monitoring'],
        mistakesToAvoid: ['Saying "just add more servers" without detail'],
        followUps: ['How would you load-test it?'],
      };
    },
  ],
  Behavioral: [
    (c) => ({
      question: 'Tell me about a time you had a conflict with a teammate. How did you handle it?',
      resumeReference: `Experience: ${c.company}`,
      whyAsked: 'Assesses emotional maturity and how you work through disagreements.',
      sampleAnswer: `At ${c.company}, [ADD: the situation and the disagreement]. My goal was to [ADD: task]. I set up a one-on-one, listened to their concerns, and [ADD: what you did to resolve it]. In the end [ADD: the result], and we [ADD: how the relationship improved].`,
      keyPoints: ['STAR structure', 'Empathy and listening', 'A constructive resolution', 'What you learned'],
      mistakesToAvoid: ['Making the other person the villain', 'A story where nothing was resolved'],
      followUps: ['What would you do if they still disagreed?'],
    }),
    (c) => ({
      question: 'Describe a time you failed or made a significant mistake.',
      resumeReference: 'General',
      whyAsked: 'Tests accountability and ability to learn.',
      sampleAnswer: `At ${c.company}, I [ADD: the mistake]. It led to [ADD: the impact]. I owned it immediately by [ADD: what you did], fixed it by [ADD: the fix], and put in place [ADD: the process change] so it wouldn't happen again.`,
      keyPoints: ['A real mistake', 'Ownership', 'Fix and prevention', 'Lesson learned'],
      mistakesToAvoid: ['A fake failure that is really a success', 'Blaming others'],
      followUps: ['How did your manager react?'],
    }),
    (c, i) => {
      const h = pick(c.highlights, i + 2);
      return {
        question: `Tell me about a time you went beyond your role. Was "${h.h}" an example?`,
        resumeReference: `${h.role}${h.company ? ` at ${h.company}` : ''}`,
        whyAsked: 'Looks for ownership and initiative.',
        sampleAnswer: `Yes. [ADD: the situation that made it necessary]. It wasn't strictly my responsibility, but I [ADD: what you did and why]. ${/\d/.test(h.h) ? `The result: ${did(h.h)}.` : 'The result was [ADD: outcome].'}`,
        keyPoints: ['Why you stepped up', 'Specific actions', 'Measurable impact'],
        mistakesToAvoid: ['Implying your team was incompetent'],
        followUps: ['How did you balance it with your regular work?'],
      };
    },
    () => ({
      question: 'Tell me about a time you had to meet a very tight deadline.',
      resumeReference: 'General',
      whyAsked: 'Tests prioritization and performance under pressure.',
      sampleAnswer: `[ADD: situation and deadline]. I broke the work down, cut scope to [ADD: what you prioritized], and [ADD: how you communicated with stakeholders]. We delivered [ADD: result], and afterwards I [ADD: what you improved].`,
      keyPoints: ['Prioritization', 'Communication', 'Result', 'Reflection'],
      mistakesToAvoid: ['Glorifying overwork as the only strategy'],
      followUps: ['What did you decide not to do?'],
    }),
    () => ({
      question: 'Describe a time you received critical feedback. What did you do with it?',
      resumeReference: 'General',
      whyAsked: 'Assesses coachability and growth mindset.',
      sampleAnswer: `My [ADD: manager/peer] told me [ADD: the feedback]. At first [ADD: honest reaction], but I [ADD: steps taken]. Within [ADD: time], [ADD: measurable improvement].`,
      keyPoints: ['Real feedback', 'Action taken', 'Visible improvement'],
      mistakesToAvoid: ['Feedback that is a disguised compliment'],
      followUps: ['What feedback are you working on now?'],
    }),
  ],
  'Scenario-Based': [
    (c) => ({
      question: `Imagine you join as a ${c.target} and find the codebase or process has no documentation. What do you do in your first 30 days?`,
      resumeReference: 'Target role',
      whyAsked: 'Tests how you ramp up, prioritize and create leverage in a new team.',
      sampleAnswer: `First I'd learn by doing: pick small tasks to understand the system, and talk to the people who know it best. I'd document as I learn, starting with [ADD: the most painful gap]. By day 30 I'd aim to [ADD: concrete goal]. I did something similar at ${c.company} when [ADD: related example].`,
      keyPoints: ['Learn before changing', 'Relationships', 'Quick wins', 'A 30-day goal'],
      mistakesToAvoid: ['Proposing a rewrite on day one'],
      followUps: ['How would you get buy-in for documentation time?'],
    }),
    () => ({
      question: 'A critical production issue hits on Friday evening and your lead is unreachable. What do you do?',
      resumeReference: 'General',
      whyAsked: 'Tests judgement, ownership and communication under pressure.',
      sampleAnswer: `I'd assess impact first: who is affected and how badly. Then stabilize: roll back or apply a safe mitigation. I'd communicate in the incident channel with what I know, what I'm doing, and when I'll update next. Afterwards, I'd write a blameless post-mortem. [ADD: a real incident you handled, if any].`,
      keyPoints: ['Assess impact', 'Mitigate before root-causing', 'Communicate clearly', 'Post-mortem'],
      mistakesToAvoid: ['Waiting for permission while users suffer', 'Risky fixes without a rollback plan'],
      followUps: ['When would you escalate further?'],
    }),
    () => ({
      question: 'Your product manager asks for a feature by next week that you estimate needs three weeks. How do you respond?',
      resumeReference: 'General',
      whyAsked: 'Tests negotiation, estimation and stakeholder management.',
      sampleAnswer: `I'd explain the estimate and what drives it, then offer options: a smaller version by next week, the full version in three weeks, or more people on it. I'd ask what's driving the date to find the real must-haves. [ADD: an example where you negotiated scope].`,
      keyPoints: ['Transparency', 'Options, not just "no"', 'Understand the real deadline driver'],
      mistakesToAvoid: ['Agreeing and then missing the date silently'],
      followUps: ['What if they insist on the full scope?'],
    }),
    (c) => ({
      question: `You disagree with a senior engineer's technical decision on ${c.skills[0]}. What do you do?`,
      resumeReference: `Skills: ${c.skills[0]}`,
      whyAsked: 'Tests how you influence without authority.',
      sampleAnswer: `I'd first make sure I understand their reasoning. Then I'd bring data: [ADD: benchmarks, prototype, examples]. I'd raise it privately or in a design review, framed around the goal we share. If we still disagree, I'd commit to the decision and document the risk.`,
      keyPoints: ['Seek to understand', 'Data over opinion', 'Disagree and commit'],
      mistakesToAvoid: ['Going around them', 'Staying silent about real risks'],
      followUps: ['Tell me about a time this actually happened.'],
    }),
  ],
  'Problem-Solving': [
    () => ({
      question: 'Walk me through how you debug an issue you have never seen before.',
      resumeReference: 'General',
      whyAsked: 'Assesses structured thinking and persistence.',
      sampleAnswer: `I reproduce it first, then narrow it down: check logs and recent changes, form a hypothesis, and test it with the smallest change possible. I binary-search through the system until I find the cause. For example, [ADD: a real debugging story].`,
      keyPoints: ['Reproduce', 'Hypothesize and test', 'Narrow the search space', 'Prevent recurrence'],
      mistakesToAvoid: ['Random changes until something works'],
      followUps: ['When do you ask for help?'],
    }),
    (c) => ({
      question: `How would you estimate how many requests per second a service like ${c.projects[0]?.name || 'your main project'} needs to handle at peak?`,
      resumeReference: `Project: ${c.projects[0]?.name || 'General'}`,
      whyAsked: 'Tests estimation and back-of-the-envelope reasoning.',
      sampleAnswer: `I'd start from users: [ADD: daily active users], times actions per user per day, divided by seconds in a day, then multiply by a peak factor of around 3–5x. That gives roughly [ADD: your estimate]. I'd sanity-check it against [ADD: real metrics you've seen].`,
      keyPoints: ['State assumptions', 'Simple arithmetic', 'Peak factor', 'Sanity check'],
      mistakesToAvoid: ['Refusing to estimate without data'],
      followUps: ['How would you size the database for that?'],
    }),
    () => ({
      question: 'How do you approach a large task when the requirements are unclear?',
      resumeReference: 'General',
      whyAsked: 'Tests how you handle ambiguity.',
      sampleAnswer: `I ask clarifying questions about the goal and constraints, write down assumptions, and share a short plan for feedback. I'd build a thin slice first to validate direction. [ADD: example of a time you did this].`,
      keyPoints: ['Clarify goals', 'Write down assumptions', 'Iterate in small slices'],
      mistakesToAvoid: ['Building for weeks without feedback'],
      followUps: ['What if stakeholders disagree on the goal?'],
    }),
    (c) => ({
      question: `Users report that a feature built with ${c.skills[0]} is slow, but only sometimes. How do you investigate?`,
      resumeReference: `Skills: ${c.skills[0]}`,
      whyAsked: 'Tests debugging of intermittent, real-world problems.',
      sampleAnswer: `I'd look for patterns: time of day, user segment, data size, region. I'd add tracing or check existing metrics for latency percentiles, not just averages. Likely suspects are [ADD: caching misses, slow queries, cold starts]. I'd confirm with data before fixing. [ADD: a similar issue you've solved].`,
      keyPoints: ['Find the pattern', 'p95/p99 latency', 'Hypothesis with data', 'Verify the fix'],
      mistakesToAvoid: ['Optimizing the wrong thing without measurement'],
      followUps: ['What monitoring would you add afterwards?'],
    }),
  ],
  'Leadership & Teamwork': [
    (c) => {
      const m = c.highlights.find((h) => /mentor|led|lead|coach|train/i.test(h.h));
      return {
        question: m ? `Your resume mentions: "${m.h}". How did you approach that?` : 'Tell me about a time you helped a teammate grow.',
        resumeReference: m ? `${m.role} at ${m.company}` : 'General',
        whyAsked: 'Looks for leadership potential and how you multiply the team\'s impact.',
        sampleAnswer: `${m ? `At ${m.company}, ` : ''}[ADD: the situation and who you helped]. I [ADD: your approach, e.g. pairing, regular 1:1s, giving ownership]. The outcome was [ADD: how they or the team improved].`,
        keyPoints: ['A specific person or team', 'Your approach', 'A visible outcome'],
        mistakesToAvoid: ['Sounding condescending about junior colleagues'],
        followUps: ['How do you give difficult feedback?'],
      };
    },
    () => ({
      question: 'Tell me about a time you influenced a decision without formal authority.',
      resumeReference: 'General',
      whyAsked: 'Tests influence, communication and persuasion.',
      sampleAnswer: `[ADD: situation]. I gathered [ADD: data or prototype], met the key stakeholders one-on-one to understand their concerns, and presented [ADD: the proposal]. The team adopted it and [ADD: result].`,
      keyPoints: ['Data and empathy', 'Stakeholder mapping', 'Result'],
      mistakesToAvoid: ['Forcing a decision through'],
      followUps: ['What if it had been rejected?'],
    }),
    () => ({
      question: 'How do you work with people from other functions, like design, product or sales?',
      resumeReference: 'General',
      whyAsked: 'Tests collaboration across teams.',
      sampleAnswer: `I try to understand their goals and constraints early. For example, [ADD: a cross-functional example]. I keep them updated, explain technical trade-offs in plain language, and ask for feedback early.`,
      keyPoints: ['Shared goals', 'Plain-language communication', 'Early feedback'],
      mistakesToAvoid: ['Treating other functions as obstacles'],
      followUps: ['Describe a disagreement with a product manager.'],
    }),
    () => ({
      question: 'Describe a time your team was struggling. What did you do?',
      resumeReference: 'General',
      whyAsked: 'Looks for ownership of team outcomes, not just your own tasks.',
      sampleAnswer: `[ADD: what was going wrong, e.g. missed sprint goals]. I [ADD: what you noticed and did, e.g. proposed a retro, took on blocking work]. Over [ADD: time], [ADD: measurable improvement].`,
      keyPoints: ['Diagnosis', 'Action beyond your own tasks', 'Result'],
      mistakesToAvoid: ['Blaming teammates'],
      followUps: ['What did you learn about team dynamics?'],
    }),
  ],
  'Tricky Questions': [
    (c) => ({
      question: `Why should we hire you over other candidates for this ${c.target} role?`,
      resumeReference: 'Overall profile',
      whyAsked: 'Tests whether you can summarize your unique value confidently.',
      sampleAnswer: `I bring three things. First, strong ${c.skills[0]} experience: ${did(c.highlights[0].h)}. Second, [ADD: second differentiator]. Third, [ADD: a trait or experience specific to this role]. I can contribute quickly in [ADD: area] while growing into [ADD: area].`,
      keyPoints: ['Two or three differentiators', 'Evidence for each', 'Tie to the role\'s needs'],
      mistakesToAvoid: ['Putting other candidates down', 'Generic claims with no evidence'],
      followUps: ['What would you do in your first 90 days?'],
    }),
    (c) => {
      const miss = c.missing[0];
      return {
        question: miss ? `This role needs ${miss}, which isn't on your resume. How would you handle that?` : 'What is something important for this role that you have not done yet?',
        resumeReference: miss ? `Missing skill: ${miss}` : 'Job description',
        whyAsked: 'Tests honesty about gaps and your ability to learn fast.',
        sampleAnswer: `${miss ? `You're right, I haven't used ${miss} in production.` : 'One gap is [ADD: the gap].'} What I do have is [ADD: closest related experience, e.g. ${c.skills[0]}]. I've already started [ADD: learning steps], and when I learned ${c.skills[1] || c.skills[0]} I was productive within [ADD: time frame].`,
        keyPoints: ['Admit the gap honestly', 'Related experience', 'A concrete learning plan', 'A track record of learning fast'],
        mistakesToAvoid: ['Bluffing experience you don\'t have'],
        followUps: ['How long would it take you to be productive?'],
      };
    },
    () => ({
      question: 'What would you do if you got this job and realized in three months that it wasn\'t what you expected?',
      resumeReference: 'General',
      whyAsked: 'Tests commitment and maturity.',
      sampleAnswer: `I'd first talk to my manager to understand the gap between my expectations and reality, and look for ways to align the role with where I add most value. I'd give it a fair chance and focus on delivering. [ADD: an example where you adapted to a role change].`,
      keyPoints: ['Communication', 'Adaptability', 'Commitment'],
      mistakesToAvoid: ['Saying you would just leave'],
      followUps: ['What expectations do you have of this role?'],
    }),
    () => ({
      question: 'Tell me about a decision you made that turned out to be wrong.',
      resumeReference: 'General',
      whyAsked: 'Tests self-awareness and decision-making under uncertainty.',
      sampleAnswer: `I [ADD: decision] based on [ADD: the information at the time]. It turned out [ADD: what went wrong]. I [ADD: how you corrected course], and now I [ADD: how you make similar decisions differently].`,
      keyPoints: ['Reasonable decision at the time', 'Correction', 'Changed approach'],
      mistakesToAvoid: ['Claiming you are never wrong'],
      followUps: ['How do you decide when to reverse a decision?'],
    }),
    () => ({
      question: 'Do you have any questions for us?',
      resumeReference: 'General',
      whyAsked: 'Shows curiosity, preparation and what you care about.',
      sampleAnswer: `Yes, a few. What does success look like in the first six months for this role? What are the biggest challenges the team is facing right now? And how do you support growth, for example [ADD: something you care about, like mentoring or conference budgets]?`,
      keyPoints: ['Two or three thoughtful questions', 'About the role, team and growth'],
      mistakesToAvoid: ['Saying "No, I think you covered everything"', 'Asking only about perks'],
      followUps: [],
    }),
  ],
};

const VERB_RE = /^(built|led|wrote|ran|made|cut|grew|drove|won|set|took|taught|sold|kept|brought|built|spoke|oversaw|grew|began|rebuilt|shipped|\w+ed)\b/i;
/** Turns a resume bullet into first-person speech: "Built X" -> "I built X". */
function did(s = '') {
  const t = lowerFirst(s);
  return VERB_RE.test(s.trim()) ? `I ${t}` : t;
}

function lowerFirst(s = '') {
  const t = s.replace(/\.$/, '');
  return t && /^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t;
}

let localId = 0;
const nid = () => `d_${Date.now().toString(36)}_${(localId++).toString(36)}`;

function build(category, difficulty, template, ctx, i) {
  const q = template(ctx, i);
  return {
    id: nid(),
    category,
    difficulty,
    ...q,
    needsPersonalDetails: /\[ADD:/i.test(q.sampleAnswer),
  };
}

export function generateLocal({ analysis, job, categories, difficulty, count }) {
  const ctx = context(analysis, job);
  const cats = categories.length ? categories : CATEGORY_NAMES;
  const per = Math.floor(count / cats.length);
  let extra = count % cats.length;
  const out = [];
  const seen = new Set();
  cats.forEach((cat) => {
    const n = per + (extra-- > 0 ? 1 : 0);
    const templates = T[cat] || [];
    for (let k = 0, made = 0; made < n && k < n * 4; k++) {
      const q = build(cat, difficulty, templates[k % templates.length], ctx, Math.floor(k / templates.length) + k);
      if (seen.has(q.question)) continue;
      seen.add(q.question);
      out.push(q);
      made++;
    }
  });
  // Top up if some categories ran out of unique templates
  let k = 0;
  while (out.length < count && k < 200) {
    const cat = cats[k % cats.length];
    const templates = T[cat];
    const q = build(cat, difficulty, templates[(k * 7) % templates.length], ctx, k + 11);
    if (!seen.has(q.question)) {
      seen.add(q.question);
      out.push(q);
    }
    k++;
  }
  // Interleave categories for a natural order
  const byCat = cats.map((c) => out.filter((q) => q.category === c));
  const mixed = [];
  for (let i = 0; mixed.length < out.length; i++) byCat.forEach((list) => list[i] && mixed.push(list[i]));
  return mixed.slice(0, count);
}

export function regenerateLocal({ analysis, job, question, existing = [] }) {
  const ctx = context(analysis, job);
  const templates = T[question.category] || T['Resume-Based'];
  const taken = new Set(existing.map((q) => q.question));
  for (let k = 0; k < 40; k++) {
    const i = Math.floor(Math.random() * 50);
    const q = build(question.category, question.difficulty, templates[i % templates.length], ctx, i);
    if (!taken.has(q.question)) return q;
  }
  return build(question.category, question.difficulty, templates[0], ctx, 0);
}

// ---------------------------------------------------------------- evaluation
const STOP = new Set('the a an and or but of to in on for with at by from is are was were be been it this that you your i me my we our they their as what how why when which who do did does can could would should will about tell time describe walk through give example'.split(' '));
const words = (s) => (s.toLowerCase().match(/[a-z0-9+#.]+/g) || []).filter((w) => w.length > 2 && !STOP.has(w));

export function evaluateLocal({ question, answer }) {
  const text = answer.trim();
  const wc = (text.match(/\S+/g) || []).length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 3);
  const avgLen = sentences.length ? wc / sentences.length : wc;
  const lower = text.toLowerCase();
  const count = (re) => (lower.match(re) || []).length;

  const fillers = count(/\b(um+|uh+|like,|basically|actually|you know|kind of|sort of)\b/g);
  const hedges = count(/\b(i think|maybe|probably|i guess|not sure|i feel like|kind of|sort of|hopefully)\b/g);
  const ownership = count(/\b(i (led|built|designed|decided|owned|created|implemented|drove|improved|launched|reduced|increased|delivered|mentored|managed))\b/g);
  const numbers = count(/\d+(\.\d+)?\s?(%|x|k|ms|s|users|hours|days|weeks|minutes)?/g);
  const starSignals = [
    /\b(when|while|at my|in my (last|previous|current)|situation|we had|there was)\b/.test(lower),
    /\b(my (goal|task|responsibility|role)|i needed to|i was asked|i had to)\b/.test(lower),
    ownership > 0 || /\bi (then|first|started|worked|wrote|set up|talked)\b/.test(lower),
    /\b(result|as a result|which led|outcome|reduced|increased|improved|saved|finally|in the end)\b/.test(lower),
  ].filter(Boolean).length;
  const transitions = count(/\b(first|second|then|next|finally|as a result|because|so that|after that)\b/g);

  const qWords = new Set([...words(question.question), ...(question.keyPoints || []).flatMap(words)]);
  const aWords = new Set(words(text));
  const overlap = [...qWords].filter((w) => aWords.has(w)).length;
  const overlapRatio = qWords.size ? overlap / Math.min(qWords.size, 12) : 0.5;

  const lengthFactor = wc < 15 ? 0.25 : wc < 40 ? 0.6 : wc < 60 ? 0.85 : wc <= 280 ? 1 : 0.85;
  const clamp = (n) => Math.max(0, Math.min(10, Math.round(n)));

  const clarity = clamp((avgLen > 35 ? 5 : avgLen < 6 ? 5 : 8) - fillers * 0.7 + (transitions > 1 ? 1.5 : 0) * lengthFactor + (lengthFactor - 1) * 4);
  const relevance = clamp((3 + overlapRatio * 7) * lengthFactor + (numbers > 0 ? 0.5 : 0));
  const confidence = clamp((6 + ownership * 1.2 - hedges * 1.2 + (numbers > 0 ? 1 : 0)) * lengthFactor);
  const structure = clamp((2 + starSignals * 1.8 + (transitions > 1 ? 1 : 0)) * lengthFactor);
  const score = clamp(relevance * 0.35 + structure * 0.25 + clarity * 0.2 + confidence * 0.2);

  const strengths = [];
  const improvements = [];
  if (numbers > 0) strengths.push('You used concrete numbers, which makes your impact believable.');
  if (ownership > 0) strengths.push('Strong ownership language ("I led", "I built") shows what you personally did.');
  if (starSignals >= 3) strengths.push('Clear story structure: situation, actions and result are all present.');
  if (overlapRatio > 0.5) strengths.push('You stayed on topic and addressed what was asked.');
  if (wc >= 60 && wc <= 280) strengths.push('Good length: detailed without rambling.');
  if (!strengths.length) strengths.push('You attempted the question; now build it into a fuller story.');

  if (wc < 40) improvements.push('Your answer is too short. Aim for 90–180 words with a specific example.');
  if (wc > 280) improvements.push('Trim your answer; aim for under two minutes when spoken.');
  if (!numbers) improvements.push('Add a measurable result (time saved, % improvement, users affected).');
  if (starSignals < 3) improvements.push('Use STAR: set the situation, your task, the actions you took, and the result.');
  if (hedges > 1) improvements.push('Reduce hedging words like "I think", "maybe" and "probably".');
  if (fillers > 1) improvements.push('Cut filler words such as "basically" and "you know".');
  if (overlapRatio < 0.35) improvements.push('Connect your answer more directly to the question asked.');
  if (!ownership) improvements.push('Say what you did using "I" rather than "we".');

  const summary =
    score >= 8
      ? 'Strong answer. It is specific, structured and relevant; polish small details and you are interview-ready.'
      : score >= 6
      ? 'Solid foundation, but it needs more specifics and a clearer result to stand out.'
      : score >= 4
      ? 'The core idea is there, but the answer lacks structure and evidence. Build it around one concrete example.'
      : 'This answer needs significant work. Use a specific example and the STAR structure.';

  return {
    score,
    clarity,
    relevance,
    confidence,
    structure,
    summary,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    improvedAnswer: question.sampleAnswer || 'Structure your answer as: the situation, your task, the specific actions you took, and a measurable result.',
  };
}

export function reportLocal({ results }) {
  const avg = results.reduce((s, r) => s + r.evaluation.score, 0) / (results.length || 1);
  const dims = ['clarity', 'relevance', 'confidence', 'structure'];
  const dimAvg = Object.fromEntries(dims.map((d) => [d, results.reduce((s, r) => s + r.evaluation[d], 0) / (results.length || 1)]));
  const sorted = Object.entries(dimAvg).sort((a, b) => b[1] - a[1]);
  const best = [...results].sort((a, b) => b.evaluation.score - a.evaluation.score)[0];
  const worst = [...results].sort((a, b) => a.evaluation.score - b.evaluation.score)[0];
  const label = { clarity: 'clarity', relevance: 'staying relevant', confidence: 'confident delivery', structure: 'answer structure' };
  return {
    overallSummary: `You averaged ${avg.toFixed(1)}/10 across ${results.length} questions. Your strongest dimension was ${label[sorted[0][0]]}, and the biggest opportunity is ${label[sorted[sorted.length - 1][0]]}.`,
    strengths: [
      `Best answer: "${best?.question}" (${best?.evaluation.score}/10).`,
      `Strongest dimension: ${label[sorted[0][0]]} (${sorted[0][1].toFixed(1)}/10).`,
    ],
    focusAreas: [
      `Improve ${label[sorted[sorted.length - 1][0]]} (${sorted[sorted.length - 1][1].toFixed(1)}/10).`,
      `Revisit: "${worst?.question}" (${worst?.evaluation.score}/10).`,
    ],
    nextSteps: [
      'Rewrite your two lowest-scoring answers using the suggested improved answers, filling in every [ADD: ...] with your real details.',
      'Practice saying your answers out loud and time them: 60–120 seconds each.',
      'Run another mock interview at a higher difficulty level.',
    ],
  };
}
