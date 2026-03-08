import { MessageCircle } from "lucide-react";
import { getAdForPlacement } from "@/lib/ad-queries";
import { getAllowedTypes } from "@/lib/ad-placement-specs";
import { Button } from "@/components/ui/button";
import { CtaButtonAd } from "@/components/ads/creatives/CtaButtonAd";

const FALLBACK_URL =
  "https://vaultmediainc10211905.o18.link/c?o=21483674&m=20197&a=628724&sub_aff_id=contact_btn&mo=Doctor_USA";

interface ClinicContactCtaProps {
  pagePath: string;
}

export async function ClinicContactCta({ pagePath }: ClinicContactCtaProps) {
  const allowedTypes = getAllowedTypes("clinic-contact-cta");
  const ad = await getAdForPlacement("clinic-contact-cta", pagePath, allowedTypes);

  if (ad) {
    return <CtaButtonAd creative={ad.creative} clickUrl={ad.clickUrl} />;
  }

  // Fallback: hardcoded affiliate button (untracked)
  return (
    <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
      <a
        href={FALLBACK_URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
      >
        <MessageCircle className="h-4 w-4" />
        Chat with a Doctor Online
      </a>
    </Button>
  );
}
