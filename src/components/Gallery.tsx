"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";

type Item = { src: string; caption: string };

const TILE = [
  "col-span-2 row-span-2 aspect-[4/3] lg:aspect-auto",
  "aspect-[4/3]",
  "aspect-[4/3]",
  "col-span-2 aspect-[16/9] lg:aspect-auto",
];

/** Photo grid with a keyboard-accessible lightbox (native <dialog>: Esc closes, arrows navigate). */
export default function Gallery({ items, closeLabel, prevLabel, nextLabel }: { items: Item[]; closeLabel: string; prevLabel: string; nextLabel: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const go = (delta: number) => setIndex((i) => (i + delta + items.length) % items.length);

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  };
  const current = items[index];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-2">
        {items.map((item, i) => (
          <button
            key={item.src}
            type="button"
            onClick={() => open(i)}
            aria-label={item.caption}
            className={`group relative overflow-hidden rounded-2xl bg-soft text-left ${TILE[i] ?? "aspect-[4/3]"}`}
          >
            <Image
              src={item.src}
              alt={item.caption}
              fill
              sizes="(min-width: 1024px) 40vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out-soft group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-forest/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="absolute inset-x-0 bottom-0 translate-y-2 p-4 text-sm font-semibold text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              {item.caption}
            </span>
          </button>
        ))}
      </div>

      <dialog
        ref={dialog}
        onKeyDown={onKey}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-auto w-[min(1100px,94vw)] rounded-2xl bg-forest p-0 text-white backdrop:bg-forest/85 backdrop:backdrop-blur-sm"
      >
        <div className="relative">
          <div className="relative aspect-[4/3] max-h-[78vh] w-full bg-black sm:aspect-[16/10]">
            <Image src={current.src} alt={current.caption} fill sizes="94vw" className="object-contain" />
          </div>
          <button type="button" onClick={() => dialog.current?.close()} aria-label={closeLabel} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl backdrop-blur transition hover:bg-white/30">
            ×
          </button>
          <button type="button" onClick={() => go(-1)} aria-label={prevLabel} className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-xl backdrop-blur transition hover:bg-white/30">
            ‹
          </button>
          <button type="button" onClick={() => go(1)} aria-label={nextLabel} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-xl backdrop-blur transition hover:bg-white/30">
            ›
          </button>
        </div>
        <p className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
          <span className="font-semibold">{current.caption}</span>
          <span className="tabular text-white/60">{index + 1} / {items.length}</span>
        </p>
      </dialog>
    </>
  );
}
