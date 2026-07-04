export const SITE_INDEX_CURVES = [];

export function findSiteIndexCurves(speciesCode) {
  return SITE_INDEX_CURVES.filter((curve) => curve.speciesCode === speciesCode);
}

export function hasSiteIndexCurveData(speciesCode) {
  return findSiteIndexCurves(speciesCode).length > 0;
}
