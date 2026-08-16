import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="page">
      <header style={{ marginBottom: 28 }}>
        <Skeleton width={68} height={68} radius={22} />
        <Skeleton
          width={90}
          height={22}
          radius={999}
          style={{ marginTop: 14 }}
        />
        <Skeleton width="80%" height={34} style={{ margin: "10px 0" }} />
        <Skeleton width="60%" height={16} />
      </header>
      <Skeleton height={150} radius={28} style={{ margin: "22px 0" }} />
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          margin: "22px 0",
        }}
      >
        <Skeleton height={146} radius={28} />
        <Skeleton height={146} radius={28} />
        <Skeleton height={146} radius={28} />
        <Skeleton height={146} radius={28} />
      </section>
      <Skeleton width={100} height={22} style={{ marginBottom: 10 }} />
      <Skeleton height={140} radius={28} />
    </main>
  );
}
