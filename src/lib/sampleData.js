// Fictional sample data used by "Try a Demo". Not a real person.

export const SAMPLE_RESUME = `Aarav Mehta
Full-Stack Developer · Pune, India · aarav.mehta@example.com · github.com/aarav-demo

SUMMARY
Full-stack developer with 3.5 years of experience building React and Node.js web applications. Strong in performance optimization, REST API design and cloud deployment on AWS. Enjoys mentoring junior developers and shipping features end to end.

EXPERIENCE
Software Engineer II — Finlytics Technologies, Pune | Jan 2023 – Present
• Led the rebuild of the customer dashboard in React and TypeScript, cutting page load time from 4.2s to 1.6s.
• Designed REST APIs in Node.js/Express serving 120k daily active users with 99.9% uptime.
• Introduced Redis caching for portfolio summaries, reducing database load by 45%.
• Mentored 3 junior developers and set up code review guidelines for a 9-person team.
• Migrated CI/CD from Jenkins to GitHub Actions, cutting deployment time from 25 to 8 minutes.

Software Engineer — BrightCart Commerce, Bengaluru | Jul 2021 – Dec 2022
• Built checkout and order-tracking features in React and Redux for an e-commerce platform with 40k monthly orders.
• Developed PostgreSQL schemas and optimized slow queries, improving report generation speed by 3x.
• Integrated Razorpay payment gateway and handled webhook reliability with retry queues.
• Collaborated with product and design teams in 2-week Agile sprints.

Software Development Intern — CodeNest Labs, Pune | Jan 2021 – Jun 2021
• Built internal admin tools using React and Firebase.
• Wrote unit tests with Jest, raising coverage of the admin module from 35% to 70%.

PROJECTS
ShopSphere — Real-time inventory platform (Personal project)
• MERN stack app with WebSocket-based live stock updates, deployed on AWS EC2 with Docker and Nginx.
• Implemented JWT authentication and role-based access control.

DevPulse — Developer productivity analytics
• Next.js dashboard that pulls GitHub activity via the GitHub API and visualizes PR cycle time with Chart.js.

SKILLS
Languages: JavaScript, TypeScript, Python, SQL
Frontend: React, Redux, Next.js, Tailwind CSS, HTML, CSS
Backend: Node.js, Express, REST APIs, WebSockets
Databases: PostgreSQL, MongoDB, Redis, Firebase
Cloud & DevOps: AWS (EC2, S3, Lambda), Docker, GitHub Actions, Jenkins, Nginx
Testing: Jest, React Testing Library

EDUCATION
B.E. in Computer Engineering — Savitribai Phule Pune University | 2017 – 2021 | CGPA 8.4/10

CERTIFICATIONS
AWS Certified Developer – Associate (2023)
Meta Front-End Developer Professional Certificate (2022)

ACHIEVEMENTS
• Winner, Finlytics Internal Hackathon 2024 (built an AI-powered expense categorizer).
• Speaker at Pune JS Meetup: "Making React apps feel instant".`;

export const SAMPLE_JOB = {
  title: 'Senior Frontend Engineer',
  company: 'Nimbus Pay',
  description: `We're hiring a Senior Frontend Engineer to own our merchant dashboard.

Requirements:
- 4+ years building production web apps with React and TypeScript
- Deep knowledge of web performance, Core Web Vitals and accessibility (WCAG)
- Experience with Next.js and server-side rendering
- Comfortable writing Node.js APIs and working with PostgreSQL
- Experience with testing (Jest, React Testing Library, Playwright or Cypress)
- GraphQL experience is a plus
- Experience mentoring engineers and leading technical decisions
- Familiarity with design systems and Storybook`,
};

export const SAMPLE_ANALYSIS = {
  name: 'Aarav Mehta',
  headline: 'Full-Stack Developer · 3.5 years · React, Node.js, AWS',
  summary:
    'Full-stack developer with 3.5 years across fintech and e-commerce. Strongest evidence is in React performance work, Node.js API design, caching and CI/CD, with early mentoring experience.',
  yearsOfExperience: 3.5,
  seniority: 'Mid',
  technicalSkills: ['JavaScript', 'TypeScript', 'React', 'Redux', 'Next.js', 'Node.js', 'Express', 'REST APIs', 'WebSockets', 'PostgreSQL', 'MongoDB', 'Redis', 'Python', 'SQL', 'Tailwind CSS'],
  softSkills: ['Mentoring', 'Cross-functional collaboration', 'Agile delivery', 'Public speaking'],
  tools: ['AWS', 'Docker', 'GitHub Actions', 'Jenkins', 'Nginx', 'Jest', 'React Testing Library', 'Firebase', 'Chart.js'],
  strongSkills: ['React', 'TypeScript', 'Node.js', 'Performance optimization', 'Redis caching', 'CI/CD'],
  experience: [
    {
      role: 'Software Engineer II',
      company: 'Finlytics Technologies',
      duration: 'Jan 2023 – Present',
      highlights: [
        'Led the rebuild of the customer dashboard in React and TypeScript, cutting page load time from 4.2s to 1.6s',
        'Designed REST APIs in Node.js/Express serving 120k daily active users with 99.9% uptime',
        'Introduced Redis caching for portfolio summaries, reducing database load by 45%',
        'Mentored 3 junior developers and set up code review guidelines for a 9-person team',
        'Migrated CI/CD from Jenkins to GitHub Actions, cutting deployment time from 25 to 8 minutes',
      ],
    },
    {
      role: 'Software Engineer',
      company: 'BrightCart Commerce',
      duration: 'Jul 2021 – Dec 2022',
      highlights: [
        'Built checkout and order-tracking features in React and Redux for 40k monthly orders',
        'Optimized PostgreSQL queries, improving report generation speed by 3x',
        'Integrated Razorpay payments and handled webhook reliability with retry queues',
      ],
    },
    {
      role: 'Software Development Intern',
      company: 'CodeNest Labs',
      duration: 'Jan 2021 – Jun 2021',
      highlights: ['Built internal admin tools with React and Firebase', 'Raised Jest test coverage from 35% to 70%'],
    },
  ],
  projects: [
    {
      name: 'ShopSphere',
      description: 'Real-time inventory platform with WebSocket live stock updates, JWT auth and RBAC, deployed on AWS EC2 with Docker and Nginx',
      tech: ['MongoDB', 'Express', 'React', 'Node.js', 'WebSockets', 'Docker', 'AWS EC2', 'Nginx'],
    },
    {
      name: 'DevPulse',
      description: 'Next.js dashboard visualizing GitHub PR cycle time using the GitHub API and Chart.js',
      tech: ['Next.js', 'GitHub API', 'Chart.js'],
    },
  ],
  education: [{ degree: 'B.E. in Computer Engineering', institution: 'Savitribai Phule Pune University', year: '2017 – 2021' }],
  certifications: ['AWS Certified Developer – Associate (2023)', 'Meta Front-End Developer Professional Certificate (2022)'],
  achievements: ['Winner, Finlytics Internal Hackathon 2024 (AI-powered expense categorizer)', 'Speaker at Pune JS Meetup: "Making React apps feel instant"'],
  careerObservations: [
    'Steady progression from intern to Software Engineer II in about 3.5 years',
    'Moved from e-commerce (BrightCart) to fintech (Finlytics) at the end of 2022',
    'Strong quantified results on performance and reliability',
  ],
  improvementAreas: [
    'No evidence of accessibility (WCAG) or design-system work',
    'Testing experience is mostly unit tests; no end-to-end testing listed',
    'Leadership is limited to mentoring; no examples of owning technical direction',
  ],
  suggestedRoles: ['Senior Frontend Engineer', 'Full-Stack Engineer', 'Software Engineer (React/Node)'],
};
