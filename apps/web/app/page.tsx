import { ArrowRight, Camera, Check, Flame, Trophy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main
      className="ambient-background"
      style={{ minHeight: "100dvh", overflow: "hidden" }}
    >
      <nav
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "24px 22px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/icon.svg" alt="" width={42} height={42} priority />
          <div className="display brand-word" style={{ fontSize: 28 }}>
            pi<span>que</span>.
          </div>
        </div>
        <Link
          className="button button-secondary"
          href="/login"
          style={{ minHeight: 44 }}
        >
          Entrar
        </Link>
      </nav>
      <section
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "64px 22px 80px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: 56,
          alignItems: "center",
        }}
      >
        <div className="rise">
          <span className="pill pill-lime">
            <Flame size={14} /> El pique que sí funciona
          </span>
          <h1
            className="display"
            style={{
              fontSize: "clamp(3.5rem, 10vw, 7.7rem)",
              margin: "24px 0 20px",
              maxWidth: 760,
            }}
          >
            Ponte metas.
            <br />
            <span style={{ color: "var(--violet)" }}>Pí­cate.</span>
            <br />
            Cumple.
          </h1>
          <p
            className="muted"
            style={{
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              lineHeight: 1.55,
              maxWidth: 550,
            }}
          >
            Retos privados con tu pareja y amigos. Pruebas, puntos y
            consecuencias acordadas. Sin dinero. Sin trampas.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 30,
            }}
          >
            <Link className="button button-primary" href="/registro">
              Crear mi primer reto <ArrowRight size={18} />
            </Link>
            <a className="button button-secondary" href="#como-funciona">
              Cómo funciona
            </a>
          </div>
        </div>
        <div
          aria-label="Vista previa de la aplicación"
          className="card rise"
          style={{
            padding: 18,
            maxWidth: 390,
            width: "100%",
            margin: "0 auto",
            transform: "rotate(1.5deg)",
            background: "var(--ink)",
            color: "var(--canvas)",
          }}
        >
          <div style={{ padding: 14 }}>
            <small style={{ opacity: 0.65 }}>Buenos días</small>
            <h2
              className="display"
              style={{ fontSize: 34, margin: "5px 0 20px" }}
            >
              Hoy toca
              <br />
              dar la talla.
            </h2>
          </div>
          <div
            style={{
              background: "var(--violet)",
              borderRadius: 22,
              padding: 20,
              color: "#25005a",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span
                className="pill"
                style={{ background: "rgba(255,255,255,.18)" }}
              >
                HOY · 10 PT
              </span>
              <Flame />
            </div>
            <h3 style={{ fontSize: 24, margin: "30px 0 6px" }}>Entrenar</h3>
            <p style={{ opacity: 0.8, margin: 0 }}>Agosto sin vaguear</p>
            <button
              className="button button-lime"
              style={{ width: "100%", marginTop: 24 }}
            >
              <Camera size={18} /> Hecho, tengo prueba
            </button>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <div
              style={{
                flex: 1,
                padding: 15,
                border: "1px solid #393340",
                borderRadius: 18,
              }}
            >
              <Trophy size={20} color="var(--gold)" />
              <b style={{ display: "block", marginTop: 10 }}>#1 Tú</b>
              <small style={{ opacity: 0.65 }}>40 puntos</small>
            </div>
            <div
              style={{
                flex: 1,
                padding: 15,
                border: "1px solid #393340",
                borderRadius: 18,
              }}
            >
              <Flame size={20} color="var(--coral)" />
              <b style={{ display: "block", marginTop: 10 }}>4 días</b>
              <small style={{ opacity: 0.65 }}>Tu mejor racha</small>
            </div>
          </div>
        </div>
      </section>
      <section
        id="como-funciona"
        style={{
          maxWidth: 1080,
          margin: "0 auto 80px",
          padding: "0 22px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 14,
        }}
      >
        {[
          [Check, "Reglas claras", "Todos aceptan antes de empezar."],
          [Camera, "Pruebas privadas", "Solo las ve quien debe validar."],
          [Trophy, "Puntos explicables", "Cada punto queda registrado."],
        ].map(([Icon, title, text]) => {
          const Comp = Icon as typeof Check;
          return (
            <article
              className="card"
              key={String(title)}
              style={{ padding: 24 }}
            >
              <Comp color="var(--violet)" />
              <h2 style={{ margin: "22px 0 8px" }}>{String(title)}</h2>
              <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
                {String(text)}
              </p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
