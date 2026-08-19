package com.geoattend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_records")
@Data
@NoArgsConstructor
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "session_id", nullable = false)
    private AttendanceSession session;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ABSENT;

    private LocalDateTime markedAt;

    @Column(nullable = false)
    private Boolean geoVerified = false;

    @Column(nullable = false)
    private Boolean faceVerified = false;

    @Column(length = 512)
    private String locationName;

    private Integer absentMinutes = 0;

    public enum Status {
        PRESENT, ABSENT, LATE
    }
}
