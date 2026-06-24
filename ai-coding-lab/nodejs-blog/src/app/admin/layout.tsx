import { AdminSidebar } from '@/components/layout/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:flex min-h-[calc(100vh-3.5rem)]">
      <AdminSidebar />
      <div className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8">{children}</div>
    </div>
  );
}
