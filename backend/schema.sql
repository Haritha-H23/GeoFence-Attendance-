-- GeoAttend Database Schema
-- Run this if you prefer manual setup instead of JPA auto-create

CREATE DATABASE IF NOT EXISTS geo_attendance;
USE geo_attendance;

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'STAFF', 'ADMIN') NOT NULL
);

CREATE TABLE staffs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE courses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    semester VARCHAR(20),
    schedules_json TEXT,
    staff_id BIGINT,
    FOREIGN KEY (staff_id) REFERENCES staffs(id) ON DELETE SET NULL
);

CREATE TABLE students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    section VARCHAR(20),
    phone VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE student_courses (
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE attendance_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    radius_meters INT NOT NULL DEFAULT 50,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (staff_id) REFERENCES staffs(id)
);

CREATE TABLE face_descriptors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNIQUE,
    descriptor TEXT NOT NULL,
    registered_at DATETIME,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE face_descriptors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNIQUE,
    descriptor TEXT NOT NULL,
    registered_at DATETIME,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE attendance_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    status ENUM('PRESENT', 'ABSENT', 'LATE') NOT NULL DEFAULT 'ABSENT',
    marked_at DATETIME,
    geo_verified BOOLEAN NOT NULL DEFAULT FALSE,
    face_verified BOOLEAN NOT NULL DEFAULT FALSE,
    absent_minutes INT DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_student (session_id, student_id)
);
