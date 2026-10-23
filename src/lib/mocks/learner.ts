import type { PurchaseRecord } from "@/lib/learner-types";

/**
 * ---------------------------------------------------------------------------
 *  DEMONSTRATION DATA ONLY — learner seed
 * ---------------------------------------------------------------------------
 *  A fictional learner ("Kavya Raghavan") who owns a demo copy of the sample
 *  published course. These are NOT genuine purchases: records carry
 *  `demo: true`, the UI labels them, and nothing here proves payment or
 *  enrolment. Prompt 5 replaces all of it with real enrolment + progress data.
 * ---------------------------------------------------------------------------
 */

export const DEMO_LEARNER_NOTE =
  "Demo learner — sample library, purchases, and progress. Not real transactions.";

export const DEMO_LEARNER = {
  name: "Kavya Raghavan",
  email: "kavya.learns@example.in",
};

/** One small text file used when the learner downloads a simulated resource. */
export function simulatedDownloadText(fileName: string): string {
  return [
    "CourseKit — simulated download",
    "================================",
    "",
    `You requested: ${fileName}`,
    "",
    "This is a frontend demo placeholder. No real course file was stored or",
    "downloaded. Actual secure media delivery ships in Prompt 5 via",
    "short-lived signed URLs from cloud object storage.",
    "",
    "— Demo workspace",
  ].join("\n");
}

export function seedLearnerPurchases(): PurchaseRecord[] {
  return [
    {
      id: "lpur_demo_1",
      orderId: "ord_demo_8821",
      courseId: "course_film",
      courseTitle: "Film Photography Foundations",
      amountInPaise: 149900,
      status: "paid",
      placedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      demo: true,
    },
  ];
}

export function seedLearnerProgress(): Record<
  string,
  Record<string, { completed: boolean; positionSeconds: number; updatedAt: string }>
> {
  return {
    course_film: {
      les_film_1: {
        completed: true,
        positionSeconds: 252,
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      les_film_3: {
        completed: false,
        positionSeconds: 132,
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
  };
}

export function seedLearnerLastAccessed(): Record<string, { lessonId: string; at: string }> {
  return {
    course_film: {
      lessonId: "les_film_3",
      at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  };
}
