import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="page">
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 26,
        }}
      >
        <Skeleton width={48} height={48} radius={16} />
        <Skeleton width="50%" height={22} />
        <Skeleton width={48} height={48} radius={16} />
      </nav>
      <header style={{ display: "flex", gap: 16, marginBottom: 28 }}>
        <Skeleton width={58} height={58} radius={999} />
        <div style={{ flex: 1 }}>
          <Skeleton width={110} height={12} style={{ marginBottom: 8 }} />
          <Skeleton width="70%" height={26} style={{ marginBottom: 8 }} />
          <Skeleton width="90%" height={14} />
        </div>
      </header>
      <Skeleton height={280} radius={28} style={{ marginBottom: 28 }} />
      <div style={{ display: "grid", gap: 11 }}>
        <Skeleton height={100} radius={24} />
        <Skeleton height={100} radius={24} />
      </div>
    </main>
  );
}
