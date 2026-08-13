export interface PushSubscription {
  endpoint: string;
  publicKey: string;
  authSecret: string;
}

export interface PushPayload {
  title: string;
  body: string;
  href?: string;
  tag?: string;
}

export type PushSendResult = { ok: true } | { ok: false; expired: boolean };

export interface PushSender {
  send(
    subscription: PushSubscription,
    payload: PushPayload,
  ): Promise<PushSendResult>;
}

export const noOpPushSender: PushSender = {
  async send() {
    return { ok: true };
  },
};
