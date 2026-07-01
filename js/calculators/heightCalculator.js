export function calculateMeanHeight(trees = []) {
  const validTrees = trees
    .map((tree) => Number.parseFloat(tree.height))
    .filter((height) => Number.isFinite(height) && height > 0);

  if (!validTrees.length) {
    return { count: 0, meanHeight: 0 };
  }

  const sum = validTrees.reduce((total, height) => total + height, 0);
  return {
    count: validTrees.length,
    meanHeight: sum / validTrees.length
  };
}

export const heightFields = ["Provträd", "Höjd", "Trädslag", "Anteckning"];
