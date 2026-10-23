import type { CreatorPublicProfile } from "@/lib/domain";

/**
 * ---------------------------------------------------------------------------
 *  DEMONSTRATION DATA ONLY
 * ---------------------------------------------------------------------------
 *  These creators, courses, prices, and learner counts are fictional and exist
 *  purely to design and demo the storefront UI. They never touch the database
 *  and are rendered with an explicit "Demo" label wherever they appear.
 *  Prompt 5 replaces reads of this module with real queries — pages import
 *  shapes from `@/lib/domain`, never hardcode examples inline.
 * ---------------------------------------------------------------------------
 */

export const MOCK_DATA_NOTICE =
  "Sample profiles shown to preview the product. No real creators or sales.";

export const MOCK_CREATORS: CreatorPublicProfile[] = [
  {
    id: "mk_creator_meera",
    handle: "meera-shoots",
    displayName: "Meera Kapoor",
    tagline: "Teaching 86k subscribers to shoot on film, not filters.",
    avatarUrl: "/images/avatars/meera.jpg",
    niche: "Photography",
    stats: { courseCount: 2, learnerCount: 1284 },
    links: [
      { label: "YouTube", url: "https://youtube.com" },
      { label: "Instagram", url: "https://instagram.com" },
    ],
    courses: [
      {
        id: "mk_course_film",
        slug: "film-photography-foundations",
        title: "Film Photography Foundations",
        blurb: "Metering, film stocks, and scanning — your first 10 rolls done right.",
        coverUrl: "/images/courses/photography.jpg",
        priceInPaise: 149900,
        lessonCount: 24,
        durationLabel: "4h 30m",
        level: "Beginner",
      },
      {
        id: "mk_course_street",
        slug: "street-portraits-natural-light",
        title: "Street Portraits in Natural Light",
        blurb: "Approach strangers, find light, and leave with frames worth printing.",
        coverUrl: "/images/courses/photography.jpg",
        priceInPaise: 99900,
        lessonCount: 18,
        durationLabel: "3h 05m",
        level: "Intermediate",
      },
    ],
  },
  {
    id: "mk_creator_ayaan",
    handle: "trainwithayaan",
    displayName: "Ayaan Verma",
    tagline: "Strength coach. Zero-equipment programs for real schedules.",
    avatarUrl: "/images/avatars/ayaan.jpg",
    niche: "Fitness",
    stats: { courseCount: 1, learnerCount: 862 },
    links: [
      { label: "Instagram", url: "https://instagram.com" },
      { label: "Community", url: "https://example.com" },
    ],
    courses: [
      {
        id: "mk_course_strength",
        slug: "home-strength-basics",
        title: "Home Strength Basics",
        blurb: "A 6-week progressive program using nothing but your floor and your focus.",
        coverUrl: "/images/courses/fitness.jpg",
        priceInPaise: 89900,
        lessonCount: 16,
        durationLabel: "2h 40m",
        level: "All levels",
      },
    ],
  },
  {
    id: "mk_creator_diya",
    handle: "diyacooks",
    displayName: "Diya Rao",
    tagline: "Weeknight Indian cooking from my tiny Mumbai kitchen.",
    avatarUrl: "/images/avatars/diya.jpg",
    niche: "Cooking",
    stats: { courseCount: 1, learnerCount: 2105 },
    links: [
      { label: "YouTube", url: "https://youtube.com" },
      { label: "Newsletter", url: "https://example.com" },
    ],
    courses: [
      {
        id: "mk_course_cooking",
        slug: "everyday-indian-cooking",
        title: "Everyday Indian Cooking",
        blurb: "30 recipes, 5 base gravies, and the spice box system that makes it fast.",
        coverUrl: "/images/courses/cooking.jpg",
        priceInPaise: 129900,
        lessonCount: 30,
        durationLabel: "5h 15m",
        level: "Beginner",
      },
    ],
  },
];
