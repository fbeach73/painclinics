import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, Building2, Star, BadgeCheck } from 'lucide-react';
import type { FeaturedTier } from '@/components/clinic/featured-badge';
import { StarRating } from '@/components/clinic/star-rating';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ClinicWithDistance } from '@/types/clinic';

interface FeaturedClinicCardProps {
  clinic: ClinicWithDistance;
  className?: string;
}

export function FeaturedClinicCard({ clinic, className }: FeaturedClinicCardProps) {
  const featuredTier = (clinic.featuredTier || 'basic') as FeaturedTier;
  const isPremium = featuredTier === 'premium';
  const hasPhoto = clinic.photos && clinic.photos.length > 0;

  return (
    <Card
      className={cn(
        'group flex flex-col h-full overflow-hidden transition-all duration-300',
        'min-w-[320px] max-w-[400px]',
        // Glass morphism effect
        'bg-white/70 dark:bg-slate-900/70',
        'backdrop-blur-md',
        'border border-white/50 dark:border-slate-700/50',
        'shadow-lg shadow-black/5 dark:shadow-black/20',
        // Hover effects
        'hover:bg-white/80 dark:hover:bg-slate-900/80',
        'hover:border-emerald-200/50 dark:hover:border-emerald-700/50',
        'hover:shadow-xl hover:shadow-emerald-500/10',
        'hover:-translate-y-1',
        className
      )}
    >
      {/* Image section with gradient overlay */}
      <div className="relative h-52 bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/30 overflow-hidden">
        {hasPhoto && clinic.photos[0] ? (
          <Image
            src={clinic.photos[0]}
            alt={clinic.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Building2 className="h-16 w-16 text-emerald-300 dark:text-emerald-800" />
            <span className="text-sm text-emerald-600/60 dark:text-emerald-400/40 font-medium">
              Pain Management Clinic
            </span>
          </div>
        )}

        {/* Gradient overlay for better badge readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Top badges row */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <div className="flex gap-2">
            {/* Premium/Featured badge */}
            <Badge
              className={cn(
                'gap-1 font-semibold',
                isPremium
                  ? 'premium-badge-shimmer premium-badge-glow text-white border-0'
                  : 'bg-white/90 text-emerald-700 border-emerald-200/50 dark:bg-slate-900/90 dark:text-emerald-400 dark:border-emerald-800/50 backdrop-blur-sm shadow-lg'
              )}
            >
              <Star className={cn('h-3 w-3', isPremium && 'fill-current')} />
              {isPremium ? 'Premium' : 'Featured'}
            </Badge>

            {/* Distance badge */}
            {clinic.distanceFormatted && (
              <Badge variant="secondary" className="bg-white/90 text-slate-700 dark:bg-slate-900/90 dark:text-slate-300 shadow-lg backdrop-blur-sm border-white/50 dark:border-slate-700/50">
                {clinic.distanceFormatted}
              </Badge>
            )}
          </div>

          {/* Verified badge */}
          {clinic.isVerified && (
            <Badge className="gap-1 bg-white/90 text-blue-700 border-blue-200/50 dark:bg-slate-900/90 dark:text-blue-400 dark:border-blue-800/50 shadow-lg backdrop-blur-sm">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {clinic.name}
          </h3>
          <StarRating rating={clinic.rating} reviewCount={clinic.reviewCount} variant="featured" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-2.5 pt-0">
        <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
          <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
          <span className="line-clamp-2">{clinic.address.formatted}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Phone className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>{clinic.phone}</span>
        </div>

        {clinic.about && (
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 pt-1">
            {clinic.about}
          </p>
        )}
      </CardContent>

      <CardFooter className="gap-2 pt-3">
        <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20">
          <Link href={`/pain-management/${clinic.slug}/`}>View Details</Link>
        </Button>
        <Button
          size="icon"
          asChild
          className="bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          <a href={`tel:${clinic.phone}`} aria-label={`Call ${clinic.name}`}>
            <Phone className="h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
