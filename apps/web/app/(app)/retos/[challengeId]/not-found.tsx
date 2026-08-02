import { EmptyState } from "@/components/empty-state";
export default function NotFound() {
  return (
    <main className="page">
      <EmptyState
        title="Reto no encontrado"
        text="No existe o no tienes permiso para verlo. Pique es privado por defecto."
        href="/hoy"
        action="Volver al inicio"
      />
    </main>
  );
}
