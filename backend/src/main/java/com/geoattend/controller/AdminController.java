package com.geoattend.controller;

import com.geoattend.dto.AppDtos.*;
import com.geoattend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // Students
    @GetMapping("/students")
    public ResponseEntity<List<StudentResponse>> getStudents() {
        return ResponseEntity.ok(adminService.getAllStudents());
    }

    @PostMapping("/students")
    public ResponseEntity<StudentResponse> createStudent(@RequestBody StudentRequest req) {
        return ResponseEntity.ok(adminService.createStudent(req));
    }

    @PutMapping("/students/{id}")
    public ResponseEntity<StudentResponse> updateStudent(@PathVariable Long id, @RequestBody StudentRequest req) {
        return ResponseEntity.ok(adminService.updateStudent(id, req));
    }

    @DeleteMapping("/students/{id}")
    public ResponseEntity<String> deleteStudent(@PathVariable Long id) {
        adminService.deleteStudent(id);
        return ResponseEntity.ok("deleted");
    }

    @PostMapping("/courses/{courseId}/enroll/{studentId}")
    public ResponseEntity<String> enrollStudent(@PathVariable Long courseId, @PathVariable Long studentId) {
        adminService.enrollStudentInCourse(courseId, studentId);
        return ResponseEntity.ok("enrolled");
    }

    // Staff
    @GetMapping("/staffs")
    public ResponseEntity<List<StaffResponse>> getStaffs() {
        return ResponseEntity.ok(adminService.getAllStaffs());
    }

    @PostMapping("/staffs")
    public ResponseEntity<StaffResponse> createStaff(@RequestBody StaffRequest req) {
        return ResponseEntity.ok(adminService.createStaff(req));
    }

    @PutMapping("/staffs/{id}")
    public ResponseEntity<StaffResponse> updateStaff(@PathVariable Long id, @RequestBody StaffRequest req) {
        return ResponseEntity.ok(adminService.updateStaff(id, req));
    }

    @DeleteMapping("/staffs/{id}")
    public ResponseEntity<String> deleteStaff(@PathVariable Long id) {
        adminService.deleteStaff(id);
        return ResponseEntity.ok("deleted");
    }

    // Courses
    @GetMapping("/courses")
    public ResponseEntity<List<CourseResponse>> getCourses() {
        return ResponseEntity.ok(adminService.getAllCourses());
    }

    @PostMapping("/courses")
    public ResponseEntity<CourseResponse> createCourse(@RequestBody CourseRequest req) {
        return ResponseEntity.ok(adminService.createCourse(req));
    }

    @PutMapping("/courses/{id}")
    public ResponseEntity<CourseResponse> updateCourse(@PathVariable Long id, @RequestBody CourseRequest req) {
        return ResponseEntity.ok(adminService.updateCourse(id, req));
    }

    @DeleteMapping("/courses/{id}")
    public ResponseEntity<String> deleteCourse(@PathVariable Long id) {
        adminService.deleteCourse(id);
        return ResponseEntity.ok("deleted");
    }

    @PostMapping("/courses/{courseId}/assign-staff/{staffId}")
    public ResponseEntity<CourseResponse> assignStaff(@PathVariable Long courseId, @PathVariable Long staffId) {
        return ResponseEntity.ok(adminService.assignStaffToCourse(courseId, staffId));
    }
}
