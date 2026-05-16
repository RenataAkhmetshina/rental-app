/**
 * @jest-environment jsdom
 */
// 

// Test: timeAgo 
function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''} ago`;
}

describe('timeAgo utility', () => {
  test('returns Today for recent dates', () => {
    expect(timeAgo(new Date())).toBe('Today');
  });

  test('returns Yesterday for 1 day ago', () => {
    const d = new Date(Date.now() - 86400000);
    expect(timeAgo(d)).toBe('Yesterday');
  });

  test('returns days ago for < 30 days', () => {
    const d = new Date(Date.now() - 86400000 * 5);
    expect(timeAgo(d)).toBe('5 days ago');
  });

  test('returns months ago for > 30 days', () => {
    const d = new Date(Date.now() - 86400000 * 65);
    expect(timeAgo(d)).toBe('2 months ago');
  });

  test('returns year for > 365 days', () => {
    const d = new Date(Date.now() - 86400000 * 400);
    expect(timeAgo(d)).toBe('1 year ago');
  });
});

// Test: price formatting
describe('Price formatting', () => {
  test('formats large numbers with commas', () => {
    expect((1500).toLocaleString('en-US')).toBe('1,500');
    expect((10000).toLocaleString('en-US')).toBe('10,000');
  });
});

// Test: lease total price calculation
describe('Lease price calculation', () => {
  function calcTotal(startDate, endDate, pricePerMonth) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    
    return Math.max(1, months) * pricePerMonth;
  }

  test('calculates 1 month correctly', () => {
    const start = new Date('2025-01-01');
    const end = new Date('2025-02-01');
    expect(calcTotal(start, end, 1000)).toBe(1000);
  });

  test('calculates 3 months correctly', () => {
    const start = new Date('2025-01-01');
    const end = new Date('2025-04-01');
    expect(calcTotal(start, end, 500)).toBe(1500);
  });

  test('enforces minimum of 1 month', () => {
    const start = new Date('2025-01-01');
    const end = new Date('2025-01-02');
    expect(calcTotal(start, end, 1000)).toBe(1000);
  });
});