// A diferencia de layout.tsx, Next crea una instancia nueva de template.tsx
// en cada navegación (incluso entre rutas hermanas) — se aprovecha para que
// el contenido de cada pestaña entre con un fundido/desplazamiento sutil
// (.page-enter, 200ms, solo transform/opacity) en vez de aparecer de golpe.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
