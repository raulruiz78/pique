import { BottomNav } from "@/components/bottom-nav";
import { InstallBanner } from "@/components/install-banner";
import { PwaRegister } from "@/components/pwa-register";

export const dynamic = "force-dynamic";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <PwaRegister />
      <InstallBanner />
      {children}
      <BottomNav />
    </div>
  );
}
