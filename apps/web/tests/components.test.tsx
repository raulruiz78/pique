import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { dayBounds } from "@/lib/queries";

describe("componentes accesibles", () => {
  it("da nombre accesible al avatar", () => {
    render(<Avatar name="Raúl Ruiz" />);
    expect(
      screen.getByRole("img", { name: "Avatar de Raúl Ruiz" }),
    ).toHaveTextContent("RR");
  });
  it("presenta estado vacío con acción clara", () => {
    render(
      <EmptyState
        title="Sin retos"
        text="Crea el primero."
        href="/crear"
        action="Crear reto"
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Sin retos" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear reto" })).toHaveAttribute(
      "href",
      "/crear",
    );
  });
  it("calcula el día de usuario respetando su zona horaria", () => {
    const { start, end } = dayBounds(
      new Date("2026-08-02T12:00:00Z"),
      "Europe/Madrid",
    );
    expect(start.toISOString()).toBe("2026-08-01T22:00:00.000Z");
    expect(end.toISOString()).toBe("2026-08-02T22:00:00.000Z");
  });
});
