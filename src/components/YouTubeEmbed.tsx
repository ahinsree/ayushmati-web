"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";

// Click-to-load facade: shows the thumbnail and only loads YouTube's player (about 1 MB of
// script) when the visitor presses play. Uses youtube-nocookie.com for privacy.
export function YouTubeEmbed({ id, title, start = 0 }: { id: string; title: string; start?: number }) {
  const [playing, setPlaying] = useState(false);
  const params = new URLSearchParams({ autoplay: "1", rel: "0", modestbranding: "1", start: String(start) });

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-forest-950 shadow-xl ring-1 ring-forest-900/10">
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?${params}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full"
          aria-label={`Play video: ${title}`}
        >
          <Image
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            fill
            sizes="(min-width: 1024px) 896px, 100vw"
            className="object-cover opacity-90 transition group-hover:opacity-100"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-forest-950/60 to-transparent" aria-hidden />
          <span className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow-lg transition group-hover:scale-105">
            <Play className="ml-1 h-8 w-8 fill-forest-700 text-forest-700" aria-hidden />
          </span>
        </button>
      )}
    </div>
  );
}
