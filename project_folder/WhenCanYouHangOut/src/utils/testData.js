export const testSchedules = {
    'test-1': {
        name: 'Work Schedule',
        schedule: {
            Sunday: { timeRanges: [] },
            Monday: { timeRanges: [
                { id: 1, title: 'Work', start: '09:00', end: '17:00', status: 'Not Free' },
                { id: 2, title: 'Lunch', start: '12:00', end: '13:00', status: 'Free' }
            ]},
            Tuesday: { timeRanges: [
                { id: 3, title: 'Work', start: '09:00', end: '17:00', status: 'Not Free' },
                { id: 4, title: 'Lunch', start: '12:00', end: '13:00', status: 'Free' }
            ]},
            Wednesday: { timeRanges: [
                { id: 5, title: 'Work', start: '09:00', end: '17:00', status: 'Not Free' },
                { id: 6, title: 'Lunch', start: '12:00', end: '13:00', status: 'Free' }
            ]},
            Thursday: { timeRanges: [
                { id: 7, title: 'Work', start: '09:00', end: '17:00', status: 'Not Free' },
                { id: 8, title: 'Lunch', start: '12:00', end: '13:00', status: 'Free' }
            ]},
            Friday: { timeRanges: [
                { id: 9, title: 'Work', start: '09:00', end: '17:00', status: 'Not Free' },
                { id: 10, title: 'Lunch', start: '12:00', end: '13:00', status: 'Free' }
            ]},
            Saturday: { timeRanges: [] }
        }
    },
    'test-2': {
        name: 'Student Schedule',
        schedule: {
            Sunday: { timeRanges: [
                { id: 11, title: 'Study', start: '14:00', end: '18:00', status: 'Not Free' }
            ]},
            Monday: { timeRanges: [
                { id: 12, title: 'Classes', start: '08:00', end: '15:00', status: 'Not Free' },
                { id: 13, title: 'Study Group', start: '16:00', end: '18:00', status: 'Maybe Free' }
            ]},
            Tuesday: { timeRanges: [
                { id: 14, title: 'Classes', start: '10:00', end: '16:00', status: 'Not Free' }
            ]},
            Wednesday: { timeRanges: [
                { id: 15, title: 'Classes', start: '08:00', end: '15:00', status: 'Not Free' },
                { id: 16, title: 'Lab Work', start: '16:00', end: '19:00', status: 'Not Free' }
            ]},
            Thursday: { timeRanges: [
                { id: 17, title: 'Classes', start: '10:00', end: '16:00', status: 'Not Free' }
            ]},
            Friday: { timeRanges: [
                { id: 18, title: 'Classes', start: '09:00', end: '14:00', status: 'Not Free' }
            ]},
            Saturday: { timeRanges: [
                { id: 19, title: 'Study', start: '10:00', end: '14:00', status: 'Maybe Free' }
            ]}
        }
    },
    'test-3': {
        name: 'Gym Schedule',
        schedule: {
            Sunday: { timeRanges: [
                { id: 20, title: 'Rest Day', start: '00:00', end: '23:59', status: 'Free' }
            ]},
            Monday: { timeRanges: [
                { id: 21, title: 'Cardio', start: '06:00', end: '07:30', status: 'Not Free' }
            ]},
            Tuesday: { timeRanges: [
                { id: 22, title: 'Weights', start: '17:00', end: '18:30', status: 'Not Free' }
            ]},
            Wednesday: { timeRanges: [
                { id: 23, title: 'Cardio', start: '06:00', end: '07:30', status: 'Not Free' }
            ]},
            Thursday: { timeRanges: [
                { id: 24, title: 'Weights', start: '17:00', end: '18:30', status: 'Not Free' }
            ]},
            Friday: { timeRanges: [
                { id: 25, title: 'Cardio', start: '06:00', end: '07:30', status: 'Not Free' }
            ]},
            Saturday: { timeRanges: [
                { id: 26, title: 'Yoga', start: '09:00', end: '10:30', status: 'Maybe Free' }
            ]}
        }
    },
    'test-4': {
        name: 'Social Schedule',
        schedule: generateEmptyWeekSchedule([
            { day: 'Friday', title: 'Game Night', start: '19:00', end: '23:00', status: 'Free' },
            { day: 'Saturday', title: 'Brunch', start: '11:00', end: '13:00', status: 'Free' },
            { day: 'Saturday', title: 'Movie Night', start: '20:00', end: '23:00', status: 'Free' }
        ])
    },
    'test-5': {
        name: 'Part-time Job',
        schedule: generateEmptyWeekSchedule([
            { day: 'Monday', title: 'Shift', start: '18:00', end: '22:00', status: 'Not Free' },
            { day: 'Wednesday', title: 'Shift', start: '18:00', end: '22:00', status: 'Not Free' },
            { day: 'Friday', title: 'Shift', start: '18:00', end: '22:00', status: 'Not Free' },
            { day: 'Saturday', title: 'Shift', start: '12:00', end: '20:00', status: 'Not Free' }
        ])
    },
    'test-6': {
        name: 'Sports Practice',
        schedule: generateEmptyWeekSchedule([
            { day: 'Tuesday', title: 'Practice', start: '19:00', end: '21:00', status: 'Not Free' },
            { day: 'Thursday', title: 'Practice', start: '19:00', end: '21:00', status: 'Not Free' },
            { day: 'Saturday', title: 'Game', start: '14:00', end: '17:00', status: 'Not Free' }
        ])
    },
    'test-7': {
        name: 'Family Time',
        schedule: generateEmptyWeekSchedule([
            { day: 'Sunday', title: 'Family Dinner', start: '17:00', end: '20:00', status: 'Not Free' },
            { day: 'Wednesday', title: 'Family Game Night', start: '19:00', end: '21:00', status: 'Maybe Free' }
        ])
    },
    'test-8': {
        name: 'Hobby Club',
        schedule: generateEmptyWeekSchedule([
            { day: 'Monday', title: 'Book Club', start: '19:00', end: '21:00', status: 'Maybe Free' },
            { day: 'Thursday', title: 'Art Class', start: '18:00', end: '20:00', status: 'Not Free' }
        ])
    },
    'test-9': {
        name: 'Volunteer Work',
        schedule: generateEmptyWeekSchedule([
            { day: 'Tuesday', title: 'Food Bank', start: '09:00', end: '12:00', status: 'Not Free' },
            { day: 'Saturday', title: 'Animal Shelter', start: '09:00', end: '13:00', status: 'Not Free' }
        ])
    },
    'test-10': {
        name: 'Free Time',
        schedule: generateEmptyWeekSchedule([
            { day: 'Monday', title: 'Available', start: '18:00', end: '22:00', status: 'Free' },
            { day: 'Tuesday', title: 'Available', start: '18:00', end: '22:00', status: 'Free' },
            { day: 'Wednesday', title: 'Available', start: '18:00', end: '22:00', status: 'Free' },
            { day: 'Thursday', title: 'Available', start: '18:00', end: '22:00', status: 'Free' },
            { day: 'Friday', title: 'Available', start: '18:00', end: '22:00', status: 'Free' }
        ])
    }
};

function generateEmptyWeekSchedule(events = []) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const schedule = {};
    days.forEach(day => {
        schedule[day] = { timeRanges: [] };
    });
    
    events.forEach((event, index) => {
        if (schedule[event.day]) {
            schedule[event.day].timeRanges.push({
                ...event,
                id: 1000 + index
            });
        }
    });
    
    return schedule;
}