import PrintLayout from '../_components/PrintLayout';
import { getFirestore } from '@/lib/firebaseAdmin';
import { verifyPdfUrl } from '@/lib/pdfSign';

export const runtime = 'nodejs';

function mustInt(v: string | null) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : 0;
}

async function getWatermarkFlag(db: any) {
  try {
    const snap = await db.collection('config').doc('app').get();
    return snap.exists ? !!snap.data()?.pdfWatermarkEnabled : true;
  } catch {
    return true;
  }
}

function parseWm(v: string | undefined) {
  const s = (v || '').trim();
  if (s === '0') return false;
  if (s === '1') return true;
  return null;
}

export default async function PrintCheatSheetPage({
  searchParams,
}: {
  searchParams: { sheetId?: string; sig?: string; exp?: string; wm?: string };
}) {
  const sheetId = (searchParams.sheetId || '').trim();
  const sig = (searchParams.sig || '').trim();
  const exp = mustInt(searchParams.exp || null);
  const wmRequested = parseWm(searchParams.wm);

  if (!sheetId || !sig || !exp) {
    return (
      <PrintLayout title="Unauthorized" watermarkEnabled={false}>
        <h1>Unauthorized</h1>
        <p className="muted">Missing parameters.</p>
      </PrintLayout>
    );
  }

  const ok = verifyPdfUrl({ type: 'cheatSheet', id: sheetId, exp, sig });
  if (!ok) {
    return (
      <PrintLayout title="Unauthorized" watermarkEnabled={false}>
        <h1>Unauthorized</h1>
        <p className="muted">Invalid or expired link.</p>
      </PrintLayout>
    );
  }

  const db = getFirestore();
  const configWmEnabled = await getWatermarkFlag(db);
  const wmEnabled = wmRequested === null ? configWmEnabled : wmRequested && configWmEnabled;

  const snap = await db.collection('cheatSheets').doc(sheetId).get();
  if (!snap.exists) {
    return (
      <PrintLayout title="Not Found" watermarkEnabled={wmEnabled}>
        <h1>Not found</h1>
        <p className="muted">Cheat sheet not found for ID: {sheetId}</p>
      </PrintLayout>
    );
  }

  const doc = snap.data() as any;
  const c = doc?.content || doc || {};

  const role = typeof c.role === 'string' ? c.role.trim() : '';
  const oneLiner = typeof c.oneLiner === 'string' ? c.oneLiner.trim() : '';
  const pitch = typeof c.pitch === 'string' ? c.pitch.trim() : '';
  const topSkills = Array.isArray(c.topSkills) ? c.topSkills : [];
  const likelyQuestions = Array.isArray(c.likelyQuestions) ? c.likelyQuestions : [];
  const questionsToAsk = Array.isArray(c.questionsToAsk) ? c.questionsToAsk : [];
  const quickReminders = Array.isArray(c.quickReminders) ? c.quickReminders : [];

  return (
    <PrintLayout title="Interview Cheat Sheet" watermarkEnabled={wmEnabled}>
      <h1>Interview Cheat Sheet</h1>
      <div className="hr" />

      {role && (
        <>
          <h2>Role</h2>
          <p>{role}</p>
        </>
      )}

      {oneLiner && (
        <>
          <h2>One-liner</h2>
          <p>{oneLiner}</p>
        </>
      )}

      {pitch && (
        <>
          <h2>60-second Pitch</h2>
          <p>{pitch}</p>
        </>
      )}

      {topSkills.length > 0 && (
        <>
          <h2>Top Skills</h2>
          <ul>
            {topSkills.slice(0, 12).map((s: any, i: number) => (
              <li key={i}>{String(s)}</li>
            ))}
          </ul>
        </>
      )}

      {likelyQuestions.length > 0 && (
        <>
          <h2>Likely Questions</h2>
          {likelyQuestions.slice(0, 10).map((t: any, i: number) => {
            const q = typeof t?.q === 'string' ? t.q : '';
            const a = typeof t?.answer === 'string' ? t.answer : '';
            const star = typeof t?.starHint === 'string' ? t.starHint : '';
            return (
              <div key={i} style={{ marginBottom: 10 }}>
                {q && (
                  <p>
                    <b>Q:</b> {q}
                  </p>
                )}
                {a && (
                  <p>
                    <b>Best Answer:</b> {a}
                  </p>
                )}
                {star && (
                  <p>
                    <b>STAR hint:</b> {star}
                  </p>
                )}
              </div>
            );
          })}
        </>
      )}

      {questionsToAsk.length > 0 && (
        <>
          <h2>Questions to Ask</h2>
          <ul>
            {questionsToAsk.slice(0, 8).map((s: any, i: number) => (
              <li key={i}>{String(s)}</li>
            ))}
          </ul>
        </>
      )}

      {quickReminders.length > 0 && (
        <>
          <h2>Quick Reminders</h2>
          <ul>
            {quickReminders.slice(0, 8).map((s: any, i: number) => (
              <li key={i}>{String(s)}</li>
            ))}
          </ul>
        </>
      )}
    </PrintLayout>
  );
}
