import type { ApiErrorShape, Json } from "@pique/database";
import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createServerSupabase } from "./supabase/server";

export function requestId(request: Request): string {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}
export function ok<T>(data: T, status = 200) {
  return NextResponse.json(
    { data },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}
export function fail(
  code: string,
  message: string,
  id: string,
  status = 400,
  details?: Json,
) {
  const body: ApiErrorShape = {
    error: {
      code,
      message,
      requestId: id,
      ...(details === undefined ? {} : { details }),
    },
  };
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
export function fromError(error: unknown, id: string) {
  if (error instanceof ZodError)
    return fail(
      "VALIDATION_ERROR",
      "Revisa los datos enviados.",
      id,
      422,
      error.flatten() as unknown as Json,
    );
  const details =
    error && typeof error === "object"
      ? (error as { message?: unknown; code?: unknown })
      : null;
  console.error(
    JSON.stringify({
      level: "error",
      requestId: id,
      event: "api_error",
      error: error instanceof Error ? error.name : "unknown",
      message:
        typeof details?.message === "string" ? details.message : undefined,
      code: typeof details?.code === "string" ? details.code : undefined,
    }),
  );
  return fail(
    "INTERNAL_ERROR",
    "Algo ha fallado. Inténtalo de nuevo.",
    id,
    500,
  );
}
export async function requireUser(id: string): Promise<
  | {
      user: User;
      supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>;
    }
  | NextResponse<ApiErrorShape>
> {
  const supabase = await createServerSupabase();
  if (!supabase)
    return fail(
      "SERVICE_NOT_CONFIGURED",
      "Supabase no está configurado.",
      id,
      503,
    );
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user)
    return fail("UNAUTHENTICATED", "Inicia sesión para continuar.", id, 401);
  return { user, supabase };
}
