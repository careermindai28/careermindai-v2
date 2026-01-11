type PdfType = 'resume' | 'coverLetter' | 'interviewGuide';

export type DownloadPdfResult =
  | { ok: true }
  | {
      ok: false;
      code: 'UNAUTHORIZED' | 'EXPORT_LIMIT_REACHED' | 'FAILED';
      message: string;
      status?: number;
    };

type DownloadPdfOpts = {
  onStart?: () => void;
  onDone?: () => void;
  onError?: (msg: string) => void;
  onLimit?: (msg: string) => void;
  onUnauthorized?: (msg: string) => void;
};

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function downloadPdf(
  type: PdfType,
  id: string,
  opts?: DownloadPdfOpts
): Promise<DownloadPdfResult> {
  try {
    opts?.onStart?.();

    const { getFirebaseAuth } = await import('@/lib/firebaseClient');
    const auth = getFirebaseAuth();
    const user = auth.currentUser;

    if (!user) {
      const msg = 'Please sign in to export PDFs.';
      opts?.onUnauthorized?.(msg);
      opts?.onError?.(msg);
      return { ok: false, code: 'UNAUTHORIZED', message: msg, status: 401 };
    }

    const token = await user.getIdToken(true);

    const res = await fetch('/api/pdf-export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type, id }),
    });

    // Handle non-200s with readable errors
    if (!res.ok) {
      const data = await safeJson(res);
      const err = data?.error || 'PDF export failed.';
      const detail = data?.detail ? ` (${data.detail})` : '';
      const msg = `${err}${detail}`;

      if (res.status === 402) {
        opts?.onLimit?.(msg);
        opts?.onError?.(msg);
        return { ok: false, code: 'EXPORT_LIMIT_REACHED', message: msg, status: 402 };
      }

      if (res.status === 401 || res.status === 403) {
        opts?.onUnauthorized?.(msg);
        opts?.onError?.(msg);
        return { ok: false, code: 'UNAUTHORIZED', message: msg, status: res.status };
      }

      opts?.onError?.(msg);
      return { ok: false, code: 'FAILED', message: msg, status: res.status };
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download =
      type === 'resume'
        ? 'CareerMindAI-Resume.pdf'
        : type === 'coverLetter'
          ? 'CareerMindAI-CoverLetter.pdf'
          : 'CareerMindAI-Interview-Guide.pdf';

    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);

    opts?.onDone?.();
    return { ok: true };
  } catch (e: any) {
    const msg = e?.message || 'PDF export failed.';
    opts?.onError?.(msg);
    return { ok: false, code: 'FAILED', message: msg };
  }
}
