"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      className="button button-secondary"
      onClick={async () => {
        await createBrowserSupabase().auth.signOut();
        router.replace("/");
        router.refresh();
      }}
    >
      <LogOut size={17} /> Cerrar sesión
    </button>
  );
}
