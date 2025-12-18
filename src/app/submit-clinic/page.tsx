import { CheckCircle2, ClipboardList, Clock, Mail } from "lucide-react";
import { Metadata } from "next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = {
  title: "Submit a Clinic | Pain Clinics",
  description:
    "Submit your pain management clinic to be listed in our directory. Free listing for qualified healthcare providers.",
};

const requirements = [
  "Licensed pain management clinic or practice",
  "Valid business address in the United States",
  "Active phone number and/or website",
  "Pain management services as primary specialty",
];

const processSteps = [
  {
    icon: ClipboardList,
    title: "Submit Information",
    description: "Fill out the form with your clinic details",
  },
  {
    icon: Clock,
    title: "Review Process",
    description: "Our team verifies the information provided",
  },
  {
    icon: CheckCircle2,
    title: "Listing Published",
    description: "Your clinic appears in our directory",
  },
];

export default function SubmitClinicPage() {
  return (
    <main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Submit a Clinic</h1>
          <p className="text-lg text-foreground/70">
            Add your pain management clinic to our free directory and help patients find the care they
            need.
          </p>
        </div>

        <Alert className="mb-8">
          <Mail className="h-4 w-4" />
          <AlertTitle>Free Listing</AlertTitle>
          <AlertDescription>
            Basic listings in our directory are completely free. We believe in connecting patients with
            pain management providers without barriers.
          </AlertDescription>
        </Alert>

        {/* Submission Process */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Submission Process</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {processSteps.map((step, index) => (
              <Card key={step.title}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-primary/10 p-3 mb-3">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-sm font-medium text-foreground/70 mb-1">Step {index + 1}</div>
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-foreground/80">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Submission Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Clinic Information</CardTitle>
                <CardDescription>
                  Please provide accurate information about your pain management clinic.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinicName">Clinic Name *</Label>
                    <Input id="clinicName" placeholder="Pain Management Associates" required />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Name *</Label>
                      <Input id="contactName" placeholder="Dr. Jane Smith" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email *</Label>
                      <Input id="contactEmail" type="email" placeholder="contact@clinic.com" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Input id="address" placeholder="123 Medical Center Dr" required />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" placeholder="Houston" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input id="state" placeholder="TX" maxLength={2} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP Code *</Label>
                      <Input id="zip" placeholder="77001" required />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input id="phone" type="tel" placeholder="(555) 123-4567" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input id="website" type="url" placeholder="https://www.clinic.com" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="services">Services Offered</Label>
                    <Textarea
                      id="services"
                      placeholder="Describe the pain management services your clinic provides (e.g., injections, physical therapy, medication management, etc.)"
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalInfo">Additional Information</Label>
                    <Textarea
                      id="additionalInfo"
                      placeholder="Any other details you'd like to share about your clinic"
                      className="min-h-[80px]"
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Submit Clinic
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    By submitting, you confirm this information is accurate and you are authorized to
                    represent this clinic.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Requirements Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Requirements</CardTitle>
                <CardDescription>To be listed in our directory</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Questions?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-foreground space-y-2">
                <p>
                  Have questions about the submission process or need help with your listing?
                </p>
                <p>
                  <a href="/contact" className="text-primary hover:underline">
                    Contact us
                  </a>{" "}
                  and we&apos;ll be happy to assist.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
