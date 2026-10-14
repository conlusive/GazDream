type Props = { lead: string; highlight: string; className?: string; baseDelay?: number };

/**
 * Headline whose words rise from behind a mask; the highlighted phrase is set in the accent colour.
 * The real text stays in an sr-only span, the animated copy is hidden from assistive tech.
 */
export default function RevealHeading({ lead, highlight, className = "", baseDelay = 0.12 }: Props) {
  let index = 0;
  const words = (text: string) =>
    text.split(" ").map((w, i, all) => (
      <span key={`${w}-${i}`}>
        <span className="inline-block overflow-hidden align-bottom pb-[0.14em] -mb-[0.14em]">
          <span className="word-up inline-block" style={{ animationDelay: `${baseDelay + index++ * 0.075}s` }}>
            {w}
          </span>
        </span>
        {i < all.length - 1 ? " " : ""}
      </span>
    ));

  return (
    <h1 className={className}>
      <span className="sr-only">{`${lead} ${highlight}`}</span>
      <span aria-hidden="true">
        {words(lead)}{" "}
        <em className="serif">{words(highlight)}</em>
      </span>
    </h1>
  );
}
