import { createMatch, type MatchState } from "../game/match";
import type { Player } from "../game/placement";
export class RequestError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api(
  path: string,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
) {
  const response = await fetch(`/api/v1${path}`, {
    method,
    credentials: "same-origin",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok)
    throw new RequestError(data.code, response.status, data.message);
  return data;
}
export interface MatchPayload {
  state: MatchState;
  revision: number;
  controlVersion: number;
}
export class PlacementController {
  state = createMatch();
  revision = 0;
  controlVersion = 0;
  tabId = crypto.randomUUID();
  private inflight = false;
  constructor(
    private changed: (value: MatchPayload) => void,
    private failure: (error: unknown) => void,
    private busy: (value: boolean) => void,
  ) {}
  update(value: MatchPayload) {
    if (value.revision < this.revision) return;
    this.state = value.state;
    this.revision = value.revision;
    this.controlVersion = value.controlVersion;
    this.changed(value);
  }
  async command(action: unknown) {
    if (this.inflight) return { ok: false, state: this.state };
    this.inflight = true;
    this.busy(true);
    const request = {
      tabId: this.tabId,
      controlVersion: this.controlVersion,
      revision: this.revision,
      requestId: crypto.randomUUID(),
      action,
    };
    try {
      this.update(await api("/match/actions", request));
      return { ok: true, state: this.state };
    } catch (error) {
      this.failure(error);
      return { ok: false, state: this.state };
    } finally {
      this.inflight = false;
      this.busy(false);
    }
  }
  place(_player: Player, handIndex: number, index: number) {
    return this.command({ type: "play", handIndex, index });
  }
  opening(_player: Player, indices: number[]) {
    return this.command({ type: "opening", indices });
  }
  pass() {
    return this.command({ type: "pass" });
  }
  reset() {
    return this.command({ type: "reset" });
  }
}
