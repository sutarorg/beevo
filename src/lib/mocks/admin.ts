import type {
  AdminOrderRecord,
  CreatorRow,
  DisputeRecord,
  LearnerRow,
  PaymentEvent,
  PayoutRecordAdmin,
  AdminEvent,
} from "@/lib/admin-types";
import type { CourseAdminRow } from "@/lib/admin-types";

/**
 * ---------------------------------------------------------------------------
 *  DEMONSTRATION DATA ONLY — admin console seed
 * ---------------------------------------------------------------------------
 *  Fictional platform records (creators, learners, orders, payouts, disputes)
 *  powering the Prompt 4 admin UI. They are NOT real customers, transactions,
 *  or payouts — records are labelled demo and the backend replaces this entire
 *  module in Prompt 5. Financial figures are DERIVED by the admin service
 *  from these base records; pages never hardcode amounts.
 * ---------------------------------------------------------------------------
 */

export const DEMO_ADMIN_NOTE =
  "Demo admin console — fictional platform records. Not real customers, payments, or payouts.";

const now = Date.now();
const day = 24 * 60 * 60 * 1000;
const ago = (d: number) => new Date(now - d * day).toISOString();
const fee = (gross: number) => Math.round(gross * 0.08);

export const seedCreatorRows: CreatorRow[] = [
  { id: "cr_meera", handle: "meera-shoots", displayName: "Meera Kapoor", email: "meera@example.in", niche: "Photography", status: "active", courseCount: 4, publishedCount: 1, learnerCount: 12, grossInPaise: 0, joinedAt: ago(90), lastActiveAt: ago(1) },
  { id: "cr_ayaan", handle: "trainwithayaan", displayName: "Ayaan Verma", email: "ayaan@example.in", niche: "Fitness", status: "active", courseCount: 1, publishedCount: 1, learnerCount: 3, grossInPaise: 0, joinedAt: ago(60), lastActiveAt: ago(2) },
  { id: "cr_diya", handle: "diyacooks", displayName: "Diya Rao", email: "diya@example.in", niche: "Cooking", status: "active", courseCount: 2, publishedCount: 1, learnerCount: 4, grossInPaise: 0, joinedAt: ago(45), lastActiveAt: ago(1) },
  { id: "cr_farid", handle: "fkbeats", displayName: "Farid Khan", email: "farid@example.in", niche: "Music production", status: "active", courseCount: 1, publishedCount: 1, learnerCount: 1, grossInPaise: 0, joinedAt: ago(30), lastActiveAt: ago(4) },
  { id: "cr_lena", handle: "lenawrites", displayName: "Lena D’Souza", email: "lena@example.in", niche: "Writing", status: "suspended", courseCount: 1, publishedCount: 0, learnerCount: 0, grossInPaise: 0, joinedAt: ago(120), lastActiveAt: ago(14) },
  { id: "cr_rohan", handle: "rohaninvests", displayName: "Rohan Shah", email: "rohan@example.in", niche: "Personal finance", status: "active", courseCount: 1, publishedCount: 1, learnerCount: 2, grossInPaise: 0, joinedAt: ago(15), lastActiveAt: ago(1) },
];

export const seedCourseAdminRows: CourseAdminRow[] = [
  { id: "course_film", title: "Film Photography Foundations", creatorHandle: "meera-shoots", creatorName: "Meera Kapoor", priceInPaise: 149900, status: "published", enrollmentCount: 12, grossInPaise: 0, flaggedForReview: false, updatedAt: ago(2) },
  { id: "course_street", title: "Street Portraits in Natural Light", creatorHandle: "meera-shoots", creatorName: "Meera Kapoor", priceInPaise: 99900, status: "unpublished", enrollmentCount: 0, grossInPaise: 0, flaggedForReview: false, updatedAt: ago(6) },
  { id: "course_strength", title: "Home Strength Basics", creatorHandle: "trainwithayaan", creatorName: "Ayaan Verma", priceInPaise: 89900, status: "published", enrollmentCount: 3, grossInPaise: 0, flaggedForReview: false, updatedAt: ago(8) },
  { id: "course_cooking", title: "Everyday Indian Cooking", creatorHandle: "diyacooks", creatorName: "Diya Rao", priceInPaise: 129900, status: "published", enrollmentCount: 4, grossInPaise: 0, flaggedForReview: false, updatedAt: ago(3) },
  { id: "course_curry", title: "Weeknight Curry Masterclass", creatorHandle: "diyacooks", creatorName: "Diya Rao", priceInPaise: 79900, status: "draft", enrollmentCount: 0, grossInPaise: 0, flaggedForReview: false, updatedAt: ago(1) },
  { id: "course_beats", title: "Bedroom Beats in 30 Days", creatorHandle: "fkbeats", creatorName: "Farid Khan", priceInPaise: 199900, status: "published", enrollmentCount: 1, grossInPaise: 0, flaggedForReview: true, updatedAt: ago(5) },
  { id: "course_writing", title: "Write Your First Essay Collection", creatorHandle: "lenawrites", creatorName: "Lena D’Souza", priceInPaise: 69900, status: "unpublished", enrollmentCount: 0, grossInPaise: 0, flaggedForReview: true, updatedAt: ago(14) },
  { id: "course_money", title: "Salary to Savings: A Starter System", creatorHandle: "rohaninvests", creatorName: "Rohan Shah", priceInPaise: 149900, status: "published", enrollmentCount: 2, grossInPaise: 0, flaggedForReview: false, updatedAt: ago(2) },
];

const L: [string, string, string, number][] = [
  ["ln_1", "Ananya Iyer", "ananya.iyer@example.in", 61],
  ["ln_2", "Rohit Malhotra", "rohit.m@example.in", 58],
  ["ln_3", "Sana Sheikh", "sana.shoots@example.in", 52],
  ["ln_4", "Vikram Nair", "vik.nair@example.in", 49],
  ["ln_5", "Priya Deshmukh", "priya.d@example.in", 44],
  ["ln_6", "Kabir Anand", "kabir.a@example.in", 40],
  ["ln_7", "Ishita Bose", "ishita.bose@example.in", 33],
  ["ln_8", "Arjun Menon", "arjun.menon@example.in", 27],
  ["ln_9", "Tara Kulkarni", "tara.k@example.in", 21],
  ["ln_10", "Dev Patel", "dev.patel@example.in", 12],
  ["ln_11", "Nisha Rao", "nisha.rao@example.in", 9],
  ["ln_12", "Zoya Khan", "zoya.k@example.in", 5],
];

export const seedLearnerRows: LearnerRow[] = L.map(([id, name, email, days], index) => ({
  id,
  fullName: name,
  email,
  status: "active" as const,
  enrolledCourses: (index % 3) + 1,
  totalSpendInPaise: 0,
  joinedAt: ago(days),
}));

interface OrderSpec {
  days: number;
  learner: number;
  course: string;
  status: AdminOrderRecord["status"];
  reconciliation?: AdminOrderRecord["reconciliation"];
  method?: PaymentEvent["method"];
}

const prices: Record<string, { title: string; creator: string; price: number }> = {
  course_film: { title: "Film Photography Foundations", creator: "cr_meera", price: 149900 },
  course_strength: { title: "Home Strength Basics", creator: "cr_ayaan", price: 89900 },
  course_cooking: { title: "Everyday Indian Cooking", creator: "cr_diya", price: 129900 },
  course_beats: { title: "Bedroom Beats in 30 Days", creator: "cr_farid", price: 199900 },
  course_money: { title: "Salary to Savings: A Starter System", creator: "cr_rohan", price: 149900 },
};

const creatorNames: Record<string, string> = {
  cr_meera: "Meera Kapoor",
  cr_ayaan: "Ayaan Verma",
  cr_diya: "Diya Rao",
  cr_farid: "Farid Khan",
  cr_rohan: "Rohan Shah",
};

const orderSpecs: OrderSpec[] = [
  { days: 1, learner: 0, course: "course_film", status: "paid", method: "upi" },
  { days: 1, learner: 1, course: "course_film", status: "paid", method: "card" },
  { days: 3, learner: 2, course: "course_cooking", status: "paid", method: "upi" },
  { days: 4, learner: 3, course: "course_film", status: "failed", method: "upi" },
  { days: 5, learner: 3, course: "course_film", status: "paid", method: "upi" },
  { days: 8, learner: 4, course: "course_strength", status: "paid", method: "netbanking" },
  { days: 9, learner: 5, course: "course_film", status: "refunded", method: "card" },
  { days: 11, learner: 6, course: "course_money", status: "paid", method: "upi", reconciliation: "pending" },
  { days: 13, learner: 7, course: "course_beats", status: "paid", method: "card", reconciliation: "exception" },
  { days: 15, learner: 8, course: "course_cooking", status: "paid", method: "upi" },
  { days: 17, learner: 9, course: "course_money", status: "pending", method: "netbanking", reconciliation: "pending" },
  { days: 19, learner: 10, course: "course_film", status: "paid", method: "card" },
  { days: 22, learner: 11, course: "course_strength", status: "paid", method: "upi" },
  { days: 25, learner: 1, course: "course_cooking", status: "paid", method: "upi" },
  { days: 28, learner: 2, course: "course_film", status: "failed", method: "card" },
  { days: 31, learner: 5, course: "course_strength", status: "paid", method: "upi" },
  { days: 36, learner: 7, course: "course_cooking", status: "paid", method: "card" },
  { days: 41, learner: 9, course: "course_film", status: "paid", method: "upi" },
];

export function buildSeedOrders(): AdminOrderRecord[] {
  return orderSpecs.map((spec, index) => {
    const course = prices[spec.course];
    const learner = seedLearnerRows[spec.learner];
    const gross = course.price;
    const status = spec.status;
    const commission = status === "paid" || status === "refunded" ? fee(gross) : 0;
    return {
      id: `ord_demo_${String(3100 + index)}`,
      providerRef: `rzp_pay_demo_${(872100 + index * 37).toString(16)}`,
      courseId: spec.course,
      courseTitle: course.title,
      creatorId: course.creator,
      creatorName: creatorNames[course.creator],
      learnerId: learner.id,
      learnerName: learner.fullName,
      grossInPaise: gross,
      platformFeeInPaise: commission,
      creatorShareInPaise: gross - commission,
      status,
      commissionStatus: status === "refunded" ? "reversed" : status === "paid" ? "accrued" : "waived",
      reconciliation: spec.reconciliation ?? (status === "paid" ? "settled" : "pending"),
      reviewed: false,
      placedAt: ago(spec.days),
      demo: true,
    };
  });
}

export function buildSeedPaymentEvents(orders: AdminOrderRecord[]): PaymentEvent[] {
  const events: PaymentEvent[] = [];
  for (const order of orders) {
    const method = orderSpecs.find((s) => `ord_demo_${String(3100 + orderSpecs.indexOf(s))}` === order.id)?.method ?? "upi";
    events.push({
      id: `pev_${order.id}`,
      orderId: order.id,
      learnerName: order.learnerName,
      amountInPaise: order.grossInPaise,
      method,
      status: order.status === "paid" || order.status === "refunded" ? "succeeded" : order.status,
      failureReason: order.status === "failed" ? "bank_declined" : null,
      providerRef: order.providerRef,
      at: order.placedAt,
    });
  }
  // Extra standalone failures (no order reached paid state)
  const extra: [number, number, PaymentEvent["method"], string][] = [
    [2, 4, "card", "card_declined"],
    [6, 8, "upi", "upi_timeout"],
    [14, 10, "netbanking", "bank_downtime"],
  ];
  extra.forEach(([days, learnerIdx, method, reason], i) => {
    const learner = seedLearnerRows[learnerIdx];
    events.push({
      id: `pev_extra_${i}`,
      orderId: "—",
      learnerName: learner.fullName,
      amountInPaise: 149900,
      method,
      status: "failed",
      failureReason: reason,
      providerRef: `rzp_pay_demo_fail_${i}`,
      at: ago(days),
    });
  });
  return events.sort((a, b) => b.at.localeCompare(a.at));
}

export const seedPayouts: PayoutRecordAdmin[] = [
  {
    id: "pay_demo_1",
    creatorId: "cr_meera",
    creatorName: "Meera Kapoor",
    handle: "meera-shoots",
    amountInPaise: 128_000,
    status: "recorded",
    beneficiaryMasked: "HDFC Bank ••••4821",
    transferRef: "UTR N312459871",
    transferDate: ago(38).slice(0, 10),
    recordedBy: "Platform Admin (demo)",
    createdAt: ago(40),
    recordedAt: ago(38),
    note: "Recorded under the manual payment arrangement.",
    history: [
      { id: "peh_1a", at: ago(40), actor: "Platform Admin (demo)", area: "payouts", action: "payout_created", detail: "Payout record created for Meera Kapoor (₹1,280.00).", kind: "action" },
      { id: "peh_1b", at: ago(38), actor: "Platform Admin (demo)", area: "payouts", action: "payout_recorded", detail: "Marked recorded with UTR N312459871.", kind: "action" },
    ],
  },
  {
    id: "pay_demo_2",
    creatorId: "cr_meera",
    creatorName: "Meera Kapoor",
    handle: "meera-shoots",
    amountInPaise: 96_500,
    status: "recorded",
    beneficiaryMasked: "HDFC Bank ••••4821",
    transferRef: "UTR N402117655",
    transferDate: ago(10).slice(0, 10),
    recordedBy: "Platform Admin (demo)",
    createdAt: ago(11),
    recordedAt: ago(10),
    note: "Recorded under the manual payment arrangement.",
    history: [
      { id: "peh_2a", at: ago(11), actor: "Platform Admin (demo)", area: "payouts", action: "payout_created", detail: "Payout record created for Meera Kapoor (₹965.00).", kind: "action" },
      { id: "peh_2b", at: ago(10), actor: "Platform Admin (demo)", area: "payouts", action: "payout_recorded", detail: "Marked recorded with UTR N402117655.", kind: "action" },
    ],
  },
  {
    id: "pay_demo_3",
    creatorId: "cr_ayaan",
    creatorName: "Ayaan Verma",
    handle: "trainwithayaan",
    amountInPaise: 41_300,
    status: "pending",
    beneficiaryMasked: "ICICI Bank ••••7720",
    transferRef: null,
    transferDate: null,
    recordedBy: null,
    createdAt: ago(2),
    recordedAt: null,
    note: "Awaiting transfer + UTR entry.",
    history: [
      { id: "peh_3a", at: ago(2), actor: "Platform Admin (demo)", area: "payouts", action: "payout_created", detail: "Payout record created for Ayaan Verma (₹413.00).", kind: "action" },
    ],
  },
  {
    id: "pay_demo_4",
    creatorId: "cr_farid",
    creatorName: "Farid Khan",
    handle: "fkbeats",
    amountInPaise: 88_100,
    status: "failed",
    beneficiaryMasked: "SBI ••••2290",
    transferRef: "UTR N509122344",
    transferDate: ago(6).slice(0, 10),
    recordedBy: "Platform Admin (demo)",
    createdAt: ago(8),
    recordedAt: ago(6),
    note: "Bank returned the transfer (beneficiary IFSC mismatch).",
    history: [
      { id: "peh_4a", at: ago(8), actor: "Platform Admin (demo)", area: "payouts", action: "payout_created", detail: "Payout record created for Farid Khan (₹881.00).", kind: "action" },
      { id: "peh_4b", at: ago(6), actor: "Platform Admin (demo)", area: "payouts", action: "payout_failed", detail: "Transfer returned by bank — IFSC mismatch.", kind: "event" },
    ],
  },
];

export const seedDisputes: DisputeRecord[] = [
  {
    id: "disp_demo_1",
    type: "chargeback",
    status: "open",
    orderId: "ord_demo_3112",
    courseTitle: "Bedroom Beats in 30 Days",
    learnerName: "Arjun Menon",
    creatorName: "Farid Khan",
    amountInPaise: 199900,
    openedAt: ago(2),
    summary: "Cardholder raised a chargeback with their bank claiming an unrecognised charge.",
    notes: [
      { id: "dn_1", at: ago(2), actor: "system", note: "Chargeback notification received from the payment provider. Settlement placed on hold." },
    ],
  },
  {
    id: "disp_demo_2",
    type: "legal_exception",
    status: "under_review",
    orderId: "ord_demo_3105",
    courseTitle: "Film Photography Foundations",
    learnerName: "Kabir Anand",
    creatorName: "Meera Kapoor",
    amountInPaise: 149900,
    openedAt: ago(4),
    summary: "Buyer reports access could not be granted after payment. A remedy may be required under applicable law.",
    notes: [
      { id: "dn_2", at: ago(4), actor: "Platform Admin (demo)", note: "Confirmed payment captured; enrolment record missing. Investigating provisionally — this may qualify as a legally required exception." },
      { id: "dn_3", at: ago(3), actor: "Platform Admin (demo)", note: "Restored access manually as the first remedy; buyer informed by email." },
    ],
  },
  {
    id: "disp_demo_3",
    type: "reversal",
    status: "resolved",
    orderId: "ord_demo_3106",
    courseTitle: "Film Photography Foundations",
    learnerName: "Kabir Anand",
    creatorName: "Meera Kapoor",
    amountInPaise: 149900,
    openedAt: ago(9),
    summary: "Duplicate payment for the same course was reversed; the corresponding sale was reversed in the ledger.",
    notes: [
      { id: "dn_4", at: ago(8), actor: "Platform Admin (demo)", note: "Duplicate charge verified with provider refs; reversal completed." },
    ],
  },
];

export const seedAuditEvents: AdminEvent[] = [
  { id: "aud_1", at: ago(14), actor: "Platform Admin (demo)", area: "creators", action: "creator_suspended", detail: "Lena D’Souza (@lenawrites) suspended: repeated copyright complaints pending review.", kind: "action" },
  { id: "aud_2", at: ago(13), actor: "system", area: "payments", action: "settlement_exception", detail: "Settlement mismatch flagged on ord_demo_3108 — needs review.", kind: "system" },
  { id: "aud_3", at: ago(11), actor: "Platform Admin (demo)", area: "payouts", action: "payout_created", detail: "Payout record created for Meera Kapoor (₹965.00).", kind: "action" },
  { id: "aud_4", at: ago(10), actor: "Platform Admin (demo)", area: "payouts", action: "payout_recorded", detail: "Payout pay_demo_2 recorded with UTR N402117655.", kind: "action" },
  { id: "aud_5", at: ago(9), actor: "system", area: "disputes", action: "dispute_opened", detail: "Reversal case opened for ord_demo_3106 (duplicate payment).", kind: "system" },
  { id: "aud_6", at: ago(5), actor: "Platform Admin (demo)", area: "courses", action: "course_flagged", detail: "Bedroom Beats in 30 Days flagged for content review.", kind: "action" },
  { id: "aud_7", at: ago(4), actor: "system", area: "payments", action: "webhook_retry", detail: "Provider webhook delivery retried (3 attempts) — recovered.", kind: "system" },
  { id: "aud_8", at: ago(2), actor: "Platform Admin (demo)", area: "disputes", action: "dispute_note", detail: "Investigation note added to legal_exception case disp_demo_2.", kind: "action" },
];
