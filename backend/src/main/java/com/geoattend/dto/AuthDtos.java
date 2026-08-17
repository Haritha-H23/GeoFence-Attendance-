package com.geoattend.dto;

import lombok.Data;

public class AuthDtos {

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
        private String role;
    }

    @Data
    public static class LoginResponse {
        private UserDto user;
        private String token;

        public LoginResponse(UserDto user, String token) {
            this.user = user;
            this.token = token;
        }
    }

    @Data
    public static class UserDto {
        private Long id;
        private String name;
        private String email;
        private String role;
    }
}
