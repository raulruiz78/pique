import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && anon && secret);
const testUrl = url ?? "http://127.0.0.1:54321";
const testAnon = anon ?? "local-test-key";
const testSecret = secret ?? "local-test-secret";
const outsiderEmail = `outsider-${Date.now()}@pique.local`;
let outsiderId = "";

describe.skipIf(!enabled)("RLS privado por defecto", () => {
  const admin = createClient(testUrl, testSecret, {
    auth: { persistSession: false },
  });
  const outsider = createClient(testUrl, testAnon, {
    auth: { persistSession: false },
  });
  beforeAll(async () => {
    const created = await admin.auth.admin.createUser({
      email: outsiderEmail,
      password: "PiqueOutsider2026!",
      email_confirm: true,
      user_metadata: {
        username: `outsider_${Date.now()}`,
        display_name: "Persona ajena",
      },
    });
    outsiderId = created.data.user!.id;
    await outsider.auth.signInWithPassword({
      email: outsiderEmail,
      password: "PiqueOutsider2026!",
    });
  });
  afterAll(async () => {
    await outsider.auth.signOut();
    if (outsiderId) await admin.auth.admin.deleteUser(outsiderId);
  });
  it("un usuario ajeno no ve círculos", async () => {
    const { data, error } = await outsider
      .from("circles")
      .select("id")
      .eq("id", "20000000-0000-0000-0000-000000000001");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
  it("un usuario ajeno no ve retos ni evidencias", async () => {
    const [challenge, evidence] = await Promise.all([
      outsider
        .from("challenges")
        .select("id")
        .eq("id", "30000000-0000-0000-0000-000000000001"),
      outsider.from("evidence").select("id"),
    ]);
    expect(challenge.data).toEqual([]);
    expect(evidence.data).toEqual([]);
  });
  it("nadie puede asignarse puntos desde el cliente", async () => {
    const { error } = await outsider.from("score_transactions").insert({
      challenge_id: "30000000-0000-0000-0000-000000000001",
      user_id: outsiderId,
      points: 999,
      source_type: "CHEAT",
      source_id: crypto.randomUUID(),
      reason: "CHEAT",
    });
    expect(error).not.toBeNull();
  });
  it("solo permite subir imágenes en el espacio propio", async () => {
    const ownPath = `profiles/${outsiderId}/profile.webp`;
    const ownUpload = await outsider.storage
      .from("profile-images")
      .upload(ownPath, new Blob(["profile"], { type: "image/webp" }), {
        contentType: "image/webp",
      });
    expect(ownUpload.error).toBeNull();

    const forbidden = await outsider.storage
      .from("profile-images")
      .upload(
        "circles/20000000-0000-0000-0000-000000000001/attack.webp",
        new Blob(["attack"], { type: "image/webp" }),
        { contentType: "image/webp" },
      );
    expect(forbidden.error).not.toBeNull();

    await outsider.storage.from("profile-images").remove([ownPath]);
  });
});
