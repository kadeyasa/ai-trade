import { NextRequest, NextResponse } from "next/server";
import { getCronSecret } from "@/lib/admin-settings";
import { hasSecret } from "@/lib/env";

export function guardCollector(request: NextRequest) {
  const cronSecret = getCronSecret();
  if (!hasSecret(cronSecret)) return null;
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized collector request" }, { status: 401 });
  }
  return null;
}
