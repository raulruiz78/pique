"use client";

import { createBrowserClient } from "@supabase/ssr";
import { ArrowRight, LoaderCircle } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Mode = "login" | "signup" | "recover";

export function AuthForm({
  mode,
  nextPath = "/hoy",
}: {
  mode: Mode;
  nextPath?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key)
      return toast.error("Configura Supabase en .env.local para continuar.");
    setLoading(true);
    const supabase = createBrowserClient(url, key);
    if (mode === "recover") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/callback?next=/perfil`,
      });
      setLoading(false);
      if (error) return toast.error("No hemos podido enviar el correo.");
      return toast.success("Revisa tu correo: te hemos enviado el enlace.");
    }
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
              data: {
                display_name: displayName.trim(),
                username: username.trim().toLowerCase(),
              },
            },
          });
    setLoading(false);
    if (result.error)
      return toast.error(
        result.error.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos."
          : "No hemos podido completar el acceso.",
      );
    toast.success(
      mode === "login"
        ? "¡Dentro! Que empiece el pique."
        : "Cuenta creada. Bienvenido al pique.",
    );
    router.replace(nextPath as Route);
    router.refresh();
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
      {mode === "signup" && (
        <>
          <label>
            <span className="field-label">Nombre</span>
            <input
              className="field"
              autoComplete="name"
              required
              minLength={2}
              maxLength={60}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Tu nombre"
            />
          </label>
          <label>
            <span className="field-label">Nombre de usuario</span>
            <input
              className="field"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              minLength={3}
              maxLength={30}
              pattern="[A-Za-z0-9_]+"
              title="Usa entre 3 y 30 letras, números o guiones bajos."
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="tu_usuario"
            />
            <small className="muted" style={{ display: "block", marginTop: 6 }}>
              Entre 3 y 30 letras, números o guiones bajos.
            </small>
          </label>
        </>
      )}
      <label>
        <span className="field-label">Email</span>
        <input
          className="field"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
        />
      </label>
      {mode !== "recover" && (
        <label>
          <span className="field-label">Contraseña</span>
          <input
            className="field"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 8 caracteres"
          />
        </label>
      )}
      <button
        className="button button-primary"
        disabled={loading}
        type="submit"
      >
        {loading ? (
          <LoaderCircle className="animate-spin" size={18} />
        ) : (
          <>
            {mode === "login"
              ? "Entrar al pique"
              : mode === "signup"
                ? "Crear mi cuenta"
                : "Enviar enlace"}
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
}
