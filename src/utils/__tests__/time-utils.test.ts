import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRelativeTime } from '../time-utils';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // Mock Date.now() to return a fixed timestamp
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-20T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for times less than 1 minute ago', () => {
    const thirtySecondsAgo = new Date('2024-01-20T11:59:30Z');
    expect(formatRelativeTime(thirtySecondsAgo)).toBe('just now');

    const fiftyNineSecondsAgo = new Date('2024-01-20T11:59:01Z');
    expect(formatRelativeTime(fiftyNineSecondsAgo)).toBe('just now');
  });

  it('returns correct format for minutes', () => {
    const oneMinuteAgo = new Date('2024-01-20T11:59:00Z');
    expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago');

    const fiveMinutesAgo = new Date('2024-01-20T11:55:00Z');
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');

    const fiftyNineMinutesAgo = new Date('2024-01-20T11:01:00Z');
    expect(formatRelativeTime(fiftyNineMinutesAgo)).toBe('59 minutes ago');
  });

  it('returns correct format for hours', () => {
    const oneHourAgo = new Date('2024-01-20T11:00:00Z');
    expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago');

    const threeHoursAgo = new Date('2024-01-20T09:00:00Z');
    expect(formatRelativeTime(threeHoursAgo)).toBe('3 hours ago');

    const twentyThreeHoursAgo = new Date('2024-01-19T13:00:00Z');
    expect(formatRelativeTime(twentyThreeHoursAgo)).toBe('23 hours ago');
  });

  it('returns correct format for days', () => {
    const oneDayAgo = new Date('2024-01-19T12:00:00Z');
    expect(formatRelativeTime(oneDayAgo)).toBe('1 day ago');

    const threeDaysAgo = new Date('2024-01-17T12:00:00Z');
    expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');

    const sixDaysAgo = new Date('2024-01-14T12:00:00Z');
    expect(formatRelativeTime(sixDaysAgo)).toBe('6 days ago');
  });

  it('returns correct format for weeks', () => {
    const oneWeekAgo = new Date('2024-01-13T12:00:00Z');
    expect(formatRelativeTime(oneWeekAgo)).toBe('1 week ago');

    const twoWeeksAgo = new Date('2024-01-06T12:00:00Z');
    expect(formatRelativeTime(twoWeeksAgo)).toBe('2 weeks ago');

    const threeWeeksAgo = new Date('2023-12-30T12:00:00Z');
    expect(formatRelativeTime(threeWeeksAgo)).toBe('3 weeks ago');
  });

  it('returns correct format for months', () => {
    const oneMonthAgo = new Date('2023-12-20T12:00:00Z');
    expect(formatRelativeTime(oneMonthAgo)).toBe('1 month ago');

    const threeMonthsAgo = new Date('2023-10-20T12:00:00Z');
    expect(formatRelativeTime(threeMonthsAgo)).toBe('3 months ago');

    const elevenMonthsAgo = new Date('2023-02-20T12:00:00Z');
    expect(formatRelativeTime(elevenMonthsAgo)).toBe('11 months ago');
  });

  it('returns correct format for years', () => {
    const oneYearAgo = new Date('2023-01-20T12:00:00Z');
    expect(formatRelativeTime(oneYearAgo)).toBe('1 year ago');

    const twoYearsAgo = new Date('2022-01-20T12:00:00Z');
    expect(formatRelativeTime(twoYearsAgo)).toBe('2 years ago');

    const fiveYearsAgo = new Date('2019-01-20T12:00:00Z');
    expect(formatRelativeTime(fiveYearsAgo)).toBe('5 years ago');
  });

  it('handles string dates correctly', () => {
    const dateString = '2024-01-19T12:00:00Z';
    expect(formatRelativeTime(dateString)).toBe('1 day ago');

    const isoString = new Date('2024-01-18T12:00:00Z').toISOString();
    expect(formatRelativeTime(isoString)).toBe('2 days ago');
  });

  it('handles edge cases at boundaries', () => {
    // Exactly 60 seconds ago
    const sixtySecondsAgo = new Date('2024-01-20T11:59:00Z');
    expect(formatRelativeTime(sixtySecondsAgo)).toBe('1 minute ago');

    // Exactly 60 minutes ago
    const sixtyMinutesAgo = new Date('2024-01-20T11:00:00Z');
    expect(formatRelativeTime(sixtyMinutesAgo)).toBe('1 hour ago');

    // Exactly 24 hours ago
    const twentyFourHoursAgo = new Date('2024-01-19T12:00:00Z');
    expect(formatRelativeTime(twentyFourHoursAgo)).toBe('1 day ago');

    // Exactly 7 days ago
    const sevenDaysAgo = new Date('2024-01-13T12:00:00Z');
    expect(formatRelativeTime(sevenDaysAgo)).toBe('1 week ago');

    // Exactly 30 days ago (approximately 1 month)
    const thirtyDaysAgo = new Date('2023-12-21T12:00:00Z');
    expect(formatRelativeTime(thirtyDaysAgo)).toBe('1 month ago');

    // Exactly 365 days ago (1 year)
    const threeSixtyFiveDaysAgo = new Date('2023-01-20T12:00:00Z');
    expect(formatRelativeTime(threeSixtyFiveDaysAgo)).toBe('1 year ago');
  });

  it('handles future dates gracefully', () => {
    const futureDate = new Date('2024-01-21T12:00:00Z');
    // Future dates will show as "just now" since the diff is negative
    expect(formatRelativeTime(futureDate)).toBe('just now');
  });

  it('handles invalid dates', () => {
    const invalidDate = 'invalid-date';
    // Invalid dates will likely return NaN which should be handled
    expect(() => formatRelativeTime(invalidDate)).not.toThrow();
  });
});