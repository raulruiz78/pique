import { AuthForm } from "@/components/auth-form";

export default function RecoverPage() {
  return (
    <>
      <span className="eyebrow">Recuperar acceso</span>
      <h1 className="display" style={{ fontSize: 43, margin: "10px 0 12px" }}>
        Volvemos al juego.
      </h1>
      <p className="muted" style={{ margin: "0 0 28px", lineHeight: 1.5 }}>
        Te enviaremos un enlace seguro a tu correo.
      </p>
      <AuthForm mode="recover" />
    </>
  );
}
