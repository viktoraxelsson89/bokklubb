// metrics.js - Beräkningsfunktioner (rena funktioner utan side effects)

export function getAvgRating(book) {
  if (book.finalAverage) return book.finalAverage;
  
  const ratings = Object.values(book.ratings || {});
  if (ratings.length === 0) return 0;
  
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
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

export function getRatingColor(rating) {
  if (rating >= 8) return 'bg-sage text-ink';
  if (rating >= 6) return 'bg-sand text-ink';
  if (rating >= 4) return 'bg-mortar text-ink';
  return 'bg-grout text-bone';
}
