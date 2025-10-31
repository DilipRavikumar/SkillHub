package com.skillhub.controller;

import com.skillhub.dto.JwtResponse;
import com.skillhub.dto.LoginRequest;
import com.skillhub.dto.RegisterRequest;
import com.skillhub.entity.User;
import com.skillhub.service.EmailService;
import com.skillhub.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private EmailService emailService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest registerRequest) {
        try {
            User user = userService.registerUser(registerRequest);
            String token = userService.loginUser(new LoginRequest(registerRequest.getEmail(), registerRequest.getPassword()));
            
            // Send welcome email to new user
            try {
                emailService.sendWelcomeEmail(user.getEmail(), user.getName());
            } catch (Exception e) {
                // Log error but don't fail the registration
                System.err.println("Failed to send welcome email: " + e.getMessage());
            }
            
            return ResponseEntity.ok(new JwtResponse(token, user.getId(), user.getName(), 
                    user.getEmail(), user.getRole().getRoleName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            String token = userService.loginUser(loginRequest);
            User user = userService.getUserByEmail(loginRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Send login notification email
            try {
                emailService.sendLoginNotification(user.getEmail(), user.getName());
            } catch (Exception e) {
                // Log error but don't fail the login
                System.err.println("Failed to send login email: " + e.getMessage());
            }
            
            return ResponseEntity.ok(new JwtResponse(token, user.getId(), user.getName(), 
                    user.getEmail(), user.getRole().getRoleName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody java.util.Map<String, String> profileRequest) {
        try {
            User currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(401).body("Unauthorized");
            }

            System.out.println("Profile update request for user: " + currentUser.getId());

            // Update user profile (name and email only - no password changes)
            User updatedUser = userService.updateUserProfile(
                currentUser.getId(),
                profileRequest.get("name"),
                profileRequest.get("email")
            );
            
            System.out.println("Profile updated successfully");
            
            // Return updated user info (without password)
            return ResponseEntity.ok(new java.util.HashMap<String, Object>() {{
                put("id", updatedUser.getId());
                put("name", updatedUser.getName());
                put("email", updatedUser.getEmail());
                put("role", updatedUser.getRole().getRoleName());
            }});
        } catch (Exception e) {
            System.out.println("Error updating profile: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
