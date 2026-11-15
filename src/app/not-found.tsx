import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";

export default function NotFound() {
  return (
    <section className="bg-beevo-canvas py-16 md:py-24">
      <div className="beevo-container">
        <div className="mx-auto max-w-2xl rounded-[22px] border border-beevo-border bg-beevo-cream/60 p-8 text-center shadow-beevo-card md:p-12">
          <div className="mx-auto mb-5 w-[150px]">
            <Image
              src="/images/beevo/bee-flight-doodle.webp"
              alt="Beevo mascot flying gently"
              width={320}
              height={260}
              className="mx-auto h-auto w-[130px] object-contain"
            />
          </div>
          <Eyebrow>404 &middot; Page not found</Eyebrow>
          <h1 className="mt-4 font-display text-[30px] font-extrabold leading-tight tracking-[-0.03em] text-beevo-ink sm:text-[38px]">
            That scene isn&apos;t in our storyboard.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-beevo-body">
            The page you&apos;re looking for may have moved or doesn&apos;t exist. Head back to the
            homepage or explore Beevo&apos;s features and one-time credit packs.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/" className="beevo-btn-primary min-h-[46px] px-6 text-[14.5px]">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Homepage
            </Link>
            <Link href="/pricing" className="beevo-btn-secondary min-h-[46px] px-6 text-[14.5px]">
              View Credit Packs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
