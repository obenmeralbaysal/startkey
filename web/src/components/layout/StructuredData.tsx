/**
 * The reference website's JSON-LD blocks (FAQ page and the organisation graph), with
 * their URLs made site-relative and their images pointing at the local media files.
 */
export function StructuredData({ blocks }: { blocks: unknown[] }) {
  return (
    <>
      {blocks.map((block, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block, null, 2) }}
        />
      ))}
    </>
  );
}
