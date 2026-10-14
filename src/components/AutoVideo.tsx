"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Props = { src: string; poster: string; className?: string; soundLabel?: string };

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const reducedNow = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Silent looping video that starts by itself and pauses while off-screen. With reduced motion it
 * shows the poster with native controls instead. Pass `soundLabel` to add a sound toggle.
 */
export default function AutoVideo({ src, poster, className = "", soundLabel }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  const reduced = useSyncExternalStore(subscribe, reducedNow, () => false);

  useEffect(() => {
    const video = ref.current;
    if (!video || reduced) return;
    // Data saver: do not stream video, keep the poster and show controls instead.
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) {
      video.pause();
      video.controls = true;
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.25 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduced]);

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
        className={className}
        poster={poster}
        autoPlay={!reduced}
        muted
        loop
        playsInline
        controls={reduced}
        disablePictureInPicture
        preload="auto"
      >
        <source src={src} type="video/mp4" />
      </video>
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
