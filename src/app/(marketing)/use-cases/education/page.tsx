import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Globe, GraduationCap, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FinalCtaBand } from "@/components/home/FinalCtaBand";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Education & Kids Learning Cartoon Videos",
  description:
    "Create clear illustrated cartoon lessons, science explainers, and children's learning stories in English, Hindi, and supported languages using Beevo's dynamic storyboards and one-time credits.",
  path: "/use-cases/education",
});

export default function EducationUseCasePage() {
  return (
    <>
      <section className="bg-beevo-canvas pb-12 pt-10 md:pb-16 md:pt-14">
        <div className="beevo-container">
          <Breadcrumbs
            items={[
              { name: "Use Cases", href: "/use-cases/education" },
              { name: "Education & Kids Learning", href: "/use-cases/education" },
            ]}
          />

          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <Eyebrow>Use Case &middot; Education</Eyebrow>
              <h1 className="mt-3.5 font-display text-[clamp(2rem,3.5vw,2.85rem)] font-extrabold leading-[1.12] tracking-[-0.035em] text-beevo-ink">
                Turn lesson plans into{" "}
                <span className="text-beevo-honey-display">friendly cartoon stories.</span>
              </h1>
              <p className="mt-4 text-[15.5px] leading-[1.68] text-beevo-body">
                Teachers, tutors, parents, and curriculum designers use Beevo to turn science
                topics, history stories, moral fables, and classroom tutorials into clear
                illustrated videos—with calm voiceover, synchronized captions, and no animation
                software to learn.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/get-started" className="beevo-btn-primary min-h-[46px] px-6 text-[14px]">
                  Create a Learning Video
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/pricing" className="beevo-btn-secondary min-h-[46px] px-5 text-[14px]">
                  See Credit Packs
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative aspect-video w-full overflow-hidden rounded-[22px] border border-beevo-border bg-beevo-cream shadow-beevo-card">
                <Image
                  src="/images/beevo/usecase-education.webp"
                  alt="Beevo educational cartoon lesson layout featuring sunlit meadow science visuals"
                  fill
                  priority
                  sizes="(max-width: 1024px) 94vw, 560px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                icon: GraduationCap,
                title: "Classroom & Science Explainers",
                body: "Break multi-step ideas like pollination, the water cycle, or the solar system into sequential illustrated beats paced cleanly to spoken explanations.",
              },
              {
                icon: BookOpen,
                title: "Children's Picture-Book Stories",
                body: "Pair Storybook, Watercolor, or 3D Cartoon styles with a consistent friendly host character that stays recognizable from the opening scene to the end.",
              },
              {
                icon: Globe,
                title: "English, Hindi & Bilingual Lessons",
                body: "Narrate lessons in English, Hindi, or other voices in Beevo's ElevenLabs catalog, paired with synchronized captions and adjustable speech speed.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-[18px] border border-beevo-border bg-white p-6 shadow-beevo-card"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-beevo-yellow text-beevo-ink">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 font-display text-[17px] font-extrabold text-beevo-ink">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-[14px] leading-[1.64] text-beevo-body">{item.body}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-10 rounded-[20px] border border-beevo-border bg-beevo-cream/65 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-wider text-beevo-honey-text">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Practical Benefits for Educators
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-3 text-[14px] font-semibold text-beevo-body sm:grid-cols-2">
              {[
                "Pay per credit pack—ideal for occasional term lessons without recurring SaaS fees",
                "Split 800 Creator credits across eight 1-minute topics or two 4-minute chapters",
                "Single lessons can run up to 10 minutes long in 16:9 widescreen",
                "Download clean MP4 files for classrooms, LMS courses, or offline playback",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-beevo-honey-text" aria-hidden="true" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <FinalCtaBand
        heading="Bring your next lesson to life."
        subcopy="Paste your lesson notes or short story script and preview how Beevo turns it into a clear illustrated cartoon video."
      />
    </>
  );
}
