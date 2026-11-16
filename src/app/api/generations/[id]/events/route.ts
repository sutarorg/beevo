import { requireUser } from "@/lib/security/auth";
import { ApiError, handleApiError } from "@/lib/security/http";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    const { id } = await context.params;
    const admin = auth.adminSupabase;

    const { data: initial } = await admin
      .from("generations")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (!initial) throw new ApiError(404, "GENERATION_NOT_FOUND", "Generation not found.");
    if (initial.user_id !== auth.userId && auth.role === "user") {
      throw new ApiError(403, "FORBIDDEN", "Access denied.");
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, payload: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`)
          );
        };

        let lastSig = "";
        const startedAt = Date.now();

        while (!request.signal.aborted && Date.now() - startedAt < 55_000) {
          const { data: row } = await admin
            .from("generations")
            .select(
              "id, generation_status, current_stage, progress_percent, dynamic_image_count, completed_image_count, output_asset_id, error_details, updated_at"
            )
            .eq("id", id)
            .maybeSingle();

          if (!row) break;

          const sig = `${row.generation_status}:${row.current_stage}:${row.progress_percent}:${row.completed_image_count}:${row.updated_at}`;
          if (sig !== lastSig) {
            lastSig = sig;
            sendEvent("progress", {
              generationId: row.id,
              status: row.generation_status,
              currentStage: row.current_stage,
              progressPercent: Number(row.progress_percent),
              generatedImages: Number(row.completed_image_count),
              totalImages: row.dynamic_image_count,
              stageLabel:
                row.current_stage === "image_generation" && row.dynamic_image_count
                  ? `Generated images: ${row.completed_image_count} / ${row.dynamic_image_count}`
                  : row.current_stage,
              outputAssetId: row.output_asset_id,
              errorDetails: row.error_details,
            });
          }

          if (["completed", "failed", "cancelled"].includes(row.generation_status)) {
            sendEvent(row.generation_status, { generationId: row.id, status: row.generation_status });
            break;
          }

          await new Promise((r) => setTimeout(r, 2000));
        }

        sendEvent("ping", { ts: Date.now() });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
