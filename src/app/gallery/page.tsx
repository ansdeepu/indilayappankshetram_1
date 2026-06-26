import { GallerySection } from '@/components/home/gallery-section';
import { SiteFooter } from '@/components/layout/footer';
import { SiteHeader } from '@/components/layout/header';

export default function GalleryPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex flex-col">
        <div className="container mx-auto px-4 py-8 md:py-16">
          <GallerySection />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
