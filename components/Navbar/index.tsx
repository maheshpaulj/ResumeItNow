'use client'
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ThemeSwitch from '../ThemeSwitch';
import { useSession, signOut } from 'next-auth/react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/local-storage';


export default function Navbar() {
    const { data: session } = useSession()
    const router = useRouter();
    const { getSettings, isClient } = useLocalStorage();
    const [settings, setSettings] = useState({
        displayName: session?.user?.name,
        defaultTemplate: 'modern'
      })
    useEffect(() => {
        const localSettings = getSettings();
        if (localSettings) {
            setSettings(localSettings);
        }
    })
    return (
        <nav className="border-b">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                    <div className="flex">
                        <div className="flex flex-shrink-0 items-center">
                            <Link href="/" className="font-bold text-2xl">
                                ResumeItNow
                            </Link>
                        </div>
                    </div>
                    <div className="flex space-x-4 ml-8 items-center">
                            <Button variant="ghost" size="sm" onClick={()=>router.push('/')}>Home</Button>
                            <Button variant="ghost" size="sm" onClick={()=>router.push('/about')}>About</Button>
                            <Button variant="ghost" size="sm" onClick={()=>router.push('/resume/create')}>Generate</Button>
                    </div>
                    <div className='items-center flex space-x-2'>
                        {session ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">{(settings.displayName !== '' ? settings.displayName : session.user?.name)}</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className='w-56'>
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem className='cursor-pointer' onClick={()=>router.push('/profile')}>
                                            Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem  className='cursor-pointer' onClick={()=>router.push('/settings')}>
                                            Settings
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem className='text-red-400 cursor-pointer' onClick={()=>{ localStorage.clear(); signOut({redirect: false}); router.push('/')} }>
                                            Logout
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <>
                                <Button variant="outline" size="sm" className='cursor-pointer' onClick={()=>router.push('/signin')}>Sign In</Button>
                            </>
                        )}
                        <ThemeSwitch />
                    </div>
                </div>
            </div>
        </nav>
    );
}
