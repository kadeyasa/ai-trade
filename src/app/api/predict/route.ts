import { NextRequest, NextResponse } from "next/server";
import { createPrediction } from "@/lib/scoring";
import { getCoinAnalysisMarket, getCryptoAssets } from "@/services/market/market.service";
import { getNewsForToken } from "@/services/news/news.service";
import { collectPrediction, getPrediction } from "@/services/prediction/prediction.service";
import { getSocialForToken } from "@/services/social/social.service";

export async function GET(request: NextRequest) {
  const coinId = request.nextUrl.searchParams.get("coinId");
  if (coinId) {
    const asset = (await getCryptoAssets()).assets.find((item) => item.id === coinId);
    const token = {
      name: asset?.name ?? coinId,
      symbol: asset?.symbol ?? coinId,
      contractAddress: ""
    };
    const [market, social, news] = await Promise.all([
      getCoinAnalysisMarket(coinId),
      getSocialForToken(token),
      getNewsForToken(token)
    ]);
    return NextResponse.json({ prediction: createPrediction({ market, social: social.trend, news }) });
  }

  const prediction = await getPrediction();
  return NextResponse.json({ prediction });
}

export async function POST() {
  const prediction = await collectPrediction();
  return NextResponse.json({ prediction });
}
