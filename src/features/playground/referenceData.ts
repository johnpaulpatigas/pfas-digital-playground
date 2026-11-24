export interface ParameterReferenceRow {
  id: string;
  name: string;
  symbol: string;
  unit: string;
  min: string;
  average: string;
  max: string;
  recommendedDist: string;
  source: string;
  description: string;
  criticalCutoff: string;
}

export const PARAMETER_REFERENCES: ParameterReferenceRow[] = [
  {
    id: 'dailyIntake',
    name: 'Estimated PFAS Daily Intake',
    symbol: 'I',
    unit: 'µg/day',
    min: '0.001 µg/day',
    average: '0.050 to 0.080 µg/day',
    max: '0.250 to 0.500 µg/day',
    recommendedDist: 'Lognormal (µ: 0.05, σ: 0.40) or Triangular',
    source: 'US EPA Exposure Factors Handbook (2019), EFSA Contam Panel (2020)',
    description:
      'Total daily ingested mass of target PFAS from drinking water, food (such as seafood and dairy), consumer products, and dust.',
    criticalCutoff: 'I_{crit} = BW × RfD (e.g. 0.0831 µg/day for 55.4 kg with PFOA)',
  },
  {
    id: 'bodyWeight',
    name: 'Body Weight',
    symbol: 'BW',
    unit: 'kg',
    min: '40.0 kg',
    average: '55.4 kg (Filipino Adult Female)',
    max: '85.0 to 100.0 kg',
    recommendedDist: 'Normal (µ: 55.4, σ: 8.5) or Triangular (45, 55, 75)',
    source: 'DOST-FNRI Philippine Dietary Reference Intakes (PDRI), CDC NHANES',
    description:
      'Body mass in kilograms. Lower body weight results in a higher dose per kilogram for a given intake rate.',
    criticalCutoff:
      'BW_{crit} = I / RfD (Exceedance occurs when body mass falls below critical cutoff)',
  },
  {
    id: 'age',
    name: 'Age',
    symbol: 'Age',
    unit: 'years',
    min: '18 years',
    average: '30 to 35 years',
    max: '65 to 75 years',
    recommendedDist: 'Uniform (18 to 50) or Normal (µ: 32, σ: 7)',
    source: 'Philippine Statistics Authority (PSA) Demographic Surveys',
    description: 'Age used for demographic cohort stratification and exposure duration modeling.',
    criticalCutoff: 'Demographic baseline marker informing cumulative exposure duration',
  },
  {
    id: 'waterConsumption',
    name: 'Daily Drinking Water Intake',
    symbol: 'W',
    unit: 'L/day',
    min: '0.8 L/day',
    average: '1.8 to 2.2 L/day',
    max: '3.5 to 5.0 L/day',
    recommendedDist: 'Normal (µ: 2.0, σ: 0.4) or Lognormal (µ: 1.9, σ: 0.3)',
    source: 'WHO Guidelines for Drinking-Water Quality, EPA Exposure Factors Handbook',
    description:
      'Direct drinking water intake per day. Higher water intake increases total chemical ingestion when water contains detectable PFAS.',
    criticalCutoff: 'W_{crit} = (BW × RfD) / EPA_MCL (e.g. 20.8 L/day at 4 ng/L for PFOA)',
  },
  {
    id: 'bioavailability',
    name: 'Gastrointestinal Bioavailability',
    symbol: 'f_{abs}',
    unit: 'fraction (0 to 1)',
    min: '0.75 (75%)',
    average: '0.90 to 0.95 (90% to 95%)',
    max: '0.99 (99%)',
    recommendedDist: 'Uniform (0.85 to 0.98) or Triangular (0.80, 0.95, 0.99)',
    source: 'ATSDR Toxicological Profile for Perfluoroalkyls (2021)',
    description:
      'Fraction of ingested PFAS absorbed through the gastrointestinal tract into systemic circulation. Perfluoroalkyl carboxylic and sulfonic acids exhibit high oral bioavailability (>90%).',
    criticalCutoff: 'f_{abs, crit} = (BW × RfD) / I (Fraction required to reach reference dose)',
  },
  {
    id: 'eliminationHalfLife',
    name: 'Elimination Half-Life',
    symbol: 'T_{1/2}',
    unit: 'years',
    min: '0.1 yr (GenX)',
    average: '3.8 yr (PFOA), 5.4 yr (PFOS), 8.5 yr (PFHxS)',
    max: '12.0 yr (PFHxS)',
    recommendedDist: 'Fixed or Normal around target compound empirical mean',
    source: 'Olsen et al. (2007), Li et al. (2018), US EPA Health Advisory Reviews',
    description:
      'Biological half-life for elimination from human blood serum. Long-chain PFAS undergo renal tubular reabsorption via organic anion transporters (such as OAT4 and URAT1).',
    criticalCutoff:
      'T_{1/2, crit} = (BW × RfD / I) × T_{1/2} (Slower clearance elevates steady-state mass)',
  },
  {
    id: 'exposureDuration',
    name: 'Exposure Duration',
    symbol: 't',
    unit: 'years',
    min: '1.0 year',
    average: '25 to 30 years (steady-state capacity)',
    max: '40 to 50 years',
    recommendedDist: 'Uniform (25 to 30) for baseline average, or Fixed (30)',
    source: 'US EPA Superfund Standard Default Exposure Factors (30-yr residential)',
    description:
      'Duration of chronic exposure. For PFOA and PFNA (half-lives approximately 3.2 to 3.8 years), 25 to 30 years represents 6.5 to 9 half-lives, reaching over 99% of steady-state accumulation (and 87% to 91% for longer-lived PFHxS).',
    criticalCutoff:
      't \\ge 25\\text{ to }30\\text{ years}: \\text{Achieves } (1 - e^{-k_e t}) \\ge 0.99 \\text{ of steady state}',
  },
];
