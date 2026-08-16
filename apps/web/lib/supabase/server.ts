import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

// cache() deduplica por render de servidor: el layout y la página de una
// misma navegación comparten el mismo cliente/usuario en vez de leer las
// cookies y verificar la sesión contra Supabase Auth una vez por cada
// llamada (antes eran 2-4 round-trips redundantes por navegación).
export const createServerSupabase = cache(
  async function createServerSupabase() {
    if (!isSupabaseConfigured()) return null;
    const cookieStore = await cookies();
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              /* Server Components cannot write cookies; proxy refreshes them. */
            }
          },
        },
      },
    );
  },
);

export const getCurrentUser = cache(async function getCurrentUser() {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
