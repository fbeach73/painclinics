// National chronic pain statistics (CDC/NCHS Data Brief No. 518, Nov 2024)
// These are constant across all state guides

export const NATIONAL_STATS = {
  chronicPainPercent: 24.3,
  highImpactPercent: 8.5,
  totalAffected: "~60M",
  previousPercent: 20.4,
  previousYear: 2016,
} as const;

export const AGE_BREAKDOWN = [
  { age: "18–29", chronicPain: 12.3, highImpact: 3.2 },
  { age: "30–44", chronicPain: 19.8, highImpact: 6.1 },
  { age: "45–64", chronicPain: 28.1, highImpact: 10.4 },
  { age: "65+", chronicPain: 36.0, highImpact: 13.5 },
] as const;

export const TREND_DATA = [
  { year: "2016", percent: 20.4 },
  { year: "2019", percent: 20.5 },
  { year: "2021", percent: 20.9 },
  { year: "2023", percent: 24.3 },
] as const;

export const SOURCES =
  "Sources: CDC/NCHS Data Brief No. 518 (Nov 2024) · US Pain Foundation 2024 Fact Sheet · NHIS 2019–2023 Analysis (PMC)";

// Per-state configs — add new states as guides are created
// Generate with Claude Desktop using the prompt in the plan file

export type StateStatsConfig = {
  population: string;
  estimatedChronicPain: string;
  medicaidProgram: string;
  insights: string[];
};

export const STATE_STATS: Record<string, StateStatsConfig> = {
  AL: {
    population: "4M",
    estimatedChronicPain: "972K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — a pattern especially relevant in Alabama's Black Belt counties where women often serve as primary caregivers with limited healthcare access.",
      "Rural Alabamians in the Wiregrass region and Black Belt counties face higher pain rates — national data shows chronic pain rises with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, compounding economic strain in a state where manufacturing and poultry processing industries already expose workers to repetitive-strain injuries.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Alabama's densely populated industrial corridor from Birmingham to Huntsville saw sustained community exposure and long-term effects.",
    ],
  },
  CA: {
    population: "30.5M",
    estimatedChronicPain: "7.4M",
    medicaidProgram: "Medi-Cal",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — relevant across California's large, diverse population.",
      "Rural Californians in the Central Valley and Northern CA face higher pain rates — national data shows chronic pain rises with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, making clinic access an economic issue as much as a health one.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — California's dense urban centers saw significant exposure and long-term effects.",
    ],
  },
  AK: {
    population: "550K",
    estimatedChronicPain: "134K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — relevant in Alaska's Alaska Native and rural communities where women face compounded barriers to specialist care.",
      "Rural Alaskans in the Interior and Bush communities face some of the nation's highest pain rates — chronic pain rises with decreasing urbanization, and many villages have zero in-state pain specialists.",
      "About 83% of people with high-impact chronic pain are unable to work, a critical concern in Alaska where the commercial fishing, oil field, and construction industries carry high musculoskeletal injury rates.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Anchorage and the Matanuska-Susitna Valley saw meaningful community spread with limited telehealth infrastructure to support recovery.",
    ],
  },
  AZ: {
    population: "5.5M",
    estimatedChronicPain: "1.3M",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — a pattern pronounced among Arizona's large Latino and Indigenous populations in Maricopa and Pima counties.",
      "Rural Arizonans in the White Mountains, Navajo Nation, and western desert communities face higher pain rates — national data shows chronic pain rises with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, affecting Arizona's service tourism and construction sectors that depend on a large physically active workforce.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Phoenix's rapid population density growth created sustained exposure waves with ongoing effects in the greater metro area.",
    ],
  },
  AR: {
    population: "2.5M",
    estimatedChronicPain: "608K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — particularly relevant in the Arkansas Delta region where women head a disproportionate share of households facing poverty and pain.",
      "Rural Arkansans in the Ozark Mountains and Mississippi Delta counties face higher pain rates — national data shows chronic pain rises with decreasing urbanization, and Arkansas ranks among the least urbanized states.",
      "About 83% of people with high-impact chronic pain are unable to work, an acute issue in a state where poultry processing, timber, and agriculture are major employers with high repetitive-motion injury rates.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Little Rock and Fort Smith saw notable community spread, with limited long-COVID specialty clinics available statewide.",
    ],
  },
  CO: {
    population: "4.5M",
    estimatedChronicPain: "1.1M",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — relevant across Colorado's Front Range corridor where women in service industries face high ergonomic exposure.",
      "Rural Coloradans in the San Luis Valley and Western Slope counties face higher pain rates — national data shows chronic pain rises with decreasing urbanization, and many mountain communities are hours from pain specialists.",
      "About 83% of people with high-impact chronic pain are unable to work, affecting Colorado's outdoor recreation and ski resort economies that rely heavily on physically demanding seasonal labor.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Denver metro's dense housing and early community transmission created lasting health impacts across the urban core.",
    ],
  },
  CT: {
    population: "3M",
    estimatedChronicPain: "729K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — particularly visible in Connecticut's older industrial cities like Bridgeport and New Haven where workforce demands have historically been high.",
      "Rural Connecticuters in Litchfield County and the Quiet Corner of Windham County face higher pain rates — chronic pain rises with decreasing urbanization even in a largely suburban state.",
      "About 83% of people with high-impact chronic pain are unable to work, a concern in Connecticut's financial services and defense manufacturing sectors that require high cognitive and physical availability.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Connecticut's high population density in the I-95 corridor and commuter patterns to New York amplified early exposure and long-term effects.",
    ],
  },
  DE: {
    population: "800K",
    estimatedChronicPain: "194K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — a pattern evident among Delaware's large healthcare and service workforce concentrated in New Castle County.",
      "Rural Delawareans in Sussex County's agricultural communities face higher pain rates — national data shows chronic pain rises with decreasing urbanization, and Sussex has limited pain specialist access.",
      "About 83% of people with high-impact chronic pain are unable to work, a meaningful concern in Delaware's chemical, pharmaceutical, and banking industries where workforce participation is central to the state's economy.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Wilmington's role as a regional transit hub created sustained community exposure with effects still apparent in the northern corridor.",
    ],
  },
  FL: {
    population: "17.5M",
    estimatedChronicPain: "4.3M",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — relevant across Florida's large retiree and female service-sector workforce in Tampa, Orlando, and Miami metro areas.",
      "Rural Floridians in the Panhandle, Big Bend region, and rural Glades and Hendry counties face higher pain rates — national data shows chronic pain rises with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, a major concern in Florida's tourism and hospitality economy, which depends on a large physically active service workforce.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Florida's year-round tourism and early reopening created sustained community exposure across densely populated coastal metros.",
    ],
  },
  GA: {
    population: "8.5M",
    estimatedChronicPain: "2.1M",
    medicaidProgram: "Georgia Families (Medicaid)",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — particularly relevant in Georgia's rural south where women head a large share of households and face limited specialist access.",
      "Rural Georgians in the Wiregrass, Coastal Plain, and Appalachian foothills counties face higher pain rates — national data shows chronic pain rises with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, a serious concern in Georgia's logistics, poultry processing, and carpet manufacturing industries that carry high physical injury burdens.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Atlanta's Hartsfield-Jackson airport status as a global transit hub created early and sustained community exposure with ongoing long-term effects.",
    ],
  },
  HI: {
    population: "1.1M",
    estimatedChronicPain: "267K",
    medicaidProgram: "Med-QUEST",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — relevant among Hawaii's Native Hawaiian and Pacific Islander communities, who experience disproportionate chronic pain burden.",
      "Rural Hawaiians on the Neighbor Islands — particularly the Big Island's rural districts and Molokai — face higher pain rates and must travel to Oahu for specialist care.",
      "About 83% of people with high-impact chronic pain are unable to work, a significant concern in Hawaii's tourism-dependent economy where service and hospitality workers face high ergonomic and repetitive-strain exposure.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Honolulu's role as a major Pacific transit hub created early exposure, with limited long-COVID follow-up infrastructure across the island chain.",
    ],
  },
  ID: {
    population: "1.5M",
    estimatedChronicPain: "364K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — evident in Idaho's rural agricultural communities where women often perform physically demanding farm labor alongside caregiving roles.",
      "Rural Idahoans in the Snake River Plain farming communities and the mountainous North Idaho panhandle face higher pain rates — chronic pain rises with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, a concern in Idaho's agriculture, food processing, and construction sectors where injury rates are above national averages.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Boise's rapid population growth during 2020–2022 intensified community exposure, and the region lacks robust long-COVID specialty clinics.",
    ],
  },
  IL: {
    population: "10M",
    estimatedChronicPain: "2.4M",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — a pattern visible across Chicago's South and West Side neighborhoods where women face intersecting socioeconomic and health barriers.",
      "Rural Illinoisans in Little Egypt (the southern tip), the Shawnee Hills region, and the sparsely populated western prairie counties face higher pain rates — chronic pain rises with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, compounding pressures in Illinois's manufacturing, agriculture, and logistics industries that are central to the state's economic output.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Chicago's density and status as a major rail and air transit hub created early and sustained community exposure with lasting health impacts.",
    ],
  },
  IN: {
    population: "5.5M",
    estimatedChronicPain: "1.3M",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — particularly relevant in Indiana's mid-sized industrial cities like Muncie, Anderson, and Gary where female manufacturing workers face high ergonomic exposure.",
      "Rural Indianans in the southern hill country around Brown County and the Ohio River valley communities face higher pain rates — chronic pain rises with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, a critical issue in Indiana's automotive manufacturing and steel industries, which are central pillars of the state economy.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Indianapolis's position as a major Midwest logistics hub and large convention venue created sustained community exposure during the pandemic.",
    ],
  },
  IA: {
    population: "2.5M",
    estimatedChronicPain: "608K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — relevant among Iowa's large agricultural workforce where women perform both farm labor and caregiving roles in rural counties.",
      "Rural Iowans in the sparsely populated northwestern prairie and northeastern Driftless Area face higher pain rates — national data shows chronic pain rises with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, a serious concern in Iowa's pork and grain agriculture economy where physical labor is central and disability often means loss of the family farm.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Iowa's large meatpacking facilities in Waterloo and Storm Lake were among the nation's first major outbreak sites, creating elevated long-term exposure.",
    ],
  },
  KS: {
    population: "2.5M",
    estimatedChronicPain: "608K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — particularly relevant in Kansas's rural western counties where women are the primary caregivers with long distances to pain specialists.",
      "Rural Kansans in the High Plains and Flint Hills face higher pain rates — national data shows chronic pain rises with decreasing urbanization, and many western Kansas counties have no pain clinics at all.",
      "About 83% of people with high-impact chronic pain are unable to work, a critical issue in Kansas's agriculture, aviation manufacturing, and meat processing industries that anchor the state's workforce.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Wichita's aviation manufacturing facilities and meatpacking plants in southwest Kansas were significant early exposure sites.",
    ],
  },
  KY: {
    population: "3.5M",
    estimatedChronicPain: "850K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — particularly acute in Eastern Kentucky's Appalachian counties where women often work physically demanding jobs in healthcare and service industries.",
      "Rural Kentuckians in the Appalachian coalfields of Pike, Harlan, and Leslie counties face some of the nation's highest chronic pain rates — chronic pain rises sharply with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, a devastating statistic in Eastern Kentucky where coal mining's decline has already severely strained the regional economy.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Louisville's position as a major UPS air hub and regional medical center created sustained community exposure across the metro area.",
    ],
  },
  LA: {
    population: "3.5M",
    estimatedChronicPain: "850K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — a pattern pronounced in Louisiana's rural parishes along the Red River and Bayou communities where healthcare access is severely limited.",
      "Rural Louisianans in the Acadiana parishes, the Mississippi Delta, and coastal communities face higher pain rates — national data shows chronic pain rises with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, a major concern in Louisiana's oil and gas, petrochemical, and seafood industries where workforce injuries are common and disability creates economic hardship.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — New Orleans's dense population and role as a major port and tourism destination created early and sustained community exposure.",
    ],
  },
  ME: {
    population: "1.1M",
    estimatedChronicPain: "267K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — relevant in Maine's older, largely rural female population, which has one of the highest median ages in the nation.",
      "Rural Mainers in Aroostook County and the Downeast Washington County communities face higher pain rates — Maine is the most rural state in the nation, and chronic pain rises sharply with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, a critical concern in Maine's fishing, logging, and paper mill industries where physical labor defines the workforce.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Portland's position as Maine's primary population center and transit hub created concentrated early exposure with persistent long-term effects.",
    ],
  },
  MD: {
    population: "4.5M",
    estimatedChronicPain: "1.1M",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — particularly relevant in Baltimore City and Prince George's County, where Black women face compounded disparities in pain treatment access.",
      "Rural Marylanders on the Eastern Shore and in Garrett County's Allegheny Plateau communities face higher pain rates — national data shows chronic pain rises with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, affecting Maryland's federal government, defense, and biotech sectors that rely on a highly active professional workforce.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Baltimore and the DC suburbs had sustained high-density exposure, and Maryland has some of the nation's leading long-COVID research institutions.",
    ],
  },
  MA: {
    population: "5.5M",
    estimatedChronicPain: "1.3M",
    medicaidProgram: "MassHealth",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — relevant across Massachusetts's large healthcare workforce, where women make up the majority of frontline workers facing high physical demands.",
      "Rural Massachusettans in the Pioneer Valley, Berkshire County, and the Cape and Islands face higher pain rates — chronic pain rises with decreasing urbanization even in this largely suburban state.",
      "About 83% of people with high-impact chronic pain are unable to work, a concern in Massachusetts's biotech, education, and financial sectors that drive the state's high-income economy.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Boston's dense university and medical district populations created early and sustained exposure, and the state hosts leading long-COVID research programs.",
    ],
  },
  MI: {
    population: "8M",
    estimatedChronicPain: "1.9M",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — a pattern pronounced in Michigan's auto manufacturing cities like Flint, Saginaw, and Detroit where female assembly workers face high ergonomic burdens.",
      "Rural Michiganders in the Upper Peninsula and the northern Lower Peninsula's timber and agricultural communities face higher pain rates — chronic pain rises sharply with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, a devastating figure in Michigan's auto manufacturing economy where UAW workers face chronic musculoskeletal injuries from decades of assembly line work.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Detroit's dense urban core and large essential worker population in auto plants created sustained community exposure during the 2020–2021 period.",
    ],
  },
  MN: {
    population: "4.5M",
    estimatedChronicPain: "1.1M",
    medicaidProgram: "Medical Assistance / MinnesotaCare",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — relevant among Minnesota's large Somali and Hmong communities in the Twin Cities, where women face cultural and language barriers to pain care.",
      "Rural Minnesotans on the Iron Range, in the Red River Valley, and in the sparsely populated Arrowhead region face higher pain rates — national data shows chronic pain rises with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, a concern in Minnesota's iron ore mining, agriculture, and medical device manufacturing industries where physical demands are high.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — the Minneapolis–Saint Paul metro's density and large meatpacking workforce in greater Minnesota created both urban and rural exposure clusters.",
    ],
  },
  MS: {
    population: "2M",
    estimatedChronicPain: "486K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — a pattern especially acute in Mississippi's Delta region where Black women face the nation's highest chronic pain burden with the least access to specialist care.",
      "Rural Mississippians in the Mississippi Delta and the Piney Woods region of the southwest face some of the nation's highest chronic pain rates — Mississippi is among the most rural and underserved states.",
      "About 83% of people with high-impact chronic pain are unable to work, a critical issue in a state where agriculture, poultry processing, and catfish farming define the rural economy with minimal safety nets.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Jackson and Gulfport saw sustained community exposure, and Mississippi has the fewest long-COVID specialty resources per capita in the South.",
    ],
  },
  MO: {
    population: "5M",
    estimatedChronicPain: "1.2M",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — particularly visible in the Ozark Highlands and Bootheel where rural women face limited healthcare access and higher rates of physically demanding occupations.",
      "Rural Missourians in the Ozark Plateau counties and the Missouri Bootheel face higher pain rates — national data shows chronic pain rises with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, compounding difficulties in Missouri's agriculture, auto assembly, and lead mining industries where musculoskeletal injuries are prevalent.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — St. Louis and Kansas City as major regional transit and healthcare hubs saw early community exposure with lasting health effects.",
    ],
  },
  MT: {
    population: "850K",
    estimatedChronicPain: "207K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — relevant among Montana's Native American women on the Blackfeet, Crow, and Northern Cheyenne reservations, who face profound barriers to pain specialist access.",
      "Rural Montanans across the Hi-Line communities, the Eastern Plains, and tribal reservation lands face higher pain rates — Montana is a vast frontier state where the nearest pain clinic can be 200+ miles away.",
      "About 83% of people with high-impact chronic pain are unable to work, an acute concern in Montana's ranching, mining, and timber industries where physical labor is inseparable from the state's economic identity.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Billings and Missoula's roles as regional service centers concentrated exposure, and the state has minimal telehealth pain management infrastructure.",
    ],
  },
  NE: {
    population: "1.5M",
    estimatedChronicPain: "364K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — a pattern evident in Nebraska's meatpacking communities like Lexington and Schuyler, where Latina women face high ergonomic injury rates.",
      "Rural Nebraskans in the Sandhills and Panhandle communities of the western plains face higher pain rates — national data shows chronic pain rises with decreasing urbanization, and western Nebraska is among the nation's most sparsely populated regions.",
      "About 83% of people with high-impact chronic pain are unable to work, a serious concern in Nebraska's beef processing, ethanol, and grain agriculture industries that form the backbone of the state economy.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Nebraska's meatpacking plants were major early outbreak sites, and Omaha's role as a regional rail and commerce hub amplified community spread.",
    ],
  },
  NV: {
    population: "2.5M",
    estimatedChronicPain: "608K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — particularly visible among Nevada's large hospitality and casino service workforce in Las Vegas, where women face high repetitive-strain exposure.",
      "Rural Nevadans in the Great Basin mining communities, Elko County, and the sparsely populated Humboldt region face higher pain rates — chronic pain rises sharply with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, a major concern in Nevada's tourism and gaming economy, which has no safety net for workers who cannot maintain the physical demands of casino floor and hotel service roles.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Las Vegas's massive casino industry created dense, unmasked indoor exposure environments during reopening, driving above-average long-COVID rates.",
    ],
  },
  NH: {
    population: "1.1M",
    estimatedChronicPain: "267K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — relevant in New Hampshire's aging rural communities in Coos and Grafton counties, where women outlive men significantly and face chronic pain without accessible specialist care.",
      "Rural New Hampshirites in the Great North Woods region of Coos County and the Lakes Region face higher pain rates — chronic pain rises with decreasing urbanization in this heavily forested, sparsely populated state.",
      "About 83% of people with high-impact chronic pain are unable to work, a meaningful concern in New Hampshire's advanced manufacturing, tourism, and semiconductor industries where workforce participation is tightly tied to economic output.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Manchester and Nashua's proximity to the Boston metro created early exposure, and commuter patterns accelerated community spread throughout southern NH.",
    ],
  },
  NJ: {
    population: "7M",
    estimatedChronicPain: "1.7M",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — a pattern evident across New Jersey's pharmaceutical, healthcare, and logistics workforces concentrated in the central corridor.",
      "Rural New Jerseyans in the Pinelands (Pine Barrens) and Sussex County farming communities face higher pain rates — even in the nation's most densely populated state, pockets of rural underservice persist.",
      "About 83% of people with high-impact chronic pain are unable to work, a concern in New Jersey's pharmaceutical, finance, and port logistics industries where the cost of workforce disability is economically significant.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — New Jersey's role as a dense New York suburb and its early status as a COVID epicenter created some of the nation's highest long-COVID case burdens.",
    ],
  },
  NM: {
    population: "1.5M",
    estimatedChronicPain: "364K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — particularly relevant among New Mexico's large Native American and Hispanic women in rural Navajo Nation lands and the Española Valley.",
      "Rural New Mexicans in the Navajo Nation, the Jicarilla Apache homeland, and the rural Bootheel counties face some of the nation's highest chronic pain rates with the least access to specialty care.",
      "About 83% of people with high-impact chronic pain are unable to work, a critical issue in New Mexico's oil and gas, military, and arts economy — particularly in southeast New Mexico's Permian Basin communities.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Albuquerque and Santa Fe saw meaningful community exposure, while tribal communities faced disproportionate COVID burden and ongoing chronic health effects.",
    ],
  },
  NY: {
    population: "16M",
    estimatedChronicPain: "3.9M",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — a pattern acute in New York City's outer boroughs and in Buffalo and Syracuse, where working-class women bear high physical labor burdens with unequal healthcare access.",
      "Rural New Yorkers in the Southern Tier, North Country, and Adirondack region face higher pain rates — national data shows chronic pain rises with decreasing urbanization, and upstate NY has significant specialist shortages.",
      "About 83% of people with high-impact chronic pain are unable to work, compounding pressure on New York's finance, healthcare, and media industries that collectively represent the largest state economy in the US.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — New York City was the nation's first major COVID epicenter in 2020, and the density of the five boroughs created one of the highest long-COVID burdens in the world.",
    ],
  },
  NC: {
    population: "8.5M",
    estimatedChronicPain: "2.1M",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — particularly visible in North Carolina's furniture manufacturing belt and rural Piedmont communities where female workers face repetitive-strain injury exposure.",
      "Rural North Carolinians in the Appalachian Mountains of the western counties and the coastal Tidewater communities face higher pain rates — chronic pain rises with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, a pressing concern in North Carolina's tobacco agriculture, hog farming, and textile remnant industries where physical capacity is an employment prerequisite.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Charlotte and the Research Triangle's rapid population growth created dense urban exposure, and NC's large poultry processing workforce faced early occupational exposure.",
    ],
  },
  ND: {
    population: "650K",
    estimatedChronicPain: "158K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — relevant in North Dakota's Native American communities on the Spirit Lake and Standing Rock reservations, where women face compounded pain disparities.",
      "Rural North Dakotans on the Bakken Oil Patch and in the Red River Valley farming communities face higher pain rates — North Dakota is among the most rural and sparsely populated states.",
      "About 83% of people with high-impact chronic pain are unable to work, a stark concern in a state where oil field work, wheat farming, and ranching define the economy and require sustained physical capacity.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Fargo and Bismarck saw community spread concentrated in oil field worker housing and agricultural processing facilities during the pandemic.",
    ],
  },
  OH: {
    population: "9.5M",
    estimatedChronicPain: "2.3M",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — a pattern especially visible in Ohio's Appalachian counties in the southeast and in the post-industrial cities of Youngstown, Dayton, and Lorain.",
      "Rural Ohioans in the Appalachian Ohio counties — Athens, Meigs, and Vinton — face some of the nation's highest chronic pain rates, driven by poverty, occupational injury history, and limited specialist access.",
      "About 83% of people with high-impact chronic pain are unable to work, a central concern in Ohio's auto manufacturing, steel, and agriculture industries that are already under pressure from long-term industrial decline.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Columbus, Cleveland, and Cincinnati as major Midwest metros saw sustained community exposure, and Ohio has seen above-average long-COVID disability filing rates.",
    ],
  },
  OK: {
    population: "3M",
    estimatedChronicPain: "729K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — particularly relevant among Oklahoma's large Native American female population, who face significant chronic pain disparities across tribal land communities.",
      "Rural Oklahomans in the Ouachita Mountains, the Panhandle, and the rural southeast face higher pain rates — national data shows chronic pain rises with decreasing urbanization, and Oklahoma ranks among the most underserved for pain specialists.",
      "About 83% of people with high-impact chronic pain are unable to work, a serious concern in Oklahoma's oil and gas, agriculture, and aviation industries where physical capability is central to employment.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Oklahoma City and Tulsa as regional hubs saw community spread concentrated in oil field services and meatpacking worker communities.",
    ],
  },
  OR: {
    population: "3.5M",
    estimatedChronicPain: "850K",
    medicaidProgram: "Oregon Health Plan",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — relevant among Oregon's large Latino agricultural workforce in the Willamette Valley, where women face occupational exposure and limited Spanish-language pain care.",
      "Rural Oregonians in the Eastern Oregon high desert, the Klamath Basin, and the rural Coast Range communities face higher pain rates — chronic pain rises sharply with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, a critical concern in Oregon's timber, commercial fishing, and agriculture industries where occupational injuries are common and recovery resources are scarce.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Portland's dense urban core and large unhoused population created sustained community exposure, and the metro area has seen above-average rates of long-COVID reporting.",
    ],
  },
  PA: {
    population: "10.5M",
    estimatedChronicPain: "2.6M",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — a pattern pronounced in Pennsylvania's post-industrial cities like Scranton, Allentown, and Erie where female workers have long histories in physically demanding manufacturing roles.",
      "Rural Pennsylvanians in the Appalachian Ridge and Valley region, Potter County, and the northern Endless Mountains face higher pain rates — chronic pain rises sharply with decreasing urbanization in this heavily rural state.",
      "About 83% of people with high-impact chronic pain are unable to work, a devastating figure in Pennsylvania's steel, coal, and manufacturing industries where chronic occupational injury has defined worker health for generations.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Philadelphia as the sixth-largest US city created sustained dense exposure, while Pittsburgh's aging population amplified long-term post-COVID health impacts.",
    ],
  },
  RI: {
    population: "850K",
    estimatedChronicPain: "207K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — relevant across Rhode Island's large Portuguese and Latino communities in Providence and Central Falls, where women often work in food service and textile manufacturing.",
      "Rural Rhode Islanders in the rural communities of Kent County and the Narragansett Bay islands face higher pain rates — even in the nation's smallest state, geographic isolation creates real access barriers.",
      "About 83% of people with high-impact chronic pain are unable to work, a concern in Rhode Island's jewelry manufacturing, defense, and healthcare industries that form the state's economic base.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Providence's density as the state's primary urban center and proximity to Boston created early and sustained community exposure.",
    ],
  },
  SC: {
    population: "4M",
    estimatedChronicPain: "972K",
    medicaidProgram: "Healthy Connections",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — a pattern especially acute in South Carolina's rural Lowcountry and Pee Dee region, where Black women face systemic barriers to pain treatment access.",
      "Rural South Carolinians in the Pee Dee tobacco country and the coastal Lowcountry's inland communities face higher pain rates — national data shows chronic pain rises with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, a meaningful concern in South Carolina's BMW and Boeing manufacturing facilities, textile remnants, and peach and tobacco farming industries.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Myrtle Beach's year-round tourism and Charleston's role as a major port city created sustained community exposure during multiple pandemic waves.",
    ],
  },
  SD: {
    population: "700K",
    estimatedChronicPain: "170K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — particularly relevant among South Dakota's Lakota women on the Pine Ridge and Rosebud reservations, who face among the highest chronic pain burdens in the nation.",
      "Rural South Dakotans on the western Plains reservations, in the Black Hills communities, and across the sparsely populated East River farming counties face higher pain rates — South Dakota is one of the nation's most rural states.",
      "About 83% of people with high-impact chronic pain are unable to work, a critical concern in a state where ranching, pork processing (Sioux Falls), and tourism define the economy with minimal disability support infrastructure.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Sioux Falls's large Smithfield Foods packing plant was among the nation's first major workplace outbreak sites, creating concentrated long-COVID exposure.",
    ],
  },
  TN: {
    population: "5.5M",
    estimatedChronicPain: "1.3M",
    medicaidProgram: "TennCare",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — particularly visible in Tennessee's Appalachian eastern counties and rural Middle Tennessee communities where women face limited specialist access.",
      "Rural Tennesseans in the Cumberland Plateau counties — Fentress, Pickett, and Van Buren — and the rural western counties face higher pain rates — chronic pain rises sharply with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, a serious concern in Tennessee's auto assembly, whiskey distilling, and healthcare industries where the workforce is large and physical demands are high.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Nashville's rapid population growth and status as a major country music tourism destination created sustained dense community exposure during the pandemic.",
    ],
  },
  TX: {
    population: "23M",
    estimatedChronicPain: "5.6M",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — a pattern evident across Texas's large border communities in the Rio Grande Valley, where Latinas face high pain burden with limited specialist access.",
      "Rural Texans in the Trans-Pecos, the Panhandle, and the Piney Woods of East Texas face higher pain rates — national data shows chronic pain rises with decreasing urbanization, and vast West Texas has extreme specialist shortages.",
      "About 83% of people with high-impact chronic pain are unable to work, a major concern in Texas's oil and gas, agriculture, construction, and petrochemical industries where physical capacity is central to employment.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Houston, Dallas, and San Antonio as three of the nation's ten largest cities created massive community exposure, and Texas has one of the largest absolute long-COVID populations in the US.",
    ],
  },
  UT: {
    population: "2.5M",
    estimatedChronicPain: "608K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — relevant in Utah's large faith-community households where women often delay seeking pain care due to cultural and financial barriers.",
      "Rural Utahns in the rural Uinta Basin, the San Juan County canyon communities, and the isolated communities of the Arizona Strip face higher pain rates — chronic pain rises with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, a concern in Utah's mining, aerospace and defense, and tech sector economies where workforce participation rates are among the nation's highest.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Salt Lake City's rapid suburban growth and density in the Wasatch Front created sustained community exposure across a region with a notably young population.",
    ],
  },
  VT: {
    population: "520K",
    estimatedChronicPain: "126K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — relevant in Vermont's aging rural female population in the Northeast Kingdom, which has among the least access to pain specialists in New England.",
      "Rural Vermonters in Essex County and the Northeast Kingdom — the most sparsely populated region east of the Mississippi — face higher pain rates and often travel to Dartmouth or Burlington for specialist care.",
      "About 83% of people with high-impact chronic pain are unable to work, a meaningful concern in Vermont's maple syrup, dairy, skiing tourism, and precision manufacturing industries where physical labor is foundational.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Burlington's role as Vermont's primary urban center concentrated early exposure, and the state's small population made per-capita long-COVID effects proportionally significant.",
    ],
  },
  VA: {
    population: "7M",
    estimatedChronicPain: "1.7M",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — a pattern visible in Southwest Virginia's coalfield counties and in the rural Southside communities where women face compounded barriers to pain care.",
      "Rural Virginians in the coalfield counties of Buchanan, Dickenson, and Wise in the far southwest, and the rural Southside counties, face higher pain rates — chronic pain rises sharply with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, a serious concern in Virginia's federal contracting, defense, and coal mining sectors — particularly in Southwestern Virginia where mine closures have already strained the economy.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Northern Virginia's dense federal workforce and DC suburb density created early and sustained exposure, while Hampton Roads' military population contributed additional community spread.",
    ],
  },
  WA: {
    population: "6M",
    estimatedChronicPain: "1.5M",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — particularly relevant among Washington's large Filipino and Somali immigrant communities in the Seattle metro, who face language and cultural barriers to pain care.",
      "Rural Washingtonians in the Okanogan Highlands, the Palouse wheat country, and the rural Columbia Basin face higher pain rates — national data shows chronic pain rises with decreasing urbanization, and Eastern Washington has significant pain specialist shortages.",
      "About 83% of people with high-impact chronic pain are unable to work, a significant concern in Washington's aerospace, tech, and commercial fishing industries where the workforce disability burden ripples through the high-wage economy.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Seattle was among the first US cities to identify community COVID spread in 2020, and the dense tech and healthcare corridor created sustained long-term exposure.",
    ],
  },
  WV: {
    population: "1.5M",
    estimatedChronicPain: "364K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — particularly acute in the southern coalfield counties of McDowell, Mingo, and Logan, where women shoulder caregiving burdens with virtually no access to pain specialists.",
      "Rural West Virginians in the Appalachian coalfields consistently face the nation's highest chronic pain rates — West Virginia is the most rural state and has among the fewest pain management providers per capita in the US.",
      "About 83% of people with high-impact chronic pain are unable to work, a devastating statistic in a state where coal mining's decline has already created a workforce crisis and chronic pain is the leading cause of disability filing.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Charleston and Huntington serve as regional service hubs where community exposure concentrated, adding long-COVID burden to a state already leading the nation in opioid-related mortality.",
    ],
  },
  WI: {
    population: "4.5M",
    estimatedChronicPain: "1.1M",
    medicaidProgram: "BadgerCare Plus",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — relevant in Wisconsin's dairy farming communities and paper mill towns like Wausau and Green Bay, where female workers face high physical labor demands.",
      "Rural Wisconsinites in the Northwoods communities of Vilas and Forest counties and in the rural Driftless Area face higher pain rates — national data shows chronic pain rises with decreasing urbanization.",
      "About 83% of people with high-impact chronic pain are unable to work, a critical concern in Wisconsin's dairy farming, paper manufacturing, and food processing industries where physical capacity is essential for employment.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Milwaukee's density and Green Bay's large meatpacking workforce created sustained community exposure during multiple pandemic waves.",
    ],
  },
  WY: {
    population: "450K",
    estimatedChronicPain: "109K",
    medicaidProgram: "Medicaid",
    insights: [
      "Women are more likely to have high-impact chronic pain than men (9.4% vs 7.3%) — a pattern relevant among Wyoming's ranching and Native American communities on the Wind River Reservation, where women face profound geographic barriers to specialist care.",
      "Rural Wyomingites across the vast Wyoming Basin, the rural Bighorn Basin, and the Powder River Basin coal communities face higher pain rates — Wyoming is the least populated state and has the fewest pain clinics per square mile in the US.",
      "About 83% of people with high-impact chronic pain are unable to work, a stark concern in Wyoming's coal mining, natural gas, and ranching industries where physical labor is the dominant form of employment.",
      "Long COVID accounts for ~13% of the post-2019 rise in chronic pain — Cheyenne and Casper as the state's two primary population centers concentrated early exposure, and Wyoming's limited healthcare infrastructure has made long-COVID recovery support scarce.",
    ],
  },
};

export function hasStatsForState(stateAbbreviation: string): boolean {
  return stateAbbreviation in STATE_STATS;
}

export function getStateStats(
  stateAbbreviation: string
): StateStatsConfig | null {
  return STATE_STATS[stateAbbreviation] ?? null;
}
