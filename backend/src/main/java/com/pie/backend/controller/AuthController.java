package com.pie.backend.controller;

import com.pie.backend.dto.LoginRequest;
import com.pie.backend.dto.LoginResponse;
import com.pie.backend.model.User;
import com.pie.backend.security.PieTokenService;
import com.pie.backend.service.UserService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserService userService;
    private final PieTokenService tokenService;

    public AuthController(
            UserService userService,
            PieTokenService tokenService) {

        this.userService = userService;
        this.tokenService = tokenService;
    }

    @PostMapping("/login")
    public LoginResponse login(
            @Valid @RequestBody LoginRequest request) {

        User user = userService.login(
                request.getEmail(),
                request.getPassword()
        );

        String token =
                tokenService.createToken(user.getId());

        return LoginResponse.from(user, token);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestHeader(
                    value = "X-PIE-Token",
                    required = false
            ) String token) {

        tokenService.revoke(token);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Logged out successfully"
                )
        );
    }
}