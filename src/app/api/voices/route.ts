import { listElevenLabsVoices } from "@/lib/elevenlabs/client";
import { handleApiError, jsonOk } from "@/lib/security/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const voices = await listElevenLabsVoices();
    return jsonOk({
      provider: "elevenlabs",
      count: voices.length,
      voices,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
