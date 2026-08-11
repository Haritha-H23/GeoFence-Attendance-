package com.geoattend.repository;

import com.geoattend.model.Staff;
import com.geoattend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StaffRepository extends JpaRepository<Staff, Long> {
    Optional<Staff> findByUser(User user);
    Optional<Staff> findByUserId(Long userId);
}
