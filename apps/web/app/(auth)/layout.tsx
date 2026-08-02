import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
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
            display: "block",
            textDecoration: "none",
            color: "var(--ink)",
            fontSize: 31,
            marginBottom: 28,
          }}
        >
          pi<span style={{ color: "var(--violet)" }}>que</span>.
        </Link>
        <div className="card" style={{ padding: "32px 26px" }}>
          {children}
        </div>
      </section>
    </main>
  );
}
