package com.skillhub.controller;

import com.skillhub.dto.EnrollmentRequest;
import com.skillhub.entity.Enrollment;
import com.skillhub.entity.User;
import com.skillhub.service.EnrollmentService;
import com.skillhub.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    @Autowired
    private EnrollmentService enrollmentService;

    @Autowired
    private UserService userService;

    @PostMapping("/enroll")
    public ResponseEntity<?> enrollStudent(@RequestBody EnrollmentRequest enrollmentRequest) {
        try {
            User currentUser = userService.getCurrentUser();
            if (!currentUser.getRole().getRoleName().equals("STUDENT") && 
                !currentUser.getRole().getRoleName().equals("ADMIN")) {
                return ResponseEntity.badRequest().body("Only students can enroll in courses");
            }
            
            Enrollment enrollment = enrollmentService.enrollStudent(enrollmentRequest.getCourseId());
            return ResponseEntity.ok(enrollment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/my-enrollments")
    public ResponseEntity<?> getMyEnrollments() {
        try {
            User currentUser = userService.getCurrentUser();
            if (!currentUser.getRole().getRoleName().equals("STUDENT") && 
                !currentUser.getRole().getRoleName().equals("ADMIN")) {
                return ResponseEntity.badRequest().body("Only students can view enrollments");
            }
            
            List<Enrollment> enrollments = enrollmentService.getEnrollmentsByStudent();
            return ResponseEntity.ok(enrollments);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
