import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <Skeleton width={100} height={25} />
        <Skeleton width={42} height={42} radius={16} />
      </div>
      <div
        style={{
          display: "grid",
          justifyItems: "center",
          gap: 14,
          paddingTop: 14,
        }}
      >
        <Skeleton width={126} height={126} radius={999} />
        <Skeleton width={160} height={26} />
        <Skeleton width={90} height={14} />
      </div>
      <Skeleton height={110} radius={28} style={{ margin: "24px 0" }} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 28,
        }}
      >
        <Skeleton height={90} radius={24} />
        <Skeleton height={90} radius={24} />
      </div>
      <Skeleton height={140} radius={28} />
    </main>
  );
}
