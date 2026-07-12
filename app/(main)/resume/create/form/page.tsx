"use client";

import { useSession } from "next-auth/react";
import StepForm from '@/components/resume-builder/StepForm';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

export default function ResumeBuilderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [proceedWithoutSignIn, setProceedWithoutSignIn] = useState(false);

  if (status === "loading") {
    return <div>Loading...</div>; // Optional loading spinner
  }

  // If the user is not signed in and hasn't chosen to proceed
  if (!session && !proceedWithoutSignIn) {
    return (
      <div className="container min-h-screen mx-auto py-10 px-4 max-w-3xl">
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>You are not signed in</AlertTitle>
          <AlertDescription className="mt-2">
            If you continue, your resume will not be saved&#40;you can create
            and download the resume but your resume won&apos;t be saved anywhere, so you might lose it.&#41; Sign In to save your resumes and download/edit them any time!
          </AlertDescription>
          <Button
            variant="outline"
            className="mt-4 mr-2"
            onClick={() => router.push('/signin')}
            size="lg"
          >
            Sign In
          </Button>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setProceedWithoutSignIn(true)}
            size="lg"
          >
            Continue without Signing In
          </Button>
        </Alert>
      </div>
    );
  }

  // If the user is signed in or chose to proceed without signing in
  return (
    <div className="min-h-screen">
      <StepForm />
    </div>
  );
}
