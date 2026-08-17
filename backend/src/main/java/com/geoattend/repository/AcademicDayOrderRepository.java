package com.geoattend.repository;

import com.geoattend.model.AcademicDayOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface AcademicDayOrderRepository extends JpaRepository<AcademicDayOrder, Long> {
    Optional<AcademicDayOrder> findByDate(LocalDate date);
}
