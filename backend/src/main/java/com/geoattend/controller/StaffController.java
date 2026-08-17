package com.geoattend.controller;


import com.geoattend.dto.AppDtos.*;
import com.geoattend.model.Staff;
import com.geoattend.repository.CourseRepository;
import com.geoattend.repository.StaffRepository;
import com.geoattend.repository.UserRepository;
import com.geoattend.service.AdminService;
import com.geoattend.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/staff")
@PreAuthorize("hasRole('STAFF')")
@RequiredArgsConstructor
public class StaffController {

    private final CourseRepository courseRepository;
    private final StaffRepository staffRepository;
    private final UserRepository userRepository;
    private final AttendanceService attendanceService;
    private final AdminService adminService;

    @GetMapping("/profile")
    public ResponseEntity<StaffResponse> getProfile(Principal principal) {
        Staff staff = getStaff(principal);
        StaffResponse res = new StaffResponse();
        res.setId(staff.getId());
        res.setName(staff.getUser().getName());
        res.setEmail(staff.getUser().getEmail());
        res.setEmployeeId(staff.getEmployeeId());
        res.setDepartment(staff.getDepartment());
        res.setPhone(staff.getPhone());
        res.setAssignedCourses(
            courseRepository.findByStaff(staff).stream()
                .map(adminService::toCourseResponse)
                .collect(Collectors.toList())
        );
        return ResponseEntity.ok(res);
    }

    @GetMapping("/courses")
    public ResponseEntity<List<CourseResponse>> getCourses(Principal principal) {
        Staff staff = getStaff(principal);
        List<CourseResponse> courses = courseRepository.findByStaff(staff)
                .stream()
                .map(adminService::toCourseResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(courses);
    }

    @PostMapping("/attendance/start")
    public ResponseEntity<SessionResponse> startSession(@RequestBody SessionRequest req, Principal principal) {
        Long userId = getUserId(principal);
        return ResponseEntity.ok(attendanceService.startSession(userId, req));
    }

    @PostMapping("/attendance/{sessionId}/end")
    public ResponseEntity<Void> endSession(@PathVariable Long sessionId) {
        attendanceService.endSession(sessionId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/attendance/active/{courseId}")
    public ResponseEntity<SessionResponse> getActiveSession(@PathVariable Long courseId) {
        return ResponseEntity.ok(attendanceService.getActiveSession(courseId));
    }

    @GetMapping("/attendance/{sessionId}/records")
    public ResponseEntity<List<AttendanceRecordResponse>> getRecords(@PathVariable Long sessionId) {
        return ResponseEntity.ok(attendanceService.getSessionRecords(sessionId));
    }

    @PutMapping("/attendance/{sessionId}/student/{studentId}")
    public ResponseEntity<Void> overrideAttendance(
            @PathVariable Long sessionId,
            @PathVariable Long studentId,
            @RequestBody StatusUpdateRequest req) {
        attendanceService.overrideAttendance(sessionId, studentId, req.getStatus());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/attendance/{sessionId}/photo")
    public ResponseEntity<java.util.Map<String, Integer>> uploadPhoto(
            @PathVariable Long sessionId,
            @RequestParam("photo") MultipartFile photo) {
        int detectedCount = attendanceService.markAttendanceByFace(sessionId, photo);
        return ResponseEntity.ok(java.util.Map.of("detectedCount", detectedCount));
    }

    private Staff getStaff(Principal principal) {
        var user = userRepository.findByEmail(principal.getName()).orElseThrow();
        return staffRepository.findByUser(user).orElseThrow();
    }

    private Long getUserId(Principal principal) {
        return userRepository.findByEmail(principal.getName()).orElseThrow().getId();
    }
}
