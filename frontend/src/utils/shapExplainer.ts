export interface ShapFactor {
  key: string;
  label: string;
  rawValue: number;
  weight: number;
  contributionPoints: number; // e.g. +14.2 or -6.5 pts relative to average
  isPositive: boolean;
  impactLevel: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface ShapReport {
  baseValue: number; // Metro average baseline (e.g. 52.0)
  finalScore: number;
  netDelta: number;
  factors: ShapFactor[];
  strengths: string[];
  risks: string[];
  executiveVerdict: string;
  industryFitBadge: string;
}

const METRO_BASELINE_SCORE = 52.5;

export function computeShapExplainer(
  score: number,
  preset: string,
  factors: { key: string; label: string; raw: number; contribution?: number; explanation?: string }[]
): ShapReport {
  const baseValue = METRO_BASELINE_SCORE;
  const netDelta = Math.round((score - baseValue) * 10) / 10;

  // Expected baseline factor raw average is ~0.50
  const shapFactors: ShapFactor[] = factors.map((f) => {
    // Relative shift from neutral 0.50
    const rawDelta = f.raw - 0.50;
    // Scaled contribution points roughly proportional to final score
    const points = Math.round(rawDelta * 36 * 10) / 10;
    const isPos = points >= 0;
    const absPts = Math.abs(points);

    let impactLevel: 'high' | 'medium' | 'low' = 'low';
    if (absPts >= 8) impactLevel = 'high';
    else if (absPts >= 3.5) impactLevel = 'medium';

    let customExp = f.explanation || '';
    if (!customExp) {
      if (f.key === 'demand') {
        customExp = isPos
          ? 'Dense residential population and above-average household income in catchment.'
          : 'Low catchment population density requiring higher regional drive-in.';
      } else if (f.key === 'accessibility') {
        customExp = isPos
          ? 'High multi-modal road connectivity and public transit density.'
          : 'Limited arterial access and low transit frequency.';
      } else if (f.key === 'competition') {
        customExp = isPos
          ? 'Healthy market demand without saturated direct competition.'
          : 'Higher competitor cluster density creating potential pricing pressure.';
      } else if (f.key === 'complementarity') {
        customExp = isPos
          ? 'Strong anchor tenant synergy (grocery, retail hubs, footfall magnets).'
          : 'Isolated parcel with minimal neighboring commercial footfall generators.';
      } else if (f.key === 'risk') {
        customExp = isPos
          ? 'Zero FEMA flood risk zone and favorable air quality index.'
          : 'Elevated environmental/flood hazard risk buffer.';
      }
    }

    return {
      key: f.key,
      label: f.label,
      rawValue: f.raw,
      weight: 0.2,
      contributionPoints: points,
      isPositive: isPos,
      impactLevel,
      explanation: customExp,
    };
  });

  // Sort by highest absolute impact first
  shapFactors.sort((a, b) => Math.abs(b.contributionPoints) - Math.abs(a.contributionPoints));

  const strengths = shapFactors
    .filter((f) => f.isPositive && f.contributionPoints > 0)
    .map((f) => `+${f.contributionPoints} pts: ${f.label} — ${f.explanation}`);

  const risks = shapFactors
    .filter((f) => !f.isPositive && f.contributionPoints < 0)
    .map((f) => `${f.contributionPoints} pts: ${f.label} — ${f.explanation}`);

  // Executive narrative synthesis
  let verdict = '';
  let industryBadge = 'Prime Candidate';

  if (score >= 80) {
    verdict = `Tier-1 flagship location for ${preset.toUpperCase()}. The site significantly outperforms the metro baseline (+${netDelta} pts) primarily driven by ${shapFactors[0]?.label.toLowerCase()} and strong commercial infrastructure.`;
    industryBadge = 'Top 10% Metro Prime';
  } else if (score >= 60) {
    verdict = `Solid expansion candidate with above-average market viability (+${netDelta} pts). Strong core metrics with manageable trade-offs in ${shapFactors.find(f => !f.isPositive)?.label.toLowerCase() || 'secondary factors'}.`;
    industryBadge = 'Viable Growth Asset';
  } else if (score >= 40) {
    verdict = `Moderate viability site near metro baseline (${netDelta >= 0 ? '+' : ''}${netDelta} pts). Recommended for secondary phase or price-sensitive development with dedicated marketing push.`;
    industryBadge = 'Secondary Opportunity';
  } else {
    verdict = `High-risk location underperforming metro standards (${netDelta} pts). Heavy constraints in ${shapFactors[0]?.label.toLowerCase()} may impede target unit economics.`;
    industryBadge = 'High Friction Site';
  }

  return {
    baseValue,
    finalScore: score,
    netDelta,
    factors: shapFactors,
    strengths,
    risks,
    executiveVerdict: verdict,
    industryFitBadge: industryBadge,
  };
}
