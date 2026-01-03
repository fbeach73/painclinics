"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

// Common clinic types - user can also enter custom values
const CLINIC_TYPES = [
  "Pain Management",
  "Pain management physician",
  "Pain control clinic",
  "Orthopedic",
  "Chiropractic",
  "Physical Therapy",
  "Neurology",
  "Rehabilitation",
  "Interventional Pain",
  "Anesthesiology",
  "Doctor",
  "Medical clinic",
  "Other",
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
  // Amenities
  amenities: string[] | null;
}

interface OwnerInfo {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface OwnershipData {
  ownerUserId: string | null;
  isVerified: boolean;
  claimedAt: Date | null;
  owner: OwnerInfo | null;
}

interface ClinicDetailsTabProps {
  clinicId: string;
  initialData: ClinicData;
  ownershipData?: OwnershipData;
}

export function ClinicDetailsTab({ clinicId, initialData, ownershipData }: ClinicDetailsTabProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ClinicData>(initialData);

  // Amenities state
  const [isAutomating, setIsAutomating] = useState(false);
  const [newAmenity, setNewAmenity] = useState("");

  // Email state
  const [newEmail, setNewEmail] = useState("");

  // Ownership removal state
  const [isRemovingOwnership, setIsRemovingOwnership] = useState(false);

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
        // Amenities
        amenities: formData.amenities || null,
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

  // Amenities handlers
  const handleAutomateAmenities = async () => {
    setIsAutomating(true);
    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}/automate-amenities`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setFormData((prev) => ({ ...prev, amenities: data.amenities }));
        setHasUnsavedChanges(true);
        toast.success(`Found ${data.amenities.length} amenities`);
      } else {
        toast.error(data.error || "Failed to automate amenities");
      }
    } catch {
      toast.error("Failed to automate amenities");
    } finally {
      setIsAutomating(false);
    }
  };

  const removeAmenity = (index: number) => {
    const newAmenities = [...(formData.amenities || [])];
    newAmenities.splice(index, 1);
    setFormData((prev) => ({ ...prev, amenities: newAmenities.length > 0 ? newAmenities : null }));
    setHasUnsavedChanges(true);
  };

  const addAmenity = () => {
    const trimmed = newAmenity.trim();
    if (!trimmed) return;

    const current = formData.amenities || [];
    if (current.includes(trimmed)) {
      toast.error("Amenity already exists");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      amenities: [...current, trimmed],
    }));
    setNewAmenity("");
    setHasUnsavedChanges(true);
  };

  // Email handlers
  const removeEmail = (index: number) => {
    const newEmails = [...(formData.emails || [])];
    newEmails.splice(index, 1);
    setFormData((prev) => ({ ...prev, emails: newEmails.length > 0 ? newEmails : null }));
    setHasUnsavedChanges(true);
  };

  const addEmail = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const current = formData.emails || [];
    if (current.includes(trimmed)) {
      toast.error("Email already exists");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      emails: [...current, trimmed],
    }));
    setNewEmail("");
    setHasUnsavedChanges(true);
  };

  // Handle ownership removal
  const handleRemoveOwnership = async () => {
    setIsRemovingOwnership(true);
    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}/ownership`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove ownership");
      }

      toast.success("Ownership removed successfully");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove ownership";
      toast.error("Failed to remove ownership", { description: message });
    } finally {
      setIsRemovingOwnership(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Ownership Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Clinic Ownership
          </CardTitle>
          <CardDescription>
            Manage clinic ownership and verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ownershipData?.owner ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={ownershipData.owner.image ?? undefined} />
                  <AvatarFallback>
                    {ownershipData.owner.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {ownershipData.owner.name || "Unknown"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {ownershipData.owner.email}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {ownershipData.isVerified ? (
                      <Badge variant="default" className="bg-green-600 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Pending Verification
                      </Badge>
                    )}
                    {ownershipData.claimedAt && (
                      <span className="text-xs text-muted-foreground">
                        Claimed {new Date(ownershipData.claimedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isRemovingOwnership}
                  >
                    {isRemovingOwnership ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <UserX className="mr-2 h-4 w-4" />
                        Remove Ownership
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Clinic Ownership</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove <strong>{ownershipData.owner.name || ownershipData.owner.email}</strong> as the owner of this clinic.
                      The clinic will become unclaimed and verification status will be reset.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRemoveOwnership}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Ownership
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <Badge variant="outline" className="mb-1">Unclaimed</Badge>
                <p className="text-sm">
                  This clinic has no owner. Business owners can claim it through the public listing page.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="amenities" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Amenities
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
                  <Input
                    id="clinicType"
                    list="clinic-types"
                    value={formData.clinicType || ""}
                    onChange={(e) => handleInputChange("clinicType", e.target.value)}
                    placeholder="Select or enter clinic type"
                  />
                  <datalist id="clinic-types">
                    {CLINIC_TYPES.map((type) => (
                      <option key={type} value={type} />
                    ))}
                  </datalist>
                  <p className="text-xs text-muted-foreground">
                    Select from suggestions or enter a custom type
                  </p>
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

              {/* Email Addresses */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Addresses
                </h4>

                {/* Current Emails */}
                {formData.emails && formData.emails.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.emails.map((email, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1 pr-1"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => removeEmail(index)}
                          className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No email addresses set
                  </p>
                )}

                {/* Add Email */}
                <div className="flex gap-2">
                  <Input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter email address"
                    type="email"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addEmail();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addEmail}
                    disabled={!newEmail.trim()}
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
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

        {/* Amenities Tab */}
        <TabsContent value="amenities" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
              <CardDescription>
                Facility features and conveniences extracted from reviews and descriptions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* AI Automate Button */}
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleAutomateAmenities}
                  disabled={isAutomating}
                  variant="outline"
                >
                  {isAutomating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Automate Amenities
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  AI will extract amenities from reviews and description
                </p>
              </div>

              <Separator />

              {/* Current Amenities */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Current Amenities</h4>
                {formData.amenities && formData.amenities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.amenities.map((amenity, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1 pr-1"
                      >
                        {amenity}
                        <button
                          type="button"
                          onClick={() => removeAmenity(index)}
                          className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No amenities set. Click &quot;Automate Amenities&quot; to extract from reviews.
                  </p>
                )}
              </div>

              <Separator />

              {/* Manual Add */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Add Manually</h4>
                <div className="flex gap-2">
                  <Input
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    placeholder="Enter amenity (e.g., Free WiFi)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addAmenity();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addAmenity}
                    disabled={!newAmenity.trim()}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
