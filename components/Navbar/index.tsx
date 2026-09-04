"use client";

import { useEffect, useRef, useState } from 'react';
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
  const [atTop, setAtTop] = useState(true);
  const [navHovered, setNavHovered] = useState(false);
  const [navFocused, setNavFocused] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
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

  // The compact nav is useful while reading, but the page header should feel
  // intentional when the visitor first lands at the top of a page.
  useEffect(() => {
    const updateScrollState = () => setAtTop(window.scrollY < 8);
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  const expanded = atTop || navHovered || navFocused || accountMenuOpen;

  // Keep sticky controls aligned with the navbar's real current height. This
  // avoids reserving full-nav space while the navbar is in its compact state.
  useEffect(() => {
    document.documentElement.style.setProperty('--app-nav-height', expanded ? '4rem' : '2.25rem');
    return () => {
      document.documentElement.style.removeProperty('--app-nav-height');
    };
  }, [expanded]);

  // Radix returns focus to the account trigger when a menu closes. That is
  // useful for accessibility, but should not leave the navigation expanded
  // after the visitor has clicked back into the page.
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        setNavFocused(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, []);

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

  const UserMenu = ({ maintainNav = false }: { maintainNav?: boolean }) => (
    <DropdownMenu
      {...(maintainNav ? { open: accountMenuOpen, onOpenChange: setAccountMenuOpen } : {})}
    >
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
    <nav
      ref={navRef}
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      onMouseEnter={() => setNavHovered(true)}
      onMouseLeave={() => setNavHovered(false)}
      onFocusCapture={() => setNavFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setNavFocused(false);
        }
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`flex h-16 items-center justify-between transition-[height] duration-300 ease-out ${expanded ? 'md:h-16' : 'md:h-9'}`}>
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className={`flex items-center space-x-2 font-bold transition-all duration-300 hover:opacity-90 text-2xl ${expanded ? 'md:text-2xl' : 'md:text-base'}`}
            >
              ResumeItNow
            </Link>
          </div>
          <div className={`hidden md:flex md:gap-2 origin-center transition-transform duration-300 ${expanded ? 'md:scale-100' : 'md:scale-90'}`}>
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  variant="ghost"
                  size="sm"
                  className={`transition-[height] duration-300 ${expanded ? 'md:h-9' : 'md:h-7'}`}
                  onClick={() => navigateTo(link.href)}
                >
                  {link.title}
                </Button>
              ))}
          </div>
          <div className={`flex items-center gap-4 origin-right transition-transform duration-300 ${expanded ? 'md:scale-100' : 'md:scale-90'}`}>
            <div className="hidden md:flex md:items-center md:gap-4">
              {session ? (
                <UserMenu maintainNav />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className={`transition-[height] duration-300 ${expanded ? 'md:h-9' : 'md:h-7'}`}
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
