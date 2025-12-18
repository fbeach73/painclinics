import { Clock, Mail, MapPin } from "lucide-react";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = {
  title: "Contact Us | Pain Clinics",
  description:
    "Get in touch with the Pain Clinics team. We're here to help with questions about our directory, clinic submissions, and more.",
};

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    details: "info@painclinics.com",
    description: "We typically respond within 1-2 business days",
  },
  {
    icon: MapPin,
    title: "Address",
    details: "United States",
    description: "Pain Clinics is a digital-first company",
  },
  {
    icon: Clock,
    title: "Business Hours",
    details: "Monday - Friday",
    description: "9:00 AM - 5:00 PM EST",
  },
];

export default function ContactPage() {
  return (
    <main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
          <p className="text-lg text-foreground/70">
            Have a question or feedback? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
              <CardDescription>
                Fill out the form below and we&apos;ll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="How can we help?" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us more about your inquiry..."
                    className="min-h-[120px]"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Send Message
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  By submitting this form, you agree to our{" "}
                  <a href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                  .
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Other Ways to Reach Us</h2>
              <div className="space-y-4">
                {contactInfo.map((item) => (
                  <Card key={item.title}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-4">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="text-sm font-medium text-foreground">{item.details}</p>
                          <p className="text-sm text-foreground/80">{item.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Specific Inquiries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground">
                  <strong>Clinic Submissions:</strong> Want to add your clinic to our directory? Visit our{" "}
                  <a href="/submit-clinic" className="text-primary hover:underline">
                    Submit a Clinic
                  </a>{" "}
                  page.
                </p>
                <p className="text-sm text-foreground">
                  <strong>Advertising:</strong> Interested in advertising opportunities? Check out our{" "}
                  <a href="/advertise" className="text-primary hover:underline">
                    Advertise With Us
                  </a>{" "}
                  page.
                </p>
                <p className="text-sm text-foreground">
                  <strong>Corrections:</strong> Found incorrect information about a clinic? Please include
                  the clinic name and specific details that need updating in your message.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
