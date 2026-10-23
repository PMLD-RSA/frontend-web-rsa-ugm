import { forwardToBackend } from "@/lib/bffProxy";

export async function GET() {
  const fallbackData = {
    status: "healthy",
    services: {
      bff: "up",
      database: "mock_fallback",
      redis: "mock_fallback",
    },
    websocketClients: 1,
    timestamp: new Date().toISOString(),
  };

  return forwardToBackend("/health", {
    fallbackData,
  });
}
