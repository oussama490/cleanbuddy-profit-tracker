import type { BreakMinutes, ShiftInput } from "./types";
import { durationMinutes, timeToMinutes } from "./calculations";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateShift(
  input: ShiftInput,
  messages: {
    needDate: string;
    needStart: string;
    needEnd: string;
    endAfterStart: string;
    breakTooLong: string;
    breakNegative: string;
  },
): ValidationResult {
  const errors: string[] = [];

  if (!input.date) errors.push(messages.needDate);
  if (!input.startTime) errors.push(messages.needStart);
  if (!input.endTime) errors.push(messages.needEnd);

  if (input.startTime && input.endTime) {
    if (timeToMinutes(input.endTime) <= timeToMinutes(input.startTime)) {
      errors.push(messages.endAfterStart);
    } else {
      const total = durationMinutes(input.startTime, input.endTime);
      if (input.breakMinutes > total) errors.push(messages.breakTooLong);
    }
  }

  if (input.breakMinutes < 0) errors.push(messages.breakNegative);

  return { valid: errors.length === 0, errors };
}

export const BREAK_OPTIONS: BreakMinutes[] = [0, 30, 40, 60];
