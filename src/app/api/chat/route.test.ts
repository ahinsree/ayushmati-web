import { POST } from "./route";

function request(body: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/chat guards", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns 503 when no API key is configured", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const res = await POST(request({ messages: [] }));
    expect(res.status).toBe(503);
  });

  it("rejects malformed JSON", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    expect((await POST(request("{not json"))).status).toBe(400);
  });

  it("rejects empty and overly long conversations", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    expect((await POST(request({ messages: [] }))).status).toBe(400);
    const many = Array.from({ length: 41 }, (_, i) => ({ id: String(i), role: "user", parts: [{ type: "text", text: "hi" }] }));
    expect((await POST(request({ messages: many }))).status).toBe(400);
  });
});
