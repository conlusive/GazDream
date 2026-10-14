import type { Dictionary } from "@/app/[lang]/dictionaries";
import { INSTALLATION } from "@/lib/content";
import { rich } from "@/lib/rich";
import AutoVideo from "./AutoVideo";
import Gallery from "./Gallery";

type Labels = { close: string; prev: string; next: string };

/** Real photos and videos of a completed installation, each with a factual caption. */
export default function Installation({ dict, labels }: { dict: Dictionary["installation"]; labels: Labels }) {
  return (
    <div>
      <div className="max-w-2xl">
        <p className="eyebrow mb-3">{dict.eyebrow}</p>
        <h2 className="display text-3xl sm:text-5xl">{rich(dict.title)}</h2>
        <p className="lead mt-4">{dict.lead}</p>
      </div>

      <div className="mt-10">
        <Gallery
          items={INSTALLATION.photos.map((src, i) => ({ src, caption: dict.captions[i] }))}
          closeLabel={labels.close}
          prevLabel={labels.prev}
          nextLabel={labels.next}
        />
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.7fr]">
        <div>
          <h3 className="text-lg font-bold">{dict.elementsTitle}</h3>
          <ul className="mt-4 space-y-3">
            {dict.elements.map((e, i) => (
              <li key={e} className="flex gap-3 text-muted">
                <span className="tabular mt-0.5 text-sm font-bold text-brand-orange">{String(i + 1).padStart(2, "0")}</span>
                {e}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold">{dict.videoTitle}</h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {INSTALLATION.videos.map((v, i) => (
              <figure key={v.src}>
                <div className="aspect-video overflow-hidden rounded-2xl bg-forest">
                  <AutoVideo src={v.src} poster={v.poster} className="h-full w-full object-cover" soundLabel={dict.sound} />
                </div>
                <figcaption className="mt-2 text-sm text-muted">{dict.videos[i]}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
