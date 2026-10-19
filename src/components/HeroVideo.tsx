"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

// Full-screen hero films driven by the YouTube IFrame Player API, played in sequence and looped.
//
// Sound: browsers only allow audible autoplay after the visitor has interacted with the page.
// The film starts muted (always allowed), switches sound on at once when the visitor already
// interacted (e.g. arrived from another page of the site), and otherwise on their first tap,
// click or key press anywhere on the page. A visible toggle always controls it directly.
//
// Clarity: the player is sized like `object-fit: cover`, so YouTube picks an HD stream for the
// full-screen size and never letterboxes. A small overscan crops YouTube's title bar and
// watermark at the edges, and a horizontal focal point keeps the people in frame on narrow
// screens.

const OVERSCAN = 1.12;
const RATIO = 16 / 9;

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

/**
 * Show the still image instead of autoplaying when motion is unwelcome or data is precious:
 * reduced-motion preference, Data Saver, or a 2G/3G connection. Visitors can still press play.
 */
export function prefersStillImage(): boolean {
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  const constrained = !!connection?.saveData || /2g|3g/.test(connection?.effectiveType ?? "");
  return reduceMotion || constrained;
}

/** Runs `cb` once the browser is idle, so the poster and page paint before YouTube's ~1 MB player loads. */
function whenIdle(cb: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(cb, { timeout: 2000 });
    return () => window.cancelIdleCallback?.(handle);
  }
  const handle = window.setTimeout(cb, 600);
  return () => window.clearTimeout(handle);
}

type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  mute(): void;
  unMute(): void;
  setVolume(volume: number): void;
  loadVideoById(options: { videoId: string; startSeconds?: number }): void;
  getIframe?(): HTMLIFrameElement;
  // Undocumented but long-standing player methods, used here only to switch captions off.
  unloadModule?(module: string): void;
  setOption?(module: string, option: string, value: unknown): void;
  destroy(): void;
};

type YTEvent = { target: YTPlayer; data?: number };

type YTNamespace = {
  Player: new (
    el: HTMLElement,
    options: {
      host?: string;
      videoId: string;
      width?: string;
      height?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: YTEvent) => void;
        onStateChange?: (e: YTEvent) => void;
        onApiChange?: (e: YTEvent) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  apiPromise ??= new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("YouTube API failed to load"));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

/**
 * Keeps subtitles off. cc_load_policy=0 only asks YouTube not to show them, and viewers' own
 * caption preferences can still turn them on, so the captions module is also unloaded whenever
 * playback starts or YouTube (re)loads its modules. Visitors can't turn them back on because
 * YouTube's controls are hidden.
 */
function hideCaptions(player: YTPlayer) {
  try {
    player.unloadModule?.("captions");
    player.unloadModule?.("cc");
    player.setOption?.("captions", "track", {});
  } catch {
    // Not available on this player version; cc_load_policy still applies.
  }
}

/** Size and offset of a 16:9 box covering width x height, positioned by a horizontal focal point. */
export function coverBox(width: number, height: number, focusX = 0.5) {
  let w = width;
  let h = width / RATIO;
  if (h < height) {
    h = height;
    w = height * RATIO;
  }
  w *= OVERSCAN;
  h *= OVERSCAN;
  return { width: w, height: h, left: (width - w) * focusX, top: (height - h) / 2 };
}

export type HeroFilm = { id: string; label: string };

export function HeroVideo({
  films,
  title,
  start = 0,
  focusX = 0.5,
  children,
}: {
  /** YouTube films, played one after another and then looped; each also gets a button to jump to it. */
  films: readonly HeroFilm[];
  title: string;
  /** Where the first film starts, in seconds. */
  start?: number;
  /** Horizontal focal point of the film, 0 = left edge, 1 = right edge. */
  focusX?: number;
  children: React.ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const userMutedRef = useRef(false);
  const userPausedRef = useRef(false);
  const autoPausedRef = useRef(false); // paused by us: scrolled away or tab hidden
  const inViewRef = useRef(true);
  const mutedRef = useRef(true);
  const indexRef = useRef(0); // which film in `films` is playing (or should start)
  const idsKey = films.map((f) => f.id).join(",");

  const [enabled, setEnabled] = useState(false); // false until we know motion is OK, or the visitor presses play
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [box, setBox] = useState<ReturnType<typeof coverBox>>();
  const [current, setCurrent] = useState(0);
  const firstId = films[0]?.id;
  const [poster, setPoster] = useState(`https://i.ytimg.com/vi/${firstId}/maxresdefault.jpg`);

  const unmute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    player.unMute();
    player.setVolume(100);
    mutedRef.current = false;
    setMuted(false);
  }, []);

  const mute = useCallback(() => {
    playerRef.current?.mute();
    mutedRef.current = true;
    setMuted(true);
  }, []);

  // Autoplay unless motion or data use is unwelcome (see prefersStillImage).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(!prefersStillImage());
  }, []);

  // Keep the player covering the hero at any size.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const update = () => setBox(coverBox(el.clientWidth, el.clientHeight, focusX));
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [focusX]);

  // Create the player.
  useEffect(() => {
    if (!enabled || !mountRef.current) return;
    let cancelled = false;
    const host = mountRef.current;
    const mountEl = document.createElement("div");
    host.appendChild(mountEl);

    const cancelIdle = whenIdle(() => {
      loadYouTubeApi()
        .then((YT) => {
          if (cancelled) return;
          const playlist = idsKey.split(",");
          const first = indexRef.current;
          playerRef.current = new YT.Player(mountEl, {
            host: "https://www.youtube-nocookie.com",
            videoId: playlist[first],
            width: "100%",
            height: "100%",
            playerVars: {
              autoplay: 1,
              mute: 1,
              controls: 0,
              disablekb: 1,
              fs: 0,
              playsinline: 1,
              rel: 0,
              iv_load_policy: 3,
              cc_load_policy: 0,
              modestbranding: 1,
              start: first === 0 ? start : 0,
            },
            events: {
              onApiChange: ({ target }) => hideCaptions(target),
              onReady: ({ target }) => {
                const iframe = target.getIframe?.();
                if (iframe) {
                  iframe.title = title;
                  iframe.tabIndex = -1;
                }
                hideCaptions(target);
                target.mute();
                target.playVideo();
                // Sound straight away if the browser will allow it.
                if (navigator.userActivation?.hasBeenActive && !userMutedRef.current) unmute();
              },
              onStateChange: ({ target, data }) => {
                if (data === YT.PlayerState.PLAYING) {
                  setPlaying(true);
                  hideCaptions(target);
                }
                if (data === YT.PlayerState.ENDED) {
                  // Next film; after the last one, back to the first (from `start`).
                  const next = (indexRef.current + 1) % playlist.length;
                  indexRef.current = next;
                  setCurrent(next);
                  if (playlist.length === 1) {
                    target.seekTo(start, true);
                    target.playVideo();
                  } else {
                    target.loadVideoById({ videoId: playlist[next], startSeconds: next === 0 ? start : 0 });
                  }
                }
                if (data === YT.PlayerState.PAUSED) {
                  setPlaying(false);
                  // A pause we didn't ask for while unmuted means the browser blocked sound:
                  // fall back to muted playback until the visitor interacts.
                  if (!userPausedRef.current && !autoPausedRef.current && !mutedRef.current) {
                    target.mute();
                    mutedRef.current = true;
                    setMuted(true);
                    target.playVideo();
                  }
                }
              },
            },
          });
        })
        .catch(() => {
          // Keep the poster image if YouTube can't load.
        });
    });

    return () => {
      cancelled = true;
      cancelIdle();
      playerRef.current?.destroy();
      playerRef.current = null;
      host.replaceChildren();
    };
  }, [enabled, idsKey, start, title, unmute]);

  // Turn sound on with the visitor's first interaction anywhere on the page.
  useEffect(() => {
    if (!enabled || !muted) return;
    const onInteract = (e: Event) => {
      if ((e.target as Element | null)?.closest?.("[data-hero-controls]")) return;
      if (userMutedRef.current || !playerRef.current) return;
      unmute();
    };
    // Phones grant media permission on a completed tap (touchend/click), not on touch start.
    const events = ["pointerdown", "keydown", "click", "touchend"] as const;
    const opts = { capture: true } as const;
    events.forEach((ev) => window.addEventListener(ev, onInteract, opts));
    return () => events.forEach((ev) => window.removeEventListener(ev, onInteract, opts));
  }, [enabled, muted, unmute]);

  // Pause while the hero is scrolled out of view or the tab is hidden: the soundtrack doesn't
  // follow the visitor, and phones save data and battery. Resumes when it's visible again.
  useEffect(() => {
    const sync = () => {
      const player = playerRef.current;
      if (!player || userPausedRef.current) return;
      const visible = inViewRef.current && document.visibilityState !== "hidden";
      if (visible && autoPausedRef.current) {
        autoPausedRef.current = false;
        player.playVideo();
      } else if (!visible && !autoPausedRef.current) {
        autoPausedRef.current = true;
        player.pauseVideo();
      }
    };

    document.addEventListener("visibilitychange", sync);
    const el = sectionRef.current;
    let io: IntersectionObserver | undefined;
    if (el && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        ([entry]) => {
          inViewRef.current = entry.isIntersecting;
          sync();
        },
        { threshold: 0.25 },
      );
      io.observe(el);
    }
    return () => {
      document.removeEventListener("visibilitychange", sync);
      io?.disconnect();
    };
  }, []);

  function toggleSound() {
    if (!enabled) {
      userMutedRef.current = false;
      setEnabled(true);
      return;
    }
    if (muted) {
      userMutedRef.current = false;
      unmute();
    } else {
      userMutedRef.current = true;
      mute();
    }
  }

  /** Jumps to a film from its button; if the film isn't running yet (still image), starts it. */
  function selectFilm(index: number) {
    indexRef.current = index;
    setCurrent(index);
    userPausedRef.current = false;
    autoPausedRef.current = false;
    const player = playerRef.current;
    if (!enabled) {
      setEnabled(true);
      return;
    }
    player?.loadVideoById({ videoId: films[index].id, startSeconds: index === 0 ? start : 0 });
  }

  function togglePlay() {
    if (!enabled) {
      setEnabled(true);
      return;
    }
    const player = playerRef.current;
    if (!player) return;
    autoPausedRef.current = false;
    if (playing) {
      userPausedRef.current = true;
      player.pauseVideo();
    } else {
      userPausedRef.current = false;
      player.playVideo();
    }
  }

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex h-svh min-h-[32rem] items-end overflow-hidden bg-forest-950 text-white landscape:max-lg:min-h-[24rem]"
    >
      <div className="absolute inset-0" aria-hidden>
        <Image
          src={poster}
          alt=""
          fill
          priority
          sizes="100vw"
          onError={() => setPoster(`https://i.ytimg.com/vi/${firstId}/hqdefault.jpg`)}
          className="object-cover"
          style={{ objectPosition: `${focusX * 100}% 50%` }}
        />
        {enabled && (
          <div
            className={`absolute transition-opacity duration-1000 [&_iframe]:pointer-events-none ${playing ? "opacity-100" : "opacity-0"}`}
            style={box ? { width: box.width, height: box.height, left: box.left, top: box.top } : { inset: 0 }}
          >
            {/* No React children: YouTube swaps the element it gets for its iframe. */}
            <div ref={mountRef} data-testid="hero-player" className="h-full w-full" />
          </div>
        )}
      </div>

      {/* Light scrims: top for the header, bottom-left for the copy. The centre of the film stays clear. */}
      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/55 to-transparent" aria-hidden />
      <div
        className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-forest-950/90 via-forest-950/45 to-transparent sm:hidden"
        aria-hidden
      />
      <div
        className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_0%_100%,rgb(20_38_12/0.85)_0%,rgb(20_38_12/0.45)_35%,transparent_65%)] sm:block"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-16">
        {children}

        <div data-hero-controls className="mt-4 flex flex-wrap items-center gap-2 sm:mt-6">
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={!muted}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white/15 pl-3 pr-4 text-sm font-semibold ring-1 ring-white/40 backdrop-blur transition hover:bg-white/25"
          >
            {muted ? <VolumeX className="h-5 w-5" aria-hidden /> : <Volume2 className="h-5 w-5" aria-hidden />}
            {muted ? "Sound on" : "Sound off"}
            {muted && enabled && (
              <span className="relative ml-1 flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-leaf-300" />
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause film" : "Play film"}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/15 ring-1 ring-white/40 backdrop-blur transition hover:bg-white/25"
          >
            {playing ? <Pause className="h-4 w-4 fill-current" aria-hidden /> : <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden />}
          </button>

          {films.length > 1 && (
            <div role="group" aria-label="Choose a film" className="flex flex-wrap gap-2">
              {films.map((film, i) => (
                <button
                  key={film.id}
                  type="button"
                  onClick={() => selectFilm(i)}
                  aria-pressed={i === current}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-white/15 pl-1.5 pr-4 text-sm font-semibold ring-1 ring-white/40 backdrop-blur transition hover:bg-white/25 aria-pressed:bg-white aria-pressed:text-forest-900"
                >
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${
                      i === current ? "bg-forest-700 text-white" : "bg-white/20"
                    }`}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  {film.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
