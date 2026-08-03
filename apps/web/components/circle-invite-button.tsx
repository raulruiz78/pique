"use client";
import { LoaderCircle, Share2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CircleInviteButton({
  circleId,
  compact = false,
}: {
  circleId: string;
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  async function invite() {
    setLoading(true);
    const response = await fetch(`/api/v1/circles/${circleId}/invites`, {
      method: "POST",
    });
    const body = (await response.json()) as { data?: { code: string } };
    setLoading(false);
    if (!body.data) return toast.error("No se pudo crear la invitación.");
    const url = `${location.origin}/unirse/${body.data.code}`;
    const canShare = typeof navigator.share === "function";
    if (canShare)
      await navigator
        .share({ title: "Únete a mi círculo en Pique", url })
        .catch(() => undefined);
    else await navigator.clipboard.writeText(url);
    toast.success(canShare ? "Invitación preparada." : "Enlace copiado.");
  }
  return (
    <button
      className={compact ? "button button-secondary" : "button button-primary"}
      onClick={invite}
      disabled={loading}
      style={
        compact ? { width: 48, minHeight: 48, padding: 0 } : { width: "100%" }
      }
    >
      {loading ? (
        <LoaderCircle className="animate-spin" />
      ) : compact ? (
        <Share2 size={19} />
      ) : (
        <UserPlus size={19} />
      )}
      {!compact && "Invitar"}
    </button>
  );
}
