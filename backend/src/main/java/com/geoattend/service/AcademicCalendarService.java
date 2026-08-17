package com.geoattend.service;

import com.geoattend.model.AcademicDayOrder;
import com.geoattend.repository.AcademicDayOrderRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AcademicCalendarService {

    private final AcademicDayOrderRepository repo;

    public List<AcademicDayOrder> listAll() {
        return repo.findAll();
    }

    public Optional<Integer> getOrderForDate(LocalDate date) {
        return repo.findByDate(date).map(AcademicDayOrder::getDayOrder);
    }

    @Transactional
    public AcademicDayOrder setDayOrder(LocalDate date, int order) {
        AcademicDayOrder ado = repo.findByDate(date).orElseGet(AcademicDayOrder::new);
        ado.setDate(date);
        ado.setDayOrder(order);
        return repo.save(ado);
    }

    @Transactional
    public void clearDayOrder(LocalDate date) {
        repo.findByDate(date).ifPresent(repo::delete);
    }

    @Transactional
    public List<AcademicDayOrder> uploadAndParsePdf(MultipartFile pdf) {
        List<AcademicDayOrder> saved = new ArrayList<>();
        try (InputStream in = pdf.getInputStream(); PDDocument doc = PDDocument.load(in)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(doc);

            // Find explicit Day X patterns with nearby dates
            Pattern dayPattern = Pattern.compile("(?i)day\s*([1-5])[^\\n\\r]{0,80}?(\\d{1,2}[-/ ]\\w+[-/ ]?\\d{0,4}|\\w+\\s+\\d{1,2}(,?\\s*\\d{4})?)");
            Matcher m = dayPattern.matcher(text);
            Map<LocalDate, Integer> map = new HashMap<>();
            DateTimeFormatter[] fmts = new DateTimeFormatter[]{DateTimeFormatter.ofPattern("d-M-uuuu"), DateTimeFormatter.ofPattern("d-M-uu"), DateTimeFormatter.ofPattern("d MMM uuuu"), DateTimeFormatter.ofPattern("d MMMM uuuu")};

            while (m.find()) {
                String dayStr = m.group(1);
                String dateStr = m.group(2).trim();
                int day = Integer.parseInt(dayStr);
                LocalDate parsed = tryParseAny(dateStr, fmts);
                if (parsed != null) map.put(parsed, day);
            }

            // If none found, fallback to any explicit dates and assign cycle 1-5
            if (map.isEmpty()) {
                Pattern datePattern = Pattern.compile("\\b(\\d{1,2}[-/ ]\\d{1,2}[-/ ]\\d{2,4})\\b");
                Matcher dm = datePattern.matcher(text);
                List<LocalDate> dates = new ArrayList<>();
                while (dm.find()) {
                    LocalDate p = tryParseAny(dm.group(1), fmts);
                    if (p != null) dates.add(p);
                }
                Collections.sort(dates);
                for (int i = 0; i < dates.size(); i++) {
                    map.put(dates.get(i), (i % 5) + 1);
                }
            }

            for (var e : map.entrySet()) {
                AcademicDayOrder ado = repo.findByDate(e.getKey()).orElseGet(AcademicDayOrder::new);
                ado.setDate(e.getKey());
                ado.setDayOrder(e.getValue());
                saved.add(repo.save(ado));
            }

        } catch (Exception ex) {
            throw new RuntimeException("Failed to parse PDF", ex);
        }
        return saved;
    }

    private LocalDate tryParseAny(String s, DateTimeFormatter[] fmts) {
        String normalized = s.replaceAll("\\s+", " ").replaceAll("/", "-").replaceAll("\\.", "-").trim();
        for (DateTimeFormatter f : fmts) {
            try {
                return LocalDate.parse(normalized, f);
            } catch (DateTimeParseException ignored) {}
        }
        // try ISO
        try {
            return LocalDate.parse(normalized);
        } catch (Exception ignored) {}
        return null;
    }
}
