package com.geoattend.repository;

import com.geoattend.model.AttendanceRecord;
import com.geoattend.model.AttendanceSession;
import com.geoattend.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findBySession(AttendanceSession session);
    List<AttendanceRecord> findByStudent(Student student);
    List<AttendanceRecord> findByStudentAndSession_Course_Id(Student student, Long courseId);
    Optional<AttendanceRecord> findBySessionAndStudent(AttendanceSession session, Student student);
}
