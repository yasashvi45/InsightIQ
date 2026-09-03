import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DashboardNavbar } from './DashboardNavbar';
import { useState } from 'react';

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] bg-[var(--color-brand-bg)] overflow-hidden print:overflow-visible">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm print:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-50 transform lg:transform-none lg:static transition-transform duration-300 ease-in-out print:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden print:h-auto print:overflow-visible">
        <div className="print:hidden">
          <DashboardNavbar onMenuClick={() => setIsSidebarOpen(true)} />
        </div>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto print:p-0 print:overflow-visible">
          <div className="max-w-7xl mx-auto print:max-w-none print:w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
