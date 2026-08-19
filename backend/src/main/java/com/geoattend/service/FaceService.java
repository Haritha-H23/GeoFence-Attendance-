package com.geoattend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.geoattend.model.FaceDescriptor;
import com.geoattend.model.Student;
import com.geoattend.repository.FaceDescriptorRepository;
import com.geoattend.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FaceService {

    private final FaceDescriptorRepository faceDescriptorRepository;
    private final StudentRepository studentRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${face.service.url:http://localhost:5001}")
    private String faceServiceUrl;

    /**
     * Sends the registration image to Python service, gets back a 128-d encoding,
     * stores it in DB for this student.
     */
    @Transactional
    public void registerFaceFromImage(Long studentUserId, MultipartFile imageFile) {
        Student student = studentRepository.findByUserId(studentUserId).orElseThrow();

        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", new ByteArrayResource(imageFile.getBytes()) {
                @Override public String getFilename() { return "face.jpg"; }
            });

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ResponseEntity<String> response = restTemplate.exchange(
                    faceServiceUrl + "/encode",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            if (root.has("error")) {
                throw new RuntimeException(root.get("error").asText());
            }

            List<Double> encoding = objectMapper.convertValue(
                    root.get("encoding"),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Double.class)
            );
            String encodingCsv = encoding.stream().map(String::valueOf).collect(Collectors.joining(","));

            FaceDescriptor fd = faceDescriptorRepository.findByStudent(student)
                    .orElseGet(() -> { FaceDescriptor f = new FaceDescriptor(); f.setStudent(student); return f; });
            fd.setDescriptor(encodingCsv);
            fd.setRegisteredAt(LocalDateTime.now());
            faceDescriptorRepository.save(fd);

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Face registration failed: " + e.getMessage(), e);
        }
    }

    /**
     * Legacy: register from a pre-computed descriptor array (kept for backward compat).
     */
    @Transactional
    public void registerFace(Long studentUserId, List<Double> descriptor) {
        Student student = studentRepository.findByUserId(studentUserId).orElseThrow();
        FaceDescriptor fd = faceDescriptorRepository.findByStudent(student)
                .orElseGet(() -> { FaceDescriptor f = new FaceDescriptor(); f.setStudent(student); return f; });
        fd.setDescriptor(descriptor.stream().map(String::valueOf).collect(Collectors.joining(",")));
        fd.setRegisteredAt(LocalDateTime.now());
        faceDescriptorRepository.save(fd);
    }

    public boolean isFaceRegistered(Long studentUserId) {
        Student student = studentRepository.findByUserId(studentUserId).orElseThrow();
        return faceDescriptorRepository.existsByStudent(student);
    }

    /**
     * Sends the class photo image to Python service along with all registered student encodings.
     * Python does the detection + matching and returns matched student IDs.
     */
    public FaceMatchResult matchFacesFromImage(MultipartFile classPhoto, Long sessionCourseId) {
        List<FaceDescriptor> allRegistered = faceDescriptorRepository.findAll();
        if (allRegistered.isEmpty()) return new FaceMatchResult(List.of(), 0);

        try {
            List<Map<String, Object>> students = allRegistered.stream().map(fd -> {
                double[] vals = Arrays.stream(fd.getDescriptor().split(","))
                        .mapToDouble(Double::parseDouble).toArray();
                List<Double> enc = new ArrayList<>();
                for (double v : vals) enc.add(v);
                return Map.<String, Object>of("id", fd.getStudent().getId(), "encoding", enc);
            }).collect(Collectors.toList());

            String studentsJson = objectMapper.writeValueAsString(students);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", new ByteArrayResource(classPhoto.getBytes()) {
                @Override public String getFilename() { return "class.jpg"; }
            });
            body.add("students", studentsJson);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ResponseEntity<String> response = restTemplate.exchange(
                    faceServiceUrl + "/match",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            List<Long> matched = new ArrayList<>();
            if (root.has("matched_ids") && root.get("matched_ids") != null && !root.get("matched_ids").isNull()) {
                root.get("matched_ids").forEach(n -> matched.add(n.asLong()));
            }
            int detectedCount = root.has("detected_count") && !root.get("detected_count").isNull()
                    ? root.get("detected_count").asInt(0)
                    : matched.size();
            return new FaceMatchResult(matched, detectedCount);

        } catch (Exception e) {
            throw new RuntimeException("Face matching failed: " + e.getMessage(), e);
        }
    }

    public static class FaceMatchResult {
        private final List<Long> matchedIds;
        private final int detectedCount;

        public FaceMatchResult(List<Long> matchedIds, int detectedCount) {
            this.matchedIds = matchedIds;
            this.detectedCount = detectedCount;
        }

        public List<Long> getMatchedIds() {
            return matchedIds;
        }

        public int getDetectedCount() {
            return detectedCount;
        }
    }
}
