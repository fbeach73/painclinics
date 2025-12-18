import { Heart, Search, Users, Shield } from "lucide-react";
import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About Us | Pain Clinics",
  description:
    "Learn about Pain Clinics, your trusted directory for finding pain management specialists and clinics across the United States.",
};

const values = [
  {
    icon: Search,
    title: "Accessibility",
    description:
      "Making it easy for patients to find qualified pain management specialists in their area.",
  },
  {
    icon: Heart,
    title: "Compassion",
    description:
      "Understanding that chronic pain affects every aspect of life, and timely care matters.",
  },
  {
    icon: Shield,
    title: "Accuracy",
    description:
      "Providing verified, up-to-date information about pain clinics and their services.",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Building connections between patients and the healthcare providers who can help them.",
  },
];

export default function AboutPage() {
  return (
    <main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">About Pain Clinics</h1>
          <p className="text-lg text-foreground/70">
            Connecting patients with pain management specialists across the United States.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-foreground mb-4">
            Pain Clinics was founded with a simple but important mission: to help people suffering from
            chronic pain find the specialized care they need. We believe that everyone deserves access to
            quality pain management, and that finding the right specialist shouldn&apos;t be a painful
            process itself.
          </p>
          <p className="text-foreground">
            Chronic pain affects millions of Americans, impacting their quality of life, work, and
            relationships. Our comprehensive directory aims to bridge the gap between patients and the
            pain management professionals who can help them reclaim their lives.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">What We Do</h2>
          <p className="text-foreground mb-4">
            We maintain an extensive database of pain management clinics and specialists across the
            United States. Our directory includes:
          </p>
          <ul className="list-disc list-inside text-foreground space-y-2 mb-4">
            <li>Pain management physicians and specialists</li>
            <li>Interventional pain clinics</li>
            <li>Physical therapy and rehabilitation centers</li>
            <li>Multidisciplinary pain treatment facilities</li>
            <li>Specialized treatment centers for conditions like fibromyalgia, back pain, and neuropathy</li>
          </ul>
          <p className="text-foreground">
            Each listing provides detailed information including location, contact details, services
            offered, and patient reviews to help you make informed decisions about your care.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Our Values</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {values.map((value) => (
              <Card key={value.title}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{value.title}</h3>
                      <p className="text-sm text-foreground/80">{value.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Our Commitment</h2>
          <p className="text-foreground mb-4">
            We are committed to maintaining the accuracy and completeness of our directory. Our team
            regularly updates clinic information and verifies details to ensure you have access to
            reliable, current data.
          </p>
          <p className="text-foreground">
            If you notice any inaccurate information or would like to suggest a clinic to be added to our
            directory, please don&apos;t hesitate to{" "}
            <a href="/contact" className="text-primary hover:underline">
              contact us
            </a>{" "}
            or{" "}
            <a href="/submit-clinic" className="text-primary hover:underline">
              submit a clinic
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
          <p className="text-foreground mb-4">
            Have questions, suggestions, or feedback? We&apos;d love to hear from you.
          </p>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2 text-foreground">
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:info@painclinics.com" className="text-primary hover:underline">
                    info@painclinics.com
                  </a>
                </p>
                <p>
                  <strong>Contact Form:</strong>{" "}
                  <a href="/contact" className="text-primary hover:underline">
                    Visit our Contact Page
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
