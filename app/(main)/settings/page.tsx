"use client";
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState({
    displayName: '',
    defaultTemplate: 'modern'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!session) {
    router.push('/signin');
    return null;
  }

  // Load settings from Firebase when component mounts
  useEffect(() => {  // eslint-disable-line react-hooks/rules-of-hooks
    const loadSettings = async () => {
      if (!session?.user?.email) return;

      try {
        const docRef = doc(db, 'users', session.user.email, 'settings', 'preferences');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings({
            displayName: data.displayName,
            defaultTemplate: data.defaultTemplate || 'modern'
          });
          
          // Also set to localStorage as backup
          localStorage.setItem('resumeitnow_name', data.displayName);
          localStorage.setItem('resumeitnow_template', data.defaultTemplate);
        } else {
          // If no settings exist, use session name as default
          setSettings(prev => ({
            ...prev,
            displayName: session?.user?.name || ''
          }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
      }
    };

    loadSettings();
  }, [session?.user?.email, session?.user?.name, toast]); // Add dependencies here

  const saveSettings = async () => {
    if (!session?.user?.email) return;

    setLoading(true);
    try {
      // Save to Firebase
      await setDoc(doc(db, 'users', session.user.email, 'settings', 'preferences'), settings);
      
      // Update localStorage
      localStorage.setItem('resumeitnow_name', settings.displayName);
      localStorage.setItem('resumeitnow_template', settings.defaultTemplate);
      
      // Update NextAuth session with new name
      await updateSession({
        ...session,
        user: {
          ...session.user,
          name: settings.displayName
        }
      });

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.clear();
    await signOut({ redirect: false });
    router.push('/');
  };

  const handleAccountDelete = async () => {
    if (!session?.user?.email) return;
    
    setIsDeleting(true);
    try {
      // Delete user data from Firebase
      await deleteDoc(doc(db, `users/${session.user.email}`));
      
      // Clear local storage
      localStorage.clear();
      
      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted. Redirecting...",
      });
      
      // Sign out and redirect after a short delay
      setTimeout(async () => {
        await handleLogout();
      }, 2000);
      
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start">
      <div className="container max-w-3xl py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={settings.displayName}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    displayName: e.target.value
                  }))}
                  placeholder="Your Name"
                />
              </div>
              <Button onClick={saveSettings} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-template">Default Template</Label>
                <Select
                  value={settings.defaultTemplate}
                  onValueChange={(value) => setSettings(prev => ({
                    ...prev,
                    defaultTemplate: value
                  }))}
                >
                  <SelectTrigger id="default-template">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={saveSettings} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Account"
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove all of your data from our servers, including:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>All your saved resumes</li>
                        <li>Personal information</li>
                        <li>Settings and preferences</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleAccountDelete}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="text-sm text-muted-foreground mt-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}