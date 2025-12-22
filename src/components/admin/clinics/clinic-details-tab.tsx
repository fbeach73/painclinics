"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  Clock,
  Loader2,
  MapPin,
  Phone,
  Save,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// US States for dropdown
const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "DC", label: "District of Columbia" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

const CLINIC_TYPES = [
  { value: "pain_management", label: "Pain Management" },
  { value: "orthopedic", label: "Orthopedic" },
  { value: "chiropractic", label: "Chiropractic" },
  { value: "physical_therapy", label: "Physical Therapy" },
  { value: "neurology", label: "Neurology" },
  { value: "rehabilitation", label: "Rehabilitation" },
  { value: "interventional", label: "Interventional Pain" },
  { value: "anesthesiology", label: "Anesthesiology" },
  { value: "other", label: "Other" },
];

interface ClinicData {
  id: string;
  title: string;
  clinicType: string | null;
  permalink: string;
  streetAddress: string | null;
  city: string;
  state: string;
  stateAbbreviation: string | null;
  postalCode: string;
  mapLatitude: number;
  mapLongitude: number;
  detailedAddress: string | null;
  phone: string | null;
  website: string | null;
  emails: string[] | null;
  googleListingLink: string | null;
  // Social media
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  youtube: string | null;
  linkedin: string | null;
  tiktok: string | null;
  pinterest: string | null;
  // Hours
  clinicHours: unknown;
  closedOn: string | null;
  // Rating (for display/override)
  rating: number | null;
  reviewCount: number | null;
}

interface ClinicDetailsTabProps {
  clinicId: string;
  initialData: ClinicData;
}

export function ClinicDetailsTab({ clinicId, initialData }: ClinicDetailsTabProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ClinicData>(initialData);

  // Reset form when initial data changes
  useEffect(() => {
    setFormData(initialData);
    setHasUnsavedChanges(false);
  }, [initialData]);

  const handleInputChange = (field: keyof ClinicData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Prepare update payload
      const updates: Record<string, unknown> = {
        title: formData.title,
        clinicType: formData.clinicType || null,
        streetAddress: formData.streetAddress || null,
        city: formData.city,
        state: formData.state,
        stateAbbreviation: formData.stateAbbreviation,
        postalCode: formData.postalCode,
        mapLatitude: parseFloat(String(formData.mapLatitude)),
        mapLongitude: parseFloat(String(formData.mapLongitude)),
        detailedAddress: formData.detailedAddress || null,
        phone: formData.phone || null,
        website: formData.website || null,
        emails: formData.emails || null,
        googleListingLink: formData.googleListingLink || null,
        // Social media
        facebook: formData.facebook || null,
        instagram: formData.instagram || null,
        twitter: formData.twitter || null,
        youtube: formData.youtube || null,
        linkedin: formData.linkedin || null,
        tiktok: formData.tiktok || null,
        pinterest: formData.pinterest || null,
        // Hours
        clinicHours: formData.clinicHours,
        closedOn: formData.closedOn || null,
      };

      const response = await fetch(`/api/admin/clinics/${clinicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save changes");
      }

      toast.success("Changes saved successfully");
      setHasUnsavedChanges(false);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save changes";
      setError(message);
      toast.error("Save failed", { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  // Parse hours JSON for editing
  const [hoursJson, setHoursJson] = useState(() => {
    try {
      return JSON.stringify(formData.clinicHours || {}, null, 2);
    } catch {
      return "{}";
    }
  });

  const handleHoursChange = (value: string) => {
    setHoursJson(value);
    try {
      const parsed = JSON.parse(value);
      setFormData((prev) => ({ ...prev, clinicHours: parsed }));
      setHasUnsavedChanges(true);
    } catch {
      // Invalid JSON, don't update
    }
  };

  return (
    <div className="space-y-6">
      {/* Save Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Clinic Details Editor</span>
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-300 ml-2">
                  Unsaved changes
                </Badge>
              )}
            </div>
            <Button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs for different sections */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Hours
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Core clinic details and identification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Clinic Name *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter clinic name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinicType">Clinic Type</Label>
                  <Select
                    value={formData.clinicType || ""}
                    onValueChange={(value) => handleInputChange("clinicType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select clinic type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLINIC_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Clinic ID</Label>
                  <Input value={formData.id} disabled className="font-mono text-sm bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Permalink</Label>
                  <Input
                    value={`/${formData.permalink}`}
                    disabled
                    className="font-mono text-sm bg-muted"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <Input
                    value={formData.rating?.toFixed(1) || "N/A"}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Synced from Google Places</p>
                </div>
                <div className="space-y-2">
                  <Label>Review Count</Label>
                  <Input
                    value={formData.reviewCount?.toString() || "0"}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Synced from Google Places</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
              <CardDescription>
                Address and geographic coordinates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input
                  id="streetAddress"
                  value={formData.streetAddress || ""}
                  onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select
                    value={formData.stateAbbreviation || ""}
                    onValueChange={(value) => {
                      const state = US_STATES.find((s) => s.value === value);
                      handleInputChange("stateAbbreviation", value);
                      handleInputChange("state", state?.label || value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">ZIP Code *</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="detailedAddress">Full Address (Display)</Label>
                <Input
                  id="detailedAddress"
                  value={formData.detailedAddress || ""}
                  onChange={(e) => handleInputChange("detailedAddress", e.target.value)}
                  placeholder="Full formatted address"
                />
                <p className="text-xs text-muted-foreground">
                  Optional override for display purposes
                </p>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mapLatitude">Latitude *</Label>
                  <Input
                    id="mapLatitude"
                    type="number"
                    step="0.000001"
                    value={formData.mapLatitude}
                    onChange={(e) => handleInputChange("mapLatitude", e.target.value)}
                    placeholder="40.7128"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mapLongitude">Longitude *</Label>
                  <Input
                    id="mapLongitude"
                    type="number"
                    step="0.000001"
                    value={formData.mapLongitude}
                    onChange={(e) => handleInputChange("mapLongitude", e.target.value)}
                    placeholder="-74.0060"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Phone, website, email, and social media links
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Primary Contact */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Primary Contact
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ""}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website || ""}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleListingLink">Google Listing Link</Label>
                  <Input
                    id="googleListingLink"
                    value={formData.googleListingLink || ""}
                    onChange={(e) => handleInputChange("googleListingLink", e.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>

              <Separator />

              {/* Social Media */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Social Media
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={formData.facebook || ""}
                      onChange={(e) => handleInputChange("facebook", e.target.value)}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={formData.instagram || ""}
                      onChange={(e) => handleInputChange("instagram", e.target.value)}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter/X</Label>
                    <Input
                      id="twitter"
                      value={formData.twitter || ""}
                      onChange={(e) => handleInputChange("twitter", e.target.value)}
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      value={formData.youtube || ""}
                      onChange={(e) => handleInputChange("youtube", e.target.value)}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={formData.linkedin || ""}
                      onChange={(e) => handleInputChange("linkedin", e.target.value)}
                      placeholder="https://linkedin.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiktok">TikTok</Label>
                    <Input
                      id="tiktok"
                      value={formData.tiktok || ""}
                      onChange={(e) => handleInputChange("tiktok", e.target.value)}
                      placeholder="https://tiktok.com/..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>
                Operating hours in JSON format. Use Google Places sync for automatic updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="closedOn">Closed On</Label>
                <Input
                  id="closedOn"
                  value={formData.closedOn || ""}
                  onChange={(e) => handleInputChange("closedOn", e.target.value)}
                  placeholder="e.g., Sunday, Saturday"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours">Hours (JSON)</Label>
                <Textarea
                  id="hours"
                  value={hoursJson}
                  onChange={(e) => handleHoursChange(e.target.value)}
                  placeholder='{"monday": {"open": "09:00", "close": "17:00"}, ...}'
                  className="font-mono text-sm min-h-[300px]"
                />
                <p className="text-xs text-muted-foreground">
                  Enter hours as JSON. Format varies by source - use the Sync tab to pull from Google Places.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
