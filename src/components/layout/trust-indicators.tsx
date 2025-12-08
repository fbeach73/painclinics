import { Shield, CheckCircle, Users } from 'lucide-react';

interface TrustItem {
  icon: React.ReactNode;
  title: string;
  description?: string;
}

const trustItems: TrustItem[] = [
  {
    icon: <Shield className="size-6 text-primary" />,
    title: '5,500+ Verified Clinics',
    description: 'Comprehensive nationwide network',
  },
  {
    icon: <CheckCircle className="size-6 text-primary" />,
    title: 'Trusted by Patients',
    description: 'Real reviews from real patients',
  },
  {
    icon: <Users className="size-6 text-primary" />,
    title: 'Serving All 50 States',
    description: 'Find care near you anywhere',
  },
];

export function TrustIndicators() {
  return (
    <section className="border-b bg-muted/50">
      <div className="container py-6 md:py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {trustItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 justify-center md:justify-start"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="font-semibold text-foreground">{item.title}</p>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
