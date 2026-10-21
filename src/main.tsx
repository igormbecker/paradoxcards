import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createRoot } from "react-dom/client";
import {
  api,
  PlacementController,
  RequestError,
} from "./application/match-controller";
import "./style.css";
const Game = lazy(() => import("./presentation/react/Game"));
interface User {
  id: string;
  email: string;
}
function SessionView({
  user,
  onExit,
}: {
  user: User;
  onExit: (message?: string) => void;
}) {
  const [ready, setReady] = useState(false),
    [controlled, setControlled] = useState(false),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0),
    [notice, setNotice] = useState("");
  const owned = useRef(false),
    version = useRef(0);
  const failed = useCallback(
    (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível conectar ao servidor. Tente novamente.";
      setNotice(message);
      owned.current = false;
      setControlled(false);
      if (error instanceof RequestError && error.status === 401)
        onExit(message);
    },
    [onExit],
  );
  const [controller] = useState(
    () =>
      new PlacementController(
        (value) => {
          version.current = value.revision;
          setRevision(value.revision);
          setReady(true);
        },
        failed,
        setBusy,
      ),
  );
  const claim = useCallback(
    async (takeover = false) => {
      try {
        const value = await api("/match/control", {
          tabId: controller.tabId,
          takeover,
        });
        controller.update(value);
        owned.current = true;
        setControlled(true);
        setNotice("");
      } catch (error) {
        failed(error);
        try {
          controller.update(await api("/match"));
        } catch (e) {
          failed(e);
        }
      }
    },
    [controller, failed],
  );
  useEffect(() => {
    void claim();
    let stopped = false,
      running = false;
    const heartbeat = async () => {
      if (running || stopped) return;
      running = true;
      try {
        const value = owned.current
          ? await api("/match/heartbeat", {
              tabId: controller.tabId,
              controlVersion: controller.controlVersion,
            })
          : await api("/match");
        if (!stopped && value.revision !== version.current)
          controller.update(value);
      } catch (error) {
        if (!stopped) failed(error);
      } finally {
        running = false;
      }
    };
    const timer = setInterval(() => void heartbeat(), 15000);
    let lastActivity = Date.now();
    const activity = () => {
      if (Date.now() - lastActivity < 15 * 60000) return;
      lastActivity = Date.now();
      void api("/session/activity", {}).catch(failed);
    };
    document.addEventListener("pointerdown", activity);
    document.addEventListener("keydown", activity);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("pointerdown", activity);
      document.removeEventListener("keydown", activity);
    };
  }, [claim, controller, failed]);
  return (
    <>
      <nav className="account-bar" aria-label="Conta">
        <span>{user.email}</span>
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await api("/session", undefined, "DELETE");
              owned.current = false;
              onExit();
            } catch (error) {
              failed(error);
            } finally {
              setBusy(false);
            }
          }}
        >
          Sair
        </button>
      </nav>
      {ready && !controlled && (
        <section className="control-notice">
          <h2>Esta partida está aberta em outra aba</h2>
          <p>
            Você pode visualizar a mesa. Ao continuar aqui, a outra aba perde o
            controle.
          </p>
          <button disabled={busy} onClick={() => void claim(true)}>
            Continuar nesta aba
          </button>
        </section>
      )}
      <p role="alert" className="auth-notice">
        {notice}
      </p>
      {ready ? (
        <Suspense fallback={<main>Preparando a mesa…</main>}>
          <Game
            remote={controller}
            enabled={controlled && !busy}
            revision={revision}
          />
        </Suspense>
      ) : (
        <main>
          <p role="status">Carregando sua partida…</p>
          {notice && (
            <button onClick={() => void claim()}>Tentar novamente</button>
          )}
        </main>
      )}
    </>
  );
}
function App() {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const exit = useCallback((message = "") => {
    setUser(null);
    setNotice(message);
  }, []);
  useEffect(() => {
    let alive = true;
    api("/session")
      .then((data) => {
        if (alive) setUser(data.user);
      })
      .catch((error) => {
        if (alive && !(error instanceof RequestError && error.status === 401))
          setNotice("Não foi possível conectar à API. Confira npm run dev.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const data = await api("/session", {
        email: form.get("email"),
        password: form.get("password"),
      });
      setUser(data.user);
      setNotice("");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Não foi possível entrar.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <main>
        <p role="status">Conectando ao observatório…</p>
      </main>
    );
  if (user) return <SessionView key={user.id} user={user} onExit={exit} />;
  return (
    <main className="login">
      <p className="subtitle">O observatório temporal</p>
      <h1>Paradox Cards</h1>
      <h2>Entre para continuar sua partida</h2>
      <form onSubmit={signIn}>
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
        />
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
        />
        <button disabled={busy} aria-busy={busy}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p role="alert">{notice}</p>
      <p className="notice">
        Acesso por conta criada localmente. Sua partida fica salva para você
        retomar.
      </p>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
