package com.smartinventory.config;

import com.smartinventory.model.Role;
import com.smartinventory.model.User;
import com.smartinventory.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Ensures the two default accounts exist with the correct BCrypt passwords,
 * regardless of how the database was seeded.
 *   admin / admin123  (ADMIN)
 *   staff / staff123  (STAFF)
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        upsert("admin", "admin123", "System Administrator", Role.ADMIN);
        upsert("staff", "staff123", "Shop Staff", Role.STAFF);
    }

    private void upsert(String username, String rawPassword, String fullName, Role role) {
        User user = userRepository.findByUsername(username).orElseGet(User::new);
        user.setUsername(username);
        user.setFullName(fullName);
        user.setRole(role);
        user.setEnabled(true);
        user.setPassword(passwordEncoder.encode(rawPassword));
        userRepository.save(user);
    }
}
