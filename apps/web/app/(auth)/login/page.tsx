import { AuthForm } from "@/components/auth-form";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const requestedNext = (await searchParams).next;
  const nextPath =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/hoy";
  return (
    <>
      <span className="eyebrow">Vuelve al juego</span>
      <h1 className="display" style={{ fontSize: 43, margin: "10px 0 12px" }}>
        ¿Quién gana hoy?
      </h1>
      <p className="muted" style={{ margin: "0 0 28px", lineHeight: 1.5 }}>
        Entra y no dejes que te adelanten.
      </p>
      <AuthForm mode="login" nextPath={nextPath} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          marginTop: 22,
          fontSize: 14,
        }}
      >
        <Link href="/recuperar">Olvidé mi contraseña</Link>
        <Link href={`/registro?next=${encodeURIComponent(nextPath)}`}>
          Crear cuenta
        </Link>
      </div>
    </>
  );
}
