package com.geoattend.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AcademicCalendarServiceTest {

    @Test
    void parsesRomanDayOrdersCorrectly() {
        assertEquals(1, AcademicCalendarService.parseDayOrderToken("I"));
        assertEquals(2, AcademicCalendarService.parseDayOrderToken("II"));
        assertEquals(3, AcademicCalendarService.parseDayOrderToken("III"));
        assertEquals(4, AcademicCalendarService.parseDayOrderToken("IV"));
        assertEquals(5, AcademicCalendarService.parseDayOrderToken("V"));
    }

    @Test
    void rejectsRangeLabelsThatAreNotSingleDayOrders() {
        assertThrows(IllegalArgumentException.class, () -> AcademicCalendarService.parseDayOrderToken("1-5"));
    }
}
