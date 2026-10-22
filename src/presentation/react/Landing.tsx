import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import forestScene from "./forest-scene.svg?raw";
import { CampfireControls } from "./Campfire";
import "./Landing.css";

const sceneMarkup = forestScene.replace(/<style>[\s\S]*?<\/style>/, "");

export function Landing({
  busy,
  notice,
  onSignIn,
}: {
  busy: boolean;
  notice: string;
  onSignIn: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const [portrait, setPortrait] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [moving, setMoving] = useState(
    () => !matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const markup = useMemo(
    () =>
      sceneMarkup.replace(
        /viewBox="[^"]*"/,
        `viewBox="${portrait ? "230 0 660 900" : "0 0 1600 900"}"`,
      ),
    [portrait],
  );
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const fit = () =>
      setPortrait(
        element.clientWidth / Math.max(element.clientHeight, 1) < 1.15,
      );
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setMoving(!preference.matches);
    preference.addEventListener("change", change);
    return () => preference.removeEventListener("change", change);
  }, []);
  return (
    <main className="landing">
      <div className="stage" ref={stage}>
        <div
          className="scene-mount"
          data-testid="forest-scene"
          data-animated={moving}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: markup }}
        />
        <div className="content">
          <header className="title">
            <p className="eyebrow">Entre eras</p>
            <h1 id="game-title" aria-label="Paradox: The Card Game">
              <span className="t1">Paradox</span>
              <span className="t2">The Card Game</span>
            </h1>
          </header>
          <section className="blurb" aria-label="Sobre o jogo">
            <div className="rule" />
            <h2>O tempo está em suas mãos.</h2>
            <p>
              Entre eras, cada carta abre um caminho.
              <br />
              Cada escolha muda o que vem depois.
            </p>
          </section>
          <section className="login" aria-labelledby="login-title">
            <h2 id="login-title">O próximo movimento é seu.</h2>
            <p className="sub">Sua próxima jornada começa com uma carta.</p>
            <form onSubmit={onSignIn}>
              <div className="field">
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="Seu e-mail"
                  required
                  maxLength={254}
                />
              </div>
              <div className="field">
                <label htmlFor="password">Senha</label>
                <div className="password-field">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Sua senha"
                    required
                    maxLength={128}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                    aria-pressed={showPassword}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                      {showPassword && <path d="m3 3 18 18" />}
                    </svg>
                  </button>
                </div>
              </div>
              <button className="btn" disabled={busy} aria-busy={busy}>
                {busy ? "Entrando…" : "Entrar"}
              </button>
              {notice && (
                <p className="entry-error" role="alert">
                  {notice}
                </p>
              )}
            </form>
            <div className="access-notice">
              <h3>Uma nova era está começando</h3>
              <p>
                Para jogar, é necessário solicitar acesso à equipe do Paradox.
              </p>
              <p className="access-detail">
                Já recebeu seu acesso? Entre com as credenciais da sua conta.
              </p>
            </div>
          </section>
        </div>
      </div>
      <footer className="landing-footer">
        <CampfireControls />
        <div className="footer-details">
          <span>Paradox: The Card Game</span>
          <span className="developer-credit">
            Desenvolvido por &gt;.Bectec Tecnologia e Desenvolvimento de
            Softwares
          </span>
          <span className="landing-footer-links">
            <a href="/status">Status do sistema</a>
            <span>
              {__BUILD_VERSION__
                ? `Em desenvolvimento: ${__BUILD_VERSION__}`
                : "Em desenvolvimento"}
            </span>
          </span>
        </div>
      </footer>
    </main>
  );
}
