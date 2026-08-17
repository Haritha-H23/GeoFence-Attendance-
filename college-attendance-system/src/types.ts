export type UserRole = 'STUDENT' | 'STAFF' | 'ADMIN';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
}

export interface Student {
  id: number;
  name: string;
  email: string;
  rollNumber: string;
  department: string;
  semester: string;
  section: string;
  phone: string;
  photoUrl?: string;
  enrolledCourses: Course[];
}

export interface Staff {
  id: number;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  phone: string;
  assignedCourses: Course[];
}

export interface CourseSchedule {
  dayOrder: number;
  timeSlot: string;
  venue: string;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  department: string;
  semester: string;
  staffId?: number;
  staffName?: string;
  schedules: CourseSchedule[];
}

export interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  date: string;
  status: AttendanceStatus;
  markedAt?: string;
  geoVerified: boolean;
  faceVerified: boolean;
  absentMinutes?: number;
}

export interface AttendanceSession {
  id: number;
  courseId: number;
  courseName: string;
  staffId: number;
  date: string;
  startTime: string;
  endTime: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  active: boolean;
  records: AttendanceRecord[];
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationAlert {
  studentId: number;
  studentName: string;
  message: string;
  timestamp: string;
  absentMinutes: number;
}

export interface BreakRecord {
  studentId: number;
  studentName: string;
  breakStarted: number; // Date.now()
  allowedMinutes: number;
  expired: boolean;
}

export interface CampusLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'building' | 'facility' | 'landmark' | 'other';
  description?: string;
}

export interface CollegeInfo {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
  formattedAddress: string;
  website?: string;
  phone?: string;
}

export interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'college' | 'building' | 'facility';
  color?: string;
}

export const CAMPUS_LOCATIONS = [
  { label: 'Main Campus', lat: 12.9716, lng: 77.5946 },
  { label: 'Engineering Block', lat: 12.9724, lng: 77.5958 },
  { label: 'Library', lat: 12.9708, lng: 77.5938 },
  { label: 'Hostel Zone', lat: 12.9699, lng: 77.5963 },
  { label: 'Sports Ground', lat: 12.9729, lng: 77.5929 },
  { label: 'Admin Block', lat: 12.9713, lng: 77.5972 },
] as const;
