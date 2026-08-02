import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && anon && secret);
const testUrl = url ?? "http://127.0.0.1:54321";
const testAnon = anon ?? "local-test-key";
const testSecret = secret ?? "local-test-secret";
describe.skipIf(!enabled)("flujo crítico transaccional", () => {
  const raul = createClient(testUrl, testAnon, {
    auth: { persistSession: false },
  });
  const carmen = createClient(testUrl, testAnon, {
    auth: { persistSession: false },
  });
  const admin = createClient(testUrl, testSecret, {
    auth: { persistSession: false },
  });
  let challengeId = "";
  let checkInId = "";
  beforeAll(async () => {
    await raul.auth.signInWithPassword({
      email: "raul@pique.local",
      password: "PiqueDemo2026!",
    });
    await carmen.auth.signInWithPassword({
      email: "carmen@pique.local",
      password: "PiqueDemo2026!",
    });
  });
  afterAll(async () => {
    if (challengeId)
      await admin.from("challenges").delete().eq("id", challengeId);
  });
  it("crea, acepta y genera ocurrencias", async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const { data, error } = await raul.rpc("create_challenge", {
      payload: {
        circleId: "20000000-0000-0000-0000-000000000001",
        title: "Integración sin trampas",
        description: "Flujo automático",
        type: "DAILY",
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        timezone: "Europe/Madrid",
        recurrence: "FREQ=DAILY",
        points: 10,
        evidenceRequired: false,
        validationType: "PEER_REVIEW",
        participantIds: [
          "10000000-0000-0000-0000-000000000001",
          "10000000-0000-0000-0000-000000000002",
        ],
      },
    });
    expect(error).toBeNull();
    challengeId = data;
    const accepted = await carmen.rpc("respond_to_challenge", {
      target_challenge_id: challengeId,
      response: "ACCEPTED",
    });
    expect(accepted.data).toBe("ACTIVE");
    const occurrences = await raul
      .from("goal_occurrences")
      .select("id")
      .eq("challenge_id", challengeId)
      .eq("participant_id", "10000000-0000-0000-0000-000000000001")
      .order("starts_at")
      .limit(1);
    expect(occurrences.data).toHaveLength(1);
    const submitted = await raul.rpc("submit_check_in", {
      target_occurrence_id: occurrences.data![0]!.id,
      check_note: "Cumplido",
      check_value: null,
      evidence_payload: null,
    });
    expect(submitted.error).toBeNull();
    checkInId = submitted.data.id;
  });
  it("valida y aplica el ledger exactamente una vez", async () => {
    const first = await carmen.rpc("review_check_in", {
      target_check_in_id: checkInId,
      review_decision: "APPROVED",
      review_reason: null,
    });
    expect(first.error).toBeNull();
    await carmen.rpc("review_check_in", {
      target_check_in_id: checkInId,
      review_decision: "APPROVED",
      review_reason: null,
    });
    const ledger = await raul
      .from("score_transactions")
      .select("points")
      .eq("source_id", checkInId);
    expect(ledger.data).toEqual([{ points: 10 }]);
  });
  it("finaliza, ordena y asigna la consecuencia", async () => {
    await admin
      .from("challenges")
      .update({ end_at: new Date(Date.now() - 1000).toISOString() })
      .eq("id", challengeId);
    const completed = await admin.rpc("complete_challenge", {
      target_challenge_id: challengeId,
    });
    expect(completed.data).toBe("10000000-0000-0000-0000-000000000001");
    const { data } = await admin
      .from("challenge_participants")
      .select("user_id,position")
      .eq("challenge_id", challengeId)
      .order("position");
    expect(data?.[0]).toMatchObject({
      user_id: "10000000-0000-0000-0000-000000000001",
      position: 1,
    });
  });
});
