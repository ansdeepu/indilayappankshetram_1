'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, User, Home } from 'lucide-react';
import { TempleIcon } from '@/components/icons/temple-icon';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getAuth, signOut } from 'firebase/auth';

const adminNavLinks = [
  { href: '/admin/bookings', label: 'Bookings & Donations' },
  { href: '/admin/hero', label: 'Edit Hero Section' },
  { href: '/admin/history', label: 'Edit History Section' },
  { href: '/admin/news', label: 'Manage News' },
  { href: '/admin/rituals', label: 'Edit Rituals Page' },
  { href: '/admin/offerings', label: 'Edit Offerings Page' },
  { href: '/admin/gallery', label: 'Edit Gallery Page' },
  { href: '/admin/settings', label: 'Temple Settings' },
  { href: '/admin/payment-settings', label: 'Payment Settings' },
];

export function AdminHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <TempleIcon className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">
              Indilayappan Temple Admin
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Admin Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Manage Content</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {adminNavLinks.map(link => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href}>{link.label}</Link>
                  </DropdownMenuItem>
                ))}
                 <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                    <Link href="/">
                      <Home className="mr-2 h-4 w-4" />
                      <span>Back to Home</span>
                    </Link>
                  </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
