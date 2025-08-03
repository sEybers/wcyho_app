/**
 * Time utility functions for schedule management
 */

// Convert time string to minutes since midnight for easier comparison
export const timeToMinutes = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return 0;
  
  const [hours, minutes] = timeString.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  
  return hours * 60 + minutes;
};

// Convert minutes since midnight back to time string
export const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Check if a time falls within a time range
export const isTimeInRange = (time, startTime, endTime) => {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  // Handle overnight ranges (e.g., 22:00 to 02:00)
  if (endMinutes < startMinutes) {
    return timeMinutes >= startMinutes || timeMinutes < endMinutes;
  }
  
  return timeMinutes >= startMinutes && timeMinutes < endMinutes;
};

// Check if two time ranges overlap
export const doRangesOverlap = (range1, range2) => {
  if (!range1 || !range2) return false;
  
  const start1 = timeToMinutes(range1.start);
  const end1 = timeToMinutes(range1.end);
  const start2 = timeToMinutes(range2.start);
  const end2 = timeToMinutes(range2.end);
  
  // Handle overnight ranges
  const isRange1Overnight = end1 < start1;
  const isRange2Overnight = end2 < start2;
  
  if (isRange1Overnight && isRange2Overnight) {
    // Both ranges are overnight
    return true; // They must overlap somewhere
  } else if (isRange1Overnight) {
    // Only range1 is overnight
    return (start2 >= start1) || (end2 <= end1);
  } else if (isRange2Overnight) {
    // Only range2 is overnight
    return (start1 >= start2) || (end1 <= end2);
  } else {
    // Neither range is overnight
    return start1 < end2 && end1 > start2;
  }
};

// Format time for display (12-hour format)
export const formatTimeDisplay = (timeString) => {
  if (!timeString) return '';
  
  const [hours, minutes] = timeString.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return timeString;
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Generate array of time slots for a day
export const generateTimeSlots = (startHour = 0, endHour = 24, intervalMinutes = 60) => {
  const slots = [];
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;
  
  for (let minutes = startMinutes; minutes < endMinutes; minutes += intervalMinutes) {
    slots.push(minutesToTime(minutes));
  }
  return slots;
};

// Get status for a specific time slot based on schedule data
export const getTimeSlotStatus = (schedule, day, timeSlot) => {
  if (!schedule || !schedule[day] || !schedule[day].timeRanges) {
    return 'free';
  }
  
  const timeRanges = schedule[day].timeRanges;
  
  for (const range of timeRanges) {
    if (isTimeInRange(timeSlot, range.start, range.end)) {
      return range.status?.toLowerCase()?.replace(/\s+/g, '-') || 'free';
    }
  }
  
  return 'free';
};

// Merge overlapping time ranges with the same status
export const mergeTimeRanges = (timeRanges) => {
  if (!Array.isArray(timeRanges) || timeRanges.length === 0) return [];
  
  // Sort ranges by start time
  const sortedRanges = [...timeRanges].sort((a, b) => 
    timeToMinutes(a.start) - timeToMinutes(b.start)
  );
  
  const merged = [sortedRanges[0]];
  
  for (let i = 1; i < sortedRanges.length; i++) {
    const current = sortedRanges[i];
    const last = merged[merged.length - 1];
    
    // If ranges overlap and have same status, merge them
    if (
      doRangesOverlap(last, current) && 
      last.status === current.status
    ) {
      last.end = timeToMinutes(current.end) > timeToMinutes(last.end) 
        ? current.end 
        : last.end;
      
      // Merge titles if they exist
      if (current.title && last.title !== current.title) {
        last.title = `${last.title}, ${current.title}`;
      }
    } else {
      merged.push(current);
    }
  }
  
  return merged;
};

// Find conflicts between multiple schedules
export const findScheduleConflicts = (schedules) => {
  if (!Array.isArray(schedules) || schedules.length < 2) return [];
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const conflicts = [];
  
  days.forEach(day => {
    const dayConflicts = [];
    
    // Get all time ranges for this day from all schedules
    const allRanges = [];
    schedules.forEach((schedule, scheduleIndex) => {
      if (schedule.schedule?.[day]?.timeRanges) {
        schedule.schedule[day].timeRanges.forEach(range => {
          allRanges.push({
            ...range,
            scheduleIndex,
            scheduleName: schedule.name,
            ownerName: schedule.ownerName
          });
        });
      }
    });
    
    // Find overlapping ranges
    for (let i = 0; i < allRanges.length; i++) {
      for (let j = i + 1; j < allRanges.length; j++) {
        const range1 = allRanges[i];
        const range2 = allRanges[j];
        
        // Only consider conflicts between different schedules
        if (range1.scheduleIndex !== range2.scheduleIndex && doRangesOverlap(range1, range2)) {
          dayConflicts.push({
            range1,
            range2,
            overlapStart: minutesToTime(Math.max(timeToMinutes(range1.start), timeToMinutes(range2.start))),
            overlapEnd: minutesToTime(Math.min(timeToMinutes(range1.end), timeToMinutes(range2.end)))
          });
        }
      }
    }
    
    if (dayConflicts.length > 0) {
      conflicts.push({ day, conflicts: dayConflicts });
    }
  });
  
  return conflicts;
};

// Find common free time between schedules
export const findCommonFreeTime = (schedules, day, minDurationMinutes = 60) => {
  if (!Array.isArray(schedules) || schedules.length === 0) return [];
  
  const dayMinutes = 24 * 60; // Total minutes in a day
  const occupiedSlots = new Set();
  
  // Mark all occupied time slots
  schedules.forEach(schedule => {
    if (schedule.schedule?.[day]?.timeRanges) {
      schedule.schedule[day].timeRanges.forEach(range => {
        if (range.status !== 'free') {
          const startMinutes = timeToMinutes(range.start);
          const endMinutes = timeToMinutes(range.end);
          
          for (let minute = startMinutes; minute < endMinutes; minute++) {
            occupiedSlots.add(minute);
          }
        }
      });
    }
  });
  
  // Find consecutive free time slots
  const freeSlots = [];
  let currentSlotStart = null;
  
  for (let minute = 0; minute < dayMinutes; minute++) {
    if (!occupiedSlots.has(minute)) {
      if (currentSlotStart === null) {
        currentSlotStart = minute;
      }
    } else {
      if (currentSlotStart !== null) {
        const duration = minute - currentSlotStart;
        if (duration >= minDurationMinutes) {
          freeSlots.push({
            start: minutesToTime(currentSlotStart),
            end: minutesToTime(minute),
            duration
          });
        }
        currentSlotStart = null;
      }
    }
  }
  
  // Handle case where free time extends to end of day
  if (currentSlotStart !== null) {
    const duration = dayMinutes - currentSlotStart;
    if (duration >= minDurationMinutes) {
      freeSlots.push({
        start: minutesToTime(currentSlotStart),
        end: minutesToTime(dayMinutes),
        duration
      });
    }
  }
  
  return freeSlots;
};

// Validate time range data
export const validateTimeRange = (range) => {
  if (!range || typeof range !== 'object') return false;
  
  const { start, end, status } = range;
  
  if (!start || !end || !status) return false;
  if (typeof start !== 'string' || typeof end !== 'string') return false;
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return false;
  
  return true;
};

// Constants for common use
export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const WORK_HOURS = generateTimeSlots(9, 17);
export const ALL_HOURS = generateTimeSlots(0, 24);
export const STATUS_TYPES = ['Free', 'Not Free', 'Maybe Free'];
