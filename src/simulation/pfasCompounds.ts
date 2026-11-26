export interface PFASCompound {
  id: string;
  name: string;
  chemicalFormula: string;
  casNumber: string;
  description: string;
  halfLifeYears: number; // Model input; source-backed only where halfLifeSource is set
  halfLifeSource?: string;
  volumeOfDistribution: number; // L/kg model input; not established in the cited assessments
  epaMCL: number; // US EPA Maximum Contaminant Level (ng/L or ppt)
  rfdDose: number; // Selected chronic RfD/MRL (µg/kg/day; model storage unit)
  rfdSource: string;
}

// The March 2023 presentation reports proposed HBWCs (PFHxS 9, PFNA 10,
// PFBS 2000, HFPO-DA 10 ng/L); the June 2024 memo describes the final rule.
// These catalog values are final individual MCLs, not proposed HBWCs.

export const PFAS_COMPOUNDS: PFASCompound[] = [
  {
    id: 'pfoa',
    name: 'PFOA (Perfluorooctanoic Acid)',
    chemicalFormula: 'C_8HF_{15}O_2',
    casNumber: '335-67-1',
    description: 'Per- and polyfluoroalkyl substance included in the 2024 EPA drinking water rule.',
    halfLifeYears: 3.8,
    volumeOfDistribution: 0.17,
    epaMCL: 4.0, // 4 ng/L
    rfdDose: 0.00003, // EPA Office of Water 2024: 3E-08 mg/kg/day
    rfdSource: 'EPA Office of Water, Final Human Health Toxicity Assessment for PFOA (2024)',
  },
  {
    id: 'pfos',
    name: 'PFOS (Perfluorooctane Sulfonate)',
    chemicalFormula: 'C_8F_{17}SO_3^-',
    casNumber: '1763-23-1',
    description: 'Per- and polyfluoroalkyl substance included in the 2024 EPA drinking water rule.',
    halfLifeYears: 5.4,
    volumeOfDistribution: 0.23,
    epaMCL: 4.0, // 4 ng/L
    rfdDose: 0.0001, // EPA Office of Water 2024: 1E-07 mg/kg/day
    rfdSource: 'EPA Office of Water, Final Human Health Toxicity Assessment for PFOS (2024)',
  },
  {
    id: 'pfhxs',
    name: 'PFHxS (Perfluorohexane Sulfonic Acid)',
    chemicalFormula: 'C_6F_{13}SO_3^-',
    casNumber: '355-46-4',
    description: 'Per- and polyfluoroalkyl substance included in the 2024 EPA drinking water rule.',
    halfLifeYears: 8.5,
    volumeOfDistribution: 0.28,
    epaMCL: 10.0, // Final 2024 EPA MCL (ng/L); March 2023 proposal listed 9 ng/L
    rfdDose: 0.0097, // Ecology-selected MDH chronic RfD: 9.7E-06 mg/kg/day
    rfdSource: 'MDH 2019 chronic RfD, selected by Ecology for cleanup levels (June 2024 memo)',
  },
  {
    id: 'pfna',
    name: 'PFNA (Perfluorononanoic Acid)',
    chemicalFormula: 'C_9HF_{17}O_2',
    casNumber: '375-95-1',
    description: 'Per- and polyfluoroalkyl substance included in the 2024 EPA drinking water rule.',
    halfLifeYears: 3.52,
    halfLifeSource: 'DOH used 3.52 years in its modified ATSDR MRL derivation (Yu et al., 2021)',
    volumeOfDistribution: 0.2,
    epaMCL: 10.0, // 10 ng/L
    rfdDose: 0.0025, // Ecology-selected modified ATSDR MRL: 2.5E-06 mg/kg/day
    rfdSource: 'Modified ATSDR MRL selected by Ecology; DOH half-life update (June 2024 memo)',
  },
  {
    id: 'genx',
    name: 'GenX (HFPO-DA)',
    chemicalFormula: 'C_6HF_{11}O_3',
    casNumber: '62037-80-3',
    description:
      'HFPO-DA, also known as GenX chemicals, is included in the 2024 EPA drinking water rule.',
    halfLifeYears: 0.2,
    volumeOfDistribution: 0.4,
    epaMCL: 10.0, // 10 ng/L
    rfdDose: 0.003, // EPA Office of Water 2021: 3E-06 mg/kg/day
    rfdSource: 'EPA Office of Water, Human Health Toxicity Assessment for GenX Chemicals (2021)',
  },
];
