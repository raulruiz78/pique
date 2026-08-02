"use client";
import {
  CalendarDays,
  CirclePlus,
  House,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/hoy", label: "Inicio", Icon: House, create: false },
  {
    href: "/calendario",
    label: "Calendario",
    Icon: CalendarDays,
    create: false,
  },
  { href: "/crear", label: "Crear", Icon: CirclePlus, create: true },
  { href: "/circulos", label: "Círculos", Icon: UsersRound, create: false },
  { href: "/perfil", label: "Perfil", Icon: UserRound, create: false },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegación principal" className="bottom-nav">
      {items.map(({ href, label, Icon, create }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          className={`nav-item ${create ? "nav-create" : ""}`}
          data-active={pathname.startsWith(href)}
        >
          <Icon size={create ? 27 : 21} strokeWidth={2.4} />
          <span>{create ? "" : label}</span>
        </Link>
      ))}
    </nav>
  );
}
