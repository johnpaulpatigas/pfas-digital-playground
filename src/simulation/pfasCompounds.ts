export interface PFASCompound {
  id: string;
  name: string;
  chemicalFormula: string;
  casNumber: string;
  description: string;
  halfLifeYears: number; // Biological elimination half-life in human serum
  volumeOfDistribution: number; // L/kg
  epaMCL: number; // US EPA Maximum Contaminant Level (ng/L or ppt)
  rfdDose: number; // Reference Dose (ug/kg/day)
}

export const PFAS_COMPOUNDS: PFASCompound[] = [
  {
    id: 'pfoa',
    name: 'PFOA (Perfluorooctanoic Acid)',
    chemicalFormula: 'C_8HF_{15}O_2',
    casNumber: '335-67-1',
    description: 'Legacy long-chain PFAS widely used in non-stick coatings, aqueous film-forming foams (AFFF), and textiles.',
    halfLifeYears: 3.8,
    volumeOfDistribution: 0.17,
    epaMCL: 4.0, // 4 ng/L
    rfdDose: 0.0000015, // 1.5e-6 ug/kg/day
  },
  {
    id: 'pfos',
    name: 'PFOS (Perfluorooctane Sulfonate)',
    chemicalFormula: 'C_8F_{17}SO_3^-',
    casNumber: '1763-23-1',
    description: 'Surfactant compound exhibiting strong biological accumulation in human serum, liver, and kidneys.',
    halfLifeYears: 5.4,
    volumeOfDistribution: 0.23,
    epaMCL: 4.0, // 4 ng/L
    rfdDose: 0.0000018, // 1.8e-6 ug/kg/day
  },
  {
    id: 'pfhxs',
    name: 'PFHxS (Perfluorohexane Sulfonic Acid)',
    chemicalFormula: 'C_6F_{13}SO_3^-',
    casNumber: '355-46-4',
    description: 'Persistent long-chain sulfonic acid with a long human elimination half-life.',
    halfLifeYears: 8.5,
    volumeOfDistribution: 0.28,
    epaMCL: 10.0, // 10 ng/L
    rfdDose: 0.000005,
  },
  {
    id: 'pfna',
    name: 'PFNA (Perfluorononanoic Acid)',
    chemicalFormula: 'C_9HF_{17}O_2',
    casNumber: '375-95-1',
    description: '9-carbon perfluorinated carboxylic acid found in industrial applications and dietary sources.',
    halfLifeYears: 3.2,
    volumeOfDistribution: 0.20,
    epaMCL: 10.0, // 10 ng/L
    rfdDose: 0.000003,
  },
  {
    id: 'genx',
    name: 'GenX (HFPO-DA)',
    chemicalFormula: 'C_6HF_{11}O_3',
    casNumber: '62037-80-3',
    description: 'Short-chain replacement compound with shorter serum half-life and high mobility in groundwater.',
    halfLifeYears: 0.2,
    volumeOfDistribution: 0.40,
    epaMCL: 10.0, // 10 ng/L
    rfdDose: 0.00003,
  },
];
