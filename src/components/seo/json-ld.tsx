/**
 * Server-rendered JSON-LD.
 *
 * Structured data is injected as a plain <script> so it is present in the
 * initial HTML (no JavaScript required for crawlers or social scrapers).
 * Serialisation escapes `<`, `>`, `&`, and the JavaScript line separators so
 * creator-authored course titles can never break out of the script tag.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function JsonLd({ id, data }: { id: string; data: unknown }) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
