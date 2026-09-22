package com.pie.backend.controller;

import com.pie.backend.dto.CreateUserRequest;
import com.pie.backend.dto.UpdateProfileRequest;
import com.pie.backend.dto.UserResponse;
import com.pie.backend.model.User;
import com.pie.backend.security.SecurityIdentityService;
import com.pie.backend.service.UserService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final SecurityIdentityService securityIdentityService;

    public UserController(
            UserService userService,
            SecurityIdentityService securityIdentityService) {

        this.userService = userService;
        this.securityIdentityService =
                securityIdentityService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(
            @Valid @RequestBody CreateUserRequest request) {

        User user = userService.createUser(
                request.getName(),
                request.getEmail(),
                request.getPassword()
        );

        return UserResponse.from(user);
    }

    @GetMapping("/{id}")
    public UserResponse getUser(
            @PathVariable UUID id) {

        securityIdentityService.requireSameUser(id);

        return UserResponse.from(
                userService.getUserById(id)
        );
    }

    @GetMapping("/me")
    public UserResponse getCurrentUser() {

        UUID userId =
                securityIdentityService.currentUserId();

        return UserResponse.from(
                userService.getUserById(userId)
        );
    }

    @PutMapping("/me")
    public UserResponse updateCurrentUser(
            @Valid @RequestBody UpdateProfileRequest request) {

        UUID userId =
                securityIdentityService.currentUserId();

        User user =
                userService.updateName(
                        userId,
                        request.getName()
                );

        return UserResponse.from(user);
    }
}