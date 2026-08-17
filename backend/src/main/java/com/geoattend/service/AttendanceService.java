package com.geoattend.service;

import com.geoattend.dto.AppDtos.*;
import com.geoattend.model.*;
import com.geoattend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRecordRepository recordRepository;
    private final CourseRepository courseRepository;
    private final StaffRepository staffRepository;
    private final StudentRepository studentRepository;
    private final FaceService faceService;
    private final com.geoattend.service.AcademicCalendarService academicCalendarService;

    @Transactional
    public SessionResponse startSession(Long staffUserId, SessionRequest req) {
        Staff staff = staffRepository.findByUserId(staffUserId).orElseThrow();
        Course course = courseRepository.findById(req.getCourseId()).orElseThrow();

        // End any existing active session for this course
        sessionRepository.findByCourseAndActiveTrue(course).ifPresent(s -> {
            s.setActive(false);
            s.setEndTime(LocalTime.now());
            sessionRepository.save(s);
        });

        AttendanceSession session = new AttendanceSession();
        session.setCourse(course);
        session.setStaff(staff);
        session.setDate(LocalDate.now());
        session.setStartTime(LocalTime.now());
        session.setLatitude(req.getLatitude());
        session.setLongitude(req.getLongitude());
        session.setRadiusMeters(req.getRadiusMeters() != null ? req.getRadiusMeters() : 50);
        session.setActive(true);
        session = sessionRepository.save(session);

        // attach day order if configured
        academicCalendarService.getOrderForDate(session.getDate()).ifPresent(session::setDayOrder);

        // Pre-create ABSENT records for all enrolled students
        for (Student student : course.getEnrolledStudents()) {
            AttendanceRecord record = new AttendanceRecord();
            record.setSession(session);
            record.setStudent(student);
            record.setStatus(AttendanceRecord.Status.ABSENT);
            recordRepository.save(record);
        }

        return toSessionResponse(session);
    }

    @Transactional
    public void endSession(Long sessionId) {
        AttendanceSession session = sessionRepository.findById(sessionId).orElseThrow();
        session.setActive(false);
        session.setEndTime(LocalTime.now());
        sessionRepository.save(session);
    }

    public SessionResponse getActiveSession(Long courseId) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        return sessionRepository.findByCourseAndActiveTrue(course)
                .map(this::toSessionResponse)
                .orElseThrow(() -> new RuntimeException("No active session"));
    }

    @Transactional
    public int markAttendanceByFace(Long sessionId, MultipartFile classPhoto) {
        AttendanceSession session = sessionRepository.findById(sessionId).orElseThrow();
        List<Long> matchedStudentIds = (classPhoto != null && !classPhoto.isEmpty())
                ? faceService.matchFacesFromImage(classPhoto, session.getCourse().getId())
                : List.of();
        var matchedStudentIdSet = new HashSet<>(matchedStudentIds);

        List<AttendanceRecord> records = recordRepository.findBySession(session);
        for (AttendanceRecord record : records) {
            Long studentId = record.getStudent().getId();
            boolean faceMatched = matchedStudentIdSet.contains(studentId);
            record.setFaceVerified(faceMatched);

            if (faceMatched && Boolean.TRUE.equals(record.getGeoVerified())) {
                record.setStatus(AttendanceRecord.Status.PRESENT);
                record.setMarkedAt(LocalDateTime.now());
            } else {
                record.setStatus(AttendanceRecord.Status.ABSENT);
            }
            recordRepository.save(record);
        }
        return matchedStudentIds.size();
    }

    public List<AttendanceRecordResponse> getSessionRecords(Long sessionId) {
        AttendanceSession session = sessionRepository.findById(sessionId).orElseThrow();
        return recordRepository.findBySession(session).stream()
                .map(this::toRecordResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void overrideAttendance(Long sessionId, Long studentId, String status) {
        AttendanceSession session = sessionRepository.findById(sessionId).orElseThrow();
        Student student = studentRepository.findById(studentId).orElseThrow();
        AttendanceRecord record = recordRepository.findBySessionAndStudent(session, student)
                .orElseThrow();
        record.setStatus(AttendanceRecord.Status.valueOf(status));
        record.setMarkedAt(LocalDateTime.now());
        recordRepository.save(record);
    }

    /**
     * Called when student sends their location.
     * Checks if inside geo-fence, updates record, tracks absent minutes.
     */
    @Transactional
    public LocationResponse verifyStudentLocation(Long studentUserId, LocationRequest req) {
        Student student = studentRepository.findByUserId(studentUserId).orElseThrow();

        if (req == null || req.getLatitude() == null || req.getLongitude() == null) {
            LocationResponse res = new LocationResponse();
            res.setInsideFence(false);
            res.setMessage("Invalid location payload.");
            return res;
        }

        AttendanceSession activeSession = findActiveSession(student, req.getCourseId());

        if (activeSession == null) {
            LocationResponse res = new LocationResponse();
            res.setInsideFence(false);
            res.setMessage("No active class session right now.");
            return res;
        }

        double accuracyMeters = req.getAccuracy() != null ? Math.max(0, req.getAccuracy()) : 0;
        boolean inside = isInsideFence(
                req.getLatitude(), req.getLongitude(),
                activeSession.getLatitude(), activeSession.getLongitude(),
                activeSession.getRadiusMeters(),
                accuracyMeters
        );

        AttendanceRecord record = recordRepository
                .findBySessionAndStudent(activeSession, student)
                .orElseGet(() -> {
                    AttendanceRecord r = new AttendanceRecord();
                    r.setSession(activeSession);
                    r.setStudent(student);
                    return r;
                });

        if (inside) {
            record.setGeoVerified(true);
            record.setAbsentMinutes(0);
            // Only promote to PRESENT if face is also verified.
            // Never downgrade an already-PRESENT record via a location ping.
            if (Boolean.TRUE.equals(record.getFaceVerified())
                    && record.getStatus() != AttendanceRecord.Status.PRESENT) {
                record.setStatus(AttendanceRecord.Status.PRESENT);
                record.setMarkedAt(LocalDateTime.now());
            }
        } else {
            record.setGeoVerified(false);
            int absentMins = (record.getAbsentMinutes() == null ? 0 : record.getAbsentMinutes()) + 1;
            record.setAbsentMinutes(absentMins);
            if (absentMins >= 10) {
                record.setStatus(AttendanceRecord.Status.ABSENT);
            }
        }
        recordRepository.save(record);

        LocationResponse res = new LocationResponse();
        res.setInsideFence(inside);
        res.setAbsentMinutes(record.getAbsentMinutes());
        res.setMessage(inside ? "You are inside the class zone." :
                "You are outside the class zone. " + record.getAbsentMinutes() + " min away.");
        return res;
    }

    public List<AttendanceRecordResponse> getStudentAttendance(Long studentUserId, Long courseId) {
        Student student = studentRepository.findByUserId(studentUserId).orElseThrow();
        List<AttendanceRecord> records = courseId != null
                ? recordRepository.findByStudentAndSession_Course_Id(student, courseId)
                : recordRepository.findByStudent(student);
        return records.stream().map(this::toRecordResponse).collect(Collectors.toList());
    }

    private AttendanceSession findActiveSession(Student student, Long courseId) {
        if (courseId != null) {
            return student.getEnrolledCourses().stream()
                    .filter(c -> courseId.equals(c.getId()))
                    .flatMap(c -> sessionRepository.findByCourseAndActiveTrue(c).stream())
                    .findFirst()
                    .orElseGet(() -> student.getEnrolledCourses().stream()
                            .flatMap(c -> sessionRepository.findByCourseAndActiveTrue(c).stream())
                            .findFirst()
                            .orElse(null));
        }

        return student.getEnrolledCourses().stream()
                .flatMap(c -> sessionRepository.findByCourseAndActiveTrue(c).stream())
                .findFirst()
                .orElse(null);
    }

    // Haversine formula to check geo-fence
    private boolean isInsideFence(double lat1, double lon1, double lat2, double lon2, int radiusMeters, double accuracyMeters) {
        final int R = 6371000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return distance <= radiusMeters + accuracyMeters;
    }

    private SessionResponse toSessionResponse(AttendanceSession s) {
        SessionResponse r = new SessionResponse();
        r.setId(s.getId());
        r.setCourseId(s.getCourse().getId());
        r.setCourseName(s.getCourse().getName());
        r.setStaffId(s.getStaff().getId());
        r.setDate(s.getDate());
        r.setStartTime(s.getStartTime() != null ? s.getStartTime().toString() : null);
        r.setLatitude(s.getLatitude());
        r.setLongitude(s.getLongitude());
        r.setRadiusMeters(s.getRadiusMeters());
        r.setActive(s.getActive());
        r.setDayOrder(s.getDayOrder());
        return r;
    }

    private AttendanceRecordResponse toRecordResponse(AttendanceRecord r) {
        AttendanceRecordResponse res = new AttendanceRecordResponse();
        res.setId(r.getId());
        res.setStudentId(r.getStudent().getId());
        res.setStudentName(r.getStudent().getUser().getName());
        res.setCourseId(r.getSession().getCourse().getId());
        res.setCourseName(r.getSession().getCourse().getName());
        res.setDate(r.getSession().getDate().toString());
        res.setStatus(r.getStatus().name());
        res.setMarkedAt(r.getMarkedAt());
        res.setGeoVerified(r.getGeoVerified());
        res.setFaceVerified(r.getFaceVerified());
        return res;
    }
}
