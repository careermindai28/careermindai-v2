'use client';

import DashboardSidebar from '@/components/common/DashboardSidebar';
import Breadcrumb from '@/components/common/Breadcrumb';
import RequirePlan from '@/components/auth/RequirePlan';
import CareerPathGeneratorInteractive from './components/CareerPathGeneratorInteractive';

export default function CareerPathGeneratorPage() {
  return (
    <RequirePlan
      minTier="STARTER"
      message="CareerPath Generator is available on the Starter Pass (₹99/30 days) and above."
    >
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar />
        <main className="flex-1 lg:ml-72">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <Breadcrumb />
            </div>
            <CareerPathGeneratorInteractive />
          </div>
        </main>
      </div>
    </RequirePlan>
  );
}
