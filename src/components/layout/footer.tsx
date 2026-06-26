'use client'

import Link from "next/link";
import { TempleIcon } from "@/components/icons/temple-icon";
import { VisitorCounter } from "./visitor-counter";
import { useLanguage } from "@/context/language-context";
import { useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import type { TempleDetails } from "@/lib/types";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Youtube, Facebook, Instagram } from "lucide-react";
import { WhatsappIcon } from "../icons/whatsapp-icon";
import { cn } from "@/lib/utils";

const defaultTempleDetails: TempleDetails = {
  nameEn: 'Indilayappan Temple',
  nameMl: 'ഇണ്ടിളയപ്പൻ ക്ഷേത്രം',
  addressEn: 'Temple Road, Kerala, India',
  addressMl: 'ക്ഷേത്രം റോഡ്, കേരള, ഇന്ത്യ',
  phone1: '',
  phone2: '',
  email: 'contact@indilayappan.org',
  whatsappUrl: '#',
  youtubeUrl: '#',
  facebookUrl: '#',
  instagramUrl: '#'
};

export function SiteFooter() {
  const { language } = useLanguage();
  const firestore = useFirestore();
  const pathname = usePathname();

  const templeDetailsRef = useMemo(() => firestore ? doc(firestore, 'siteSettings', 'templeDetails') : null, [firestore]);
  const { data: templeDetails, loading } = useDoc<TempleDetails>(templeDetailsRef);

  const details = templeDetails || defaultTempleDetails;

  if (pathname === '/receipt') {
    return null;
  }

  const address = (language === 'en' ? details.addressEn : details.addressMl) || '';

  return (
    <footer className="bg-primary text-primary-foreground/80">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-start md:col-span-1">
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <TempleIcon className="h-10 w-10 text-accent" />
              <div>
                <p className="font-headline text-xl font-bold text-primary-foreground">{language === 'en' ? details.nameEn : details.nameMl}</p>
                <p className="text-sm font-body">{language === 'en' ? details.nameMl : details.nameEn}</p>
              </div>
            </Link>
            <p className="text-sm max-w-md">
              {language === 'en'
                ? 'A sacred space for devotees to find peace and spiritual solace. Experience the divine presence and ancient traditions of Kerala.'
                : 'ഭക്തർക്ക് സമാധാനവും ആത്മീയ ആശ്വാസവും കണ്ടെത്താനുള്ള ഒരു പുണ്യസ്ഥലം. കേരളത്തിന്റെ ദിവ്യമായ സാന്നിധ്യവും പുരാതന പാരമ്പര്യങ്ങളും അനുഭവിക്കുക.'}
            </p>
             <div className="flex space-x-4 mt-6">
                {details.whatsappUrl && (
                  <a href={details.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary-foreground">
                    <WhatsappIcon className="h-6 w-6 text-green-500 bg-white rounded-full" />
                  </a>
                )}
                {details.youtubeUrl && (
                  <a href={details.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary-foreground">
                    <Youtube className="h-6 w-6 text-red-600" />
                  </a>
                )}
                {details.facebookUrl && (
                  <a href={details.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary-foreground">
                    <Facebook className="h-6 w-6 text-blue-600" />
                  </a>
                )}
                {details.instagramUrl && (
                  <a href={details.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary-foreground">
                    <Instagram className="h-6 w-6" />
                  </a>
                )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:col-span-2">
            <div>
              <h3 className="font-headline text-lg font-semibold text-primary-foreground mb-4">
                {language === 'en' ? 'Quick Links' : 'ദ്രുത ലിങ്കുകൾ'}
              </h3>
              <ul className="space-y-2">
                <li><Link href="/" className="hover:text-primary-foreground transition-colors">{language === 'en' ? 'Home' : 'ഹോം'}</Link></li>
                <li><Link href="/rituals" className="hover:text-primary-foreground transition-colors">{language === 'en' ? 'Daily Rituals' : 'ദിവസേനയുള്ള ആചാരങ്ങൾ'}</Link></li>
                <li><Link href="/news" className="hover:text-primary-foreground transition-colors">{language === 'en' ? 'News & Events' : 'വാർത്തകൾ'}</Link></li>
                <li><Link href="/vazhipadu" className="hover:text-primary-foreground transition-colors">{language === 'en' ? 'Pooja Rates' : 'പൂജ നിരക്കുകൾ'}</Link></li>
                <li><Link href="/offerings" className="hover:text-primary-foreground transition-colors">{language === 'en' ? 'Online Seva' : 'ഓൺലൈൻ സേവ'}</Link></li>
                <li><Link href="/gallery" className="hover:text-primary-foreground transition-colors">{language === 'en' ? 'Gallery' : 'ഗാലറി'}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-headline text-lg font-semibold text-primary-foreground mb-4">
                 {language === 'en' ? 'Contact' : 'ബന്ധപ്പെടുക'}
              </h3>
              {loading ? <p>Loading contact info...</p> : (
                 <address className="not-italic space-y-2 text-sm">
                  <div>
                      {(templeDetails?.[language === 'en' ? 'addressEn' : 'addressMl'] || '').split('\\n').map((line, index) => <p key={index}>{line}</p>)}
                  </div>
                  {details.phone1 && <p>{language === 'en' ? 'Phone' : 'ഫോൺ'}: {details.phone1}</p>}
                  {details.phone2 && <p>{language === 'en' ? 'Phone 2' : 'ഫോൺ 2'}: {details.phone2}</p>}
                  {details.email && <p>Email: <a href={`mailto:${details.email}`} className="hover:text-primary-foreground transition-colors">{details.email}</a></p>}
                </address>
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-primary-foreground/20 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} {details.nameEn}. All Rights Reserved.</p>
          <div className="flex justify-center items-center gap-4">
            <VisitorCounter />
          </div>
        </div>
      </div>
    </footer>
  );
}
