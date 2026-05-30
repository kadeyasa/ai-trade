import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { tokenConfig } from "@/config/token";
import type { TokenConfigView } from "@/types/token";

export function PageContainer({ children, token = tokenConfig }: { children: React.ReactNode; token?: TokenConfigView }) {
  return (
    <div className="min-h-screen bg-panel">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Header token={token} />
          <main className="mx-auto max-w-7xl px-5 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
