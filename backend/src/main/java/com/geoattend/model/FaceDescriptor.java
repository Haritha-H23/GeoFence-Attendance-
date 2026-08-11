package com.geoattend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "face_descriptors")
@Data
@NoArgsConstructor
public class FaceDescriptor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "student_id", unique = true)
    private Student student;

    // 128-float descriptor stored as comma-separated string
    @Column(columnDefinition = "TEXT", nullable = false)
    private String descriptor;

    private LocalDateTime registeredAt;
}
