"use client";

import { ErrorPanel } from "@/components/states";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main id="main">
      <ErrorPanel reset={reset} />
    </main>
  );
}
