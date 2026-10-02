import { formatNumber } from "../ui.js";

// Only generated measurement lines are reformatted; free text is left intact.
export function presentMeasurementNote(text) {
  return String(text ?? "").split("\n").filter(line => !/^Metod: (summa diameter³|aritmetiskt medel \(summa höjder|totalt antal × 10 000)/.test(line)).map(line => {
    if (/^(DGV|Medelhöjd|Stamantal): /.test(line)) return line.replace(/^(DGV|Medelhöjd|Stamantal): ([\d \u00a0\u202f]+(?:[,.]\d+)?)/, (_, label, value) => `${label}: ${formatNumber(Number(value.replace(/[ \u00a0\u202f]/g, "").replace(",", ".")), 1)}${value.endsWith(" ") ? " " : ""}`);
    if (/^(Diametrar \(cm\)|Höjder \(m\)): /.test(line)) return line.replace(/\d+(?:[,.]\d+)?/g, value => formatNumber(Number(value.replace(",", ".")), 1));
    return line;
  }).join("\n");
}
