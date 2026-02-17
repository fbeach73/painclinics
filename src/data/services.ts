import type { ServiceType, InsuranceType } from '@/types/clinic';

export interface ServiceDefinition {
  type: ServiceType;
  name: string;
  description: string;
  iconName: string;
}

export interface InsuranceDefinition {
  type: InsuranceType;
  name: string;
}

export const services: ServiceDefinition[] = [
  {
    type: 'injection-therapy',
    name: 'Injection Therapy',
    description: 'Corticosteroid and other therapeutic injections for pain relief',
    iconName: 'Syringe',
  },
  {
    type: 'physical-therapy',
    name: 'Physical Therapy',
    description: 'Exercises and treatments to improve mobility and reduce pain',
    iconName: 'Activity',
  },
  {
    type: 'medication-management',
    name: 'Medication Management',
    description: 'Prescription management and medication optimization',
    iconName: 'Pill',
  },
  {
    type: 'nerve-blocks',
    name: 'Nerve Blocks',
    description: 'Targeted nerve blocks to interrupt pain signals',
    iconName: 'Zap',
  },
  {
    type: 'spinal-cord-stimulation',
    name: 'Spinal Cord Stimulation',
    description: 'Implantable devices to manage chronic pain',
    iconName: 'Cpu',
  },
  {
    type: 'regenerative-medicine',
    name: 'Regenerative Medicine',
    description: 'PRP therapy and stem cell treatments',
    iconName: 'Leaf',
  },
  {
    type: 'acupuncture',
    name: 'Acupuncture',
    description: 'Traditional Chinese medicine for pain relief',
    iconName: 'Target',
  },
  {
    type: 'chiropractic',
    name: 'Chiropractic Care',
    description: 'Spinal adjustments and musculoskeletal treatments',
    iconName: 'Hand',
  },
  {
    type: 'massage-therapy',
    name: 'Massage Therapy',
    description: 'Therapeutic massage for pain and tension relief',
    iconName: 'Sparkles',
  },
  {
    type: 'psychological-services',
    name: 'Psychological Services',
    description: 'Pain psychology and cognitive behavioral therapy',
    iconName: 'Brain',
  },
];

export const insuranceProviders: InsuranceDefinition[] = [
  { type: 'medicare', name: 'Medicare' },
  { type: 'medicaid', name: 'Medicaid' },
  { type: 'blue-cross', name: 'Blue Cross Blue Shield' },
  { type: 'aetna', name: 'Aetna' },
  { type: 'cigna', name: 'Cigna' },
  { type: 'united-healthcare', name: 'United Healthcare' },
  { type: 'humana', name: 'Humana' },
  { type: 'kaiser', name: 'Kaiser Permanente' },
  { type: 'tricare', name: 'TRICARE' },
  { type: 'workers-comp', name: "Workers' Compensation" },
];

// Payment methods accepted by clinics
export interface PaymentMethodDefinition {
  slug: string;
  label: string;
}

export const PAYMENT_METHODS: PaymentMethodDefinition[] = [
  { slug: 'credit-card', label: 'Credit Card' },
  { slug: 'cash', label: 'Cash' },
  { slug: 'check', label: 'Check' },
  { slug: 'financing', label: 'Financing / Payment Plans' },
  { slug: 'sliding-scale', label: 'Sliding Scale' },
  { slug: 'hsa-fsa', label: 'HSA / FSA' },
  { slug: 'debit-card', label: 'Debit Card' },
];

export function getPaymentMethodBySlug(slug: string): PaymentMethodDefinition | undefined {
  return PAYMENT_METHODS.find((p) => p.slug === slug);
}

export function getServiceByType(type: ServiceType): ServiceDefinition | undefined {
  return services.find((s) => s.type === type);
}

export function getInsuranceByType(type: InsuranceType): InsuranceDefinition | undefined {
  return insuranceProviders.find((i) => i.type === type);
}
