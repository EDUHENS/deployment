'use client';

import { useEffect, useState } from 'react';

/**
 * Get the current date/time components in Finland timezone (Europe/Helsinki)
 * Returns an object with date components that can be used to create a comparable Date
 */
function getFinlandTimeComponents(): { year: number; month: number; day: number; hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => {
    const part = parts.find(p => p.type === type);
    return part ? parseInt(part.value, 10) : 0;
  };
  
  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hours: getPart('hour'),
    minutes: getPart('minute'),
    seconds: getPart('second')
  };
}

/**
 * Get current date/time as a Date object representing the current moment
 * in Finland timezone. This is used for real-time tracking and validation.
 */
export function getFinlandTime(): Date {
  const components = getFinlandTimeComponents();
  
  // Create a Date object using UTC methods but with Finland time components
  // This gives us a Date that represents "this moment in Finland"
  const date = new Date();
  date.setUTCFullYear(components.year);
  date.setUTCMonth(components.month - 1);
  date.setUTCDate(components.day);
  date.setUTCHours(components.hours);
  date.setUTCMinutes(components.minutes);
  date.setUTCSeconds(components.seconds);
  date.setUTCMilliseconds(0);
  
  // Adjust for timezone offset to get the actual UTC timestamp
  // that represents this moment in Finland
  const finlandOffset = getFinlandTimezoneOffset();
  return new Date(date.getTime() - finlandOffset);
}

/**
 * Get the timezone offset for Finland (Europe/Helsinki) in milliseconds
 */
function getFinlandTimezoneOffset(): number {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const finlandTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Helsinki' }));
  const finlandOffset = finlandTime.getTime() - utcTime;
  return finlandOffset;
}

/**
 * Convert a date to Finland timezone for comparison
 * Returns the date components as they would appear in Finland timezone
 */
export function toFinlandTime(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(d);
  const getPart = (type: string) => {
    const part = parts.find(p => p.type === type);
    return part ? parseInt(part.value, 10) : 0;
  };
  
  const finlandDate = new Date();
  finlandDate.setUTCFullYear(getPart('year'));
  finlandDate.setUTCMonth(getPart('month') - 1);
  finlandDate.setUTCDate(getPart('day'));
  finlandDate.setUTCHours(getPart('hour'));
  finlandDate.setUTCMinutes(getPart('minute'));
  finlandDate.setUTCSeconds(getPart('second'));
  finlandDate.setUTCMilliseconds(0);
  
  const offset = getFinlandTimezoneOffset();
  return new Date(finlandDate.getTime() - offset);
}

/**
 * Hook that provides real-time current date/time updates in Finland timezone
 * Updates every second to keep due date calculations accurate
 * Similar to corporate systems like Coursera that constantly check dates
 */
export function useRealtimeDate() {
  const [currentDate, setCurrentDate] = useState(getFinlandTime());

  useEffect(() => {
    // Update immediately with Finland time
    setCurrentDate(getFinlandTime());

    // Update every second for real-time accuracy (like corporate apps)
    // This ensures the UI updates immediately when crossing time thresholds
    const interval = setInterval(() => {
      setCurrentDate(getFinlandTime());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return currentDate;
}

/**
 * Calculate days until due date using real-time current date in Finland timezone
 * Returns the number of days remaining, considering Finland time
 */
export function calculateDaysUntilDue(dueDate: Date | string | null | undefined, currentDate: Date): number {
  if (!dueDate) return Infinity; // No due date = always "on track"
  
  const due = toFinlandTime(dueDate);
  const current = toFinlandTime(currentDate);
  
  if (Number.isNaN(due.getTime())) return Infinity;
  
  // Calculate difference in milliseconds
  const diffMs = due.getTime() - current.getTime();
  
  // Convert to days (floor to get full days remaining)
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

