package com.pie.backend.service;

import com.pie.backend.model.User;
import com.pie.backend.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User createUser(
            String name,
            String email,
            String password) {

        String normalizedEmail =
                normalizeEmail(email);

        if (userRepository.existsByEmail(
                normalizedEmail)) {

            throw new IllegalArgumentException(
                    "A user with this email already exists"
            );
        }

        // Plain-text password is intentionally preserved
        // according to the current project requirement.
        User user =
                new User(
                        normalizedEmail,
                        name.trim(),
                        password
                );

        return userRepository.save(user);
    }

    public User login(
            String email,
            String password) {

        String normalizedEmail =
                normalizeEmail(email);

        User user =
                userRepository.findByEmail(
                        normalizedEmail
                ).orElseThrow(() ->
                        new IllegalArgumentException(
                                "Invalid email or password"
                        )
                );

        if (!user.getPassword().equals(password)) {

            throw new IllegalArgumentException(
                    "Invalid email or password"
            );
        }

        return user;
    }

    public User getUserById(UUID id) {

        return userRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"
                        )
                );
    }

    @Transactional
    public User updateName(
            UUID userId,
            String name) {

        User user =
                getUserById(userId);

        user.setName(name.trim());

        return userRepository.save(user);
    }

    public List<User> getAllUsers() {

        return userRepository.findAll();
    }

    private String normalizeEmail(String email) {

        if (email == null) {
            return "";
        }

        return email.trim().toLowerCase();
    }
}