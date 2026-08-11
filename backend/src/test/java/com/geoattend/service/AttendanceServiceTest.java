package com.geoattend.service;

import com.geoattend.model.AttendanceRecord;
import com.geoattend.model.AttendanceSession;
import com.geoattend.model.Student;
import com.geoattend.repository.AttendanceRecordRepository;
import com.geoattend.repository.AttendanceSessionRepository;
import com.geoattend.repository.CourseRepository;
import com.geoattend.repository.StaffRepository;
import com.geoattend.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock private AttendanceSessionRepository sessionRepository;
    @Mock private AttendanceRecordRepository recordRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private StaffRepository staffRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private FaceService faceService;

    @InjectMocks
    private AttendanceService attendanceService;

    @Test
    void markAttendanceByFace_setsPresent_whenBothFaceAndGeoVerified() {
        AttendanceSession session = new AttendanceSession();
        session.setId(1L);

        Student student = new Student();
        student.setId(10L);

        AttendanceRecord record = new AttendanceRecord();
        record.setSession(session);
        record.setStudent(student);
        record.setStatus(AttendanceRecord.Status.ABSENT);
        record.setGeoVerified(true);   // geo already verified
        record.setFaceVerified(false);

        MultipartFile photo = mock(MultipartFile.class);
        when(photo.isEmpty()).thenReturn(false);
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(faceService.matchFacesFromImage(eq(photo), any())).thenReturn(List.of(10L));
        when(recordRepository.findBySession(session)).thenReturn(List.of(record));

        attendanceService.markAttendanceByFace(1L, photo);

        assertTrue(record.getFaceVerified());
        assertEquals(AttendanceRecord.Status.PRESENT, record.getStatus());
    }

    @Test
    void markAttendanceByFace_remainsAbsent_whenFaceMatchedButGeoNotVerified() {
        AttendanceSession session = new AttendanceSession();
        session.setId(2L);

        Student student = new Student();
        student.setId(20L);

        AttendanceRecord record = new AttendanceRecord();
        record.setSession(session);
        record.setStudent(student);
        record.setStatus(AttendanceRecord.Status.ABSENT);
        record.setGeoVerified(false);
        record.setFaceVerified(false);

        MultipartFile photo = mock(MultipartFile.class);
        when(photo.isEmpty()).thenReturn(false);
        when(sessionRepository.findById(2L)).thenReturn(Optional.of(session));
        when(faceService.matchFacesFromImage(eq(photo), any())).thenReturn(List.of(20L));
        when(recordRepository.findBySession(session)).thenReturn(List.of(record));

        attendanceService.markAttendanceByFace(2L, photo);

        assertTrue(record.getFaceVerified());
        assertEquals(AttendanceRecord.Status.ABSENT, record.getStatus());
    }

    @Test
    void markAttendanceByFace_skipsMatching_whenPhotoIsNull() {
        AttendanceSession session = new AttendanceSession();
        session.setId(3L);

        Student student = new Student();
        student.setId(30L);

        AttendanceRecord record = new AttendanceRecord();
        record.setSession(session);
        record.setStudent(student);
        record.setStatus(AttendanceRecord.Status.ABSENT);
        record.setGeoVerified(false);
        record.setFaceVerified(false);

        when(sessionRepository.findById(3L)).thenReturn(Optional.of(session));
        when(recordRepository.findBySession(session)).thenReturn(List.of(record));

        attendanceService.markAttendanceByFace(3L, null);

        assertEquals(AttendanceRecord.Status.ABSENT, record.getStatus());
    }
}
