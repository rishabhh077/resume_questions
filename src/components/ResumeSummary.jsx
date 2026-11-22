import { Briefcase, GraduationCap, Award, FolderGit2, Trophy, Eye, TrendingUp, Sparkles, FlaskConical } from 'lucide-react';
import { Card, Badge } from './ui';

function Block({ icon: Icon, title, children, empty }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-navy-800">
        <Icon className="h-4 w-4 text-brand-500" />
        {title}
      </div>
      {children || <p className="text-sm text-navy-400">{empty || 'Not found in resume'}</p>}
    </div>
  );
}

export default function ResumeSummary({ analysis, source }) {
  const a = analysis;
  const skills = [...new Set([...(a.technicalSkills || []), ...(a.tools || [])])];
  return (
    <Card className="overflow-hidden">
      <div className="relative bg-brand-soft px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold text-navy-900">{a.name || 'Your resume'}</h2>
              {a.seniority && <Badge className="bg-white text-brand-700 ring-brand-200">{a.seniority}</Badge>}
            </div>
            {a.headline && <p className="mt-0.5 text-sm font-medium text-navy-500">{a.headline}</p>}
          </div>
          <Badge className={source === 'ai' ? 'bg-white text-emerald-700 ring-emerald-200' : 'bg-white text-amber-700 ring-amber-200'} icon={source === 'ai' ? Sparkles : FlaskConical}>
            {source === 'ai' ? 'Analyzed by Claude' : 'Demo analysis'}
          </Badge>
        </div>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-navy-700">{a.summary}</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Stat label="Experience" value={a.yearsOfExperience ? `${a.yearsOfExperience} yrs` : '—'} />
          <Stat label="Roles" value={a.experience?.length || 0} />
          <Stat label="Projects" value={a.projects?.length || 0} />
          <Stat label="Skills found" value={skills.length} />
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
        <Block icon={TrendingUp} title="Strong skills">
          {a.strongSkills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {a.strongSkills.map((s) => (
                <Badge key={s} className="bg-brand-50 text-brand-700 ring-brand-200">
                  {s}
                </Badge>
              ))}
            </div>
          )}
        </Block>
        <Block icon={Sparkles} title="All skills & tools">
          {skills.length > 0 && (
            <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto scrollbar-thin">
              {skills.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
          )}
        </Block>

        <Block icon={Briefcase} title="Experience">
          {a.experience?.length > 0 && (
            <ol className="space-y-3">
              {a.experience.slice(0, 4).map((e, i) => (
                <li key={i} className="relative border-l-2 border-navy-100 pl-3">
                  <div className="text-sm font-semibold text-navy-800">{e.role}</div>
                  <div className="text-xs text-navy-500">
                    {[e.company, e.duration].filter(Boolean).join(' · ')}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Block>
        <Block icon={FolderGit2} title="Projects">
          {a.projects?.length > 0 && (
            <ul className="space-y-2.5">
              {a.projects.slice(0, 4).map((p, i) => (
                <li key={i}>
                  <div className="text-sm font-semibold text-navy-800">{p.name}</div>
                  {p.description && <div className="line-clamp-2 text-xs text-navy-500">{p.description}</div>}
                </li>
              ))}
            </ul>
          )}
        </Block>

        <Block icon={GraduationCap} title="Education">
          {a.education?.length > 0 && (
            <ul className="space-y-1.5">
              {a.education.map((e, i) => (
                <li key={i} className="text-sm text-navy-700">
                  <span className="font-medium text-navy-800">{e.degree}</span>
                  {e.institution && <span className="text-navy-500"> · {e.institution}</span>}
                  {e.year && <span className="text-navy-400"> · {e.year}</span>}
                </li>
              ))}
            </ul>
          )}
        </Block>
        <Block icon={Award} title="Certifications & achievements">
          {(a.certifications?.length > 0 || a.achievements?.length > 0) && (
            <ul className="space-y-1.5">
              {[...(a.certifications || []), ...(a.achievements || [])].slice(0, 5).map((c, i) => (
                <li key={i} className="flex gap-2 text-sm text-navy-700">
                  <Trophy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  {c}
                </li>
              ))}
            </ul>
          )}
        </Block>

        {a.careerObservations?.length > 0 && (
          <div className="lg:col-span-2">
            <Block icon={Eye} title="What interviewers will notice">
              <ul className="grid gap-2 sm:grid-cols-2">
                {a.careerObservations.map((o, i) => (
                  <li key={i} className="rounded-xl bg-navy-50 px-3 py-2 text-sm text-navy-700 ring-1 ring-navy-100">
                    {o}
                  </li>
                ))}
              </ul>
            </Block>
          </div>
        )}
      </div>
    </Card>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-xs text-navy-400">{label}</div>
      <div className="font-display text-lg font-bold text-navy-900">{value}</div>
    </div>
  );
}
