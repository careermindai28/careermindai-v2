'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import EmailCaptureModal from './EmailCaptureModal';

import FileUploadZone from './FileUploadZone';
import LoadingState from './LoadingState';
import AuditResults from './AuditResults';

interface FormErrors {
  file: string;
}

interface Strength {
  title: string;
  description: string;
}

interface Improvement {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface ATSRecommendation {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

interface AuditResultsData {
  auditId?: string;
  audit_id?: string;

  resumeMindScore: number;
  atsCompatibility: number;

  summary?: string;
  strengths: Strength[];
  improvements: Improvement[];
  atsRecommendations: ATSRecommendation[];

  recommendedKeywords?: string[];
  riskFlags?: string[];
  regionNotes?: string;
  roleFitNotes?: string;
}

const FREE_AUDIT_KEY = 'cm_free_audit_used_v1';

function getFreeAuditUsed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(FREE_AUDIT_KEY) === '1';
  } catch {
    return false;
  }
}

function markFreeAuditUsed() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FREE_AUDIT_KEY, '1');
  } catch {}
}

export default function ResumeAuditInteractive() {
  const router = useRouter();
  const { user } = useAuth();

  const [isHydrated, setIsHydrated] = useState(false);
  const [freeAuditUsed, setFreeAuditUsed] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<FormErrors>({ file: '' });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [auditResults, setAuditResults] = useState<AuditResultsData | null>(null);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    setIsHydrated(true);
    setFreeAuditUsed(getFreeAuditUsed());
  }, []);

  const auditId = useMemo(
    () => auditResults?.auditId || auditResults?.audit_id || '',
    [auditResults]
  );

  const validateForm = (): boolean => {
    const newErrors: FormErrors = { file: '' };
    if (!selectedFile) newErrors.file = 'Please upload your resume';
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleAnalyze = async () => {
    if (!validateForm()) return;

    // ✅ 1 free audit lifetime per device (for guests)
    if (!user && freeAuditUsed) {
      setApiError(
        'You’ve already used your free audit on this device. Please sign in to run more audits and save your results.'
      );
      return;
    }

    setIsAnalyzing(true);
    setApiError('');
    setAuditResults(null);

    try {
      const formData = new FormData();
      if (!selectedFile) throw new Error('Resume file missing');
      formData.append('resumeFile', selectedFile);

      const res = await fetch('/api/resume-audit', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Audit failed');

      setAuditResults(data);

      // ✅ mark only on success
      if (!user) {
        markFreeAuditUsed();
        setFreeAuditUsed(true);

        // Ask for email after showing value (Grammarly-style)
        setTimeout(() => setEmailModalOpen(true), 250);
      }
    } catch (e: any) {
      setApiError(e?.message || 'Something went wrong');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBuildResume = () => {
    if (!auditId) {
      setApiError('auditId missing from API response');
      return;
    }
    const nextPath = `/ai-resume-builder?auditId=${encodeURIComponent(auditId)}`;
    if (!user) {
      router.push(`/sign-in?next=${encodeURIComponent(nextPath)}`);
      return;
    }
    router.push(nextPath);
  };

  const handleExportPDF = () => {
    try {
      const auditContainer = document.querySelector('[data-audit-results]');
      if (!auditContainer) {
        alert('Nothing to export');
        return;
      }

      const win = window.open('', '_blank', 'noopener,noreferrer');
      if (!win) {
        alert('Popup blocked. Please allow popups.');
        return;
      }

      win.document.open();
      win.document.write(`
      <html>
        <head>
          <title>CareerMindAI – Resume Audit Report</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: Inter, Arial, sans-serif; padding: 24px; }
            button { display: none !important; }
          </style>
        </head>
        <body>
          <h1>Resume Audit Report</h1>
          ${auditContainer.innerHTML}
          <script>
            window.onload = () => setTimeout(() => window.print(), 300);
          </script>
        </body>
      </html>
    `);
      win.document.close();
    } catch (e) {
      alert('Export failed. Please try again.');
    }
  };

  const handleStartOver = () => {
    setSelectedFile(null);
    setErrors({ file: '' });
    setAuditResults(null);
    setApiError('');
  };

  const saveLead = async (email: string) => {
    // Best-effort lead capture; do not block user if it fails.
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        source: 'resume_audit',
        auditId,
        resumeMindScore: auditResults?.resumeMindScore,
      }),
    });
  };

  if (!isHydrated) return null;

  return (
    <>
      <LoadingState isVisible={isAnalyzing} />

      <EmailCaptureModal
        open={emailModalOpen && !user && !!auditResults}
        onClose={() => setEmailModalOpen(false)}
        onSubmit={async (email) => {
          await saveLead(email);
          // Move user into the authenticated journey.
          const nextPath = auditId
            ? `/ai-resume-builder?auditId=${encodeURIComponent(auditId)}`
            : '/user-dashboard';
          router.push(`/sign-in?next=${encodeURIComponent(nextPath)}`);
        }}
      />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {apiError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
            {apiError}
          </div>
        )}

        {!auditResults ? (
          <div
            data-audit-results
            className="bg-surface border border-border rounded-xl p-6 space-y-6"
          >
            {!user && freeAuditUsed ? (
              <div className="rounded-xl border border-border bg-background p-4">
                <div className="font-semibold text-foreground">Free audit used</div>
                <div className="mt-1 text-sm text-text-secondary">
                  Sign in to run unlimited audits, save your results, and unlock AI Resume Builder.
                </div>
                <button
                  onClick={() =>
                    router.push(`/sign-in?next=${encodeURIComponent('/resume-audit-tool')}`)
                  }
                  className="mt-3 px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold"
                >
                  Continue with Google
                </button>
              </div>
            ) : null}

            <FileUploadZone
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
              error={errors.file}
            />

            <button
              onClick={handleAnalyze}
              disabled={!user && freeAuditUsed}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-60"
            >
              Analyze Resume
            </button>
          </div>
        ) : (
          <>
            <div className="bg-surface border border-border rounded-xl p-5 flex justify-between items-center">
              <div>
                <div className="text-sm text-text-secondary">Next step</div>
                <div className="font-semibold">Build AI Resume from this Audit</div>
              </div>
              <button
                onClick={handleBuildResume}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold"
              >
                Build AI Resume
              </button>
            </div>

            <AuditResults
              results={auditResults}
              onExportPDF={handleExportPDF}
              onStartOver={handleStartOver}
            />
          </>
        )}
      </div>
    </>
  );
}
