import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 24,
  md: 36,
  lg: 48,
};

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const dimension = sizeMap[size];

  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2", className)}
    >
      <Image
        src="/logo.png"
        alt="Pain Clinics"
        width={dimension}
        height={dimension}
        className="rounded-lg"
      />
      {showText && (
        <span className="font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Pain Clinics
        </span>
      )}
    </Link>
  );
}
