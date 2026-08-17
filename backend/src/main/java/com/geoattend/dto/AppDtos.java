package com.geoattend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class AppDtos {

    @Data
    public static class StudentRequest {
        private String name;
        private String email;
        private String password;
        private String rollNumber;
        private String department;
        private String semester;
        private String section;
        private String phone;
    }

    @Data
    public static class StudentResponse {
        private Long id;
        private String name;
        private String email;
        private String rollNumber;
        private String department;
        private String semester;
        private String section;
        private String phone;
        private List<CourseResponse> enrolledCourses;
    }

    @Data
    public static class StaffRequest {
        private String name;
        private String email;
        private String password;
        private String employeeId;
        private String department;
        private String phone;
    }

    @Data
    public static class StaffResponse {
        private Long id;
        private String name;
        private String email;
        private String employeeId;
        private String department;
        private String phone;
        private List<CourseResponse> assignedCourses;
    }

    @Data
    public static class CourseSchedule {
        private Integer dayOrder;
        private String timeSlot;
        private String venue;
    }

    @Data
    public static class CourseRequest {
        private String name;
        private String code;
        private String department;
        private String semester;
        private List<CourseSchedule> schedules;
        private Long staffId;
    }

    @Data
    public static class CourseResponse {
        private Long id;
        private String name;
        private String code;
        private String department;
        private String semester;
        private List<CourseSchedule> schedules;
        private Long staffId;
        private String staffName;
    }

    @Data
    public static class SessionRequest {
        private Long courseId;
        private Double latitude;
        private Double longitude;
        private Integer radiusMeters;
    }

    @Data
    public static class SessionResponse {
        private Long id;
        private Long courseId;
        private String courseName;
        private Long staffId;
        private LocalDate date;
        private String startTime;
        private Double latitude;
        private Double longitude;
        private Integer radiusMeters;
        private Boolean active;
        private Integer dayOrder;
    }

    @Data
    public static class AttendanceRecordResponse {
        private Long id;
        private Long studentId;
        private String studentName;
        private Long courseId;
        private String courseName;
        private String date;
        private String status;
        private LocalDateTime markedAt;
        private Boolean geoVerified;
        private Boolean faceVerified;
    }

    @Data
    public static class LocationRequest {
        private Double latitude;
        private Double longitude;
        private Double accuracy;
        private Long courseId;
    }

    @Data
    public static class LocationResponse {
        private Boolean insideFence;
        private String message;
        private Integer absentMinutes;
    }

    @Data
    public static class StatusUpdateRequest {
        private String status;
    }
}
