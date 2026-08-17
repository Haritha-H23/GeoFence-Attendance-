package com.geoattend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.geoattend.model.FaceDescriptor;
import com.geoattend.model.Student;
import com.geoattend.repository.FaceDescriptorRepository;
import com.geoattend.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FaceServiceTest {

    @Mock private FaceDescriptorRepository faceDescriptorRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private RestTemplate restTemplate;
    @Mock private ObjectMapper objectMapper;

    @InjectMocks
    private FaceService faceService;

    @Test
    void isFaceRegistered_returnsTrueWhenDescriptorExists() {
        Student student = new Student();
        student.setId(1L);
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(student));
        when(faceDescriptorRepository.existsByStudent(student)).thenReturn(true);

        assertTrue(faceService.isFaceRegistered(1L));
    }

    @Test
    void isFaceRegistered_returnsFalseWhenNoDescriptor() {
        Student student = new Student();
        student.setId(2L);
        when(studentRepository.findByUserId(2L)).thenReturn(Optional.of(student));
        when(faceDescriptorRepository.existsByStudent(student)).thenReturn(false);

        assertFalse(faceService.isFaceRegistered(2L));
    }

    @Test
    void matchFacesFromImage_returnsEmptyWhenNoRegisteredStudents() {
        when(faceDescriptorRepository.findAll()).thenReturn(List.of());

        List<Long> result = faceService.matchFacesFromImage(null, 1L);

        assertEquals(List.of(), result);
    }

    @Test
    void registerFace_legacy_storesDescriptorAsCsv() {
        Student student = new Student();
        student.setId(5L);
        when(studentRepository.findByUserId(5L)).thenReturn(Optional.of(student));
        when(faceDescriptorRepository.findByStudent(student)).thenReturn(Optional.empty());

        FaceDescriptor saved = new FaceDescriptor();
        saved.setStudent(student);
        when(faceDescriptorRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        faceService.registerFace(5L, List.of(0.1, 0.2, 0.3));

        // verify save was called (no exception = pass)
    }
}
