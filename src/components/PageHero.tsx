import Image from "next/image";
import { rich } from "@/lib/rich";

type Props = { eyebrow?: string; title: string; lead?: string; image?: string };

/** Dark cinematic page header. Accent words are marked with *asterisks* in the title. */
export default function PageHero({ eyebrow, title, lead, image = "/photos/install-container.jpg" }: Props) {
  return (
    <header className="relative isolate overflow-hidden bg-forest text-white">
      <Image src={image} alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-60" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest via-forest/85 to-forest/40" />
      <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-forest/85 to-transparent" />
      <div className="container-x pb-16 pt-32 sm:pb-24 sm:pt-44">
        {eyebrow && <p className={`eyebrow rise mb-5 !text-leaf ${eyebrow.includes("ß") ? "normal-case tracking-wide" : ""}`}>{eyebrow}</p>}
        <h1 className="display rise max-w-4xl text-4xl sm:text-6xl" style={{ animationDelay: "60ms" }}>
          {rich(title)}
        </h1>
        {lead && (
          <p className="rise mt-6 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl" style={{ animationDelay: "140ms" }}>
            {lead}
          </p>
        )}
      </div>
    </header>
  );
}
