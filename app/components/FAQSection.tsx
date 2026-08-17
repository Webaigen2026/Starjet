"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const BRAND_COLOR = "#020E63";
const BRAND_HOVER_COLOR = "#0A1C9E";

const faqItems: FAQItem[] = [
  {
    id: "find-flight-deals",
    question: "How do I find the best flight deals with StarJet?",
    answer:
      "Use the StarJet flight search to compare available routes, travel dates, and fare options. Flexible travel dates may help you find lower fares.",
  },
  {
    id: "manage-booking",
    question: "How can I manage my StarJet booking?",
    answer:
      "Visit the Manage Booking page and enter your booking reference and last name. From there, you can review your itinerary and access available change or cancellation options.",
  },
  {
    id: "travel-experience",
    question: "What makes StarJet a great travel choice?",
    answer:
      "StarJet focuses on convenient nonstop routes, reliable service, clear travel information, and a simple booking experience for passengers traveling between Haiti and the United States.",
  },
  {
    id: "flight-alerts",
    question: "What are StarJet flight alerts?",
    answer:
      "Flight alerts provide updates about departures, arrivals, delays, schedule changes, and other important information related to your trip.",
  },
  {
    id: "baggage",
    question: "What is included in my baggage allowance?",
    answer:
      "Your baggage allowance depends on your route and fare type. The allowance for your reservation appears during booking and in your confirmation details.",
  },
  {
    id: "check-in",
    question: "When should I check in for my flight?",
    answer:
      "Check-in times may vary by airport and route. Review your booking confirmation for the exact check-in window and arrive early enough to complete baggage drop and security screening.",
  },
];

export default function FAQSection() {
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  function toggleItem(id: string) {
    setOpenItemId((currentId) => (currentId === id ? null : id));
  }

  return (
    <section className="bg-white py-16 dark:bg-[#140227] sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-full px-4 sm:px-6 lg:px-20">
        <div className="mb-10 sm:mb-12">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="section-title max-w-3xl text-[#020E63] dark:text-white">
                Frequently asked questions about StarJet
              </h2>
            </div>
          </div>
        </div>

        <div className="grid gap-x-4 lg:grid-cols-2 lg:gap-x-8">
          {faqItems.map((item) => {
            const isOpen = openItemId === item.id;
            const buttonId = `faq-button-${item.id}`;
            const panelId = `faq-panel-${item.id}`;

            return (
              <article
                key={item.id}
                className="border-b border-[#020E63]/15 dark:border-white/15"
              >
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleItem(item.id)}
                    className="group flex w-full items-center justify-between gap-5 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#020E63] sm:py-6 dark:focus-visible:ring-white"
                  >
                    <span
                      className={`text-sm font-black leading-6 transition-colors duration-200 sm:text-[15px] ${
                        isOpen
                          ? "text-[#020E63] dark:text-white"
                          : "text-gray-900 group-hover:text-[#020E63] dark:text-white/90 dark:group-hover:text-white"
                      }`}
                    >
                      {item.question}
                    </span>

                    <span
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                        isOpen
                          ? "rotate-180 bg-[#020E63]/10 text-[#020E63] dark:bg-white/15 dark:text-white"
                          : "text-gray-700 group-hover:bg-[#020E63]/5 group-hover:text-[#020E63] dark:text-white/80 dark:group-hover:bg-white/10 dark:group-hover:text-white"
                      }`}
                    >
                      <ChevronDown className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </button>
                </h3>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-xl pb-6 pr-10 text-sm leading-7 text-gray-600 sm:text-[15px] dark:text-white/70">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col gap-4 rounded-3xl border border-[#020E63]/10 bg-[#F8F9FF] px-6 py-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/5">
          <div>
            <h3 className="font-black text-[#020E63] dark:text-white">
              Still have questions?
            </h3>

            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-white/70">
              Our support team can help with your reservation or upcoming trip.
            </p>
          </div>

          <Link
            href="/contact"
            className="inline-flex w-fit shrink-0 items-center justify-center rounded-full bg-[#020E63] px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-[#0A1C9E] hover:shadow-lg hover:shadow-[#020E63]/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#020E63]/30"
          >
            Contact support
          </Link>
        </div>
      </div>
    </section>
  );
}