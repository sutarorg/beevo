import { House, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <main
      id="main"
      className="grid min-h-dvh place-items-center bg-cream px-4 py-16"
    >
      <div className="w-full max-w-lg rounded-[2.5rem] border-2 border-ink bg-white p-8 text-center shadow-hard sm:p-12">
        <Sticker color="accent">Error 404</Sticker>
        <p className="mt-8 font-editorial text-7xl italic">Lost the plot.</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">
          This page doesn’t exist
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-smoke">
          The link may be old, mistyped, or the page moved. Happens to the best
          of us — even creators with great links.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button href="/" variant="ink">
            <House className="size-4" aria-hidden="true" />
            Back home
          </Button>
          <Button href="/how-it-works" variant="outline">
            <Map className="size-4" aria-hidden="true" />
            See how it works
          </Button>
        </div>
      </div>
    </main>
  );
}
