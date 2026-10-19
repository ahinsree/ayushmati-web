"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

// Full-screen hero films driven by the YouTube IFrame Player API, played in sequence and looped.
//
// Seamless sequence: two players are stacked. While one plays, the other preloads the next film
// and waits on its first frame; just before the end, it starts and cross-fades in, so there is no
// loading pause between films.
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
// YouTube draws its title bar (top) and logo strip (bottom) at a fixed pixel height, so small
// players need at least this much cropped from each edge to hide them, whatever the size.
const CHROME_PX = 44;

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
  loadVideoById(options: { videoId: string; startSeconds?: number; endSeconds?: number }): void;
  getCurrentTime(): number;
  getDuration?(): number;
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

/**
 * Size and offset of a 16:9 box covering width x height, positioned by a horizontal focal point.
 * It's enlarged by OVERSCAN, or more on small frames so at least CHROME_PX is hidden top and bottom.
 */
export function coverBox(width: number, height: number, focusX = 0.5) {
  let w = width;
  let h = width / RATIO;
  if (h < height) {
    h = height;
    w = height * RATIO;
  }
  const scale = Math.max(OVERSCAN, (h + 2 * CHROME_PX) / h);
  w *= scale;
  h *= scale;
  return { width: w, height: h, left: (width - w) * focusX, top: (height - h) / 2 };
}

export type HeroFilm = {
  id: string;
  label: string;
  /** Seconds to start from (default 0). */
  start?: number;
  /** Seconds to stop at and move on to the next film, e.g. to leave out closing credits. */
  end?: number;
};

/** Cross-fade between the two players, and how early (seconds before the end) to start it. */
const CROSSFADE_MS = 500;
const HANDOVER_LEAD_S = 0.4;

type Slot = { player: YTPlayer | null; filmIndex: number; priming: boolean; primed: boolean };
const emptySlot = (): Slot => ({ player: null, filmIndex: -1, priming: false, primed: false });

/** loadVideoById options for a film, honouring its start and end times. */
function filmOptions(film: HeroFilm) {
  return { videoId: film.id, startSeconds: film.start ?? 0, ...(film.end ? { endSeconds: film.end } : {}) };
}

export function HeroVideo({
  films,
  title,
  focusX = 0.5,
  children,
}: {
  /** YouTube films, played one after another and then looped; each also gets a button to jump to it. */
  films: readonly HeroFilm[];
  title: string;
  /** Horizontal focal point of the film, 0 = left edge, 1 = right edge. */
  focusX?: number;
  children: React.ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const mountA = useRef<HTMLDivElement>(null);
  const mountB = useRef<HTMLDivElement>(null);
  const ytRef = useRef<YTNamespace | null>(null);
  // Two stacked players: the active one is on screen, the other preloads the next film.
  const slotsRef = useRef<[Slot, Slot]>([emptySlot(), emptySlot()]);
  const activeRef = useRef<0 | 1>(0);
  const switchingRef = useRef(false); // true during a hand-over between players
  const userMutedRef = useRef(false);
  const userPausedRef = useRef(false);
  const autoPausedRef = useRef(false); // paused by us: scrolled away or tab hidden
  const inViewRef = useRef(true);
  const mutedRef = useRef(true);
  const indexRef = useRef(0); // which film in `films` is playing (or should start)
  // Stable copy of `films`, so a new array with the same contents doesn't recreate the players.
  const filmsKey = JSON.stringify(films);
  const playlist = useMemo(() => JSON.parse(filmsKey) as HeroFilm[], [filmsKey]);

  const [enabled, setEnabled] = useState(false); // false until we know motion is OK, or the visitor presses play
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [box, setBox] = useState<ReturnType<typeof coverBox>>();
  const [current, setCurrent] = useState(0);
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const firstId = playlist[0]?.id;
  const [poster, setPoster] = useState(`https://i.ytimg.com/vi/${firstId}/maxresdefault.jpg`);

  const activePlayer = () => slotsRef.current[activeRef.current].player;

  const unmute = useCallback(() => {
    const player = slotsRef.current[activeRef.current].player;
    if (!player) return;
    player.unMute();
    player.setVolume(100);
    mutedRef.current = false;
    setMuted(false);
  }, []);

  const mute = useCallback(() => {
    slotsRef.current[activeRef.current].player?.mute();
    mutedRef.current = true;
    setMuted(true);
  }, []);

  /** Loads a film into a background slot, muted, and parks it on its first frame (see onStateChange). */
  const prime = useCallback(
    (slot: Slot, filmIndex: number) => {
      slot.filmIndex = filmIndex;
      slot.primed = false;
      slot.priming = true;
      slot.player?.mute();
      slot.player?.loadVideoById(filmOptions(playlist[filmIndex]));
    },
    [playlist],
  );

  /**
   * Hands over to the next film. The background player already has it buffered on its first
   * frame, so it starts at once and cross-fades in, with no gap or loading pause.
   */
  const switchToNext = useCallback(() => {
    if (switchingRef.current) return;
    const len = playlist.length;
    const from = activeRef.current;
    const fromSlot = slotsRef.current[from];
    const nextIndex = (indexRef.current + 1) % len;

    if (len === 1) {
      fromSlot.player?.seekTo(playlist[0].start ?? 0, true);
      fromSlot.player?.playVideo();
      return;
    }

    const to = (1 - from) as 0 | 1;
    const toSlot = slotsRef.current[to];
    if (!toSlot.player || toSlot.filmIndex !== nextIndex) {
      // The background player isn't ready (slow network): fall back to loading in place.
      indexRef.current = nextIndex;
      setCurrent(nextIndex);
      fromSlot.player?.loadVideoById(filmOptions(playlist[nextIndex]));
      return;
    }

    switchingRef.current = true;
    toSlot.priming = false;
    if (!mutedRef.current) {
      toSlot.player.unMute();
      toSlot.player.setVolume(100);
    }
    toSlot.player.playVideo();
    fromSlot.player?.mute();
    activeRef.current = to;
    setActiveSlot(to);
    indexRef.current = nextIndex;
    setCurrent(nextIndex);

    // After the cross-fade, the old player pauses and preloads the film after this one.
    window.setTimeout(() => {
      fromSlot.player?.pauseVideo();
      prime(fromSlot, (nextIndex + 1) % len);
      switchingRef.current = false;
    }, CROSSFADE_MS + 100);
  }, [playlist, prime]);

  // Autoplay unless motion or data use is unwelcome (see prefersStillImage).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(!prefersStillImage());
  }, []);

  // Keep the players covering the film frame at any size. In landscape the frame is the whole
  // hero; in portrait it's a full-width 16:9 band, so the film shows uncropped (no zoom).
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => setBox(coverBox(el.clientWidth, el.clientHeight, focusX));
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [focusX]);

  // Create the players: the first plays straight away; the second is created once the first is
  // playing (so it doesn't compete for bandwidth at start-up) and preloads the next film.
  useEffect(() => {
    if (!enabled || !mountA.current || !mountB.current) return;
    let cancelled = false;
    const hosts = [mountA.current, mountB.current];
    const slots = slotsRef.current;

    const create = (YT: YTNamespace, slotIndex: 0 | 1, filmIndex: number, background: boolean) => {
      const slot = slots[slotIndex];
      const mountEl = document.createElement("div");
      hosts[slotIndex].appendChild(mountEl);
      const film = playlist[filmIndex];
      slot.filmIndex = filmIndex;
      slot.priming = background;
      slot.player = new YT.Player(mountEl, {
        host: "https://www.youtube-nocookie.com",
        videoId: film.id,
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
          start: film.start ?? 0,
          ...(film.end ? { end: film.end } : {}),
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
            // Sound straight away if the browser will allow it (on-screen player only).
            if (!background && navigator.userActivation?.hasBeenActive && !userMutedRef.current) unmute();
          },
          onStateChange: ({ target, data }) => {
            const isActive = slotIndex === activeRef.current;

            if (data === YT.PlayerState.PLAYING) {
              hideCaptions(target);
              if (!isActive && slot.priming) {
                // Preload done: park the background player on the film's first frame.
                target.pauseVideo();
                target.seekTo(playlist[slot.filmIndex].start ?? 0, true);
                slot.priming = false;
                slot.primed = true;
                return;
              }
              if (isActive) {
                setPlaying(true);
                if (!slots[1 - slotIndex].player && playlist.length > 1) {
                  create(YT, (1 - slotIndex) as 0 | 1, (indexRef.current + 1) % playlist.length, true);
                }
              }
            }
            if (!isActive) return;

            // Reaching a film's end (or its `end` time) hands over to the next film.
            if (data === YT.PlayerState.ENDED) switchToNext();
            if (data === YT.PlayerState.PAUSED && !switchingRef.current) {
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
    };

    const cancelIdle = whenIdle(() => {
      loadYouTubeApi()
        .then((YT) => {
          if (cancelled) return;
          ytRef.current = YT;
          create(YT, activeRef.current, indexRef.current, false);
        })
        .catch(() => {
          // Keep the poster image if YouTube can't load.
        });
    });

    return () => {
      cancelled = true;
      cancelIdle();
      for (const slot of slots) {
        slot.player?.destroy();
        Object.assign(slot, emptySlot());
      }
      hosts.forEach((h) => h.replaceChildren());
    };
  }, [enabled, playlist, title, unmute, switchToNext]);

  // Start the hand-over just before the on-screen film reaches its end (or its `end` time), so
  // the next film is already moving when this one stops.
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const player = activePlayer();
      if (!player || switchingRef.current) return;
      const film = playlist[indexRef.current];
      const end = film?.end ?? player.getDuration?.();
      if (end && player.getCurrentTime() >= end - HANDOVER_LEAD_S) switchToNext();
    }, 200);
    return () => window.clearInterval(timer);
  }, [playing, playlist, switchToNext]);

  // Turn sound on with the visitor's first interaction anywhere on the page.
  useEffect(() => {
    if (!enabled || !muted) return;
    const onInteract = (e: Event) => {
      if ((e.target as Element | null)?.closest?.("[data-hero-controls]")) return;
      if (userMutedRef.current || !slotsRef.current[activeRef.current].player) return;
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
      const player = slotsRef.current[activeRef.current].player;
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
    if (!enabled) {
      setEnabled(true);
      return;
    }
    activePlayer()?.loadVideoById(filmOptions(playlist[index]));
    // Re-aim the background player at the film after the chosen one.
    const background = slotsRef.current[1 - activeRef.current];
    if (background.player && playlist.length > 1) prime(background, (index + 1) % playlist.length);
  }

  function togglePlay() {
    if (!enabled) {
      setEnabled(true);
      return;
    }
    const player = activePlayer();
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
      className="relative isolate flex flex-col overflow-hidden bg-forest-950 text-white landscape:h-svh landscape:min-h-[32rem] landscape:justify-end landscape:max-lg:min-h-[24rem]"
    >
      {/* Film frame. Landscape: full-bleed behind the copy. Portrait (phones, upright tablets): a
          16:9 band under the header with the copy below, so the film isn't zoomed in to fill a
          tall screen. */}
      <div
        ref={frameRef}
        className="overflow-hidden landscape:absolute landscape:inset-0 portrait:relative portrait:mt-16 portrait:aspect-video portrait:w-full portrait:sm:mt-20"
        aria-hidden
      >
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
            {/* Two stacked players; the active one is shown. No React children inside: YouTube
                swaps the element it gets for its iframe. */}
            <div
              ref={mountA}
              data-testid="hero-player-0"
              className={`absolute inset-0 transition-opacity ease-in-out ${activeSlot === 0 ? "opacity-100" : "opacity-0"}`}
              style={{ transitionDuration: `${CROSSFADE_MS}ms` }}
            />
            <div
              ref={mountB}
              data-testid="hero-player-1"
              className={`absolute inset-0 transition-opacity ease-in-out ${activeSlot === 1 ? "opacity-100" : "opacity-0"}`}
              style={{ transitionDuration: `${CROSSFADE_MS}ms` }}
            />
          </div>
        )}
        {/* Portrait: soften the film's lower edge into the green below. */}
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-forest-950/80 to-transparent landscape:hidden" />
      </div>

      {/* Landscape scrims: top for the header, bottom-left for the copy. The centre of the film stays clear. */}
      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/55 to-transparent portrait:hidden" aria-hidden />
      <div
        className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_0%_100%,rgb(20_38_12/0.85)_0%,rgb(20_38_12/0.45)_35%,transparent_65%)] landscape:block"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-[max(2rem,env(safe-area-inset-bottom))] portrait:pt-6 sm:pb-16">
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
