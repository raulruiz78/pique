import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      className="ambient-background"
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <section style={{ width: "min(100%, 430px)" }}>
        <Link
          href="/"
          className="display"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            textDecoration: "none",
            color: "var(--ink)",
            fontSize: 27,
            marginBottom: 26,
          }}
        >
          <Image src="/icon.svg" alt="" width={58} height={58} priority />
          <span className="brand-word">
            pi<span>que</span>.
          </span>
        </Link>
        <div
          className="card"
          style={{
            padding: "32px 26px",
            background: "rgb(28 27 27 / 82%)",
            backdropFilter: "blur(20px)",
          }}
        >
          {children}
        </div>
      </section>
    </main>
  );
}
