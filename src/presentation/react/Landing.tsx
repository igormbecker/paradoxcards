import { useEffect, useState, type FormEvent } from "react";
import { CampfireControls } from "./Campfire";
import "./Landing.css";

export function Landing({
  busy,
  notice,
  onSignIn,
}: {
  busy: boolean;
  notice: string;
  onSignIn: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [moving, setMoving] = useState(
    () => !matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setMoving(!preference.matches);
    preference.addEventListener("change", change);
    return () => preference.removeEventListener("change", change);
  }, []);
  return (
    <main className="landing">
      <div className="landing-backdrop" aria-hidden="true">
        <img
          className="forest-scene"
          data-testid="forest-scene"
          data-animated={moving}
          src={`/assets/backgrounds/forest-clearing${moving ? "" : "-still"}.svg`}
          alt=""
        />
      </div>
      <header className="landing-header">
        <a className="landing-home" href="/" aria-label="Paradox, início">
          <span aria-hidden="true">⌛</span> Entre eras
        </a>
        <span className="access-badge">
          <i aria-hidden="true" /> Acesso antecipado
        </span>
      </header>
      <div className="landing-content">
        <section className="landing-story" aria-labelledby="game-title">
          <h1 id="game-title" aria-label="Paradox: The Card Game">
            Paradox<span>The Card Game</span>
          </h1>
          <div className="story-caption">
            <span className="temporal-rule" aria-hidden="true">
              ✧
            </span>
            <h2>O tempo está em suas mãos.</h2>
            <p>
              Entre eras, cada carta abre um caminho.
              <br />
              Cada escolha muda o que vem depois.
            </p>
          </div>
        </section>
        <section className="entry-panel" aria-labelledby="login-title">
          <div className="panel-emblem" aria-hidden="true">
            ⌛
          </div>
          <h2 id="login-title">
            O próximo movimento
            <br />é seu.
          </h2>
          <p className="entry-description">
            Sua próxima jornada começa com uma carta.
          </p>
          <form onSubmit={onSignIn}>
            <div className="entry-field">
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
            <div className="entry-field">
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
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
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
            <button className="entry-submit" disabled={busy} aria-busy={busy}>
              {busy ? "Entrando…" : "Entrar"}
              <span aria-hidden="true">✧</span>
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
      <CampfireControls />
      <footer className="landing-footer">
        <span>Paradox: The Card Game</span>
        <span className="developer-credit">
          Desenvolvido por &gt;.Bectec Tecnologia e Desenvolvimento de Softwares
        </span>
        <span className="landing-footer-links">
          <a href="/status">Status do sistema</a>
          <span>
            {__BUILD_VERSION__
              ? `Em desenvolvimento: ${__BUILD_VERSION__}`
              : "Em desenvolvimento"}
          </span>
        </span>
      </footer>
    </main>
  );
}
