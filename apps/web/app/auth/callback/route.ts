import { createServerSupabase } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next")?.startsWith("/")
    ? url.searchParams.get("next")!
    : "/hoy";
  const supabase = await createServerSupabase();
  if (supabase && code) await supabase.auth.exchangeCodeForSession(code);
  else if (supabase && tokenHash && type)
    await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  return NextResponse.redirect(new URL(next, url.origin));
}
