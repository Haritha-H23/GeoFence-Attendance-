package com.geoattend.service;

import com.geoattend.model.AcademicDayOrder;
import com.geoattend.repository.AcademicDayOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AcademicCalendarService {

    private static final Map<String, Integer> ROMAN_VALUES = Map.ofEntries(
            Map.entry("I", 1),
            Map.entry("IV", 4),
            Map.entry("V", 5),
            Map.entry("IX", 9),
            Map.entry("X", 10),
            Map.entry("XL", 40),
            Map.entry("L", 50),
            Map.entry("XC", 90),
            Map.entry("C", 100),
            Map.entry("CD", 400),
            Map.entry("D", 500),
            Map.entry("CM", 900),
            Map.entry("M", 1000)
    );

    private static final Pattern MONTH_YEAR_PATTERN = Pattern.compile("(?i)\\b(January|February|March|April|May|June|July|August|September|October|November|December)\\s+(20\\d{2})\\b");
    private static final Pattern TABLE_DAY_ORDER_PATTERN = Pattern.compile("(?i)\\b(0?[1-9]|[12]\\d|3[01])\\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Mo|Tu|We|Th|Fr|Sa|Su)\\s*(I{1,3}|IV|V|[1-5])\\b");

    private final AcademicDayOrderRepository repo;

    public static int parseDayOrderToken(String token) {
        if (token == null) {
            throw new IllegalArgumentException("Day order token is required");
        }

        String normalized = token.trim();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("Day order token is required");
        }

        String upper = normalized.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        if (upper.matches("\\d+")) {
            int value = Integer.parseInt(upper);
            if (value >= 1 && value <= 5) return value;
            throw new IllegalArgumentException("Day order must be between 1 and 5");
        }

        int total = 0;
        for (int i = 0; i < upper.length(); i++) {
            String current = String.valueOf(upper.charAt(i));
            String next = i + 1 < upper.length() ? String.valueOf(upper.charAt(i + 1)) : "";
            int currentValue = ROMAN_VALUES.getOrDefault(current, 0);
            int nextValue = ROMAN_VALUES.getOrDefault(next, 0);

            if (currentValue == 0) {
                throw new IllegalArgumentException("Unsupported day order token: " + token);
            }

            if (nextValue > currentValue) {
                total += nextValue - currentValue;
                i++;
            } else {
                total += currentValue;
            }
        }

        if (total < 1 || total > 5) {
            throw new IllegalArgumentException("Roman day order must resolve to 1..5: " + token);
        }
        return total;
    }

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

    public static Map<LocalDate, Integer> extractDayOrderMap(String text) {
        Map<LocalDate, Integer> map = new HashMap<>();
        if (text == null || text.isBlank()) {
            return map;
        }

        List<MonthYearRange> monthRanges = new ArrayList<>();
        Matcher monthYearMatcher = MONTH_YEAR_PATTERN.matcher(text);
        while (monthYearMatcher.find()) {
            String monthName = monthYearMatcher.group(1);
            int year = Integer.parseInt(monthYearMatcher.group(2));
            int start = monthYearMatcher.start();
            int end = monthYearMatcher.find() ? monthYearMatcher.start() : text.length();
            monthRanges.add(new MonthYearRange(Month.valueOf(monthName.toUpperCase(Locale.ROOT)), year, start, end));
            if (monthYearMatcher.hitEnd()) {
                break;
            }
        }

        if (monthRanges.isEmpty()) {
            return map;
        }

        monthRanges.sort(Comparator.comparingInt(r -> r.start));
        for (int i = 0; i < monthRanges.size(); i++) {
            MonthYearRange current = monthRanges.get(i);
            int end = i + 1 < monthRanges.size() ? monthRanges.get(i + 1).start : text.length();
            String chunk = text.substring(current.start, end);
            Matcher rowMatcher = TABLE_DAY_ORDER_PATTERN.matcher(chunk);
            while (rowMatcher.find()) {
                int dayOfMonth = Integer.parseInt(rowMatcher.group(1));
                String romanToken = rowMatcher.group(2);
                int dayOrder = parseDayOrderToken(romanToken);
                LocalDate date = LocalDate.of(current.year, current.month, dayOfMonth);
                map.put(date, dayOrder);
            }
        }

        return map;
    }

    @Transactional
    public List<AcademicDayOrder> uploadAndParsePdf(MultipartFile pdf) {
        List<AcademicDayOrder> saved = new ArrayList<>();
        try (InputStream in = pdf.getInputStream(); PDDocument doc = PDDocument.load(in)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(doc);
            
            log.info("PDF uploaded: {} ({} bytes)", pdf.getOriginalFilename(), pdf.getSize());
            log.debug("Extracted text length: {}", text.length());

            Map<LocalDate, Integer> map = extractDayOrderMap(text);
            DateTimeFormatter[] fmts = new DateTimeFormatter[]{
                DateTimeFormatter.ofPattern("d-M-uuuu"), 
                DateTimeFormatter.ofPattern("d-M-uu"), 
                DateTimeFormatter.ofPattern("d/M/uuuu"),
                DateTimeFormatter.ofPattern("d/M/uu"),
                DateTimeFormatter.ofPattern("d MMM uuuu"), 
                DateTimeFormatter.ofPattern("d MMM uu"),
                DateTimeFormatter.ofPattern("d MMMM uuuu"),
                DateTimeFormatter.ofPattern("d MMMM uu"),
                DateTimeFormatter.ofPattern("MMM d uuuu"),
                DateTimeFormatter.ofPattern("MMM d uu"),
                DateTimeFormatter.ofPattern("MMMM d uuuu"),
                DateTimeFormatter.ofPattern("MMMM d uu")
            };

            if (map.isEmpty()) {
                Pattern dayPattern = Pattern.compile("(?i)(?:day(?:\\s+order)?\\s*[:=]?\\s*)(I{1,3}|IV|V|[1-5])[^\\n\\r]{0,80}?(\\d{1,2}[-/ ]\\w+[-/ ]?\\d{0,4}|\\w+\\s+\\d{1,2}(,?\\s*\\d{4})?)");
                Matcher m = dayPattern.matcher(text);
                while (m.find()) {
                    String dayStr = m.group(1);
                    String dateStr = m.group(2).trim();
                    int day = parseDayOrderToken(dayStr);
                    LocalDate parsed = tryParseAny(dateStr, fmts);
                    if (parsed != null) {
                        map.put(parsed, day);
                        log.debug("Parsed Day {}: {}", day, parsed);
                    }
                }
            }

            // If none found, fallback to any explicit dates and assign cycle 1-5
            if (map.isEmpty()) {
                log.info("No Day pattern found, trying fallback date pattern");
                Pattern datePattern = Pattern.compile("\\b(\\d{1,2}[-/ ]\\d{1,2}[-/ ]\\d{2,4})\\b");
                Matcher dm = datePattern.matcher(text);
                List<LocalDate> dates = new ArrayList<>();
                while (dm.find()) {
                    LocalDate p = tryParseAny(dm.group(1), fmts);
                    if (p != null) {
                        dates.add(p);
                        log.debug("Found date: {}", p);
                    }
                }
                Collections.sort(dates);
                for (int i = 0; i < dates.size(); i++) {
                    map.put(dates.get(i), (i % 5) + 1);
                }
                log.info("Assigned {} dates with day order cycle", map.size());
            }

            for (var e : map.entrySet()) {
                AcademicDayOrder ado = repo.findByDate(e.getKey()).orElseGet(AcademicDayOrder::new);
                ado.setDate(e.getKey());
                ado.setDayOrder(e.getValue());
                saved.add(repo.save(ado));
            }
            
            log.info("Successfully saved {} academic day orders", saved.size());

        } catch (Exception ex) {
            log.error("Failed to parse PDF", ex);
            throw new RuntimeException("Failed to parse PDF: " + ex.getMessage(), ex);
        }
        return saved;
    }

    private static final class MonthYearRange {
        private final Month month;
        private final int year;
        private final int start;

        private MonthYearRange(Month month, int year, int start, int end) {
            this.month = month;
            this.year = year;
            this.start = start;
        }
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
