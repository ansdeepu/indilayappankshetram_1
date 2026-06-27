"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, User, LogOut } from "lucide-react";
import { TempleIcon } from "@/components/icons/temple-icon";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { useUser } from "@/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getAuth, signOut } from 'firebase/auth';
import { LoginDialog } from '../auth/login-dialog';
import { ProfileDialog } from '../auth/profile-dialog';


const adminContentLinks = [
  { href: '/admin/hero', label: 'Edit Hero Section' },
  { href: '/admin/history', label: 'Edit History Section' },
  { href: '/admin/rituals', label: 'Edit Rituals Page' },
  { href: '/admin/news', label: 'Manage News' },
  { href: '/admin/offerings', label: 'Edit Offerings Page' },
  { href: '/admin/assets', label: 'Manage Assets' },
  { href: '/admin/gallery', label: 'Edit Gallery Page' },
];

const adminSettingsLinks = [
  { href: '/admin/settings', label: 'Temple Settings' },
  { href: '/admin/payment-settings', label: 'Payment Settings' },
];

const adminBookingsLink = { href: '/admin/bookings', label: 'Bookings & Donations' };

const managerLinks = [
  adminBookingsLink
];


export function SiteHeader() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const { language, setLanguage } = useLanguage();
  const { user, isAdmin, isManager, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = React.useState(false);

  const navLinks = React.useMemo(() => {
    if (loading) return [];
    
    if (user) {
      if (isAdmin) {
        // Admin can see all pages, including report and category
        return [
          { href: "/", labelEn: "Home", labelMl: "ഹോം" },
          { href: "/rituals", labelEn: "Rituals", labelMl: "ആചാരങ്ങൾ" },
          { href: "/news", labelEn: "News & Events", labelMl: "വാർത്തകൾ" },
          { href: "/vazhipadu", labelEn: "Pooja Rates", labelMl: "വഴിപാടുകൾ" },
          { href: "/offerings", labelEn: "Online Seva", labelMl: "ഓൺലൈൻ സേവനം" },
          { href: "/category", labelEn: "Categories", labelMl: "വിഭാഗങ്ങൾ" },
          { href: "/assets", labelEn: "Assets", labelMl: "ആസ്തികൾ" },
          { href: "/income", labelEn: "Income", labelMl: "വരവ്" },
          { href: "/expenditure", labelEn: "Expenditure", labelMl: "ചെലവ്" },
          { href: "/report", labelEn: "Report", labelMl: "റിപ്പോർട്ട്" },
          { href: "/gallery", labelEn: "Gallery", labelMl: "ഗാലറി" },
        ];
      } else {
        // All users except admin can see Home, Income, Expenditure, and Report pages
        return [
          { href: "/", labelEn: "Home", labelMl: "ഹോം" },
          { href: "/assets", labelEn: "Assets", labelMl: "ആസ്തികൾ" },
          { href: "/income", labelEn: "Income", labelMl: "വരവ്" },
          { href: "/expenditure", labelEn: "Expenditure", labelMl: "ചെലവ്" },
          { href: "/report", labelEn: "Report", labelMl: "റിപ്പോർട്ട്" },
        ];
      }
    }
    
    // Public view: hide Categories, Income, Expenditure, and Report, but show Online Seva
    return [
      { href: "/", labelEn: "Home", labelMl: "ഹോം" },
      { href: "/rituals", labelEn: "Rituals", labelMl: "ആചാരങ്ങൾ" },
      { href: "/news", labelEn: "News & Events", labelMl: "വാർത്തകൾ" },
      { href: "/vazhipadu", labelEn: "Pooja Rates", labelMl: "വഴിപാടുകൾ" },
      { href: "/offerings", labelEn: "Online Seva", labelMl: "ഓൺലൈൻ സേവനം" },
      { href: "/assets", labelEn: "Assets", labelMl: "ആസ്തികൾ" },
      { href: "/gallery", labelEn: "Gallery", labelMl: "ഗാലറി" },
    ];
  }, [user, isAdmin, isManager, loading]);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLanguageChange = (lang: 'en' | 'ml') => {
    setLanguage(lang);
  };
  
  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/');
  };

  const siteTitle = language === 'ml' ? 'ഇണ്ടിളയപ്പൻ ക്ഷേത്രം' : 'Indilayappan Temple';

  if (pathname === '/receipt' || pathname === '/admin/login') {
    return null;
  }
  
  if (!isClient) {
    return (
       <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-primary/95 text-primary-foreground backdrop-blur supports-[backdrop-filter]:bg-primary/80">
         <div className="container flex h-16 items-center">
             {/* Render a simplified or empty header on the server */}
         </div>
       </header>
    );
  }
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-primary text-primary-foreground backdrop-blur supports-[backdrop-filter]:bg-primary/95 shadow-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <TempleIcon className="h-10 w-10 text-accent" />
          <div className="flex flex-col">
            <span className="font-headline text-xl font-bold tracking-wide">
              {siteTitle}
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex gap-1 border-r border-primary-foreground/20 pr-4 mr-2">
            <Button
              size="sm"
              variant={language === 'en' ? 'secondary' : 'ghost'}
              onClick={() => handleLanguageChange('en')}
              className={cn('text-xs h-8', language === 'en' ? 'text-secondary-foreground' : 'text-primary-foreground/80 hover:text-primary-foreground')}
            >
              English
            </Button>
            <Button
              size="sm"
              variant={language === 'ml' ? 'secondary' : 'ghost'}
              onClick={() => handleLanguageChange('ml')}
              className={cn('text-xs h-8', language === 'ml' ? 'text-secondary-foreground' : 'text-primary-foreground/80 hover:text-primary-foreground')}
            >
              മലയാളം
            </Button>
          </div>
           {!loading && (
             <div>
               {user ? (
                  <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button variant="secondary" size="sm" className="flex items-center gap-2 h-9">
                       <User className="h-4 w-4" />
                       <span className="hidden xs:inline">
                        {isAdmin ? "Admin" : isManager ? "Manager" : "Devotee"}
                       </span>
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end">
                      {isAdmin && (
                        <>
                          {adminContentLinks.map(link => (
                            <DropdownMenuItem key={link.href} asChild>
                              <Link href={link.href}>{link.label}</Link>
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          {adminSettingsLinks.map(link => (
                             <DropdownMenuItem key={link.href} asChild>
                                 <Link href={link.href}>{link.label}</Link>
                             </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                              <Link href={adminBookingsLink.href}>{adminBookingsLink.label}</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {isManager && (
                        <>
                          {managerLinks.map(link => (
                            <DropdownMenuItem key={link.href} asChild>
                              <Link href={link.href}>{link.label}</Link>
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                        <User className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
               ) : (
                 <LoginDialog isOpen={isLoginOpen} onOpenChange={setIsLoginOpen}>
                    <Button variant="secondary" size="sm" onClick={() => setIsLoginOpen(true)} className="h-9">
                      <User className="mr-2 h-4 w-4" /> Login
                   </Button>
                 </LoginDialog>
               )}
             </div>
           )}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="md:hidden px-2 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0 bg-primary text-primary-foreground border-r-accent/50 w-full max-w-sm">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Indilayappan Temple Navigation Menu</SheetDescription>
              <div className="flex items-center justify-between mb-4 pr-10">
                 <Link
                   href="/"
                   className="flex items-center space-x-2"
                   onClick={(e) => {
                     e.preventDefault();
                     setIsOpen(false);
                     router.push("/");
                   }}
                 >
                  <TempleIcon className="h-8 w-8 text-accent" />
                  <span className="font-headline font-bold">{siteTitle}</span>
                 </Link>
              </div>
              <div className="my-4 h-[1px] bg-accent/30" />
              <nav className="flex flex-col gap-6 pr-6">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        setIsOpen(false);
                        router.push(link.href);
                      }}
                      className={cn(
                        "text-lg font-medium transition-colors hover:text-primary-foreground",
                        isActive ? "text-primary-foreground font-bold" : "text-primary-foreground/80"
                      )}
                    >
                      {language === 'ml' ? link.labelMl : link.labelEn}
                    </Link>
                  )
                })}
              </nav>
               <div className="my-4 h-[1px] bg-accent/30" />
                 <div className="flex gap-4 pr-6">
                  <Button
                    size="sm"
                    variant={language === 'en' ? 'secondary' : 'ghost'}
                    onClick={() => { handleLanguageChange('en'); setIsOpen(false); }}
                     className={cn('w-full', language === 'en' ? 'text-secondary-foreground' : 'text-primary-foreground/80 hover:text-primary-foreground border border-primary-foreground/20')}
                  >
                    English
                  </Button>
                  <Button
                    size="sm"
                    variant={language === 'ml' ? 'secondary' : 'ghost'}
                    onClick={() => { handleLanguageChange('ml'); setIsOpen(false); }}
                     className={cn('w-full', language === 'ml' ? 'text-secondary-foreground' : 'text-primary-foreground/80 hover:text-primary-foreground border border-primary-foreground/20')}
                  >
                    മലയാളം
                  </Button>
                </div>
                 <div className="my-4 h-[1px] bg-accent/30" />
                 <div className="pr-6">
                    {!loading && (
                      <div className="flex flex-col gap-2">
                        {user ? (
                           <>
                             <Button variant="outline" className="w-full text-left justify-start" onClick={() => { setIsProfileOpen(true); setIsOpen(false); }}>
                               <User className="mr-2 h-4 w-4" /> My Profile
                             </Button>
                             <Button variant="secondary" className="w-full" onClick={handleLogout}>
                               <LogOut className="mr-2 h-4 w-4" /> Sign Out
                             </Button>
                           </>
                        ) : (
                           <LoginDialog isOpen={isLoginOpen} onOpenChange={setIsLoginOpen}>
                             <Button variant="secondary" className="w-full" onClick={() => { setIsLoginOpen(true); setIsOpen(false); }}>
                                <User className="mr-2 h-4 w-4" /> Login
                             </Button>
                           </LoginDialog>
                        )}
                      </div>
                    )}
                 </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Navigation on the next row */}
      <div className="hidden md:block bg-black/10 border-t border-primary-foreground/10">
        <div className="container">
          <nav className="flex items-center gap-1 py-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-all rounded-md",
                    isActive 
                      ? "bg-accent text-accent-foreground shadow-sm font-bold" 
                      : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground",
                    language === 'ml' && 'text-xs'
                  )}
                >
                  {language === 'ml' ? link.labelMl : link.labelEn}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      <ProfileDialog isOpen={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </header>
  );
}
