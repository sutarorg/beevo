import type {
  CourseEditor,
  CreatorNotification,
  CreatorProfile,
  OrderRecord,
  OrderStatus,
  PayoutRecord,
  StudentRecord,
} from "@/lib/creator-types";

/**
 * ---------------------------------------------------------------------------
 *  DEMONSTRATION DATA ONLY — creator workspace seed
 * ---------------------------------------------------------------------------
 *  A fictional creator account ("Meera Kapoor") with courses, orders,
 *  students, payouts, and notifications used to demo the creator app. Orders
 *  and payouts are NOT real transactions — every list carries a "Demo" label
 *  and the values never touch a database. Prompt 5 replaces reads of this
 *  data with real queries through the same service contracts.
 * ---------------------------------------------------------------------------
 */

export const DEMO_WORKSPACE_NOTE =
  "Demo workspace — sample creator account. Orders, earnings, and payouts are illustrative, never real transactions.";

export const MOCK_CURRENT_CREATOR: CreatorProfile = {
  handle: "meera-shoots",
  displayName: "Meera Kapoor",
  tagline: "Teaching 86k subscribers to shoot on film, not filters.",
  avatarUrl: "/images/avatars/meera.jpg",
  niche: "Photography",
  links: [
    { label: "YouTube", url: "https://youtube.com" },
    { label: "Instagram", url: "https://instagram.com" },
  ],
  publicUrl: "https://beevo.in/@meera-shoots",
};

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

export function seedCourses(): CourseEditor[] {
  return [
    {
      id: "course_film",
      creatorHandle: "meera-shoots",
      creatorName: "Meera Kapoor",
      status: "published",
      slug: "film-photography-foundations",
      title: "Film Photography Foundations",
      shortDescription:
        "Metering, film stocks, and scanning — your first 10 rolls done right.",
      outcomes: [
        "Rate and meter any film stock confidently",
        "Expose for shadows without guessing",
        "Scan and grade your own negatives",
      ],
      cover: {
        id: "media_cover_film",
        kind: "cover",
        fileName: "film-foundations-cover.jpg",
        sizeBytes: 412_000,
        previewUrl: "/images/courses/photography.jpg",
        uploadedAt: daysAgo(40),
        simulated: true,
      },
      priceInPaise: 149900,
      sections: [
        {
          id: "sec_film_1",
          title: "Getting started",
          lessons: [
            {
              id: "les_film_1",
              type: "video",
              isPreview: true,
              title: "Welcome & how this course works",
              description: "What you need, what you'll shoot, and how the community works.",
              media: [
                {
                  id: "media_les_film_1",
                  kind: "video",
                  fileName: "welcome.mp4",
                  sizeBytes: 84_000_000,
                  durationLabel: "4:12",
                  uploadedAt: daysAgo(39),
                  simulated: true,
                },
              ],
            },
            {
              id: "les_film_2",
              type: "resources",
              title: "Gear checklist & film stock guide",
              description: "Printable checklist for your first camera and film order.",
              media: [
                {
                  id: "media_les_film_2a",
                  kind: "resource",
                  fileName: "gear-checklist.pdf",
                  sizeBytes: 210_000,
                  uploadedAt: daysAgo(39),
                  simulated: true,
                },
                {
                  id: "media_les_film_2b",
                  kind: "resource",
                  fileName: "film-stock-guide.pdf",
                  sizeBytes: 480_000,
                  uploadedAt: daysAgo(38),
                  simulated: true,
                },
              ],
            },
          ],
        },
        {
          id: "sec_film_2",
          title: "Light & exposure",
          lessons: [
            {
              id: "les_film_3",
              type: "video",
              title: "Metering without fear",
              description: "Sunny 16, phone meters, and when to trust your eyes.",
              media: [
                {
                  id: "media_les_film_3",
                  kind: "video",
                  fileName: "metering.mp4",
                  sizeBytes: 210_000_000,
                  durationLabel: "11:40",
                  uploadedAt: daysAgo(37),
                  simulated: true,
                },
              ],
            },
          ],
        },
      ],
      createdAt: daysAgo(42),
      updatedAt: daysAgo(2),
      publishedAt: daysAgo(35),
    },
    {
      id: "course_street",
      creatorHandle: "meera-shoots",
      creatorName: "Meera Kapoor",
      status: "unpublished",
      slug: "street-portraits-natural-light",
      title: "Street Portraits in Natural Light",
      shortDescription:
        "Approach strangers, find light, and leave with frames worth printing.",
      outcomes: ["Approach strangers with confidence", "Read natural light fast"],
      cover: {
        id: "media_cover_street",
        kind: "cover",
        fileName: "street-portraits-cover.jpg",
        sizeBytes: 388_000,
        previewUrl: "/images/courses/photography.jpg",
        uploadedAt: daysAgo(20),
        simulated: true,
      },
      priceInPaise: 99900,
      sections: [
        {
          id: "sec_street_1",
          title: "The approach",
          lessons: [
            {
              id: "les_street_1",
              type: "video",
              isPreview: true,
              title: "Asking without being awkward",
              description: "The 3-line script that works in any city.",
              media: [
                {
                  id: "media_les_street_1",
                  kind: "video",
                  fileName: "the-approach.mp4",
                  sizeBytes: 160_000_000,
                  durationLabel: "8:05",
                  uploadedAt: daysAgo(19),
                  simulated: true,
                },
              ],
            },
          ],
        },
      ],
      createdAt: daysAgo(22),
      updatedAt: daysAgo(6),
      publishedAt: null,
    },
    {
      id: "course_scanning",
      creatorHandle: "meera-shoots",
      creatorName: "Meera Kapoor",
      status: "draft",
      slug: null,
      title: "The Scanning & Editing Workflow",
      shortDescription: "From negative to a grade you're proud of — draft in progress.",
      outcomes: [],
      cover: null,
      priceInPaise: null,
      sections: [
        {
          id: "sec_scan_1",
          title: "Scanning setup",
          lessons: [
            {
              id: "les_scan_1",
              type: "video",
              title: "Flatbed vs DSLR scanning",
              description: "Cost, speed, and quality — an honest comparison.",
              media: [
                {
                  id: "media_les_scan_1",
                  kind: "video",
                  fileName: "scanning-setup.mp4",
                  sizeBytes: 120_000_000,
                  durationLabel: "6:31",
                  uploadedAt: daysAgo(3),
                  simulated: true,
                },
              ],
            },
          ],
        },
      ],
      createdAt: daysAgo(4),
      updatedAt: daysAgo(1),
      publishedAt: null,
    },
    {
      id: "course_buyers",
      creatorHandle: "meera-shoots",
      creatorName: "Meera Kapoor",
      status: "archived",
      slug: "35mm-buyers-guide",
      title: "The 35mm Buyer's Guide",
      shortDescription: "A retired mini-course, superseded by Foundations.",
      outcomes: [],
      cover: null,
      priceInPaise: 49900,
      sections: [],
      createdAt: daysAgo(200),
      updatedAt: daysAgo(120),
      publishedAt: daysAgo(190),
    },
  ];
}

const buyers = [
  ["Ananya Iyer", "ananya.iyer@example.in"],
  ["Rohit Malhotra", "rohit.m@example.in"],
  ["Sana Sheikh", "sana.shoots@example.in"],
  ["Vikram Nair", "vik.nair@example.in"],
  ["Priya Deshmukh", "priya.d@example.in"],
  ["Kabir Anand", "kabir.a@example.in"],
  ["Ishita Bose", "ishita.bose@example.in"],
  ["Arjun Menon", "arjun.menon@example.in"],
  ["Tara Kulkarni", "tara.k@example.in"],
  ["Dev Patel", "dev.patel@example.in"],
  ["Nisha Rao", "nisha.rao@example.in"],
  ["Farhan Qureshi", "farhan.q@example.in"],
  ["Megha Pillai", "megha.p@example.in"],
  ["Yash Thakur", "yash.t@example.in"],
  ["Ritu Verma", "ritu.v@example.in"],
  ["Zoya Khan", "zoya.k@example.in"],
] as const;

const feeOf = (gross: number) => Math.round(gross * 0.08);

/** 16 demo orders spread across the last 8 weeks. All are illustrative. */
export function seedOrders(): OrderRecord[] {
  const specs: [number, number, "course_film" | "course_street", OrderStatus][] = [
    [1, 0, "course_film", "paid"],
    [1, 1, "course_film", "paid"],
    [3, 2, "course_film", "paid"],
    [5, 3, "course_film", "paid"],
    [8, 4, "course_film", "paid"],
    [9, 5, "course_film", "refunded"],
    [12, 6, "course_film", "paid"],
    [16, 7, "course_street", "paid"],
    [19, 8, "course_film", "paid"],
    [23, 9, "course_film", "paid"],
    [27, 10, "course_street", "paid"],
    [31, 11, "course_film", "paid"],
    [36, 12, "course_film", "paid"],
    [41, 13, "course_film", "paid"],
    [47, 14, "course_street", "paid"],
    [52, 15, "course_film", "paid"],
  ];
  return specs.map(([days, buyerIndex, courseId, status], i) => {
    const gross = courseId === "course_film" ? 149900 : 99900;
    const fee = feeOf(gross);
    return {
      id: `ck_mk_${String(2400 + i)}`,
      courseId,
      courseTitle:
        courseId === "course_film"
          ? "Film Photography Foundations"
          : "Street Portraits in Natural Light",
      buyerName: buyers[buyerIndex][0],
      buyerEmail: buyers[buyerIndex][1],
      grossInPaise: gross,
      platformFeeInPaise: fee,
      creatorShareInPaise: gross - fee,
      status,
      placedAt: daysAgo(days),
      demo: true as const,
    };
  });
}

export function seedStudents(): StudentRecord[] {
  return seedOrders()
    .filter((order) => order.status === "paid")
    .map((order) => ({
      id: `stu_${order.id}`,
      fullName: order.buyerName,
      email: order.buyerEmail,
      courseId: order.courseId,
      courseTitle: order.courseTitle,
      enrolledAt: order.placedAt,
      status: "active" as const,
    }));
}

export function seedPayouts(): PayoutRecord[] {
  return [
    {
      id: "pay_mk_1",
      amountInPaise: 128_000,
      reference: "manual-ref-2025-12",
      status: "recorded",
      recordedAt: daysAgo(38),
      note: "Recorded by platform admin under the payment arrangement.",
    },
    {
      id: "pay_mk_2",
      amountInPaise: 96_500,
      reference: "manual-ref-2026-01",
      status: "recorded",
      recordedAt: daysAgo(10),
      note: "Recorded by platform admin under the payment arrangement.",
    },
  ];
}

export function seedNotifications(): CreatorNotification[] {
  return [
    {
      id: "ntf_mk_1",
      kind: "enrollment",
      title: "New enrolment",
      body: "Ananya Iyer enrolled in Film Photography Foundations.",
      createdAt: daysAgo(1),
      read: false,
    },
    {
      id: "ntf_mk_2",
      kind: "enrollment",
      title: "New enrolment",
      body: "Rohit Malhotra enrolled in Film Photography Foundations.",
      createdAt: daysAgo(1),
      read: false,
    },
    {
      id: "ntf_mk_3",
      kind: "payout",
      title: "Payout recorded",
      body: "A payout of ₹965.00 was recorded by the platform (manual-ref-2026-01).",
      createdAt: daysAgo(10),
      read: true,
    },
    {
      id: "ntf_mk_4",
      kind: "system",
      title: "Profile tip",
      body: "Creators with 3+ learning outcomes convert better. Add yours in any draft.",
      createdAt: daysAgo(14),
      read: true,
    },
  ];
}
