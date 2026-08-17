import axios from 'axios';
import { loadToken } from './tokenStore';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = loadToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const register = (data: { name: string; email: string; password: string; role?: string }) =>
  api.post('/auth/register', data);

// Admin - Students
export const getStudents = () => api.get('/admin/students');
export const createStudent = (data: object) => api.post('/admin/students', data);
export const updateStudent = (id: number, data: object) => api.put(`/admin/students/${id}`, data);
export const deleteStudent = (id: number) => api.delete(`/admin/students/${id}`);

// Admin - Staff
export const getStaffs = () => api.get('/admin/staffs');
export const createStaff = (data: object) => api.post('/admin/staffs', data);
export const updateStaff = (id: number, data: object) => api.put(`/admin/staffs/${id}`, data);
export const deleteStaff = (id: number) => api.delete(`/admin/staffs/${id}`);

// Admin - Courses
export const getCourses = () => api.get('/admin/courses');
export const createCourse = (data: object) => api.post('/admin/courses', data);
export const updateCourse = (id: number, data: object) => api.put(`/admin/courses/${id}`, data);
export const deleteCourse = (id: number) => api.delete(`/admin/courses/${id}`);
export const assignCourseToStaff = (courseId: number, staffId: number) =>
  api.post(`/admin/courses/${courseId}/assign-staff/${staffId}`);
export const enrollStudentInCourse = (courseId: number, studentId: number) =>
  api.post(`/admin/courses/${courseId}/enroll/${studentId}`);

// Admin - Calendar
export const getAcademicCalendar = () => api.get('/admin/calendar');
export const uploadAcademicCalendarPdf = (formData: FormData) => api.post('/admin/calendar/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const setAcademicDayOrder = (data: object) => api.post('/admin/calendar', data);
export const clearAcademicDayOrder = (date: string) => api.delete('/admin/calendar', { params: { date } });

// Staff
export const getStaffProfile = () => api.get('/staff/profile');
export const getStaffCourses = () => api.get('/staff/courses');
export const startAttendanceSession = (data: object) => api.post('/staff/attendance/start', data);
export const endAttendanceSession = (sessionId: number) =>
  api.post(`/staff/attendance/${sessionId}/end`);
export const getActiveSession = (courseId: number) =>
  api.get(`/staff/attendance/active/${courseId}`);
export const uploadClassPhoto = (sessionId: number, formData: FormData) =>
  api.post(`/staff/attendance/${sessionId}/photo`, formData);
export const getSessionAttendance = (sessionId: number) =>
  api.get(`/staff/attendance/${sessionId}/records`);
export const updateStudentAttendance = (sessionId: number, studentId: number, status: string) =>
  api.put(`/staff/attendance/${sessionId}/student/${studentId}`, { status });

// Student
export const getStudentProfile = () => api.get('/student/profile');
export const getStudentCourses = () => api.get('/student/courses');
export const getStudentAttendance = (courseId?: number) =>
  api.get('/student/attendance', { params: courseId ? { courseId } : {} });
export const updateStudentLocation = (data: object) => api.post('/student/location', data);
export const getActiveCourseSession = (courseId: number) => api.get(`/student/attendance/active/${courseId}`);
export const registerFaceImage = (formData: FormData) =>
  api.post('/student/face/register-image', formData);
export const registerFace = (descriptor: number[]) =>
  api.post('/student/face/register', { descriptor });
export const getFaceStatus = () => api.get('/student/face/status');

// Geo-fence
export const verifyLocation = (sessionId: number, data: object) =>
  api.post(`/attendance/verify-location/${sessionId}`, data);

export default api;
