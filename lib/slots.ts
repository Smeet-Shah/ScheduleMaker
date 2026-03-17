import { addMinutes, eachDayOfInterval, set } from "date-fns";

export type Slot = {
  start: Date;
  end: Date;
};

export function generateTimeSlotsForEvent(options: {
  startDate: Date;
  endDate: Date;
  dayStartHour: number;
  dayStartMinute: number;
  dayEndHour: number;
  dayEndMinute: number;
  slotDurationMinutes: number;
}): Slot[] {
  const {
    startDate,
    endDate,
    dayStartHour,
    dayStartMinute,
    dayEndHour,
    dayEndMinute,
    slotDurationMinutes,
  } = options;

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const slots: Slot[] = [];

  for (const day of days) {
    const dayStart = set(day, {
      hours: dayStartHour,
      minutes: dayStartMinute,
      seconds: 0,
      milliseconds: 0,
    });
    const dayEnd = set(day, {
      hours: dayEndHour,
      minutes: dayEndMinute,
      seconds: 0,
      milliseconds: 0,
    });

    let cursor = dayStart;
    while (addMinutes(cursor, slotDurationMinutes) <= dayEnd) {
      const next = addMinutes(cursor, slotDurationMinutes);
      slots.push({ start: cursor, end: next });
      cursor = next;
    }
  }

  return slots;
}

export function generateDaySlotsForEvent(options: {
  startDate: Date;
  endDate: Date;
}): Slot[] {
  const { startDate, endDate } = options;
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return days.map((day) => {
    const start = set(day, {
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    });
    const end = set(day, {
      hours: 23,
      minutes: 59,
      seconds: 59,
      milliseconds: 999,
    });
    return { start, end };
  });
}


