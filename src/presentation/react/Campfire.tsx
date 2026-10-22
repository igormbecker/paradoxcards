import { useEffect, useRef, useState } from "react";
import { animateCampfire } from "./campfire-renderer";

export function CampfireScene({ moving }: { moving: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!moving || !canvas.current) return;
    return animateCampfire(canvas.current, () => setReady(true));
  }, [moving]);
  return (
    <canvas
      ref={canvas}
      className="campfire-canvas"
      data-testid="campfire-canvas"
      data-animated={moving && ready}
      aria-hidden="true"
    />
  );
}

export function CampfireControls({
  moving,
  onToggleMotion,
}: {
  moving: boolean;
  onToggleMotion: () => void;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const element = audio.current;
    function hide() {
      if (document.hidden) element?.pause();
    }
    document.addEventListener("visibilitychange", hide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      element?.pause();
    };
  }, []);
  async function toggleSound() {
    const element = audio.current;
    if (!element || pending) return;
    setError(false);
    if (!element.paused) {
      element.pause();
      return;
    }
    setPending(true);
    element.volume = 0.3;
    if (element.error) element.load();
    try {
      await element.play();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="campfire-controls">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- Ambient wood crackling only, no speech; the adjacent control names the sound. */}
      <audio
        ref={audio}
        src="/assets/audio/campfire.wav"
        loop
        preload="none"
        data-testid="campfire-audio"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => {
          setError(true);
          setPlaying(false);
        }}
      />
      <button
        type="button"
        onClick={() => void toggleSound()}
        disabled={pending}
        aria-pressed={playing}
        aria-label={
          playing ? "Desativar som da fogueira" : "Ativar som da fogueira"
        }
      >
        <span aria-hidden="true">{playing ? "♫" : "♪"}</span>{" "}
        {pending
          ? "Carregando som…"
          : playing
            ? "Som ligado"
            : "Som da fogueira"}
      </button>
      <button
        type="button"
        onClick={onToggleMotion}
        aria-pressed={moving}
        aria-label={
          moving ? "Pausar animação da fogueira" : "Ativar animação da fogueira"
        }
      >
        {moving ? "Pausar chamas" : "Animar chamas"}
      </button>
      {error && (
        <span className="campfire-error" role="status">
          Não foi possível reproduzir o som. Tente novamente.
        </span>
      )}
    </div>
  );
}
