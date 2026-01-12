import React from 'react';

export default function PrintLayout({
  title,
  watermarkEnabled,
  children,
}: {
  title: string;
  watermarkEnabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <style>{`
        @page { size: A4; margin: 14mm; }
        html, body { padding: 0; margin: 0; }
        body {
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          color: #111827;
          font-size: 12.5px;
          line-height: 1.45;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          background: #fff;
        }

        .page { position: relative; min-height: 100%; }
        .wm {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 0;
        }
        .wm span {
          transform: rotate(-28deg);
          font-size: 72px;
          font-weight: 800;
          letter-spacing: 2px;
          color: rgba(17, 24, 39, 0.07);
          user-select: none;
          white-space: nowrap;
        }

        .content { position: relative; z-index: 1; }

        /* Typography */
        h1 {
          font-size: 20px;
          font-weight: 800;
          margin: 0 0 10px;
          letter-spacing: -0.2px;
        }
        h2 {
          font-size: 14px;
          font-weight: 800;
          margin: 14px 0 8px;
          letter-spacing: -0.1px;
        }
        p  { margin: 0 0 8px; }

        ul { margin: 6px 0 10px 18px; padding: 0; }
        li { margin: 0 0 6px; }

        b, strong { font-weight: 800; }

        .hr { height: 1px; background: #e5e7eb; margin: 10px 0 12px; }

        .muted, .small { color: #6b7280; font-size: 11.5px; }

        .badge {
          display: inline-block;
          padding: 4px 8px;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          font-size: 11px;
          color: #374151;
          background: #f9fafb;
          font-weight: 600;
        }

        .section-title { font-weight: 800; margin-top: 14px; }
        .label { font-weight: 800; }

        .row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
        }
      `}</style>

      {/* Hidden semantic title */}
      <div style={{ display: 'none' }}>{title}</div>

      <div className="page">
        {watermarkEnabled && (
          <div className="wm">
            <span>CareerMindAI</span>
          </div>
        )}
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
