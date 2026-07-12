"use client";
import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Layout,
  Rocket
} from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import Link from "next/link"
import type { FC } from 'react'
import Image from 'next/image'
import CountUp from 'react-countup'

interface ResumeCount {
  count: number
}

async function getResumesCreated(): Promise<number> {
  try {
    const infoDoc = await getDoc(doc(db, "info", "resumesCreated"));
    return infoDoc.exists() ? (infoDoc.data() as ResumeCount).count : 0;
  } catch (error) {
    console.error("Error fetching resumes count:", error);
    return 0;
  }
}

const FeatureCard: FC<{
  icon: React.ReactNode;
  title: string;
  features: string[];
}> = ({ icon, title, features }) => (
  <Card className="transition-all duration-300 hover:shadow-lg">
    <CardHeader>
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <CardTitle className="text-xl">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            {feature}
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const TemplateTabs: FC<{ templates: string[] }> = ({ templates }) => (
  <Tabs defaultValue="modern" className="w-full max-w-3xl">
    <TabsList className="grid w-full grid-cols-3">
      {templates.map((template) => (
        <TabsTrigger key={template} value={template.toLowerCase()}>
          {template}
        </TabsTrigger>
      ))}
    </TabsList>
    {templates.map((template) => (
      <TabsContent key={template} value={template.toLowerCase()}>
        <Card>
          <CardContent className="p-6">
            <div className="aspect-[1366/2739] rounded-lg bg-muted flex items-center justify-center">
              <Image src={`/assets/${template}.png`} alt={template} width={720} height={368} />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    ))}
  </Tabs>
);

export default function HomePage() {
  const templatesRef = useRef<HTMLDivElement>(null);
  const [resumesCreated, setResumesCreated] = useState(0);
  const templates = ["Modern", "Professional", "Minimal"];

  useEffect(() => {
    const fetchResumesCount = async () => {
      const count = await getResumesCreated();
      setResumesCreated(count);
    };
    fetchResumesCount();
  }, []);

  const scrollToTemplates = () => {
    templatesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-24 text-center bg-gradient-to-b from-background to-muted">
        <div className="space-y-2 mb-6">
          <Badge className="mb-4" variant="secondary">
            100% Free & Open Source
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Create Your Perfect Resume
          </h1>
          <p className="text-xl text-muted-foreground max-w-[750px]">
            Free, open-source resume builder powered by AI. No watermarks, no hidden fees.
          </p>
        </div>

        <div className="flex flex-col sm:items-center sm:flex-row gap-4 mb-12">
          <Link 
            href="/resume/create" 
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-2 text-lg font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Button variant="outline" size="lg" onClick={scrollToTemplates}>
            View Templates
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-primary">
            <CountUp
                start={0}
                end={resumesCreated}
                duration={2.5}
                separator=","
              />+
            </p>
            <p className="text-sm text-muted-foreground">Resumes Created</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">100%</p>
            <p className="text-sm text-muted-foreground">Free Forever</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">ATS</p>
            <p className="text-sm text-muted-foreground">Optimized</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">MIT</p>
            <p className="text-sm text-muted-foreground">Licensed</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/50 flex flex-col items-center">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose ResumeItNow?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built with modern tools and designed for everyone. Create professional resumes 
              without the hassle of watermarks or hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Layout className="h-6 w-6 text-primary" />}
              title="Professional Templates"
              features={[
                "ATS-friendly designs",
                "Multiple layout options",
                "Customizable sections",
                "Print-ready formats"
              ]}
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6 text-primary" />}
              title="AI-Powered"
              features={[
                "Smart content suggestions",
                "Auto Generate Content",
                "Keyword optimization",
                "Powered by Llama 3.1"
              ]}
            />
            <FeatureCard
              icon={<Rocket className="h-6 w-6 text-primary" />}
              title="Built for Everyone"
              features={[
                "No sign-up required",
                "100% free, forever",
                "Export to PDF",
                "Open-source code"
              ]}
            />
          </div>
        </div>
      </section>

      {/* Templates Preview */}
      <section ref={templatesRef} className="py-24 scroll-mt-16 flex flex-col items-center">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Professional Templates</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose from our collection of ATS-optimized templates designed to help you 
              stand out while ensuring compatibility with applicant tracking systems.
            </p>
          </div>

          <div className="flex justify-center">
            <TemplateTabs templates={templates} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground flex flex-col items-center">
        <div className="container px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Create Your Professional Resume?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of job seekers who have successfully created their resumes using 
            our platform. No credit card required, no hidden fees.
          </p>
          <Link 
            href="/resume/create"
            className="inline-flex items-center justify-center rounded-md bg-background text-primary px-8 py-2 text-lg font-medium shadow transition-colors hover:bg-background/90"
          >
            Create Your Resume Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}