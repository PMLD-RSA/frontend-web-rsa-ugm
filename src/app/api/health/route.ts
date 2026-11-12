import { forwardToBackend } from "@/lib/bffProxy";

export async function GET() {
  return forwardToBackend("/health", {});
}
