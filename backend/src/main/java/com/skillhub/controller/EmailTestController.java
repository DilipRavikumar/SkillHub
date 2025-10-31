package com.skillhub.controller;

import com.skillhub.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/test/email")
public class EmailTestController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/test-welcome-email")
    public ResponseEntity<?> testWelcomeEmail(@RequestParam String email) {
        try {
            emailService.sendWelcomeEmail(email, "Test User");
            return ResponseEntity.ok("Welcome email test sent to: " + email);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/test-login-email")
    public ResponseEntity<?> testLoginEmail(@RequestParam String email) {
        try {
            emailService.sendLoginNotification(email, "Test User");
            return ResponseEntity.ok("Login email test sent to: " + email);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/test-certificate-email")
    public ResponseEntity<?> testCertificateEmail(@RequestParam String email) {
        try {
            emailService.sendCertificateEmail(email, "Test User", "Test Course", "SH-TEST-12345", "https://skillhub.com/certificate/TEST");
            return ResponseEntity.ok("Certificate email test sent to: " + email);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}

