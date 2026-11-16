import { requireAdmin } from "@/lib/security/auth";
import { handleApiError, jsonOk } from "@/lib/security/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireAdmin("admin.costs");
    const admin = actor.adminSupabase;

    const [{ data: usage }, { data: payments }, { data: assets }, { data: renderJobs }] =
      await Promise.all([
        admin.from("provider_usage").select("*"),
        admin
          .from("payments")
          .select("amount_paise, razorpay_fee_paise, razorpay_tax_paise")
          .eq("status", "captured"),
        admin.from("assets").select("asset_type, size_bytes"),
        admin.from("render_jobs").select("render_duration_seconds, render_status"),
      ]);

    const rows = usage ?? [];
    const byProvider = (p: string) => rows.filter((r) => r.provider === p);
    const sumCost = (list: typeof rows) =>
      list.length > 0 ? Number(list.reduce((s, r) => s + Number(r.cost_inr ?? 0), 0).toFixed(2)) : null;

    const openaiRows = byProvider("openai");
    const falRows = byProvider("fal_ai");
    const elevenRows = byProvider("elevenlabs");
    const ffmpegRows = byProvider("ffmpeg");
    const r2Rows = byProvider("cloudflare_r2");

    const grossRevenue =
      payments && payments.length > 0
        ? Number((payments.reduce((s, p) => s + Number(p.amount_paise ?? 0), 0) / 100).toFixed(2))
        : null;
    const revenueExTax = grossRevenue !== null ? Number((grossRevenue / 1.18).toFixed(2)) : null;
    const paymentFees =
      payments && payments.length > 0
        ? Number(
            (
              payments.reduce(
                (s, p) => s + Number(p.razorpay_fee_paise ?? 0) + Number(p.razorpay_tax_paise ?? 0),
                0
              ) / 100
            ).toFixed(2)
          )
        : null;

    const aiCost =
      (sumCost(openaiRows) ?? 0) + (sumCost(falRows) ?? 0) + (sumCost(elevenRows) ?? 0);
    const renderCost = sumCost(ffmpegRows) ?? 0;
    const storageCost = sumCost(r2Rows) ?? 0;
    const variableTotal = Number((aiCost + renderCost + storageCost + (paymentFees ?? 0)).toFixed(2));
    const contribution =
      revenueExTax !== null ? Number((revenueExTax - variableTotal).toFixed(2)) : null;

    const imageBytes = (assets ?? [])
      .filter((a) => ["cartoon_image", "character_reference"].includes(a.asset_type))
      .reduce((s, a) => s + Number(a.size_bytes ?? 0), 0);
    const audioBytes = (assets ?? [])
      .filter((a) => a.asset_type === "narration_track")
      .reduce((s, a) => s + Number(a.size_bytes ?? 0), 0);
    const videoBytes = (assets ?? [])
      .filter((a) => a.asset_type === "finished_mp4")
      .reduce((s, a) => s + Number(a.size_bytes ?? 0), 0);

    return jsonOk({
      openai: {
        model: openaiRows[0]?.model_id ?? null,
        inputTokens: openaiRows.length > 0 ? openaiRows.reduce((s, r) => s + Number(r.input_units ?? 0), 0) : null,
        outputTokens: openaiRows.length > 0 ? openaiRows.reduce((s, r) => s + Number(r.output_units ?? 0), 0) : null,
        scriptExpenditureInr: sumCost(openaiRows.filter((r) => r.operation === "script_generation")),
        storyboardExpenditureInr: sumCost(openaiRows.filter((r) => r.operation === "dynamic_storyboard_generation")),
        costPerProjectInr: null,
        billingSource: openaiRows.length > 0 ? "estimated" : "unavailable",
      },
      falAi: {
        imageModel: falRows[0]?.model_id ?? null,
        imageRequests: falRows.length > 0 ? falRows.length : null,
        completedImages: falRows.length > 0 ? falRows.length : null,
        failedImages: 0,
        regeneratedImages: falRows.filter((r) => r.operation === "scene_image_regeneration").length,
        resolutionSummary: "1K / 1080p",
        costPerImageInr:
          falRows.length > 0 ? Number(((sumCost(falRows) ?? 0) / falRows.length).toFixed(4)) : null,
        avgImagesPerFinishedMinute: null,
        totalApiExpenditureInr: sumCost(falRows),
        billingSource: falRows.length > 0 ? "estimated" : "unavailable",
      },
      elevenLabs: {
        voiceModel: elevenRows[0]?.model_id ?? null,
        voiceIdsUsed: elevenRows.length > 0 ? new Set(elevenRows.map((r) => r.model_id)).size : null,
        billableCharacters:
          elevenRows.length > 0 ? elevenRows.reduce((s, r) => s + Number(r.input_units ?? 0), 0) : null,
        generatedAudioSeconds:
          elevenRows.length > 0
            ? Number(elevenRows.reduce((s, r) => s + Number(r.output_units ?? 0), 0).toFixed(1))
            : null,
        costPerProjectInr: null,
        costPerFinishedMinuteInr: null,
        billingSource: elevenRows.length > 0 ? "estimated" : "unavailable",
      },
      ffmpeg: {
        workerRuntimeSeconds:
          renderJobs && renderJobs.length > 0
            ? Number(renderJobs.reduce((s, r) => s + Number(r.render_duration_seconds ?? 0), 0).toFixed(1))
            : null,
        avgRenderDurationSeconds: null,
        totalOutputDurationSeconds: null,
        failedJobs: (renderJobs ?? []).filter((r) => r.render_status === "failed").length,
        avgCpuPct: null,
        avgMemoryMb: null,
        actualComputeExpenseInr: sumCost(ffmpegRows),
        billingSource: ffmpegRows.length > 0 ? "estimated" : "unavailable",
      },
      r2Storage: {
        imageVolumeBytes: (assets ?? []).length > 0 ? imageBytes : null,
        audioVolumeBytes: (assets ?? []).length > 0 ? audioBytes : null,
        videoVolumeBytes: (assets ?? []).length > 0 ? videoBytes : null,
        objectCount: (assets ?? []).length > 0 ? (assets ?? []).length : null,
        storageCostInr: sumCost(r2Rows),
        accessOperations: null,
        billingSource: r2Rows.length > 0 ? "estimated" : "unavailable",
      },
      profitability: {
        grossRevenueInr: grossRevenue,
        revenueExTaxInr: revenueExTax,
        paymentFeesInr: paymentFees,
        aiCostsInr: rows.length > 0 ? Number(aiCost.toFixed(2)) : null,
        renderingCostsInr: ffmpegRows.length > 0 ? renderCost : null,
        storageCostsInr: r2Rows.length > 0 ? storageCost : null,
        variableCostInr: rows.length > 0 ? variableTotal : null,
        contributionInr: contribution,
        contributionMarginPct:
          revenueExTax !== null && revenueExTax > 0 && contribution !== null
            ? Number(((contribution / revenueExTax) * 100).toFixed(1))
            : null,
        billingSource: rows.length > 0 || grossRevenue !== null ? "estimated" : "unavailable",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
