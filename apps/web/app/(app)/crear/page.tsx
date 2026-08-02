import { ChallengeWizard } from "@/components/challenge-wizard";
export default function CreatePage() {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  return (
    <main className="page">
      <header>
        <span className="eyebrow">Nuevo desafío</span>
        <h1 className="display" style={{ fontSize: 44, margin: "6px 0 8px" }}>
          Enciende el pique.
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          En cuatro pasos. Reglas claras desde el principio.
        </p>
      </header>
      <ChallengeWizard
        startDate={start.toISOString().slice(0, 10)}
        endDate={end.toISOString().slice(0, 10)}
      />
    </main>
  );
}
