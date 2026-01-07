'use client';

import DashboardSidebar from '@/components/common/DashboardSidebar';
import Breadcrumb from '@/components/common/Breadcrumb';
import RequirePlan from '@/components/auth/RequirePlan';
import InterviewCheatSheetInteractive from './components/InterviewCheatSheetInteractive';

export default function InterviewCheatSheetPage() {
  return (
    <RequirePlan
      minTier="STARTER"
      message="Interview Cheat Sheet is available on the Starter Pass and above. Pro Pass unlocks faster exports and watermark off."
    >
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar />
        <main className="flex-1 lg:ml-72">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <Breadcrumb />
            </div>
            <InterviewCheatSheetInteractive />
          </div>
        </main>
      </div>
    </RequirePlan>
  );
}
