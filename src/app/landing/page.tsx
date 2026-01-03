"use client";

import Link from "next/link";
import {
  MapPin,
  Search,
  Star,
  Clock,
  Shield,
  Users,
  Phone,
  CheckCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { FloatingNav } from "@/components/ui/floating-navbar";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { LampContainer } from "@/components/ui/lamp";
import { Button } from "@/components/ui/moving-border";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";

// Navigation items
const navItems = [
  { name: "Features", link: "#features" },
  { name: "Testimonials", link: "#testimonials" },
  { name: "Find Clinics", link: "/pain-management" },
];

// Typewriter words
const words = [
  { text: "Find" },
  { text: "Pain" },
  { text: "Relief" },
  { text: "Near", className: "text-primary" },
  { text: "You.", className: "text-primary" },
];

// Feature items for bento grid
const features = [
  {
    title: "5,000+ Verified Clinics",
    description:
      "Access the largest database of pain management specialists across all 50 states.",
    header: (
      <div className="flex h-full min-h-[6rem] w-full items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
        <MapPin className="h-12 w-12 text-primary" />
      </div>
    ),
    icon: <MapPin className="h-4 w-4 text-primary" />,
    className: "md:col-span-2",
  },
  {
    title: "Smart Search",
    description:
      "Filter by treatment type, insurance, distance, and patient ratings.",
    header: (
      <div className="flex h-full min-h-[6rem] w-full items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5">
        <Search className="h-12 w-12 text-cyan-500" />
      </div>
    ),
    icon: <Search className="h-4 w-4 text-cyan-500" />,
  },
  {
    title: "Patient Reviews",
    description: "Real reviews from verified patients to help you decide.",
    header: (
      <div className="flex h-full min-h-[6rem] w-full items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5">
        <Star className="h-12 w-12 text-yellow-500" />
      </div>
    ),
    icon: <Star className="h-4 w-4 text-yellow-500" />,
  },
  {
    title: "Instant Appointments",
    description:
      "Book appointments online with clinics that have same-day availability.",
    header: (
      <div className="flex h-full min-h-[6rem] w-full items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5">
        <Clock className="h-12 w-12 text-green-500" />
      </div>
    ),
    icon: <Clock className="h-4 w-4 text-green-500" />,
    className: "md:col-span-2",
  },
];

// Testimonials
const testimonials = [
  {
    quote:
      "After years of chronic back pain, I finally found a specialist through Pain Clinics who changed my life. The search was so easy.",
    name: "Sarah M.",
    title: "Phoenix, AZ",
  },
  {
    quote:
      "I was able to compare multiple pain management doctors in my area and read real patient reviews. Found the perfect fit within minutes.",
    name: "James T.",
    title: "Austin, TX",
  },
  {
    quote:
      "The filtering options made it easy to find a clinic that accepts my insurance and specializes in my condition. Highly recommend!",
    name: "Maria G.",
    title: "Miami, FL",
  },
  {
    quote:
      "As someone with fibromyalgia, finding the right specialist felt impossible until I discovered this directory. Game changer.",
    name: "David L.",
    title: "Seattle, WA",
  },
  {
    quote:
      "The verified reviews gave me confidence in my choice. My new pain management doctor is incredible.",
    name: "Jennifer K.",
    title: "Denver, CO",
  },
];

// Stats
const stats = [
  { value: "5,000+", label: "Verified Clinics" },
  { value: "50", label: "States Covered" },
  { value: "100K+", label: "Patients Helped" },
  { value: "4.8", label: "Average Rating" },
];

export default function LandingPage() {
  return (
    <div className="relative w-full overflow-x-hidden">
      {/* Floating Navigation */}
      <FloatingNav navItems={navItems} />

      {/* Hero Section with Lamp Effect */}
      <LampContainer className="min-h-screen pt-20">
        <motion.div
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="flex flex-col items-center"
        >
          <TypewriterEffectSmooth words={words} />
          <p className="mx-auto mt-4 max-w-xl text-center text-base text-neutral-300 md:text-lg">
            The most comprehensive directory of pain management specialists in
            the United States. Find relief today.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button
              as={Link}
              href="/pain-management"
              containerClassName="h-14 w-48"
              className="text-base font-semibold"
            >
              Find a Clinic
            </Button>
            <Link
              href="#features"
              className="flex h-14 items-center justify-center rounded-full border border-white/20 px-8 text-base font-medium text-white transition-colors hover:bg-white/10"
            >
              Learn More
            </Link>
          </div>
        </motion.div>
      </LampContainer>

      {/* Stats Section */}
      <section className="relative z-10 -mt-32 bg-gradient-to-b from-slate-950 to-background py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary md:text-5xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-muted-foreground md:text-base">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section id="features" className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold md:text-4xl">
              Everything You Need to Find Relief
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Our platform makes it easy to find, compare, and connect with pain
              management specialists.
            </p>
          </motion.div>
          <BentoGrid>
            {features.map((feature, i) => (
              <BentoGridItem
                key={i}
                title={feature.title}
                description={feature.description}
                header={feature.header}
                icon={feature.icon}
                className={feature.className}
              />
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-muted/50 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-12 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold md:text-4xl">
                Why Choose Pain Clinics?
              </h2>
              <p className="mt-4 text-muted-foreground">
                We&apos;re committed to helping you find the right pain
                management specialist for your unique needs.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Verified clinic information and credentials",
                  "Real patient reviews and ratings",
                  "Comprehensive treatment information",
                  "Easy online appointment booking",
                  "Insurance compatibility filters",
                  "Same-day availability options",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="rounded-2xl bg-card p-6 shadow-lg">
                <Shield className="h-10 w-10 text-primary" />
                <h3 className="mt-4 font-semibold">Verified Providers</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  All clinics are verified for accuracy and legitimacy.
                </p>
              </div>
              <div className="rounded-2xl bg-card p-6 shadow-lg">
                <Users className="h-10 w-10 text-cyan-500" />
                <h3 className="mt-4 font-semibold">Patient Community</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Join thousands finding relief every day.
                </p>
              </div>
              <div className="rounded-2xl bg-card p-6 shadow-lg">
                <Phone className="h-10 w-10 text-green-500" />
                <h3 className="mt-4 font-semibold">Direct Contact</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Connect directly with clinics instantly.
                </p>
              </div>
              <div className="rounded-2xl bg-card p-6 shadow-lg">
                <Star className="h-10 w-10 text-yellow-500" />
                <h3 className="mt-4 font-semibold">Top Rated</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Find the highest-rated specialists near you.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold md:text-4xl">
              What Our Users Say
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Real stories from people who found the right pain management
              specialist through our directory.
            </p>
          </motion.div>
        </div>
        <div className="flex justify-center">
          <InfiniteMovingCards
            items={testimonials}
            direction="left"
            speed="slow"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-950 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Ready to Find Relief?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-neutral-300">
              Search our directory of 5,000+ pain management specialists and
              take the first step toward a pain-free life.
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                as={Link}
                href="/pain-management"
                containerClassName="h-16 w-56"
                className="text-lg font-semibold"
              >
                Search Clinics Now
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-xl font-bold">Pain Clinics</div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground">
                About
              </Link>
              <Link href="/faq" className="hover:text-foreground">
                FAQ
              </Link>
              <Link href="/contact" className="hover:text-foreground">
                Contact
              </Link>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Pain Clinics. All rights
              reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
