import { CryptoAssetList } from "@/components/dashboard/CryptoAssetList";
import { PageContainer } from "@/components/layout/PageContainer";
import { getCryptoAssets } from "@/services/market/market.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { assets, isFallback } = await getCryptoAssets();

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Pilih Cryptocurrency untuk Dianalisa</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Halaman ini menampilkan daftar market cryptocurrency real. Klik Analisa untuk mengambil data market, social, news,
            dan menjalankan prediction score sesuai konsep dashboard.
          </p>
        </div>
        <CryptoAssetList assets={assets} isFallback={isFallback} />
      </div>
    </PageContainer>
  );
}
