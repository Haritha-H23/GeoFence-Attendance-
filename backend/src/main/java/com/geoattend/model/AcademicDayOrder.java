package com.geoattend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "academic_day_orders", uniqueConstraints = {@UniqueConstraint(columnNames = {"date"})})
@Data
@NoArgsConstructor
public class AcademicDayOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private Integer dayOrder; // 1-5
}
