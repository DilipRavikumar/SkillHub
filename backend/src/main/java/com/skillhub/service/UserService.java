package com.skillhub.service;

import com.skillhub.dto.LoginRequest;
import com.skillhub.dto.RegisterRequest;
import com.skillhub.entity.Role;
import com.skillhub.entity.User;
import com.skillhub.repository.RoleRepository;
import com.skillhub.repository.UserRepository;
import com.skillhub.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    public User registerUser(RegisterRequest registerRequest) {
        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new RuntimeException("Email is already in use!");
        }

        Role role = roleRepository.findByRoleName(registerRequest.getRole())
                .orElseThrow(() -> new RuntimeException("Role not found: " + registerRequest.getRole()));

        User user = new User();
        user.setName(registerRequest.getName());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setRole(role);

        return userRepository.save(user);
    }

    public String loginUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        return jwtUtil.generateToken((org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal());
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public Optional<User> getCurrentUserOptional() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            return userRepository.findByEmail(email);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        // Delete user - this will cascade delete:
        // 1. Courses created (as instructor) -> Lessons -> VideoProgress
        // 2. Enrollments
        // 3. Certificates
        // 4. VideoProgress records
        userRepository.delete(user);
    }

    public User updateUser(Long userId, User userDetails) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        if (userDetails.getName() != null) {
            user.setName(userDetails.getName());
        }
        if (userDetails.getEmail() != null) {
            user.setEmail(userDetails.getEmail());
        }
        if (userDetails.getRole() != null) {
            user.setRole(userDetails.getRole());
        }

        return userRepository.save(user);
    }

    public User updateUserProfile(Long userId, String name, String email) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Update name (only if provided and different)
        if (name != null && !name.isEmpty() && !name.equals(user.getName())) {
            user.setName(name);
        }

        // Update email (check if not already in use by another user)
        if (email != null && !email.isEmpty() && !email.equals(user.getEmail())) {
            Optional<User> existingUser = userRepository.findByEmail(email);
            if (existingUser.isPresent() && !existingUser.get().getId().equals(userId)) {
                throw new RuntimeException("Email is already in use!");
            }
            user.setEmail(email);
        }

        // Password changes are NOT allowed through profile update
        // Role is NOT updated - it's permanent
        return userRepository.save(user);
    }
}
