import Image from "next/image";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { INSTALLATION } from "@/lib/content";

type Props = { dict: Dictionary["installation"]; headingLevel?: "h1" | "h2" };

/** Real photos and videos of a completed installation, each with a factual caption. */
export default function Installation({ dict }: Props) {
  return (
    <div>
      <div className="max-w-2xl">
        <p className="eyebrow mb-3">{dict.eyebrow}</p>
        <h2 className="display text-3xl sm:text-4xl">{dict.title}</h2>
        <p className="lead mt-4">{dict.lead}</p>
      </div>

      <div className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2">
        {INSTALLATION.photos.map((src, i) => (
          <figure key={src}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-soft">
              <Image src={src} alt={dict.captions[i]} fill sizes="(min-width: 1024px) 560px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
            </div>
            <figcaption className="mt-2 text-sm text-muted">{dict.captions[i]}</figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <h3 className="text-lg font-semibold">{dict.elementsTitle}</h3>
          <ul className="mt-4 space-y-3 border-t border-line pt-4 text-muted">
            {dict.elements.map((e) => (
              <li key={e} className="border-b border-line pb-3">{e}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold">{dict.videoTitle}</h3>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {INSTALLATION.videos.map((v, i) => (
              <figure key={v.src}>
                <video controls preload="metadata" playsInline poster={v.poster} className="aspect-video w-full rounded-lg bg-ink object-cover">
                  <source src={v.src} type="video/mp4" />
                </video>
                <figcaption className="mt-2 text-sm text-muted">{dict.videos[i]}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
