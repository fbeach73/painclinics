'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, LocateFixed, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StateCombobox, stateNameToSlug } from './state-combobox';

export interface PopularState {
  abbrev: string;
  name: string;
  slug: string;
  count: number;
}

export interface TopCity {
  city: string;
  stateAbbrev: string;
  slug: string;
}

interface FindClinicSectionProps {
  popularStates: PopularState[];
  topCities?: TopCity[] | undefined;
}

async function reverseGeocodeToState(
  coords: GeolocationCoordinates
): Promise<string | undefined> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
    {
      headers: {
        'User-Agent': 'PainClinics.com/1.0',
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to determine location');
  }

  const data = await res.json();

  if (!data.address?.state) {
    throw new Error('Could not determine state from location');
  }

  return stateNameToSlug(data.address.state);
}

export function FindClinicSection({ popularStates, topCities }: FindClinicSectionProps) {
  const [isLocating, setIsLocating] = React.useState(false);
  const router = useRouter();

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const stateSlug = await reverseGeocodeToState(position.coords);

          if (stateSlug) {
            router.push(`/pain-management/${stateSlug}`);
          } else {
            toast.error(
              'Could not determine your state. Please select one below.'
            );
            setIsLocating(false);
          }
        } catch {
          toast.error('Failed to determine your location. Please try again.');
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error(
              'Location access denied. Please enable location or select a state below.'
            );
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error(
              'Location unavailable. Please select a state below.'
            );
            break;
          case error.TIMEOUT:
            toast.error(
              'Location request timed out. Please try again or select a state below.'
            );
            break;
          default:
            toast.error(
              'Could not get your location. Please select a state below.'
            );
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  };

  return (
    <section className="container mx-auto py-12 md:py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
            Find Pain Management Clinics
          </h2>
          <p className="text-muted-foreground">
            Use your location to find nearby clinics or search by state
          </p>
        </div>

        {/* Location and Search Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch max-w-xl mx-auto mb-10">
          <Button
            size="lg"
            onClick={handleNearMe}
            disabled={isLocating}
            className="flex-1 gap-2"
          >
            {isLocating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Finding your location...
              </>
            ) : (
              <>
                <LocateFixed className="h-5 w-5" />
                Find Clinics Near Me
              </>
            )}
          </Button>

          <div className="flex-1">
            <StateCombobox
              className="h-10 w-full"
              placeholder="Or select a state..."
            />
          </div>
        </div>

        {/* Location Context */}
        {topCities && topCities.length > 0 && (
          <p className="text-sm text-muted-foreground text-center mb-10">
            Serving patients in{' '}
            {topCities.map((city, index) => (
              <span key={`${city.city}-${city.stateAbbrev}`}>
                <Link
                  href={`/pain-management/${city.stateAbbrev.toLowerCase()}/${city.slug}/`}
                  className="text-foreground hover:text-primary underline-offset-2 hover:underline"
                >
                  {city.city}
                </Link>
                {index < topCities.length - 1 && ', '}
              </span>
            ))}
            {' '}and more.
          </p>
        )}

        {/* Popular States Grid */}
        {popularStates.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-center mb-4">
              Popular States
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {popularStates.map((state) => (
                <Link
                  href={`/pain-management/${state.slug}`}
                  key={state.abbrev}
                >
                  <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 text-center flex flex-col justify-center min-h-[80px]">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 text-primary" />
                        <p className="font-semibold">{state.name}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {state.count.toLocaleString()} clinics
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
