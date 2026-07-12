"use client";
import { Mail } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  platform: string;
  href: string;
  icon: React.JSX.Element;
}

const productLinks: FooterSection = {
  title: "Product",
  links: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Create", href: "/resume/create" },
  ],
};

const supportLinks: FooterSection = {
  title: "Support",
  links: [
    { 
      label: "Contact Dev",
      href: "mailto:mahesh.paul.j@gmail.com",
      external: true
    },
  ],
};

const socialLinks: SocialLink[] = [
  {
    platform: "GitHub",
    href: "https://github.com/maheshpaulj/ResumeItNow",
    icon: <FaGithub className="h-5 w-5" />,
  },
  {
    platform: "Email",
    href: "mailto:mahesh.paul.j@gmail.com",
    icon: <Mail className="h-5 w-5" />,
  },
];

const FooterSection = ({ section }: { section: FooterSection }) => (
  <div className="flex flex-col items-center md:items-start">
    <h3 className="font-semibold mb-2">{section.title}</h3>
    <ul className="space-y-2 text-sm">
      {section.links.map((link) => (
        <li key={link.label}>
          <Link
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noopener noreferrer" : undefined}
            className="text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const SocialLinks = () => (
  <div className="flex flex-col items-center md:items-start col-span-2 md:col-span-1">
    <h3 className="font-semibold mb-2">Connect</h3>
    <div className="flex space-x-4">
      <TooltipProvider>
        {socialLinks.map(({ platform, href, icon }) => (
          <Tooltip key={platform}>
            <TooltipTrigger asChild>
              <Link
                href={href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                {icon}
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>{platform}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  </div>
);

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col md:flex-row items-center justify-between py-8 px-4 md:px-8">
        <div className="flex flex-col items-center md:items-start mb-8 md:mb-0">
          <Link href="/" className="group">
            <h2 className="text-xl font-bold group-hover:opacity-90 transition-opacity">
              ResumeItNow
            </h2>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            Create professional resumes with ease
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="text-sm"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Back to top
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16">
          <FooterSection section={productLinks} />
          <FooterSection section={supportLinks} />
          <SocialLinks />
        </div>
      </div>

      <div className="border-t">
        <div className="container py-4 px-4">
          <p className="text-center text-sm text-muted-foreground">
            © {currentYear} ResumeItNow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}