import { Subject, TimetableEntry, Weekday } from '../types';

export interface EnrichedClassEntry extends TimetableEntry {
  subject: Subject;
}

export const COLLEGE_SUBJECTS: Record<string, Subject> = {
  dae: {
    id: 'dae',
    code: 'DAE',
    name: 'Data Analysis Essentials',
    faculty: 'Dr. S Ram Chandra Polisetty',
    building: 'Ramanujan Bhavan',
    room: 'RB-203',
  },
  oopcpp: {
    id: 'oopcpp',
    code: 'OOPC++',
    name: 'Object Oriented Programming Through C++',
    faculty: 'Dr. Appawala Jayanthi',
    building: 'Ramanujan Bhavan',
    room: 'RB-120',
  },
  adsaa: {
    id: 'adsaa',
    code: 'ADSAA',
    name: 'Advanced Data Structures & Algorithm Analysis',
    faculty: 'Malakala Mani Ratnam',
    building: 'Ramanujan Bhavan',
    room: 'RB-120',
  },
  dms: {
    id: 'dms',
    code: 'DMS',
    name: 'Database Management Systems',
    faculty: 'Kasichainula Vydehi',
    building: 'Ramanujan Bhavan',
    room: 'RB-121',
  },
  ase: {
    id: 'ase',
    code: 'ASE',
    name: 'Agile Software Engineering',
    faculty: 'Chikkala Lova Lakshmi',
    building: 'Ramanujan Bhavan',
    room: 'RB-121',
  },
  dm: {
    id: 'dm',
    code: 'DM',
    name: 'Discrete Mathematics',
    faculty: 'Dr. Gudala Balaji Prakash',
    building: 'Ramanujan Bhavan',
    room: 'RB-121',
  },
  es2: {
    id: 'es2',
    code: 'ES-II',
    name: 'Employability Skills-II',
    faculty: 'P Durga Raja Choudhuri',
    building: 'James Watt Bhavan',
    room: 'JWB-202',
  },
};

export const COLLEGE_TIMETABLE: TimetableEntry[] = [
  // MONDAY
  { id: 'mon-1', weekday: 'monday', subjectId: 'dms', startTime: '09:30 AM', endTime: '10:20 AM' },
  { id: 'mon-2', weekday: 'monday', subjectId: 'dms', startTime: '10:30 AM', endTime: '11:20 AM' },
  { id: 'mon-3', weekday: 'monday', subjectId: 'oopcpp', startTime: '11:20 AM', endTime: '12:10 PM' },
  { id: 'mon-4', weekday: 'monday', subjectId: 'oopcpp', startTime: '01:00 PM', endTime: '01:50 PM' },
  { id: 'mon-5', weekday: 'monday', subjectId: 'es2', startTime: '01:50 PM', endTime: '02:40 PM' },
  { id: 'mon-6', weekday: 'monday', subjectId: 'es2', startTime: '02:50 PM', endTime: '03:40 PM' },
  { id: 'mon-7', weekday: 'monday', subjectId: 'es2', startTime: '03:40 PM', endTime: '04:20 PM' },

  // TUESDAY
  { id: 'tue-1', weekday: 'tuesday', subjectId: 'dae', startTime: '09:30 AM', endTime: '10:20 AM' },
  { id: 'tue-2', weekday: 'tuesday', subjectId: 'dae', startTime: '10:30 AM', endTime: '11:20 AM' },
  { id: 'tue-3', weekday: 'tuesday', subjectId: 'oopcpp', startTime: '11:20 AM', endTime: '12:10 PM' },
  { id: 'tue-4', weekday: 'tuesday', subjectId: 'adsaa', startTime: '01:00 PM', endTime: '01:50 PM' },
  { id: 'tue-5', weekday: 'tuesday', subjectId: 'adsaa', startTime: '01:50 PM', endTime: '02:40 PM' },
  { id: 'tue-6', weekday: 'tuesday', subjectId: 'ase', startTime: '02:50 PM', endTime: '03:40 PM' },

  // WEDNESDAY
  { id: 'wed-1', weekday: 'wednesday', subjectId: 'es2', startTime: '09:30 AM', endTime: '10:20 AM' },
  { id: 'wed-2', weekday: 'wednesday', subjectId: 'es2', startTime: '10:30 AM', endTime: '11:20 AM' },
  { id: 'wed-3', weekday: 'wednesday', subjectId: 'es2', startTime: '11:20 AM', endTime: '12:10 PM' },
  { id: 'wed-4', weekday: 'wednesday', subjectId: 'dms', startTime: '01:00 PM', endTime: '01:50 PM' },
  { id: 'wed-5', weekday: 'wednesday', subjectId: 'dms', startTime: '01:50 PM', endTime: '02:40 PM' },
  { id: 'wed-6', weekday: 'wednesday', subjectId: 'adsaa', startTime: '02:50 PM', endTime: '03:40 PM' },
  { id: 'wed-7', weekday: 'wednesday', subjectId: 'dm', startTime: '03:40 PM', endTime: '04:20 PM' },

  // THURSDAY
  { id: 'thu-1', weekday: 'thursday', subjectId: 'dms', startTime: '09:30 AM', endTime: '10:20 AM' },
  { id: 'thu-2', weekday: 'thursday', subjectId: 'dms', startTime: '10:30 AM', endTime: '11:20 AM' },
  { id: 'thu-3', weekday: 'thursday', subjectId: 'oopcpp', startTime: '11:20 AM', endTime: '12:10 PM' },
  { id: 'thu-4', weekday: 'thursday', subjectId: 'ase', startTime: '01:00 PM', endTime: '01:50 PM' },
  { id: 'thu-5', weekday: 'thursday', subjectId: 'ase', startTime: '01:50 PM', endTime: '02:40 PM' },
  { id: 'thu-6', weekday: 'thursday', subjectId: 'dm', startTime: '02:50 PM', endTime: '03:40 PM' },
  { id: 'thu-7', weekday: 'thursday', subjectId: 'dm', startTime: '03:40 PM', endTime: '04:20 PM' },

  // FRIDAY
  { id: 'fri-1', weekday: 'friday', subjectId: 'oopcpp', startTime: '09:30 AM', endTime: '10:20 AM' },
  { id: 'fri-2', weekday: 'friday', subjectId: 'oopcpp', startTime: '10:30 AM', endTime: '11:20 AM' },
  { id: 'fri-3', weekday: 'friday', subjectId: 'ase', startTime: '11:20 AM', endTime: '12:10 PM' },
  { id: 'fri-4', weekday: 'friday', subjectId: 'dae', startTime: '01:00 PM', endTime: '01:50 PM' },
  { id: 'fri-5', weekday: 'friday', subjectId: 'dae', startTime: '01:50 PM', endTime: '02:40 PM' },
  { id: 'fri-6', weekday: 'friday', subjectId: 'adsaa', startTime: '02:50 PM', endTime: '03:40 PM' },

  // SATURDAY & SUNDAY: No classes scheduled
];

export function getTimetableEntriesForWeekday(weekday: Weekday): EnrichedClassEntry[] {
  return COLLEGE_TIMETABLE.filter(item => item.weekday === weekday).map(item => ({
    ...item,
    subject: COLLEGE_SUBJECTS[item.subjectId] || {
      id: item.subjectId,
      code: item.subjectId.toUpperCase(),
      name: item.subjectId.toUpperCase(),
      faculty: 'Faculty Member',
      building: 'Campus',
      room: 'TBD',
    },
  }));
}
