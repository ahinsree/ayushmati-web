"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

// Full-screen hero film driven by the YouTube IFrame Player API.
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

type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  mute(): void;
  unMute(): void;
  setVolume(volume: number): void;
  getIframe?(): HTMLIFrameElement;
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
      events?: { onReady?: (e: YTEvent) => void; onStateChange?: (e: YTEvent) => void };
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

export function HeroVideo({
  id,
  title,
  start = 0,
  focusX = 0.5,
  children,
}: {
  id: string;
  title: string;
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
  const mutedRef = useRef(true);

  const [enabled, setEnabled] = useState(false); // false until we know motion is OK, or the visitor presses play
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [box, setBox] = useState<ReturnType<typeof coverBox>>();
  const [poster, setPoster] = useState(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`);

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

  // Autoplay unless the visitor prefers reduced motion.
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(!reduce);
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

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current = new YT.Player(mountEl, {
          host: "https://www.youtube-nocookie.com",
          videoId: id,
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
            modestbranding: 1,
            start,
          },
          events: {
            onReady: ({ target }) => {
              const iframe = target.getIframe?.();
              if (iframe) {
                iframe.title = title;
                iframe.tabIndex = -1;
              }
              target.mute();
              target.playVideo();
              // Sound straight away if the browser will allow it.
              if (navigator.userActivation?.hasBeenActive && !userMutedRef.current) unmute();
            },
            onStateChange: ({ target, data }) => {
              if (data === YT.PlayerState.PLAYING) setPlaying(true);
              if (data === YT.PlayerState.ENDED) {
                // Loop from the intro point rather than from 0:00.
                target.seekTo(start, true);
                target.playVideo();
              }
              if (data === YT.PlayerState.PAUSED) {
                setPlaying(false);
                // A pause we didn't ask for while unmuted means the browser blocked sound:
                // fall back to muted playback until the visitor interacts.
                if (!userPausedRef.current && !mutedRef.current) {
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

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      host.replaceChildren();
    };
  }, [enabled, id, start, title, unmute]);

  // Turn sound on with the visitor's first interaction anywhere on the page.
  useEffect(() => {
    if (!enabled || !muted) return;
    const onInteract = (e: Event) => {
      if ((e.target as Element | null)?.closest?.("[data-hero-controls]")) return;
      if (userMutedRef.current || !playerRef.current) return;
      unmute();
    };
    const opts = { capture: true } as const;
    window.addEventListener("pointerdown", onInteract, opts);
    window.addEventListener("keydown", onInteract, opts);
    return () => {
      window.removeEventListener("pointerdown", onInteract, opts);
      window.removeEventListener("keydown", onInteract, opts);
    };
  }, [enabled, muted, unmute]);

  // Pause while the hero is scrolled out of view, so the soundtrack doesn't follow the visitor.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const player = playerRef.current;
        if (!player || userPausedRef.current) return;
        if (entry.isIntersecting) player.playVideo();
        else player.pauseVideo();
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
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

  function togglePlay() {
    if (!enabled) {
      setEnabled(true);
      return;
    }
    const player = playerRef.current;
    if (!player) return;
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
      className="relative isolate flex h-svh min-h-[36rem] items-end overflow-hidden bg-forest-950 text-white"
    >
      <div className="absolute inset-0" aria-hidden>
        <Image
          src={poster}
          alt=""
          fill
          priority
          sizes="100vw"
          onError={() => setPoster(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`)}
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
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgb(20_38_12/0.85)_0%,rgb(20_38_12/0.45)_35%,transparent_65%)]"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-12 sm:pb-16">
        {children}

        <div data-hero-controls className="mt-6 flex items-center gap-2">
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
        </div>
      </div>
    </section>
  );
}
