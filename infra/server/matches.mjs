import { randomInt } from "node:crypto";
import { getNewClient } from "../database.mjs";
import {
  createMatch,
  playFromHand,
  confirmOpening,
  passTurn,
} from "../../src/game/match.ts";
import { fail, digest } from "../auth/service.mjs";
const uuid = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const newMatch = () => createMatch(randomInt(0, 4294967296));
const response = (row) => ({
  state: row.state,
  revision: row.revision,
  controlVersion: row.control_version,
});
export async function matchOperation(session, operation, input = {}) {
  const client = await getNewClient();
  try {
    await client.query("BEGIN");
    // O lock da sessão serializa logout com jogadas autenticadas.
    const valid = await client.query(
      "SELECT id FROM paradox.sessions WHERE id=$1 AND expires_at>clock_timestamp() AND absolute_expires_at>clock_timestamp() FOR SHARE",
      [session.id],
    );
    if (!valid.rowCount) fail(401, "SESSION_EXPIRED", "Sua sessão expirou.");
    await client.query(
      "INSERT INTO paradox.user_matches(user_id,state) VALUES($1,$2) ON CONFLICT DO NOTHING",
      [session.user_id, JSON.stringify(newMatch())],
    );
    let row = (
      await client.query(
        "SELECT * FROM paradox.user_matches WHERE user_id=$1 FOR UPDATE",
        [session.user_id],
      )
    ).rows[0];
    if (operation === "read") {
      await client.query("COMMIT");
      return response(row);
    }
    if (!uuid(input.tabId))
      fail(400, "INVALID_TAB", "Identificação de aba inválida.");
    const same = row.session_id === session.id && row.tab_id === input.tabId;
    const active = +row.lease_expires_at > Date.now();
    if (operation === "claim") {
      const ownerSession = row.session_id
        ? (
            await client.query(
              "SELECT id FROM paradox.sessions WHERE id=$1 AND expires_at>clock_timestamp() AND absolute_expires_at>clock_timestamp()",
              [row.session_id],
            )
          ).rowCount
        : 0;
      if (active && ownerSession && !same && input.takeover !== true)
        fail(409, "CONTROL_BUSY", "Esta partida está aberta em outra aba.");
      row = (
        await client.query(
          "UPDATE paradox.user_matches SET session_id=$2,tab_id=$3,control_version=control_version+$4,lease_expires_at=clock_timestamp()+interval '60 seconds' WHERE user_id=$1 RETURNING *",
          [session.user_id, session.id, input.tabId, same && active ? 0 : 1],
        )
      ).rows[0];
    } else {
      if (!same || !active || input.controlVersion !== row.control_version)
        fail(
          409,
          "CONTROL_LOST",
          "O controle está em outra aba ou expirou. Continue nesta aba para retomar.",
        );
      if (operation === "action") {
        if (!uuid(input.requestId))
          fail(400, "INVALID_REQUEST", "Identificação de jogada inválida.");
        const fingerprint = digest(
          JSON.stringify({ revision: input.revision, action: input.action }),
        );
        const previous = (
          await client.query(
            "SELECT * FROM paradox.action_receipts WHERE user_id=$1 AND request_id=$2",
            [session.user_id, input.requestId],
          )
        ).rows[0];
        if (previous) {
          if (previous.fingerprint !== fingerprint)
            fail(
              409,
              "REQUEST_REUSED",
              "Identificação já usada por outra jogada.",
            );
          await client.query("COMMIT");
          return previous.response;
        }
        if (input.revision !== row.revision)
          fail(409, "STALE_STATE", "A partida mudou. Atualize antes de jogar.");
        const action = input.action;
        let result;
        if (action?.type === "reset") result = { ok: true, state: newMatch() };
        else if (action?.type === "pass")
          result = passTurn(row.state, row.state.turn);
        else if (action?.type === "opening" && Array.isArray(action.indices))
          result = confirmOpening(row.state, row.state.turn, action.indices);
        else if (action?.type === "play")
          result = playFromHand(
            row.state,
            row.state.turn,
            action.handIndex,
            action.index,
          );
        if (!result?.ok)
          fail(
            400,
            "INVALID_ACTION",
            "Jogada indisponível para o estado atual.",
          );
        row = (
          await client.query(
            "UPDATE paradox.user_matches SET state=$2,revision=revision+1 WHERE user_id=$1 RETURNING *",
            [session.user_id, JSON.stringify(result.state)],
          )
        ).rows[0];
        await client.query(
          "INSERT INTO paradox.action_receipts(user_id,request_id,fingerprint,response) VALUES($1,$2,$3,$4)",
          [
            session.user_id,
            input.requestId,
            fingerprint,
            JSON.stringify(response(row)),
          ],
        );
      }
      await client.query(
        "UPDATE paradox.user_matches SET lease_expires_at=clock_timestamp()+interval '60 seconds' WHERE user_id=$1",
        [session.user_id],
      );
    }
    await client.query("COMMIT");
    return response(row);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}
