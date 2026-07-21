"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import ThemeSwitch from '../ThemeSwitch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

interface Settings {
  displayName: string | null | undefined;
  defaultTemplate: string;
}

interface NavLink {
  title: string;
  href: string;
}

const navLinks: NavLink[] = [
  { title: 'Home', href: '/' },
  { title: 'About', href: '/about' },
  { title: 'Create', href: '/resume/create' },
  { title: 'ATS Checker(beta)', href: '/ats-checker' },
];

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    displayName: '',
    defaultTemplate: 'modern'
  });

  useEffect(() => {
    setMounted(true);
    setSettings({
      displayName: window.localStorage.getItem("resumeitnow_name") || session?.user?.name,
      defaultTemplate: window.localStorage.getItem("resumeitnow_template") || 'modern'
    });
  }, [session]);

  if (!mounted) return null;

  const handleSignOut = async () => {
    localStorage.clear();
    await signOut({ redirect: false });
    router.push('/');
  };

  const navigateTo = (href: string) => {
    setSheetOpen(false); // Close the sheet
    router.push(href);
  };

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full md:w-auto">
          {settings.displayName || session?.user?.name || 'User'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer" onClick={() => navigateTo('/profile')}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => navigateTo('/settings')}>
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-400 cursor-pointer" onClick={handleSignOut}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const MobileMenu = () => (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <nav className="flex flex-col gap-4">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigateTo(link.href)}
            >
              {link.title}
            </Button>
          ))}
          <div className="mt-4">
            {session ? (
              <UserMenu />
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigateTo('/signin')}
              >
                Sign In
              </Button>
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );

  return (
    // Compact by default on desktop; hovering anywhere on the bar expands it.
    // Mobile has no hover, so it keeps the full height there.
    <nav className="group sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between transition-[height] duration-300 ease-out md:h-9 md:group-hover:h-16 md:group-focus-within:h-16">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center space-x-2 font-bold transition-all duration-300 hover:opacity-90 text-2xl md:text-base md:group-hover:text-2xl md:group-focus-within:text-2xl"
            >
              ResumeItNow
            </Link>
          </div>
          <div className="hidden md:flex md:gap-2 origin-center transition-transform duration-300 md:scale-90 md:group-hover:scale-100 md:group-focus-within:scale-100">
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  variant="ghost"
                  size="sm"
                  className="md:h-7 md:group-hover:h-9 md:group-focus-within:h-9 transition-[height] duration-300"
                  onClick={() => navigateTo(link.href)}
                >
                  {link.title}
                </Button>
              ))}
          </div>
          <div className="flex items-center gap-4 origin-right transition-transform duration-300 md:scale-90 md:group-hover:scale-100 md:group-focus-within:scale-100">
            <div className="hidden md:flex md:items-center md:gap-4">
              {session ? (
                <UserMenu />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="md:h-7 md:group-hover:h-9 md:group-focus-within:h-9 transition-[height] duration-300"
                  onClick={() => navigateTo('/signin')}
                >
                  Sign In
                </Button>
              )}
            </div>
            <ThemeSwitch />
            <MobileMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}