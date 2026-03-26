import { useState } from 'react';
import useSWR from 'swr';
import { fetcher, api } from '../lib/api';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { CardSkeleton } from '../components/Skeleton';
import { ExternalLink, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AIUseCases() {
  const { data: useCases, isLoading } = useSWR('/ai-use-cases', fetcher);
  const [selected, setSelected] = useState(null);
  const [jdForm, setJdForm] = useState({ jobTitle: '', seniority: 'Mid-level', department: '' });
  const [jdResult, setJdResult] = useState('');
  const [jdLoading, setJdLoading] = useState(false);
  const [requestModal, setRequestModal] = useState(null);

  const handleGenerateJD = async () => {
    if (!jdForm.jobTitle) return;
    setJdLoading(true);
    setJdResult('');
    try {
      const res = await api.post('/ai/job-description', jdForm);
      setJdResult(res.content);
    } catch (err) {
      setJdResult('Error generating job description. Please try again.');
    } finally {
      setJdLoading(false);
    }
  };

  const handleCardClick = (useCase) => {
    if (useCase.has_builtin_demo) {
      setSelected(useCase);
      setJdResult('');
    } else if (useCase.demo_url) {
      window.open(useCase.demo_url, '_blank');
    } else {
      setRequestModal(useCase);
    }
  };

  return (
    <div>
      <PageHeader
        title="AI Use Cases"
        description="Explore AI-powered HR tools. Try the Job Description Generator demo or request access to upcoming capabilities."
      />

      {isLoading ? (
        <CardSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(useCases || []).map((uc, i) => (
            <Card key={uc.id} delay={i * 0.05} onClick={() => handleCardClick(uc)}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl shrink-0">
                  {uc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white">{uc.title}</h3>
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">{uc.description}</p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {(uc.tags || []).map((tag, j) => (
                      <span key={j} className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 text-sm font-bold text-accent-blue">
                <span>{uc.has_builtin_demo ? 'Try Demo' : uc.demo_url ? 'Open Demo' : 'Request Access'}</span>
                <span>{uc.demo_url ? <ExternalLink size={14} /> : '→'}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* JD Generator Demo Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Job Description Generator"
        subtitle="Powered by Claude AI"
        wide
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Job Title</label>
              <input
                type="text"
                value={jdForm.jobTitle}
                onChange={(e) => setJdForm(f => ({ ...f, jobTitle: e.target.value }))}
                placeholder="e.g. Senior Frontend Developer"
                className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-accent-blue/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Seniority Level</label>
              <select
                value={jdForm.seniority}
                onChange={(e) => setJdForm(f => ({ ...f, seniority: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-blue/50"
              >
                <option>Junior</option>
                <option>Mid-level</option>
                <option>Senior</option>
                <option>Lead</option>
                <option>Principal</option>
                <option>Director</option>
                <option>VP</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
              <input
                type="text"
                value={jdForm.department}
                onChange={(e) => setJdForm(f => ({ ...f, department: e.target.value }))}
                placeholder="e.g. Engineering"
                className="w-full px-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-accent-blue/50"
              />
            </div>
            <button
              onClick={handleGenerateJD}
              disabled={!jdForm.jobTitle || jdLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue text-white text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {jdLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              {jdLoading ? 'Generating…' : 'Generate Job Description'}
            </button>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Output</div>
            <div className="rounded-xl bg-navy-900 border border-white/10 p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
              {jdResult ? (
                <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                  <ReactMarkdown>{jdResult}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">
                  Fill in the details and click Generate to create a job description.
                </p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Request Access Modal */}
      <Modal
        open={!!requestModal}
        onClose={() => setRequestModal(null)}
        title={requestModal?.title}
        subtitle="Coming Soon"
      >
        <div className="text-center py-8">
          <div className="text-4xl mb-4">{requestModal?.icon}</div>
          <h3 className="text-lg font-semibold text-white mb-2">{requestModal?.title}</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">{requestModal?.description}</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-gold/15 text-accent-gold text-sm font-semibold">
            Contact your admin to enable this demo
          </div>
        </div>
      </Modal>
    </div>
  );
}
