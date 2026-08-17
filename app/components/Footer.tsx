"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Send,
  X,
} from "lucide-react";

import BrandLogo from "./BrandLogo";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

type SocialIcon = (props: { className?: string }) => ReactNode;

interface SocialLink {
  id: string;
  label: string;
  href: string;
  icon: SocialIcon;
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14C17.174 2.097 15.943 2 14.643 2 11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle
        cx="17.5"
        cy="6.5"
        r="1"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M6.94 6.5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0ZM3.5 9h3v12h-3V9Zm6.5 0h2.87v1.64h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.6V21h-3v-6.5c0-1.55-.03-3.54-2.16-3.54-2.16 0-2.49 1.69-2.49 3.43V21h-3V9Z" />
    </svg>
  );
}

const footerColumns: FooterColumn[] = [
  {
    title: "Book",
    links: [
      { label: "Search Flights", href: "/flights" },
      { label: "Manage Booking", href: "/my-trips" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

const legalLinks: FooterLink[] = [];

const socialLinks: SocialLink[] = [
  {
    id: "x",
    label: "X",
    href: "https://x.com",
    icon: X,
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://instagram.com",
    icon: InstagramIcon,
  },
  {
    id: "facebook",
    label: "Facebook",
    href: "https://facebook.com",
    icon: FacebookIcon,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://linkedin.com",
    icon: LinkedinIcon,
  },
];

export default function SiteFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const currentYear = new Date().getFullYear();

  function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      return;
    }

    setSubscribed(true);
    setEmail("");
  }

  return (
    <footer className="relative overflow-hidden bg-white text-gray-700 dark:bg-[#140227] dark:text-white/75">
      {/* Decorative background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#020E63]/5 blur-3xl dark:bg-white/5"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-[#020E63]/5 blur-3xl dark:bg-white/5"
      />

      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-14 sm:px-6 sm:py-16 lg:px-10 lg:py-20 xl:px-16">
        {/* Brand and newsletter */}
        <div className="grid gap-10 pb-12 lg:grid-cols-[1fr_1.05fr] lg:gap-20 lg:pb-16">
          {/* Brand */}
          <div className="max-w-lg">
            <Link
              href="/"
              aria-label="StarJet home"
              className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#020E63] focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:focus-visible:ring-white dark:focus-visible:ring-offset-[#140227]"
            >
              <div className="relative h-22 w-22 sm:h-24 sm:w-24">
                <BrandLogo size={96} />
              </div>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-gray-600 sm:text-base dark:text-white/70">
              Connecting Boston, New York, and South Florida to Cap-Haïtien and
              Port-au-Prince with dependable, nonstop service.
            </p>

            <address className="mt-7 space-y-3 not-italic">
              <ContactLink
                href="tel:+18005551234"
                icon={<Phone className="h-4 w-4" aria-hidden="true" />}
              >
                1-800-555-1234
              </ContactLink>

              <ContactLink
                href="mailto:support@starjet.com"
                icon={<Mail className="h-4 w-4" aria-hidden="true" />}
              >
                support@starjet.com
              </ContactLink>

              <div className="flex items-start gap-3 text-sm leading-6 text-gray-600 dark:text-white/70">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#020E63]/10 text-[#020E63] dark:bg-white/10 dark:text-white">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </span>

                <span>Boston Logan International Airport, Massachusetts</span>
              </div>
            </address>
          </div>

          {/* Newsletter */}
          <div className="rounded-[28px]  p-6 backdrop-blur-sm sm:p-8 dark:border-white/10 dark:bg-white/5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#020E63] dark:text-white/70">
                StarJet offers
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#020E63] sm:text-3xl dark:text-white">
                Get fare alerts
              </h2>

              <p className="mt-2 max-w-lg text-sm leading-7 text-gray-600 dark:text-white/70">
                Receive new route announcements, exclusive promotions, and our
                latest flight offers directly in your inbox.
              </p>
            </div>

            {subscribed ? (
              <div
                role="status"
                aria-live="polite"
                className="mt-6 flex items-start gap-3 rounded-2xl bg-[#020E63]/10 px-4 py-4 text-sm text-[#020E63] dark:bg-white/10 dark:text-white"
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#020E63] text-white dark:bg-white dark:text-[#020E63]">
                  <Check className="h-4 w-4" aria-hidden="true" />
                </span>

                <div>
                  <p className="font-bold">You&apos;re on the list.</p>

                  <p className="mt-1 opacity-80">
                    Watch your inbox for the latest StarJet fare alerts.
                  </p>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                className="mt-6 flex flex-col gap-3 sm:flex-row"
              >
                <div className="relative min-w-0 flex-1">
                  <label htmlFor="footer-email" className="sr-only">
                    Email address
                  </label>

                  <Mail
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/45"
                    aria-hidden="true"
                  />

                  <input
                    id="footer-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email address"
                    className="h-13 w-full rounded-xl border border-[#020E63]/10 bg-white py-3.5 pl-11 pr-4 text-sm font-medium text-gray-950 outline-none transition placeholder:text-gray-400 hover:border-[#020E63]/30 focus:border-[#020E63] focus:ring-4 focus:ring-[#020E63]/10 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/40 dark:hover:border-white/25 dark:focus:border-white dark:focus:ring-white/10"
                  />
                </div>

                <button
                  type="submit"
                  className="group inline-flex min-h-13 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#020E63] px-6 py-3.5 text-sm font-black text-white transition-all duration-200 hover:bg-[#0A1C9E] hover:shadow-lg hover:shadow-[#020E63]/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#020E63]/30 active:scale-[0.98] dark:bg-white dark:text-[#020E63] dark:hover:bg-white/90 dark:hover:shadow-none"
                >
                  Subscribe

                  <Send
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              </form>
            )}

            <p className="mt-3 text-xs leading-5 text-gray-500 dark:text-white/50">
              By subscribing, you agree to receive promotional emails from
              StarJet. You may unsubscribe at any time.
            </p>
          </div>
        </div>

        {/* Footer navigation */}
        <nav
          aria-label="Footer navigation"
          className="grid grid-cols-2 gap-x-6 gap-y-10 border-b border-[#020E63]/10 py-12 sm:grid-cols-4 lg:gap-12 lg:py-14 dark:border-white/10"
        >
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[#020E63] dark:text-white">
                {column.title}
              </h2>

              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.href}`}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1.5 rounded text-sm leading-6 text-gray-600 transition-colors duration-200 hover:text-[#020E63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#020E63] dark:text-white/65 dark:hover:text-white dark:focus-visible:ring-white"
                    >
                      <span>{link.label}</span>

                      <ChevronRight
                        className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="flex flex-col gap-7 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-500 dark:text-white/50">
              © {currentYear} StarJet. All rights reserved.
            </p>

            {legalLinks.length > 0 && (
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded text-xs font-medium text-gray-500 transition-colors hover:text-[#020E63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#020E63] sm:text-sm dark:text-white/50 dark:hover:text-white dark:focus-visible:ring-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              aria-label="Change language and region"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-[#020E63]/10 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition duration-200 hover:border-[#020E63] hover:bg-[#020E63]/10 hover:text-[#020E63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#020E63] dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:border-white/30 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white"
            >
              <Globe2
                className="h-4 w-4 text-[#020E63] dark:text-white"
                aria-hidden="true"
              />

              English (US)
            </button>

            <div
              className="flex items-center gap-2"
              aria-label="StarJet social media"
            >
              {socialLinks.map(({ id, label, href, icon: Icon }) => (
                <a
                  key={id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow StarJet on ${label}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#020E63]/10 bg-white text-gray-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#020E63] hover:bg-[#020E63] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#020E63] dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:border-white dark:hover:bg-white dark:hover:text-[#020E63] dark:focus-visible:ring-white"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ContactLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="group flex w-fit items-center gap-3 rounded text-sm text-gray-600 transition-colors duration-200 hover:text-[#020E63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#020E63] dark:text-white/70 dark:hover:text-white dark:focus-visible:ring-white"
    >
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#020E63]/10 text-[#020E63] transition-colors duration-200 group-hover:bg-[#020E63] group-hover:text-white dark:bg-white/10 dark:text-white dark:group-hover:bg-white dark:group-hover:text-[#020E63]">
        {icon}
      </span>

      <span>{children}</span>
    </a>
  );
}