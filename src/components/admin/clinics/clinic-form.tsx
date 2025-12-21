'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlacesLookupDialog } from '@/components/admin/sync/places-lookup-dialog';

interface ClinicFormData {
  id?: string;
  title: string;
  streetAddress: string;
  city: string;
  state: string;
  stateAbbreviation: string;
  postalCode: string;
  phone: string;
  website: string;
  mapLatitude: number | null;
  mapLongitude: number | null;
  placeId: string;
  clinicType: string;
}

interface ClinicFormProps {
  clinic?: ClinicFormData;
  onSuccess?: (clinic: ClinicFormData & { id: string }) => void;
  onCancel?: () => void;
}

const US_STATES = [
  { abbrev: 'AL', name: 'Alabama' },
  { abbrev: 'AK', name: 'Alaska' },
  { abbrev: 'AZ', name: 'Arizona' },
  { abbrev: 'AR', name: 'Arkansas' },
  { abbrev: 'CA', name: 'California' },
  { abbrev: 'CO', name: 'Colorado' },
  { abbrev: 'CT', name: 'Connecticut' },
  { abbrev: 'DE', name: 'Delaware' },
  { abbrev: 'FL', name: 'Florida' },
  { abbrev: 'GA', name: 'Georgia' },
  { abbrev: 'HI', name: 'Hawaii' },
  { abbrev: 'ID', name: 'Idaho' },
  { abbrev: 'IL', name: 'Illinois' },
  { abbrev: 'IN', name: 'Indiana' },
  { abbrev: 'IA', name: 'Iowa' },
  { abbrev: 'KS', name: 'Kansas' },
  { abbrev: 'KY', name: 'Kentucky' },
  { abbrev: 'LA', name: 'Louisiana' },
  { abbrev: 'ME', name: 'Maine' },
  { abbrev: 'MD', name: 'Maryland' },
  { abbrev: 'MA', name: 'Massachusetts' },
  { abbrev: 'MI', name: 'Michigan' },
  { abbrev: 'MN', name: 'Minnesota' },
  { abbrev: 'MS', name: 'Mississippi' },
  { abbrev: 'MO', name: 'Missouri' },
  { abbrev: 'MT', name: 'Montana' },
  { abbrev: 'NE', name: 'Nebraska' },
  { abbrev: 'NV', name: 'Nevada' },
  { abbrev: 'NH', name: 'New Hampshire' },
  { abbrev: 'NJ', name: 'New Jersey' },
  { abbrev: 'NM', name: 'New Mexico' },
  { abbrev: 'NY', name: 'New York' },
  { abbrev: 'NC', name: 'North Carolina' },
  { abbrev: 'ND', name: 'North Dakota' },
  { abbrev: 'OH', name: 'Ohio' },
  { abbrev: 'OK', name: 'Oklahoma' },
  { abbrev: 'OR', name: 'Oregon' },
  { abbrev: 'PA', name: 'Pennsylvania' },
  { abbrev: 'RI', name: 'Rhode Island' },
  { abbrev: 'SC', name: 'South Carolina' },
  { abbrev: 'SD', name: 'South Dakota' },
  { abbrev: 'TN', name: 'Tennessee' },
  { abbrev: 'TX', name: 'Texas' },
  { abbrev: 'UT', name: 'Utah' },
  { abbrev: 'VT', name: 'Vermont' },
  { abbrev: 'VA', name: 'Virginia' },
  { abbrev: 'WA', name: 'Washington' },
  { abbrev: 'WV', name: 'West Virginia' },
  { abbrev: 'WI', name: 'Wisconsin' },
  { abbrev: 'WY', name: 'Wyoming' },
  { abbrev: 'DC', name: 'District of Columbia' },
];

export function ClinicForm({ clinic, onSuccess, onCancel }: ClinicFormProps) {
  const router = useRouter();
  const isEdit = Boolean(clinic?.id);

  const [formData, setFormData] = useState<ClinicFormData>({
    title: clinic?.title ?? '',
    streetAddress: clinic?.streetAddress ?? '',
    city: clinic?.city ?? '',
    state: clinic?.state ?? '',
    stateAbbreviation: clinic?.stateAbbreviation ?? '',
    postalCode: clinic?.postalCode ?? '',
    phone: clinic?.phone ?? '',
    website: clinic?.website ?? '',
    mapLatitude: clinic?.mapLatitude ?? null,
    mapLongitude: clinic?.mapLongitude ?? null,
    placeId: clinic?.placeId ?? '',
    clinicType: clinic?.clinicType ?? 'pain_management',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPlacesLookup, setShowPlacesLookup] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof ClinicFormData, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleStateChange = (stateAbbrev: string) => {
    const state = US_STATES.find((s) => s.abbrev === stateAbbrev);
    if (state) {
      setFormData((prev) => ({
        ...prev,
        state: state.name,
        stateAbbreviation: state.abbrev,
      }));
    }
  };

  const handlePlaceSelect = (place: {
    id: string;
    name: string;
    address: string;
    location: { latitude: number; longitude: number } | null;
  }) => {
    // Parse address components if possible
    const addressParts = place.address.split(',').map((s) => s.trim());

    setFormData((prev) => ({
      ...prev,
      title: prev.title || place.name,
      placeId: place.id,
      streetAddress: addressParts[0] || prev.streetAddress,
      mapLatitude: place.location?.latitude ?? prev.mapLatitude,
      mapLongitude: place.location?.longitude ?? prev.mapLongitude,
    }));

    setShowPlacesLookup(false);
    toast.success('Place selected', {
      description: place.name,
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.stateAbbreviation) {
      newErrors.stateAbbreviation = 'State is required';
    }
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    }
    if (formData.mapLatitude === null || formData.mapLongitude === null) {
      newErrors.coordinates = 'Coordinates are required. Use Google Places lookup to auto-fill.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEdit
        ? `/api/admin/clinics/${clinic!.id}`
        : '/api/admin/clinics';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          state: formData.state || formData.stateAbbreviation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save clinic');
      }

      toast.success(isEdit ? 'Clinic updated' : 'Clinic created', {
        description: formData.title,
      });

      if (onSuccess) {
        onSuccess(data.clinic);
      } else {
        router.push(`/admin/clinics/${data.clinic.id}`);
      }
    } catch (error) {
      toast.error('Failed to save clinic', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Clinic' : 'Add New Clinic'}</CardTitle>
          <CardDescription>
            {isEdit
              ? 'Update clinic information'
              : 'Enter clinic details or search Google Places to auto-fill'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Google Places Lookup */}
            <div className="rounded-lg border border-dashed p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Google Places Lookup</h4>
                  <p className="text-sm text-muted-foreground">
                    Search for a business to auto-fill location data
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPlacesLookup(true)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search Places
                </Button>
              </div>
              {formData.placeId && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Place ID:</span>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {formData.placeId}
                  </code>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Clinic Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., Advanced Pain Management Center"
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicType">Clinic Type</Label>
                <Select
                  value={formData.clinicType}
                  onValueChange={(value) => handleChange('clinicType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pain_management">Pain Management</SelectItem>
                    <SelectItem value="orthopedic">Orthopedic</SelectItem>
                    <SelectItem value="chiropractic">Chiropractic</SelectItem>
                    <SelectItem value="physical_therapy">Physical Therapy</SelectItem>
                    <SelectItem value="neurology">Neurology</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Address</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="streetAddress">Street Address</Label>
                  <Input
                    id="streetAddress"
                    value={formData.streetAddress}
                    onChange={(e) => handleChange('streetAddress', e.target.value)}
                    placeholder="123 Medical Center Dr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Los Angeles"
                    className={errors.city ? 'border-destructive' : ''}
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive">{errors.city}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">
                    State <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.stateAbbreviation}
                    onValueChange={handleStateChange}
                  >
                    <SelectTrigger className={errors.stateAbbreviation ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state.abbrev} value={state.abbrev}>
                          {state.name} ({state.abbrev})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.stateAbbreviation && (
                    <p className="text-sm text-destructive">{errors.stateAbbreviation}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">
                    Postal Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleChange('postalCode', e.target.value)}
                    placeholder="90210"
                    className={errors.postalCode ? 'border-destructive' : ''}
                  />
                  {errors.postalCode && (
                    <p className="text-sm text-destructive">{errors.postalCode}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Coordinates <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="any"
                      value={formData.mapLatitude ?? ''}
                      onChange={(e) =>
                        handleChange(
                          'mapLatitude',
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      placeholder="Latitude"
                      className={`flex-1 ${errors.coordinates ? 'border-destructive' : ''}`}
                    />
                    <Input
                      type="number"
                      step="any"
                      value={formData.mapLongitude ?? ''}
                      onChange={(e) =>
                        handleChange(
                          'mapLongitude',
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      placeholder="Longitude"
                      className={`flex-1 ${errors.coordinates ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.coordinates && (
                    <p className="text-sm text-destructive">{errors.coordinates}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Contact Information</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Update Clinic' : 'Create Clinic'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <PlacesLookupDialog
        open={showPlacesLookup}
        onOpenChange={setShowPlacesLookup}
        onSelect={handlePlaceSelect}
        initialQuery={formData.title}
      />
    </>
  );
}
