export function calculateAverage(votes) {
  const validVotes = Object.values(votes).filter(v => v && v.submitted && v.vote);
  if (validVotes.length === 0) return 0;
  return validVotes.reduce((sum, v) => sum + v.vote, 0) / validVotes.length;
}

export function getAverageRating(ratings) {
  const values = Object.values(ratings);
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Bakåtkompatibelt genomsnitt: nya böcker har finalAverage, gamla har bara ratings{}
export function getDisplayAverage(book) {
  return book.finalAverage || getAverageRating(book.ratings || {});
}

export function getRatingColor(rating) {
  if (rating >= 8) return 'bg-sage text-ink';
  if (rating >= 6) return 'bg-sand text-ink';
  if (rating >= 4) return 'bg-mortar text-ink';
  return 'bg-grout text-bone';
}

export function calculateCorrelation(x, y) {
  if (x.length !== y.length || x.length === 0) return 0;
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  return denominator === 0 ? 0 : numerator / denominator;
}
