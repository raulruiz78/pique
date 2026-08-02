import { BottomNav } from "@/components/bottom-nav";
import { PwaRegister } from "@/components/pwa-register";

export const dynamic = "force-dynamic";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <PwaRegister />
      {children}
      <BottomNav />
    </div>
  );
}
