import { AuthForm } from "@/components/auth-form";
import Link from "next/link";

export default async function SignupPage({
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
      <span className="eyebrow">Tu primer pique</span>
      <h1 className="display" style={{ fontSize: 43, margin: "10px 0 12px" }}>
        Empieza fuerte.
      </h1>
      <p className="muted" style={{ margin: "0 0 28px", lineHeight: 1.5 }}>
        Mayores de 18 años. Retos privados y cero apuestas con dinero.
      </p>
      <AuthForm mode="signup" nextPath={nextPath} />
      <p
        className="muted"
        style={{ textAlign: "center", fontSize: 14, margin: "22px 0 0" }}
      >
        ¿Ya estás dentro?{" "}
        <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
