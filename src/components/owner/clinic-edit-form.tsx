"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Phone,
  Globe,
  MapPin,
  Clock,
  FileText,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Save,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClinicEditFormProps {
  clinic: {
    id: string;
    title: string;
    phone: string | null;
    phones: string[] | null;
    website: string | null;
    emails: string[] | null;
    streetAddress: string | null;
    city: string;
    state: string;
    postalCode: string;
    clinicHours: unknown;
    closedOn: string | null;
    content: string | null;
    facebook: string | null;
    instagram: string | null;
    twitter: string | null;
    youtube: string | null;
    linkedin: string | null;
    tiktok: string | null;
    pinterest: string | null;
  };
}

const daysOfWeek = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function ClinicEditForm({ clinic }: ClinicEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contact Info
  const [phone, setPhone] = useState(clinic.phone || "");
  const [additionalPhones, setAdditionalPhones] = useState<string[]>(
    clinic.phones || []
  );
  const [website, setWebsite] = useState(clinic.website || "");
  const [emails, setEmails] = useState<string[]>(clinic.emails || []);

  // Address
  const [streetAddress, setStreetAddress] = useState(clinic.streetAddress || "");
  const [city, setCity] = useState(clinic.city);
  const [state, setState] = useState(clinic.state);
  const [postalCode, setPostalCode] = useState(clinic.postalCode);

  // Hours
  const [hours, setHours] = useState<Record<string, string>>(
    (clinic.clinicHours as Record<string, string>) || {}
  );
  const [closedOn, setClosedOn] = useState(clinic.closedOn || "");

  // Content
  const [content, setContent] = useState(clinic.content || "");

  // Social
  const [facebook, setFacebook] = useState(clinic.facebook || "");
  const [instagram, setInstagram] = useState(clinic.instagram || "");
  const [twitter, setTwitter] = useState(clinic.twitter || "");
  const [youtube, setYoutube] = useState(clinic.youtube || "");
  const [linkedin, setLinkedin] = useState(clinic.linkedin || "");
  const [tiktok, setTiktok] = useState(clinic.tiktok || "");
  const [pinterest, setPinterest] = useState(clinic.pinterest || "");

  const handleAddPhone = () => {
    setAdditionalPhones([...additionalPhones, ""]);
  };

  const handleRemovePhone = (index: number) => {
    setAdditionalPhones(additionalPhones.filter((_, i) => i !== index));
  };

  const handlePhoneChange = (index: number, value: string) => {
    const updated = [...additionalPhones];
    updated[index] = value;
    setAdditionalPhones(updated);
  };

  const handleAddEmail = () => {
    setEmails([...emails, ""]);
  };

  const handleRemoveEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleEmailChange = (index: number, value: string) => {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);
  };

  const handleHoursChange = (day: string, value: string) => {
    setHours({ ...hours, [day]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/owner/clinics/${clinic.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone || null,
          phones: additionalPhones.filter((p) => p.trim()),
          website: website || null,
          emails: emails.filter((e) => e.trim()),
          streetAddress: streetAddress || null,
          city,
          state,
          postalCode,
          clinicHours: Object.keys(hours).length > 0 ? hours : null,
          closedOn: closedOn || null,
          content: content || null,
          facebook: facebook || null,
          instagram: instagram || null,
          twitter: twitter || null,
          youtube: youtube || null,
          linkedin: linkedin || null,
          tiktok: tiktok || null,
          pinterest: pinterest || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update clinic");
      }

      toast.success("Clinic updated successfully");
      router.push(`/my-clinics/${clinic.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update clinic");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="contact" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="address">Address</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        {/* Contact Tab */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Update your clinic&apos;s contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Primary Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Additional Phone Numbers</Label>
                {additionalPhones.map((p, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={p}
                      onChange={(e) => handlePhoneChange(index, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRemovePhone(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={handleAddPhone}>
                  Add Phone Number
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://www.example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Email Addresses</Label>
                {emails.length === 0 && (
                  <p className="text-sm text-muted-foreground">No email addresses added yet.</p>
                )}
                {emails.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="contact@example.com"
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRemoveEmail(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={handleAddEmail}>
                  Add Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Address Tab */}
        <TabsContent value="address">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address
              </CardTitle>
              <CardDescription>
                Update your clinic&apos;s location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input
                  id="streetAddress"
                  placeholder="123 Main Street"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    placeholder="12345"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Business Hours
              </CardTitle>
              <CardDescription>
                Set your clinic&apos;s operating hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {daysOfWeek.map((day) => (
                <div key={day} className="grid gap-4 grid-cols-[120px_1fr]">
                  <Label className="capitalize self-center">{day}</Label>
                  <Input
                    placeholder="9:00 AM - 5:00 PM or Closed"
                    value={hours[day] || ""}
                    onChange={(e) => handleHoursChange(day, e.target.value)}
                  />
                </div>
              ))}

              <div className="space-y-2 pt-4">
                <Label htmlFor="closedOn">Holidays/Special Closures</Label>
                <Input
                  id="closedOn"
                  placeholder="Closed on major holidays"
                  value={closedOn}
                  onChange={(e) => setClosedOn(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                About Your Clinic
              </CardTitle>
              <CardDescription>
                Describe your clinic and the services you offer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Description</Label>
                <Textarea
                  id="content"
                  placeholder="Tell potential patients about your clinic, your team, and what makes your practice unique..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                />
                <p className="text-sm text-muted-foreground">
                  {content.split(/\s+/).filter(Boolean).length} words
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Social Media Links
              </CardTitle>
              <CardDescription>
                Add your clinic&apos;s social media profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facebook" className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Label>
                <Input
                  id="facebook"
                  type="url"
                  placeholder="https://facebook.com/yourclinic"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  type="url"
                  placeholder="https://instagram.com/yourclinic"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter / X
                </Label>
                <Input
                  id="twitter"
                  type="url"
                  placeholder="https://twitter.com/yourclinic"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube" className="flex items-center gap-2">
                  <Youtube className="h-4 w-4" />
                  YouTube
                </Label>
                <Input
                  id="youtube"
                  type="url"
                  placeholder="https://youtube.com/yourclinic"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  type="url"
                  placeholder="https://linkedin.com/company/yourclinic"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok">TikTok</Label>
                <Input
                  id="tiktok"
                  type="url"
                  placeholder="https://tiktok.com/@yourclinic"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pinterest">Pinterest</Label>
                <Input
                  id="pinterest"
                  type="url"
                  placeholder="https://pinterest.com/yourclinic"
                  value={pinterest}
                  onChange={(e) => setPinterest(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Button */}
      <div className="flex justify-end gap-4 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/my-clinics/${clinic.id}`)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
