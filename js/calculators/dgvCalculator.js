export function calculateDgv(input = {}) {
  return {
    status: "planned",
    message: "DGV-beräkningen kopplas in i nästa steg.",
    input
  };
}

export const dgvFields = [
  "Ståndortsindex",
  "Trädslag",
  "Ålder",
  "Grundyta",
  "Stamantal"
];
