import { BottomNav } from "@/components/bottom-nav";
import { InstallBanner } from "@/components/install-banner";
import { OnboardingTutorial } from "@/components/onboarding-tutorial";
import { PwaRegister } from "@/components/pwa-register";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const { data: profile } =
    supabase && user
      ? await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle()
      : { data: null };
  return (
    <div className="app-shell">
      <PwaRegister />
      {profile && !profile.onboarding_completed && <OnboardingTutorial />}
      <InstallBanner />
      {children}
      <BottomNav />
    </div>
  );
}
