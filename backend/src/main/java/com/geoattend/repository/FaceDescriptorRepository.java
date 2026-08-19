package com.geoattend.repository;

import com.geoattend.model.FaceDescriptor;
import com.geoattend.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FaceDescriptorRepository extends JpaRepository<FaceDescriptor, Long> {
    Optional<FaceDescriptor> findByStudent(Student student);
    boolean existsByStudent(Student student);
    List<FaceDescriptor> findAll();
}
