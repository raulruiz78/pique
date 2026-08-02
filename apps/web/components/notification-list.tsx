"use client";
import { CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
export function MarkNotificationsRead() {
  const router = useRouter();
  return (
    <button
      className="button button-secondary"
      onClick={async () => {
        const response = await fetch("/api/v1/notifications", {
          method: "PATCH",
        });
        if (!response.ok) return toast.error("No se pudieron marcar.");
        router.refresh();
      }}
    >
      <CheckCheck size={17} />
      Marcar leídas
    </button>
  );
}
