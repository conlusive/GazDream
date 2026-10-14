"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Props = {
  src: string;
  poster?: string;
  className?: string;
  soundLabel?: string;
  /** Load right after the page is ready (hero). Otherwise the file is only requested near the viewport. */
  eager?: boolean;
};

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const reducedNow = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Silent looping video that starts by itself.
 * - The file is not requested until it is about to be seen (or right after load for `eager`), so
 *   it never competes with the images that are needed first.
 * - It fades in over whatever is behind it (poster/photo) once it is really playing.
 * - It pauses while off-screen. With reduced motion or Data Saver it stays on the poster with controls.
 */
export default function AutoVideo({ src, poster, className = "", soundLabel, eager = false }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [playing, setPlaying] = useState(false);
  const reduced = useSyncExternalStore(subscribe, reducedNow, () => false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (reduced || conn?.saveData) {
      video.controls = true;
      video.preload = "none";
      video.src = src;
      return;
    }

    const onPlaying = () => setPlaying(true);
    video.addEventListener("playing", onPlaying);

    let loaded = false;
    const load = () => {
      if (loaded) return;
      loaded = true;
      video.src = src;
      video.load();
    };

    let idle = 0;
    if (eager) {
      const start = () => {
        idle = window.setTimeout(load, 150);
      };
      if (document.readyState === "complete") start();
      else window.addEventListener("load", start, { once: true });
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          load();
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: "300px 0px", threshold: 0.01 },
    );
    observer.observe(video);

    return () => {
      observer.disconnect();
      video.removeEventListener("play", onPlaying);
      video.removeEventListener("playing", onPlaying);
      window.clearTimeout(idle);
    };
  }, [src, eager, reduced]);

  const toggleSound = () => {
    const video = ref.current;
    if (!video) return;
    video.muted = soundOn;
    setSoundOn(!soundOn);
  };

  return (
    <div className="relative h-full w-full">
      <video
        ref={ref}
        className={`${className} transition-opacity duration-700 ${playing || reduced ? "opacity-100" : "opacity-0"}`}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        disablePictureInPicture
      />
      {soundLabel && !reduced && (
        <button
          type="button"
          onClick={toggleSound}
          aria-label={soundLabel}
          aria-pressed={soundOn}
          className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-forest/70 text-white backdrop-blur transition hover:bg-forest"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9H4z" />
            {soundOn ? <path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" /> : <path d="M17 9l5 6M22 9l-5 6" />}
          </svg>
        </button>
      )}
    </div>
  );
}
