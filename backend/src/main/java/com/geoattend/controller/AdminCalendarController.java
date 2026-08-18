package com.geoattend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/calendar")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminCalendarController {

    @GetMapping
    public ResponseEntity<Map<String, String>> list() {
        return ResponseEntity.status(HttpStatus.GONE).body(Map.of("message", "Academic calendar feature has been removed."));
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> set(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.GONE).body(Map.of("message", "Academic calendar feature has been removed."));
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return ResponseEntity.status(HttpStatus.GONE).body(Map.of("message", "Academic calendar feature has been removed."));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> clear(@RequestParam("date") String date) {
        return ResponseEntity.status(HttpStatus.GONE).body(Map.of("message", "Academic calendar feature has been removed."));
    }
}
