
import { HeroSection } from '@/components/home/hero-section';
import { HistorySection } from '@/components/home/history-section';
import { SiteFooter } from '@/components/layout/footer';
import { SiteHeader } from '@/components/layout/header';
import { TraditionalDivider } from '@/components/ui/traditional-divider';


export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex flex-col">
        <HeroSection />
        <div className="container mx-auto px-4 py-8 md:py-16 space-y-16 md:space-y-24">
          <HistorySection />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
