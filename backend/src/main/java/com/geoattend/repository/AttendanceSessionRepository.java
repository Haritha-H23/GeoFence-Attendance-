package com.geoattend.repository;

import com.geoattend.model.AttendanceSession;
import com.geoattend.model.Course;
import com.geoattend.model.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    List<AttendanceSession> findByStaff(Staff staff);
    Optional<AttendanceSession> findByCourseAndActiveTrue(Course course);
    List<AttendanceSession> findByCourse(Course course);
}
