package com.geoattend.repository;

import com.geoattend.model.Course;
import com.geoattend.model.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByStaff(Staff staff);
}
