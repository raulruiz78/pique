"use client";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PiqueCoin } from "./pique-coin";

export function CircleShieldMarket({
  circleId,
  coinBalance,
  shieldCount,
}: {
  circleId: string;
  coinBalance: number;
  shieldCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const canBuy = coinBalance >= 1000;

  async function buy() {
    setLoading(true);
    const response = await fetch(`/api/v1/circles/${circleId}/shields`, {
      method: "POST",
    });
    setLoading(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      return toast.error(
        body?.error?.message ?? "No se pudo comprar el comodín.",
      );
    }
    toast.success("¡Comodín conseguido! Sale al hacer check-in.");
    router.refresh();
  }

  return (
    <section className="stitch-card" style={{ padding: 18, marginTop: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PiqueCoin size={26} />
          <div>
            <b style={{ fontSize: 19 }}>{coinBalance.toLocaleString("es")}</b>
            <small className="muted" style={{ display: "block" }}>
              coins en este círculo
            </small>
          </div>
        </div>
        {shieldCount > 0 && (
          <span className="pill pill-lime">
            <ShieldCheck size={12} />
            {shieldCount} {shieldCount === 1 ? "comodín" : "comodines"}
          </span>
        )}
      </div>
      <button
        className="button button-secondary"
        style={{ width: "100%", marginTop: 14 }}
        disabled={!canBuy || loading}
        onClick={buy}
      >
        {loading ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <PiqueCoin size={16} />
        )}
        {canBuy
          ? "Comprar comodín — 1000 coins"
          : `Te faltan ${(1000 - coinBalance).toLocaleString("es")} coins`}
      </button>
      <small className="muted" style={{ display: "block", marginTop: 8 }}>
        Ganas coins con cada check-in que te aprueban en este círculo. Un
        comodín te salta un check-in — sin foto, sin puntos, solo salva la
        racha.
      </small>
    </section>
  );
}
