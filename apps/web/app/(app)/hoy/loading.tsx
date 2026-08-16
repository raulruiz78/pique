import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="page">
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <Skeleton width={48} height={48} radius={999} />
        <div style={{ flex: 1 }}>
          <Skeleton width={70} height={12} style={{ marginBottom: 8 }} />
          <Skeleton width="70%" height={22} />
        </div>
        <Skeleton width={48} height={48} radius={16} />
      </header>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: 11,
          marginBottom: 24,
        }}
      >
        <Skeleton height={140} radius={28} />
        <Skeleton height={140} radius={28} />
      </section>
      <Skeleton height={10} style={{ marginBottom: 30 }} />
      <div style={{ display: "grid", gap: 12 }}>
        <Skeleton height={110} radius={24} />
        <Skeleton height={110} radius={24} />
        <Skeleton height={110} radius={24} />
      </div>
    </main>
  );
}
