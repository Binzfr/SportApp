package com.melih.sportapp.controller;

import com.melih.sportapp.model.User;
import com.melih.sportapp.repository.UserRepository;
import com.melih.sportapp.security.JwtUtil;
import com.melih.sportapp.security.SimpleRateLimiter;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Autowired
    private SimpleRateLimiter rateLimiter;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody User user, @RequestHeader(value = "X-Forwarded-For", required = false) String ip) {
        String clientIp = ip != null ? ip : "unknown";
        if (!rateLimiter.allowRegister(clientIp)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body("Trop de tentatives d'inscription, réessayez plus tard.");
        }
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginData, @RequestHeader(value = "X-Forwarded-For", required = false) String ip) {
        String clientIp = ip != null ? ip : "unknown";
        if (!rateLimiter.allowLogin(clientIp)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body("Trop de tentatives de connexion, réessayez plus tard.");
        }
        Optional<User> userOpt = userRepository.findByUsername(loginData.get("username"));
        if (userOpt.isPresent() && passwordEncoder.matches(loginData.get("password"), userOpt.get().getPassword())) {
            String token = jwtUtil.generateToken(userOpt.get().getId(), userOpt.get().getUsername());
            return ResponseEntity.ok(Map.of("token", token));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
    }
}
