package com.geoattend.service;

import com.geoattend.dto.AuthDtos.*;
import com.geoattend.model.User;
import com.geoattend.repository.UserRepository;
import com.geoattend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().name());

        return new LoginResponse(dto, token);
    }

    public LoginResponse register(RegisterRequest request) {
        if (request == null || request.getEmail() == null || request.getPassword() == null || request.getName() == null) {
            throw new RuntimeException("Name, email, and password are required.");
        }

        String email = request.getEmail().trim();
        String password = request.getPassword();
        String roleName = request.getRole() == null ? "STUDENT" : request.getRole().trim().toUpperCase();

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("An account with this email already exists.");
        }

        User.Role role;
        try {
            role = User.Role.valueOf(roleName);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role selected.");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        userRepository.save(user);

        return login(new LoginRequest() {{
            setEmail(email);
            setPassword(password);
        }});
    }
}
