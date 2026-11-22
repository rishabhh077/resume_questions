// JSON schemas for Claude structured outputs.
// Structured outputs require every object to list all properties as required
// and set additionalProperties: false.

const str = { type: 'string' };
const strArr = { type: 'array', items: { type: 'string' } };

function obj(properties) {
  return {
    type: 'object',
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}

export const analysisSchema = obj({
  name: str,
  headline: str,
  summary: str,
  yearsOfExperience: { type: 'number' },
  seniority: { type: 'string', enum: ['Student', 'Entry', 'Mid', 'Senior', 'Lead', 'Executive'] },
  technicalSkills: strArr,
  softSkills: strArr,
  tools: strArr,
  strongSkills: strArr,
  experience: {
    type: 'array',
    items: obj({ role: str, company: str, duration: str, highlights: strArr }),
  },
  projects: {
    type: 'array',
    items: obj({ name: str, description: str, tech: strArr }),
  },
  education: {
    type: 'array',
    items: obj({ degree: str, institution: str, year: str }),
  },
  certifications: strArr,
  achievements: strArr,
  careerObservations: strArr,
  improvementAreas: strArr,
  suggestedRoles: strArr,
});

export const matchSchema = obj({
  matchScore: { type: 'integer' },
  matchedSkills: strArr,
  missingSkills: strArr,
  recommendations: strArr,
});

export const questionItem = obj({
  category: str,
  difficulty: str,
  question: str,
  resumeReference: str,
  whyAsked: str,
  sampleAnswer: str,
  keyPoints: strArr,
  mistakesToAvoid: strArr,
  followUps: strArr,
  needsPersonalDetails: { type: 'boolean' },
});

export const questionsSchema = obj({
  questions: { type: 'array', items: questionItem },
});

export const evaluationSchema = obj({
  score: { type: 'integer' },
  clarity: { type: 'integer' },
  relevance: { type: 'integer' },
  confidence: { type: 'integer' },
  structure: { type: 'integer' },
  summary: str,
  strengths: strArr,
  improvements: strArr,
  improvedAnswer: str,
});

export const reportSchema = obj({
  overallSummary: str,
  strengths: strArr,
  focusAreas: strArr,
  nextSteps: strArr,
});
