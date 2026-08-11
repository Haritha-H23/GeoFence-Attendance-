package com.geoattend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.geoattend.dto.AppDtos.*;
import com.geoattend.model.*;
import com.geoattend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final StaffRepository staffRepository;
    private final CourseRepository courseRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    // ---- Students ----

    @Transactional
    public List<StudentResponse> getAllStudents() {
        return studentRepository.findAll().stream().map(this::toStudentResponse).collect(Collectors.toList());
    }

    @Transactional
    public StudentResponse createStudent(StudentRequest req) {
        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword() != null ? req.getPassword() : "password123"));
        user.setRole(User.Role.STUDENT);
        userRepository.save(user);

        Student student = new Student();
        student.setUser(user);
        student.setRollNumber(req.getRollNumber());
        student.setDepartment(req.getDepartment());
        student.setSemester(req.getSemester());
        student.setSection(req.getSection());
        student.setPhone(req.getPhone());
        return toStudentResponse(studentRepository.save(student));
    }

    @Transactional
    public StudentResponse updateStudent(Long id, StudentRequest req) {
        Student student = studentRepository.findById(id).orElseThrow();
        student.getUser().setName(req.getName());
        student.getUser().setEmail(req.getEmail());
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            student.getUser().setPassword(passwordEncoder.encode(req.getPassword()));
        }
        student.setRollNumber(req.getRollNumber());
        student.setDepartment(req.getDepartment());
        student.setSemester(req.getSemester());
        student.setSection(req.getSection());
        student.setPhone(req.getPhone());
        return toStudentResponse(studentRepository.save(student));
    }

    public void deleteStudent(Long id) {
        studentRepository.deleteById(id);
    }

    @Transactional
    public void enrollStudentInCourse(Long courseId, Long studentId) {
        Student student = studentRepository.findById(studentId).orElseThrow();
        Course course = courseRepository.findById(courseId).orElseThrow();
        student.getEnrolledCourses().add(course);
        studentRepository.save(student);
    }

    // ---- Staff ----

    public List<StaffResponse> getAllStaffs() {
        return staffRepository.findAll().stream().map(this::toStaffResponse).collect(Collectors.toList());
    }

    @Transactional
    public StaffResponse createStaff(StaffRequest req) {
        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword() != null ? req.getPassword() : "password123"));
        user.setRole(User.Role.STAFF);
        userRepository.save(user);

        Staff staff = new Staff();
        staff.setUser(user);
        staff.setEmployeeId(req.getEmployeeId());
        staff.setDepartment(req.getDepartment());
        staff.setPhone(req.getPhone());
        return toStaffResponse(staffRepository.save(staff));
    }

    @Transactional
    public StaffResponse updateStaff(Long id, StaffRequest req) {
        Staff staff = staffRepository.findById(id).orElseThrow();
        staff.getUser().setName(req.getName());
        staff.getUser().setEmail(req.getEmail());
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            staff.getUser().setPassword(passwordEncoder.encode(req.getPassword()));
        }
        staff.setEmployeeId(req.getEmployeeId());
        staff.setDepartment(req.getDepartment());
        staff.setPhone(req.getPhone());
        return toStaffResponse(staffRepository.save(staff));
    }

    public void deleteStaff(Long id) {
        staffRepository.deleteById(id);
    }

    // ---- Courses ----

    public List<CourseResponse> getAllCourses() {
        return courseRepository.findAll().stream().map(this::toCourseResponse).collect(Collectors.toList());
    }

    public CourseResponse createCourse(CourseRequest req) {
        Course course = new Course();
        course.setName(req.getName());
        course.setCode(req.getCode());
        course.setDepartment(req.getDepartment());
        course.setSemester(req.getSemester());
        course.setSchedulesJson(toJson(req.getSchedules()));
        if (req.getStaffId() != null) {
            staffRepository.findById(req.getStaffId()).ifPresent(course::setStaff);
        }
        return toCourseResponse(courseRepository.save(course));
    }

    public CourseResponse updateCourse(Long id, CourseRequest req) {
        Course course = courseRepository.findById(id).orElseThrow();
        course.setName(req.getName());
        course.setCode(req.getCode());
        course.setDepartment(req.getDepartment());
        course.setSemester(req.getSemester());
        course.setSchedulesJson(toJson(req.getSchedules()));
        if (req.getStaffId() != null) {
            staffRepository.findById(req.getStaffId()).ifPresent(course::setStaff);
        } else {
            course.setStaff(null);
        }
        return toCourseResponse(courseRepository.save(course));
    }

    public void deleteCourse(Long id) {
        courseRepository.deleteById(id);
    }

    @Transactional
    public CourseResponse assignStaffToCourse(Long courseId, Long staffId) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        Staff staff = staffRepository.findById(staffId).orElseThrow();
        course.setStaff(staff);
        return toCourseResponse(courseRepository.save(course));
    }

    // ---- Mappers ----

    private StudentResponse toStudentResponse(Student s) {
        StudentResponse r = new StudentResponse();
        r.setId(s.getId());
        r.setName(s.getUser().getName());
        r.setEmail(s.getUser().getEmail());
        r.setRollNumber(s.getRollNumber());
        r.setDepartment(s.getDepartment());
        r.setSemester(s.getSemester());
        r.setSection(s.getSection());
        r.setPhone(s.getPhone());
        r.setEnrolledCourses(s.getEnrolledCourses().stream().map(this::toCourseResponse).collect(Collectors.toList()));
        return r;
    }

    private StaffResponse toStaffResponse(Staff s) {
        StaffResponse r = new StaffResponse();
        r.setId(s.getId());
        r.setName(s.getUser().getName());
        r.setEmail(s.getUser().getEmail());
        r.setEmployeeId(s.getEmployeeId());
        r.setDepartment(s.getDepartment());
        r.setPhone(s.getPhone());
        r.setAssignedCourses(s.getAssignedCourses().stream().map(this::toCourseResponse).collect(Collectors.toList()));
        return r;
    }

    public CourseResponse toCourseResponse(Course c) {
        CourseResponse r = new CourseResponse();
        r.setId(c.getId());
        r.setName(c.getName());
        r.setCode(c.getCode());
        r.setDepartment(c.getDepartment());
        r.setSemester(c.getSemester());
        r.setSchedules(fromJson(c.getSchedulesJson()));
        if (c.getStaff() != null) {
            r.setStaffId(c.getStaff().getId());
            r.setStaffName(c.getStaff().getUser().getName());
        }
        return r;
    }

    private String toJson(List<CourseSchedule> schedules) {
        if (schedules == null || schedules.isEmpty()) return "[]";
        try { return objectMapper.writeValueAsString(schedules); }
        catch (Exception e) { return "[]"; }
    }

    private List<CourseSchedule> fromJson(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try { return objectMapper.readValue(json, new TypeReference<List<CourseSchedule>>() {}); }
        catch (Exception e) { return Collections.emptyList(); }
    }
}
