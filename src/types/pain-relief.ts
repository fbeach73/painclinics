// Pain location types
export type PainLocation =
  | 'neck'
  | 'lower-back'
  | 'shoulder'
  | 'knee'
  | 'headache'
  | 'hip'
  | 'wrist'
  | 'ankle'
  | 'general';

// Pain type (acute vs chronic)
export type PainType = 'acute' | 'chronic' | 'both';

// Resource requirements for relief methods
export type ResourceType = 'at-home' | 'has-meds' | 'can-exercise';

// Relief method categories
export type ReliefCategory =
  | 'hot-cold-therapy'
  | 'otc-medications'
  | 'physical-methods'
  | 'alternative-methods';

// Cost level indicator
export type CostLevel = '$' | '$$' | '$$$';

// Effectiveness rating (1-5 stars)
export type EffectivenessRating = 1 | 2 | 3 | 4 | 5;

// Core relief method interface
export interface PainReliefMethod {
  id: string;
  name: string;
  slug: string;
  category: ReliefCategory;
  effectiveness: EffectivenessRating;
  timeToRelief: string;
  durationOfRelief: string;
  cost: CostLevel;
  whenToUse: string[];
  whenNotToUse: string[];
  howToApply: string;
  painLocations: PainLocation[];
  painTypes: PainType[];
  resourcesNeeded: ResourceType[];
  imagePlaceholder: string;
}

// Filter state interface
export interface PainReliefFilters {
  painLocation: PainLocation | null;
  painType: PainType | null;
  resources: ResourceType[];
}

// Comparison state
export interface ComparisonState {
  selectedMethods: string[];
}
