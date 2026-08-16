import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="page">
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 38,
        }}
      >
        <Skeleton width={48} height={48} radius={999} />
        <Skeleton width="60%" height={22} />
      </header>
      <Skeleton width={100} height={12} style={{ marginBottom: 10 }} />
      <Skeleton width="80%" height={30} style={{ marginBottom: 38 }} />
      <div style={{ display: "grid", gap: 11 }}>
        <Skeleton height={150} radius={24} />
        <Skeleton height={150} radius={24} />
        <Skeleton height={80} radius={24} />
      </div>
    </main>
  );
}
