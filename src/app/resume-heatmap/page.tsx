'use client';

import DashboardSidebar from '@/components/common/DashboardSidebar';
import Breadcrumb from '@/components/common/Breadcrumb';
import RequirePlan from '@/components/auth/RequirePlan';
import ResumeHeatmapInteractive from './components/ResumeHeatmapInteractive';

export default function ResumeHeatmapPage() {
  return (
    <RequirePlan
      minTier="PRO"
      message="Resume Heatmap is available on the Pro Pass (₹199/30 days)."
    >
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar />
        <main className="flex-1 lg:ml-72">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <Breadcrumb />
            </div>
            <ResumeHeatmapInteractive />
          </div>
        </main>
      </div>
    </RequirePlan>
  );
}
