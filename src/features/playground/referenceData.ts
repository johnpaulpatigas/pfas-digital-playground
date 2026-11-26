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
    name: 'Compound-Specific Non-Water Intake',
    symbol: 'I_{nw}',
    unit: 'µg/day',
    min: 'Study-specific',
    average: 'Enter separately for each PFAS',
    max: 'Study-specific',
    recommendedDist: 'Set from study-specific exposure evidence',
    source: 'No compound-specific intake values are provided in the supplied assessments',
    description:
      'Non-water daily intake for one PFAS. Configure separate distributions for PFOA, PFOS, PFHxS, PFNA, and GenX using study-specific exposure data.',
    criticalCutoff: 'I_{nw,crit} = BW × RfD - (C_w × W / 1000)',
  },
  {
    id: 'waterConcentration',
    name: 'Compound-Specific Drinking-Water Concentration',
    symbol: 'C_w',
    unit: 'ng/L',
    min: '0 ng/L',
    average: 'Scenario starts at low-level treated-water baseline (0.5–1.0 ng/L)',
    max: 'Study/site-specific',
    recommendedDist: 'Set from measured concentration data',
    source:
      '2024 EPA NPDWR MCLs (4–10 ng/L); preset values are low-level baselines, not measured water data',
    description:
      'Concentration of a PFAS in drinking water. Water-derived intake is concentration × daily water consumption, converted from ng to µg.',
    criticalCutoff: 'C_{w,crit} = 1000 × (BW × RfD - I_{nw}) / W',
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
    criticalCutoff: 'W_{crit} = 1000 × (BW × RfD - I_{nw}) / C_w',
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
    criticalCutoff:
      'No HQ threshold: HQ is based on ingested dose and independent of bioavailability',
  },
  {
    id: 'eliminationHalfLife',
    name: 'Elimination Half-Life',
    symbol: 'T_{1/2}',
    unit: 'years',
    min: 'Not established for the modeled compounds',
    average: 'PFNA: 3.52 yr (DOH value used in modified MRL derivation)',
    max: 'Not established for the modeled compounds',
    recommendedDist: 'No source-backed distribution available',
    source:
      'June 2024 Ecology memo: DOH applied 3.52 yr from Yu et al. (2021) for PFNA; other compounds are not provided',
    description:
      'Biological half-life for elimination from human blood serum. The June 2024 Ecology memo reports DOH applied a 3.52-year PFNA estimate from Yu et al. (2021) in its modified MRL derivation. Comparable values for the other modeled compounds are not provided.',
    criticalCutoff:
      'Numerical solution of B(T½) = Bcrit using current intake, bioavailability, body weight, and exposure duration',
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
      'Duration of chronic exposure. The source documents do not establish compound-specific half-lives, so steady-state fractions depend on the user-supplied model assumption.',
    criticalCutoff:
      'tcrit = -(1/ke) ln(1 - Bcrit × ke / (I × fabs)); no crossing when intake is at or below the RfD threshold',
  },
];
