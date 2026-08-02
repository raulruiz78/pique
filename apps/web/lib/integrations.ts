export interface Analytics {
  capture(
    event: string,
    properties?: Record<string, string | number | boolean>,
  ): Promise<void>;
}
export interface MessageDelivery {
  send(userId: string, subject: string, body: string): Promise<void>;
}
export interface ErrorReporter {
  capture(error: unknown, context?: Record<string, string>): void;
}
export const noOpAnalytics: Analytics = {
  async capture() {
    return Promise.resolve();
  },
};
export const noOpDelivery: MessageDelivery = {
  async send() {
    return Promise.resolve();
  },
};
export const consoleErrorReporter: ErrorReporter = {
  capture(error, context) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "reported_error",
        error: error instanceof Error ? error.name : "unknown",
        ...context,
      }),
    );
  },
};
