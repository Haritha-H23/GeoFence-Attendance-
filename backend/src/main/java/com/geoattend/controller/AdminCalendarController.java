package com.geoattend.controller;

import com.geoattend.model.AcademicDayOrder;
import com.geoattend.service.AcademicCalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/calendar")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminCalendarController {

    private final AcademicCalendarService calendarService;

    @GetMapping
    public ResponseEntity<List<AcademicDayOrder>> list() {
        return ResponseEntity.ok(calendarService.listAll());
    }

    @PostMapping
    public ResponseEntity<AcademicDayOrder> set(@RequestBody java.util.Map<String, Object> body) {
        String date = (String) body.get("date");
        Integer order = (Integer) body.get("dayOrder");
        LocalDate d = LocalDate.parse(date);
        return ResponseEntity.ok(calendarService.setDayOrder(d, order));
    }

    @PostMapping("/upload")
    public ResponseEntity<List<AcademicDayOrder>> upload(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(calendarService.uploadAndParsePdf(file));
    }

    @DeleteMapping
    public ResponseEntity<Void> clear(@RequestParam("date") String date) {
        calendarService.clearDayOrder(LocalDate.parse(date));
        return ResponseEntity.ok().build();
    }
}
