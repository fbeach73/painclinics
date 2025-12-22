import type {
  PainReliefMethod,
  ReliefCategory,
  PainLocation,
  PainType,
  ResourceType,
} from '@/types/pain-relief';

// Category definitions for display
export const reliefCategories: Record<
  ReliefCategory,
  { name: string; description: string; iconName: string }
> = {
  'hot-cold-therapy': {
    name: 'Hot/Cold Therapy',
    description: 'Temperature-based treatments for pain relief',
    iconName: 'Thermometer',
  },
  'otc-medications': {
    name: 'OTC Medications',
    description: 'Over-the-counter pain relievers',
    iconName: 'Pill',
  },
  'physical-methods': {
    name: 'Physical Methods',
    description: 'Movement and manual therapy techniques',
    iconName: 'Activity',
  },
  'alternative-methods': {
    name: 'Alternative Methods',
    description: 'Non-traditional pain relief approaches',
    iconName: 'Sparkles',
  },
};

// Pain location labels for display
export const painLocationLabels: Record<PainLocation, string> = {
  neck: 'Neck',
  'lower-back': 'Lower Back',
  shoulder: 'Shoulder',
  knee: 'Knee',
  headache: 'Headache',
  hip: 'Hip',
  wrist: 'Wrist',
  ankle: 'Ankle',
  general: 'General/Full Body',
};

// Pain type labels
export const painTypeLabels: Record<PainType, string> = {
  acute: 'Acute (sudden, recent)',
  chronic: 'Chronic (ongoing, long-term)',
  both: 'Both acute and chronic',
};

// Resource labels for display
export const resourceLabels: Record<ResourceType, string> = {
  'at-home': 'Available at home',
  'has-meds': 'Have medications',
  'can-exercise': 'Able to exercise',
};

export const painReliefMethods: PainReliefMethod[] = [
  // ========== HOT/COLD THERAPY ==========
  {
    id: 'ice-pack',
    name: 'Ice Pack',
    slug: 'ice-pack',
    category: 'hot-cold-therapy',
    effectiveness: 4,
    timeToRelief: '10-20 minutes',
    durationOfRelief: '1-2 hours',
    cost: '$',
    whenToUse: [
      'Acute injuries (first 48-72 hours)',
      'Inflammation and swelling',
      'After exercise or physical activity',
      'Headaches and migraines',
      'Muscle strains and sprains',
    ],
    whenNotToUse: [
      'Circulatory problems or poor blood flow',
      "Raynaud's disease",
      'Areas with poor sensation or numbness',
      'Over open wounds or broken skin',
      'If you have cold sensitivity',
    ],
    howToApply:
      'Wrap ice pack in a thin towel or cloth. Apply to affected area for 15-20 minutes. Wait at least 1 hour between applications. Check skin every 5 minutes for redness. Never apply directly to bare skin.',
    painLocations: [
      'neck',
      'lower-back',
      'shoulder',
      'knee',
      'headache',
      'hip',
      'wrist',
      'ankle',
      'general',
    ],
    painTypes: ['acute', 'both'],
    resourcesNeeded: ['at-home'],
    imagePlaceholder:
      'Professional medical illustration showing proper ice pack application on lower back, person lying face down, ice pack wrapped in thin towel against lumbar region',
  },
  {
    id: 'heat-pad',
    name: 'Heating Pad',
    slug: 'heat-pad',
    category: 'hot-cold-therapy',
    effectiveness: 4,
    timeToRelief: '15-30 minutes',
    durationOfRelief: '2-4 hours',
    cost: '$',
    whenToUse: [
      'Muscle stiffness and tension',
      'Chronic pain conditions',
      'Before stretching or exercise',
      'Menstrual cramps',
      'Arthritis stiffness',
    ],
    whenNotToUse: [
      'Fresh injuries (first 48-72 hours)',
      'Active inflammation or swelling',
      'Diabetic neuropathy',
      'Skin conditions, rashes, or burns',
      'Areas with poor circulation',
    ],
    howToApply:
      'Set heating pad to medium heat. Place over affected area for 15-20 minutes. Use a cloth barrier if needed for comfort. Do not sleep with heating pad on. Take breaks between sessions.',
    painLocations: ['neck', 'lower-back', 'shoulder', 'hip', 'general'],
    painTypes: ['chronic', 'both'],
    resourcesNeeded: ['at-home'],
    imagePlaceholder:
      'Photorealistic demonstration of heating pad placement for shoulder pain, person sitting upright, heating pad draped over trapezius muscle, warm amber lighting',
  },
  {
    id: 'contrast-therapy',
    name: 'Contrast Therapy',
    slug: 'contrast-therapy',
    category: 'hot-cold-therapy',
    effectiveness: 4,
    timeToRelief: '20-30 minutes',
    durationOfRelief: '2-4 hours',
    cost: '$',
    whenToUse: [
      'Subacute injuries (after initial 72 hours)',
      'Chronic muscle soreness',
      'Exercise recovery',
      'Arthritis in hands and feet',
      'Reducing stiffness',
    ],
    whenNotToUse: [
      'Active acute inflammation',
      'Open wounds',
      'Severe circulation problems',
      'Sensory impairment',
      'Heart conditions (consult doctor)',
    ],
    howToApply:
      'Alternate between cold (1-2 minutes) and warm (3-4 minutes) applications. Complete 3-4 cycles. Always end with cold to reduce inflammation. Can use ice water and warm water baths for extremities.',
    painLocations: ['wrist', 'ankle', 'knee', 'general'],
    painTypes: ['chronic', 'both'],
    resourcesNeeded: ['at-home'],
    imagePlaceholder:
      'Medical illustration showing contrast therapy technique, sequence of three images: ice bucket submersion, warm water submersion, timer graphics showing intervals',
  },
  {
    id: 'hot-bath',
    name: 'Hot Shower/Bath',
    slug: 'hot-bath',
    category: 'hot-cold-therapy',
    effectiveness: 3,
    timeToRelief: '10-15 minutes',
    durationOfRelief: '1-3 hours',
    cost: '$',
    whenToUse: [
      'General muscle tension and stress',
      'Full body stiffness',
      'Sleep preparation',
      'Mild chronic pain',
      'Relaxation and stress relief',
    ],
    whenNotToUse: [
      'Acute injuries with swelling',
      'Skin infections or open wounds',
      'Very low blood pressure',
      'During fever',
      'Pregnancy (use warm, not hot)',
    ],
    howToApply:
      'Use comfortably warm water (not scalding hot). Soak for 15-20 minutes. Add Epsom salts for additional benefit. Hydrate before and after. Move slowly when getting out to avoid dizziness.',
    painLocations: ['lower-back', 'neck', 'shoulder', 'hip', 'general'],
    painTypes: ['chronic', 'both'],
    resourcesNeeded: ['at-home'],
    imagePlaceholder:
      'Peaceful spa-like image of person relaxing in warm bath, steam rising, soft lighting, emphasis on relaxation for pain relief',
  },

  // ========== OTC MEDICATIONS ==========
  {
    id: 'ibuprofen',
    name: 'Ibuprofen (Advil/Motrin)',
    slug: 'ibuprofen',
    category: 'otc-medications',
    effectiveness: 4,
    timeToRelief: '30-60 minutes',
    durationOfRelief: '4-6 hours',
    cost: '$',
    whenToUse: [
      'Inflammation and swelling',
      'Headaches and migraines',
      'Muscle aches and sprains',
      'Menstrual cramps',
      'Mild to moderate pain',
    ],
    whenNotToUse: [
      'History of stomach ulcers or bleeding',
      'Kidney disease',
      'Heart disease or high blood pressure',
      'Third trimester of pregnancy',
      'Taking blood thinners',
    ],
    howToApply:
      'Take 200-400mg every 4-6 hours as needed. Do not exceed 1200mg in 24 hours without doctor guidance. Take with food to reduce stomach upset. Stay hydrated.',
    painLocations: [
      'headache',
      'neck',
      'lower-back',
      'shoulder',
      'knee',
      'hip',
      'wrist',
      'ankle',
      'general',
    ],
    painTypes: ['acute', 'chronic', 'both'],
    resourcesNeeded: ['has-meds'],
    imagePlaceholder:
      'Clean product photography of Advil/ibuprofen bottle on white surface, pills visible, professional pharmaceutical marketing style',
  },
  {
    id: 'acetaminophen',
    name: 'Acetaminophen (Tylenol)',
    slug: 'acetaminophen',
    category: 'otc-medications',
    effectiveness: 3,
    timeToRelief: '30-45 minutes',
    durationOfRelief: '4-6 hours',
    cost: '$',
    whenToUse: [
      'Headaches and mild pain',
      'Fever reduction',
      'When NSAIDs are not suitable',
      'Mild arthritis pain',
      'General aches and pains',
    ],
    whenNotToUse: [
      'Liver disease or heavy alcohol use',
      'Already taking other acetaminophen products',
      'Severe pain (may not be sufficient)',
      'Known allergy to acetaminophen',
    ],
    howToApply:
      'Take 325-650mg every 4-6 hours as needed. Do not exceed 3000mg in 24 hours. Can be taken with or without food. Check all medications for hidden acetaminophen to avoid overdose.',
    painLocations: ['headache', 'general', 'neck', 'lower-back'],
    painTypes: ['acute', 'chronic', 'both'],
    resourcesNeeded: ['has-meds'],
    imagePlaceholder:
      'Clean product photography of Tylenol/acetaminophen bottle, professional pharmaceutical style, clear labeling visible',
  },
  {
    id: 'naproxen',
    name: 'Naproxen (Aleve)',
    slug: 'naproxen',
    category: 'otc-medications',
    effectiveness: 4,
    timeToRelief: '30-60 minutes',
    durationOfRelief: '8-12 hours',
    cost: '$',
    whenToUse: [
      'Longer-lasting pain relief needed',
      'Arthritis and joint pain',
      'Muscle aches',
      'Menstrual cramps',
      'Tendinitis and bursitis',
    ],
    whenNotToUse: [
      'History of stomach ulcers or GI bleeding',
      'Kidney or heart disease',
      'Taking blood thinners',
      'Pregnancy (especially third trimester)',
      'Aspirin allergy',
    ],
    howToApply:
      'Take 220mg every 8-12 hours. Do not exceed 660mg in 24 hours without doctor advice. Take with food or milk. Longer duration means fewer doses needed per day.',
    painLocations: [
      'headache',
      'neck',
      'lower-back',
      'shoulder',
      'knee',
      'hip',
      'wrist',
      'ankle',
      'general',
    ],
    painTypes: ['acute', 'chronic', 'both'],
    resourcesNeeded: ['has-meds'],
    imagePlaceholder:
      'Clean product photography of Aleve/naproxen bottle, pills visible, emphasis on longer-lasting relief messaging',
  },
  {
    id: 'aspirin',
    name: 'Aspirin',
    slug: 'aspirin',
    category: 'otc-medications',
    effectiveness: 3,
    timeToRelief: '30-60 minutes',
    durationOfRelief: '4-6 hours',
    cost: '$',
    whenToUse: [
      'Headaches',
      'Minor aches and pains',
      'Fever reduction',
      'Inflammation',
    ],
    whenNotToUse: [
      'Children under 18 (risk of Reye syndrome)',
      'Bleeding disorders',
      'Stomach ulcers or GI issues',
      'Upcoming surgery',
      'Taking blood thinners',
    ],
    howToApply:
      'Take 325-650mg every 4-6 hours as needed. Do not exceed 4000mg in 24 hours. Take with food to reduce stomach irritation. Not recommended for children.',
    painLocations: ['headache', 'general'],
    painTypes: ['acute', 'both'],
    resourcesNeeded: ['has-meds'],
    imagePlaceholder:
      'Classic aspirin bottle photography, simple white background, familiar product imagery',
  },
  {
    id: 'topical-creams',
    name: 'Topical Pain Creams',
    slug: 'topical-creams',
    category: 'otc-medications',
    effectiveness: 3,
    timeToRelief: '15-30 minutes',
    durationOfRelief: '2-4 hours',
    cost: '$$',
    whenToUse: [
      'Localized muscle or joint pain',
      'Arthritis in accessible joints',
      'Minor sports injuries',
      'When oral medications not preferred',
      'Targeted relief for specific areas',
    ],
    whenNotToUse: [
      'Open wounds or broken skin',
      'Mucous membranes or near eyes',
      'Large body areas',
      'Known allergy to ingredients',
      'With heating pads (risk of burns)',
    ],
    howToApply:
      'Apply thin layer to affected area and massage gently. Wash hands after application. Do not use with heat therapy. Reapply as directed (usually 3-4 times daily). Common brands: Bengay, Biofreeze, IcyHot, Voltaren.',
    painLocations: ['neck', 'lower-back', 'shoulder', 'knee', 'hip', 'wrist', 'ankle'],
    painTypes: ['acute', 'chronic', 'both'],
    resourcesNeeded: ['has-meds'],
    imagePlaceholder:
      'Photorealistic image of person applying topical pain relief cream to knee joint, close-up of hands massaging cream, pharmaceutical advertising quality',
  },

  // ========== PHYSICAL METHODS ==========
  {
    id: 'stretching',
    name: 'Stretching',
    slug: 'stretching',
    category: 'physical-methods',
    effectiveness: 4,
    timeToRelief: '5-15 minutes',
    durationOfRelief: '2-6 hours',
    cost: '$',
    whenToUse: [
      'Muscle tightness and tension',
      'Stiffness after inactivity',
      'Prevention of pain',
      'Before and after exercise',
      'Chronic tension patterns',
    ],
    whenNotToUse: [
      'Acute injury with swelling',
      'Unstable joints',
      'Severe pain during movement',
      'Immediately after fracture',
      'If causing sharp pain',
    ],
    howToApply:
      'Hold each stretch for 15-30 seconds. Do not bounce. Breathe deeply and relax into the stretch. Stretch both sides equally. Perform 2-3 repetitions per stretch. Target specific muscle groups based on pain location.',
    painLocations: ['neck', 'lower-back', 'shoulder', 'hip', 'general'],
    painTypes: ['chronic', 'both'],
    resourcesNeeded: ['can-exercise'],
    imagePlaceholder:
      'Step-by-step visual guide for gentle neck stretches, four panel sequence showing chin tucks, lateral flexion, rotation, physical therapy instruction style',
  },
  {
    id: 'self-massage',
    name: 'Self-Massage',
    slug: 'self-massage',
    category: 'physical-methods',
    effectiveness: 3,
    timeToRelief: '5-15 minutes',
    durationOfRelief: '1-4 hours',
    cost: '$',
    whenToUse: [
      'Muscle knots and tension',
      'Trigger points',
      'General muscle soreness',
      'Stress-related tension',
      'After exercise',
    ],
    whenNotToUse: [
      'Over broken skin or wounds',
      'Acute inflammation',
      'Varicose veins',
      'Blood clots (DVT)',
      'Bone injuries',
    ],
    howToApply:
      'Use firm but comfortable pressure. Move in circular motions or along muscle fibers. Use tools like tennis balls or foam rollers for hard-to-reach areas. Spend 1-2 minutes per trigger point. Hydrate afterward.',
    painLocations: ['neck', 'lower-back', 'shoulder', 'hip', 'general'],
    painTypes: ['chronic', 'both'],
    resourcesNeeded: ['at-home'],
    imagePlaceholder:
      'Professional demonstration of foam rolling technique for back pain, person on yoga mat, foam roller positioned under back, proper form shown',
  },
  {
    id: 'rest-positioning',
    name: 'Rest & Positioning',
    slug: 'rest-positioning',
    category: 'physical-methods',
    effectiveness: 3,
    timeToRelief: '15-30 minutes',
    durationOfRelief: '1-4 hours',
    cost: '$',
    whenToUse: [
      'Acute injuries',
      'Fatigue-related pain',
      'Overuse injuries',
      'During flare-ups',
      'Sleep-related pain',
    ],
    whenNotToUse: [
      'Prolonged rest (can worsen chronic pain)',
      'When gentle movement is tolerated',
      'If rest causes increased stiffness',
    ],
    howToApply:
      'Find a comfortable, supported position. Use pillows for support. For lower back: try lying on back with knees bent or on side with pillow between knees. Limit prolonged rest - gentle movement often helps.',
    painLocations: ['neck', 'lower-back', 'shoulder', 'hip', 'general'],
    painTypes: ['acute', 'both'],
    resourcesNeeded: ['at-home'],
    imagePlaceholder:
      'Sleep position comparison for lower back pain, three sleeping positions with skeletal overlay, side sleeping with pillow between knees highlighted as recommended',
  },
  {
    id: 'gentle-movement',
    name: 'Gentle Movement/Walking',
    slug: 'gentle-movement',
    category: 'physical-methods',
    effectiveness: 4,
    timeToRelief: '10-20 minutes',
    durationOfRelief: '2-6 hours',
    cost: '$',
    whenToUse: [
      'Chronic pain management',
      'Stiffness from inactivity',
      'Mild to moderate pain',
      'Recovery phase of injury',
      'Prevention of pain episodes',
    ],
    whenNotToUse: [
      'Severe acute injury',
      'If movement causes sharp pain',
      'Unstable fractures',
      'When rest is prescribed by doctor',
    ],
    howToApply:
      'Start with 5-10 minute sessions. Walk at comfortable pace on flat surfaces. Gradually increase duration. Stop if pain significantly increases. Focus on smooth, controlled movements.',
    painLocations: ['lower-back', 'hip', 'knee', 'ankle', 'general'],
    painTypes: ['chronic', 'both'],
    resourcesNeeded: ['can-exercise'],
    imagePlaceholder:
      'Active lifestyle image of person walking outdoors for pain management, natural setting, comfortable pace, emphasis on low-impact movement',
  },

  // ========== ALTERNATIVE METHODS ==========
  {
    id: 'tens-unit',
    name: 'TENS Unit',
    slug: 'tens-unit',
    category: 'alternative-methods',
    effectiveness: 4,
    timeToRelief: '15-30 minutes',
    durationOfRelief: '1-4 hours',
    cost: '$$',
    whenToUse: [
      'Chronic pain conditions',
      'Muscle pain and tension',
      'Nerve pain',
      'Post-surgical pain',
      'Arthritis',
    ],
    whenNotToUse: [
      'Pacemaker or implanted device',
      'Over the heart or throat',
      'During pregnancy (on abdomen)',
      'Epilepsy (without doctor approval)',
      'On broken skin or wounds',
    ],
    howToApply:
      'Place electrode pads on or near painful area. Start at lowest intensity and gradually increase. Use for 15-30 minute sessions. Follow device instructions carefully. Many affordable units available for home use.',
    painLocations: ['neck', 'lower-back', 'shoulder', 'knee', 'hip', 'general'],
    painTypes: ['chronic', 'both'],
    resourcesNeeded: ['at-home'],
    imagePlaceholder:
      'Close-up of TENS unit electrode placement for lower back pain, four electrode pads positioned symmetrically on lumbar paraspinal muscles, medical device instruction style',
  },
  {
    id: 'compression',
    name: 'Compression',
    slug: 'compression',
    category: 'alternative-methods',
    effectiveness: 3,
    timeToRelief: '10-20 minutes',
    durationOfRelief: '2-4 hours',
    cost: '$',
    whenToUse: [
      'Acute sprains and strains',
      'Swelling reduction',
      'Joint support during activity',
      'After injury (part of RICE)',
      'Mild joint instability',
    ],
    whenNotToUse: [
      'Circulatory problems',
      'Peripheral neuropathy',
      'Skin infections',
      'If numbness or tingling occurs',
      'Arterial insufficiency',
    ],
    howToApply:
      'Apply elastic bandage or compression sleeve snugly but not too tight. Should be able to fit two fingers underneath. Watch for numbness, tingling, or color changes. Remove if pain increases.',
    painLocations: ['knee', 'ankle', 'wrist', 'shoulder'],
    painTypes: ['acute', 'both'],
    resourcesNeeded: ['at-home'],
    imagePlaceholder:
      'Demonstration of RICE protocol compression wrap on ankle, elastic bandage wrapping technique shown step by step, sports injury first aid style',
  },
  {
    id: 'elevation',
    name: 'Elevation',
    slug: 'elevation',
    category: 'alternative-methods',
    effectiveness: 3,
    timeToRelief: '15-30 minutes',
    durationOfRelief: '1-3 hours',
    cost: '$',
    whenToUse: [
      'Swelling in limbs',
      'Acute injuries (part of RICE)',
      'After surgery',
      'Ankle or knee injuries',
      'Hand or wrist swelling',
    ],
    whenNotToUse: [
      'If elevation causes pain',
      'Certain heart conditions',
      'When mobility is needed',
    ],
    howToApply:
      'Elevate affected limb above heart level when possible. Use pillows for support. For legs, lie down with leg propped up. For arms, use a sling or rest on pillows. Combine with ice for acute injuries.',
    painLocations: ['ankle', 'knee', 'wrist', 'hip'],
    painTypes: ['acute', 'both'],
    resourcesNeeded: ['at-home'],
    imagePlaceholder:
      'Proper elevation technique for ankle injury, person lying on couch with leg elevated on pillows above heart level, comfortable positioning shown',
  },
  {
    id: 'epsom-salt-bath',
    name: 'Epsom Salt Bath',
    slug: 'epsom-salt-bath',
    category: 'alternative-methods',
    effectiveness: 3,
    timeToRelief: '15-20 minutes',
    durationOfRelief: '2-4 hours',
    cost: '$',
    whenToUse: [
      'General muscle soreness',
      'Stress-related tension',
      'After intense exercise',
      'Chronic muscle pain',
      'Relaxation and recovery',
    ],
    whenNotToUse: [
      'Open wounds or infections',
      'Diabetes (without doctor approval)',
      'Kidney problems',
      'Very low blood pressure',
      'During pregnancy (consult doctor)',
    ],
    howToApply:
      'Add 1-2 cups of Epsom salt to warm (not hot) bath water. Soak for 12-20 minutes. Rinse with fresh water after. Hydrate well before and after. Limit to 2-3 times per week.',
    painLocations: ['lower-back', 'hip', 'general'],
    painTypes: ['chronic', 'both'],
    resourcesNeeded: ['at-home'],
    imagePlaceholder:
      'Contrast therapy setup for arthritis relief, elegant still life of warm bath with Epsom salts, peaceful spa-like aesthetic, soft natural lighting',
  },
];

// Helper function to get a method by ID
export function getMethodById(id: string): PainReliefMethod | undefined {
  return painReliefMethods.find((m) => m.id === id);
}

// Helper function to get methods by category
export function getMethodsByCategory(category: ReliefCategory): PainReliefMethod[] {
  return painReliefMethods.filter((m) => m.category === category);
}

// Filter methods based on user selections
export function filterMethods(
  methods: PainReliefMethod[],
  filters: {
    painLocation?: PainLocation | null;
    painType?: PainType | null;
    resources?: ResourceType[];
  }
): PainReliefMethod[] {
  return methods.filter((method) => {
    // Filter by pain location
    if (filters.painLocation && !method.painLocations.includes(filters.painLocation)) {
      return false;
    }

    // Filter by pain type
    if (filters.painType && filters.painType !== 'both') {
      // Method must support the selected pain type OR support 'both'
      if (!method.painTypes.includes(filters.painType) && !method.painTypes.includes('both')) {
        return false;
      }
    }

    // Filter by resources - method must be available with at least one of the selected resources
    if (filters.resources && filters.resources.length > 0) {
      const hasMatchingResource = filters.resources.some((r) =>
        method.resourcesNeeded.includes(r)
      );
      if (!hasMatchingResource) {
        return false;
      }
    }

    return true;
  });
}
