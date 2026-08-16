import { ChallengeWizard } from "@/components/challenge-wizard";
export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ circleId?: string }>;
}) {
  const { circleId } = await searchParams;
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  return (
    <main className="page">
      <header style={{ marginBottom: 34 }}>
        <b
          className="display"
          style={{
            color: "var(--violet)",
            fontSize: 24,
            letterSpacing: "0.02em",
          }}
        >
          PIQUE
        </b>
      </header>
      <ChallengeWizard
        startDate={start.toISOString().slice(0, 10)}
        endDate={end.toISOString().slice(0, 10)}
        initialCircleId={circleId}
      />
    </main>
  );
}
