import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="page">
      <header style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Skeleton width={48} height={48} radius={999} />
        <Skeleton width="60%" height={22} />
      </header>
      <section style={{ marginTop: 40 }}>
        <Skeleton width="40%" height={38} style={{ marginBottom: 16 }} />
        <Skeleton height={10} />
      </section>
      <Skeleton height={70} radius={24} style={{ margin: "24px 0 36px" }} />
      <Skeleton height={340} radius={28} style={{ marginBottom: 22 }} />
      <div style={{ display: "grid", gap: 10 }}>
        <Skeleton height={68} radius={20} />
        <Skeleton height={68} radius={20} />
        <Skeleton height={68} radius={20} />
      </div>
    </main>
  );
}
