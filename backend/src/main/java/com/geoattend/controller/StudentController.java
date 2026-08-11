package com.geoattend.controller;

import com.geoattend.dto.AppDtos.*;
import com.geoattend.model.Student;
import com.geoattend.repository.StudentRepository;
import com.geoattend.repository.UserRepository;
import com.geoattend.service.AdminService;
import com.geoattend.service.AttendanceService;
import com.geoattend.service.FaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT')")
@RequiredArgsConstructor
public class StudentController {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final AttendanceService attendanceService;
    private final AdminService adminService;
    private final FaceService faceService;

    @GetMapping("/profile")
    public ResponseEntity<StudentResponse> getProfile(Principal principal) {
        Student student = getStudent(principal);
        StudentResponse res = new StudentResponse();
        res.setId(student.getId());
        res.setName(student.getUser().getName());
        res.setEmail(student.getUser().getEmail());
        res.setRollNumber(student.getRollNumber());
        res.setDepartment(student.getDepartment());
        res.setSemester(student.getSemester());
        res.setPhone(student.getPhone());
        res.setEnrolledCourses(
            student.getEnrolledCourses().stream().map(adminService::toCourseResponse).collect(Collectors.toList())
        );
        return ResponseEntity.ok(res);
    }

    @GetMapping("/courses")
    public ResponseEntity<List<CourseResponse>> getCourses(Principal principal) {
        Student student = getStudent(principal);
        return ResponseEntity.ok(
            student.getEnrolledCourses().stream().map(adminService::toCourseResponse).collect(Collectors.toList())
        );
    }

    @GetMapping("/attendance")
    public ResponseEntity<List<AttendanceRecordResponse>> getAttendance(
            @RequestParam(required = false) Long courseId,
            Principal principal) {
        Long userId = getUserId(principal);
        return ResponseEntity.ok(attendanceService.getStudentAttendance(userId, courseId));
    }

    @PostMapping("/location")
    public ResponseEntity<LocationResponse> updateLocation(
            @RequestBody LocationRequest req,
            Principal principal) {
        Long userId = getUserId(principal);
        return ResponseEntity.ok(attendanceService.verifyStudentLocation(userId, req));
    }

    @GetMapping("/attendance/active/{courseId}")
    public ResponseEntity<SessionResponse> getActiveSession(@PathVariable Long courseId) {
        try {
            return ResponseEntity.ok(attendanceService.getActiveSession(courseId));
        } catch (RuntimeException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/face/register-image")
    public ResponseEntity<Map<String, String>> registerFaceImage(
            @RequestParam("image") MultipartFile image,
            Principal principal) {
        Long userId = getUserId(principal);
        try {
            faceService.registerFaceFromImage(userId, image);
            return ResponseEntity.ok(Map.of("message", "Face registered successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.unprocessableEntity().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/face/register")
    public ResponseEntity<Void> registerFace(
            @RequestBody java.util.Map<String, java.util.List<Double>> body,
            Principal principal) {
        Long userId = getUserId(principal);
        faceService.registerFace(userId, body.get("descriptor"));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/face/status")
    public ResponseEntity<java.util.Map<String, Boolean>> getFaceStatus(Principal principal) {
        Long userId = getUserId(principal);
        boolean registered = faceService.isFaceRegistered(userId);
        return ResponseEntity.ok(java.util.Map.of("registered", registered));
    }

    private Student getStudent(Principal principal) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        return studentRepository.findByUser(user).orElseThrow();
    }

    private Long getUserId(Principal principal) {
        return userRepository.findByEmail(principal.getName()).orElseThrow().getId();
    }
}
