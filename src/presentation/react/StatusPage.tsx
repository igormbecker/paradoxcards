import { useEffect, useState } from "react";
import "./StatusPage.css";

interface StatusPayload {
  updated_at: string;
  status: "operational" | "unavailable";
  dependencies: {
    database: {
      version: string;
      max_connections: number;
      opened_connections: number;
    } | null;
  };
}

function isStatusPayload(value: unknown): value is StatusPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<StatusPayload>;
  const db = payload.dependencies?.database;
  return (
    typeof payload.updated_at === "string" &&
    !Number.isNaN(Date.parse(payload.updated_at)) &&
    ((payload.status === "unavailable" && db === null) ||
      (payload.status === "operational" &&
        !!db &&
        typeof db.version === "string" &&
        Number.isInteger(db.max_connections) &&
        db.max_connections > 0 &&
        Number.isInteger(db.opened_connections) &&
        db.opened_connections >= 0))
  );
}

export default function StatusPage() {
  const [payload, setPayload] = useState<StatusPayload | null>(null);
  const [state, setState] = useState<"loading" | "operational" | "unavailable">(
    "loading",
  );
  const [checking, setChecking] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const previous = document.title;
    document.title = "Status do sistema | Paradox: The Card Game";
    return () => {
      document.title = previous;
    };
  }, []);
  useEffect(() => {
    let disposed = false;
    let next: ReturnType<typeof setTimeout>;
    let controller: AbortController;
    async function refresh() {
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      setChecking(true);
      try {
        const response = await fetch("/api/v1/status", {
          cache: "no-store",
          signal: controller.signal,
        });
        const result: unknown = await response.json();
        if (
          !isStatusPayload(result) ||
          (response.status !== 200 && response.status !== 503) ||
          response.ok !== (result.status === "operational")
        )
          throw new Error("Invalid status response");
        if (!disposed) {
          setPayload(result);
          setState(result.status);
        }
      } catch {
        if (!disposed) {
          setPayload(null);
          setState("unavailable");
        }
      } finally {
        clearTimeout(timeout);
        if (!disposed) {
          setChecking(false);
          next = setTimeout(() => void refresh(), 5000);
        }
      }
    }
    void refresh();
    return () => {
      disposed = true;
      clearTimeout(next);
      controller?.abort();
    };
  }, [attempt]);
  const database =
    payload?.status === "operational" ? payload.dependencies.database : null;
  const label =
    state === "loading"
      ? "Verificando…"
      : state === "operational"
        ? "Operacional"
        : "Indisponível";
  const usage = database
    ? Math.round((database.opened_connections / database.max_connections) * 100)
    : null;
  return (
    <main className="system-page">
      <nav className="system-nav" aria-label="Navegação do status">
        <a href="/">Voltar ao início</a>
        <span>Paradox: The Card Game</span>
      </nav>
      <div className="system-content">
        <header className="system-heading">
          <div>
            <p className="system-kicker">Entre eras, conexão presente</p>
            <h1>Status do sistema</h1>
            <p>Disponibilidade do servidor e conexão com o banco de dados.</p>
          </div>
          <span
            className={`system-badge ${state}`}
            role="status"
            data-testid="system-status"
          >
            {label}
          </span>
        </header>
        {state === "unavailable" && (
          <p className="system-error" role="alert">
            Não foi possível confirmar a disponibilidade do sistema. Uma nova
            consulta será feita automaticamente.
          </p>
        )}
        <div className="system-grid">
          <section className="system-panel" aria-labelledby="database-title">
            <div className="system-panel-heading">
              <h2 id="database-title">Banco de dados</h2>
              <span>PostgreSQL</span>
            </div>
            <p className="system-connection">
              {database
                ? "Conexão estabelecida"
                : state === "loading"
                  ? "Aguardando a primeira consulta…"
                  : "Conexão não confirmada"}
            </p>
            <dl className="system-metrics">
              <div>
                <dt>Versão</dt>
                <dd data-testid="database-version">
                  {database?.version ?? "—"}
                </dd>
              </div>
              <div>
                <dt>Conexões abertas</dt>
                <dd>{database?.opened_connections ?? "—"}</dd>
              </div>
              <div>
                <dt>Limite de conexões</dt>
                <dd>{database?.max_connections ?? "—"}</dd>
              </div>
            </dl>
            {database && (
              <div className="system-capacity">
                <div>
                  <span>Uso das conexões</span>
                  <span>{usage}%</span>
                </div>
                <meter
                  min={0}
                  max={database.max_connections}
                  value={database.opened_connections}
                  aria-label="Uso das conexões do banco"
                />
              </div>
            )}
          </section>
          <section
            className="system-panel system-response"
            aria-labelledby="response-title"
          >
            <h2 id="response-title">Resposta da API</h2>
            <p>Dados da consulta mais recente.</p>
            <pre data-testid="status-payload">
              {payload
                ? JSON.stringify(payload, null, 2)
                : state === "loading"
                  ? "Aguardando resposta…"
                  : "Resposta indisponível."}
            </pre>
          </section>
        </div>
        <div className="system-update">
          <div>
            <p>
              Última atualização:{" "}
              {payload
                ? new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "medium",
                    timeZone: "America/Sao_Paulo",
                  }).format(new Date(payload.updated_at))
                : "—"}
            </p>
            <span>
              Consultas automáticas a cada 5 segundos · Horário de Brasília
            </span>
          </div>
          <button
            type="button"
            disabled={checking}
            onClick={() => setAttempt((value) => value + 1)}
          >
            {checking ? "Verificando…" : "Verificar novamente"}
          </button>
        </div>
      </div>
      <footer className="system-footer">
        Desenvolvido por &gt;.Bectec Tecnologia e Desenvolvimento de Softwares
      </footer>
    </main>
  );
}
