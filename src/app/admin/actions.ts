"use server";

import { revalidatePath } from "next/cache";
import { saveAdminSettings } from "@/lib/admin-settings";

export async function saveSettingsAction(formData: FormData) {
  const openaiApiKey = String(formData.get("openaiApiKey") ?? "").trim();
  const xBearerToken = String(formData.get("xBearerToken") ?? "").trim();
  const coingeckoApiKey = String(formData.get("coingeckoApiKey") ?? "").trim();
  const cronSecret = String(formData.get("cronSecret") ?? "").trim();

  saveAdminSettings({
    ...(openaiApiKey ? { openaiApiKey } : {}),
    ...(xBearerToken ? { xBearerToken } : {}),
    ...(coingeckoApiKey ? { coingeckoApiKey } : {}),
    ...(cronSecret ? { cronSecret } : {}),
    socialAnalysisLimit: Number(formData.get("socialAnalysisLimit") ?? 25),
    newsAnalysisLimit: Number(formData.get("newsAnalysisLimit") ?? 25)
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
}
