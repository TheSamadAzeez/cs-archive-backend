/**
 * Utility functions for time conversion between 24-hour and 12-hour formats
 */

export interface TimeFormat12Hour {
  time: string; // HH:MM format
  period: 'AM' | 'PM';
  display: string; // "HH:MM AM/PM" format
}

export interface TimeFormat24Hour {
  time: string; // HH:MM format in 24-hour
}

/**
 * Convert 24-hour format time to 12-hour format with AM/PM
 * @param time24 - Time in 24-hour format (HH:MM)
 * @returns Object with 12-hour time, period, and display string
 */
export function convertTo12Hour(time24: string): TimeFormat12Hour {
  const [hours, minutes] = time24.split(':').map(Number);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid time format');
  }

  const period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
  let displayHours = hours % 12;
  if (displayHours === 0) {
    displayHours = 12;
  }

  const formattedTime = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const display = `${formattedTime} ${period}`;

  return {
    time: formattedTime,
    period,
    display,
  };
}

/**
 * Convert 12-hour format time to 24-hour format
 * @param time12 - Time in 12-hour format (HH:MM)
 * @param period - AM or PM
 * @returns Time in 24-hour format (HH:MM)
 */
export function convertTo24Hour(time12: string, period: 'AM' | 'PM'): string {
  const [hours, minutes] = time12.split(':').map(Number);

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid 12-hour time format');
  }

  let hours24 = hours;

  if (period === 'AM' && hours === 12) {
    hours24 = 0;
  } else if (period === 'PM' && hours !== 12) {
    hours24 = hours + 12;
  }

  return `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Parse display format time string (e.g., "02:30 PM") to components
 * @param displayTime - Time in "HH:MM AM/PM" format
 * @returns Object with time and period
 */
export function parseDisplayTime(displayTime: string): { time: string; period: 'AM' | 'PM' } {
  const regex = /^(\d{1,2}:\d{2})\s+(AM|PM)$/i;
  const match = displayTime.match(regex);

  if (!match) {
    throw new Error('Invalid display time format. Expected format: "HH:MM AM/PM"');
  }

  return {
    time: match[1],
    period: match[2].toUpperCase() as 'AM' | 'PM',
  };
}
