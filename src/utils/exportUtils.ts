import type { IterationResult, SummaryStatistics } from '../types';

/**
 * Download text content as file
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export simulation iterations and stats to CSV
 */
export function exportToCSV(results: IterationResult[], filename = 'pfas_simulation_results.csv') {
  if (!results || results.length === 0) return;

  const compoundIds = ['pfoa', 'pfos', 'pfhxs', 'pfna', 'genx'] as const;
  const compoundExposureHeaders = compoundIds.flatMap((id) => [
    `${id.toUpperCase()}_NonWater_Intake_ug_day`,
    `${id.toUpperCase()}_Water_Concentration_ng_L`,
    `${id.toUpperCase()}_Water_Intake_ug_day`,
    `${id.toUpperCase()}_Total_Intake_ug_day`,
  ]);

  const headers = [
    'Iteration',
    'Daily_Intake_ug_day',
    'Body_Weight_kg',
    'Age_yrs',
    'Water_Intake_L_day',
    'Bioavailability_fraction',
    'Half_Life_yrs',
    'Exposure_Duration_yrs',
    'Elimination_Rate_day_inv',
    'Steady_State_Serum_Css_ug_L',
    'Peak_Body_Burden_ug',
    'Clearance_Rate_L_kg_day',
    'Hazard_Quotient_HQ',
    'Exploratory_Sum_of_Modeled_HQs_not_EPA_NPDWR_HI',
    ...compoundExposureHeaders,
  ];

  const rows = results.map((r) => [
    r.iteration,
    r.dailyIntake,
    r.bodyWeight,
    r.age,
    r.waterConsumption,
    r.bioavailability,
    r.eliminationHalfLife,
    r.exposureDuration,
    r.eliminationRate,
    r.steadyStateConcentration,
    r.peakBodyBurden,
    r.clearanceRate,
    parseFloat(r.hazardQuotient.toFixed(4)),
    parseFloat((r.hazardIndex ?? r.hazardQuotient).toFixed(4)),
    ...compoundIds.flatMap((id) => {
      const exposure = r.compoundOutputs?.[id];
      return [
        exposure?.dietaryIntake ?? r.dietaryIntake ?? r.dailyIntake,
        exposure?.waterConcentration ?? 0,
        exposure?.waterIntake ?? r.waterIntake ?? 0,
        exposure?.dailyIntake ?? r.dailyIntake,
      ];
    }),
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export full simulation object to JSON
 */
export function exportToJSON(
  results: IterationResult[],
  summaryStats: SummaryStatistics | null,
  filename = 'pfas_simulation_export.json',
) {
  const payload = {
    exportedAt: new Date().toISOString(),
    summaryStatistics: summaryStats,
    iterationsCount: results.length,
    data: results,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  downloadFile(jsonString, filename, 'application/json');
}
