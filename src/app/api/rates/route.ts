import { fetchExchangeSnapshot } from "@/lib/currency";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const snapshot = await fetchExchangeSnapshot();
    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible de charger les taux.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
