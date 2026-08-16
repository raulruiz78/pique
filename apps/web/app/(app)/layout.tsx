import { BottomNav } from "@/components/bottom-nav";
import { InstallBanner } from "@/components/install-banner";
import { OnboardingTutorial } from "@/components/onboarding-tutorial";
import { PushOptInBanner } from "@/components/push-opt-in-banner";
import { PwaRegister } from "@/components/pwa-register";
import { createServerSupabase, getCurrentUser } from "@/lib/supabase/server";

// Se mantiene explícito a propósito (auditoría 0.8.3): toda página bajo
// (app) ya usa cookies() a través de Supabase para saber quién ha
// iniciado sesión, lo que fuerza render dinámico en Next con o sin este
// export. Quitarlo no aportaría una ganancia medible y sí el riesgo de
// que, si en el futuro algún fetch propio no pasara por Supabase-js,
// Next pudiera cachearlo por defecto y servir datos de otra persona/
// sesión — con datos tan personales (evidencias, puntuaciones, rachas),
// se prioriza la certeza de "siempre fresco" sobre esa optimización.
export const dynamic = "force-dynamic";
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser();
  const { data: profile } =
    supabase && user
      ? await supabase
          .from("profiles")
          .select("onboarding_completed,notification_preferences")
          .eq("id", user.id)
          .maybeSingle()
      : { data: null };
  return (
    <div className="app-shell">
      <PwaRegister />
      {profile && !profile.onboarding_completed && <OnboardingTutorial />}
      <InstallBanner />
      <PushOptInBanner
        preferences={
          (profile?.notification_preferences as {
            inApp: boolean;
            push: boolean;
            email: boolean;
            quietStart: string;
            quietEnd: string;
          } | null) ?? null
        }
      />
      {children}
      <BottomNav />
    </div>
  );
}
