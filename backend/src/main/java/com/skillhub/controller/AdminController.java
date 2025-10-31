package com.skillhub.controller;

import com.skillhub.entity.User;
import com.skillhub.entity.Course;
import com.skillhub.service.UserService;
import com.skillhub.service.CourseService;
import com.skillhub.service.EnrollmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private CourseService courseService;

    @Autowired
    private EnrollmentService enrollmentService;

    // User Management Endpoints
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<?> getUserById(@PathVariable Long userId) {
        try {
            User user = userService.getUserById(userId);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        try {
            userService.deleteUser(userId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "User deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable Long userId, @RequestBody User userDetails) {
        try {
            User updatedUser = userService.updateUser(userId, userDetails);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // Course Management Endpoints
    @GetMapping("/courses")
    public ResponseEntity<?> getAllCourses() {
        try {
            List<com.skillhub.dto.CourseResponse> courses = courseService.getAllCourses();
            return ResponseEntity.ok(courses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/courses/{courseId}")
    public ResponseEntity<?> getCourseById(@PathVariable Long courseId) {
        try {
            java.util.Optional<Course> course = courseService.getCourseById(courseId);
            if (course.isPresent()) {
                return ResponseEntity.ok(course.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/courses/{courseId}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long courseId) {
        try {
            courseService.deleteCourse(courseId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Course deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/courses/{courseId}")
    public ResponseEntity<?> updateCourse(@PathVariable Long courseId, @RequestBody Course courseDetails) {
        try {
            Course updatedCourse = courseService.updateCourse(courseId, courseDetails);
            return ResponseEntity.ok(updatedCourse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // Statistics Endpoints
    @GetMapping("/stats")
    public ResponseEntity<?> getAdminStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            
            // User statistics
            List<User> users = userService.getAllUsers();
            long totalUsers = users.size();
            long totalStudents = users.stream().filter(u -> u.getRole().getRoleName().equals("STUDENT")).count();
            long totalInstructors = users.stream().filter(u -> u.getRole().getRoleName().equals("INSTRUCTOR")).count();
            long totalAdmins = users.stream().filter(u -> u.getRole().getRoleName().equals("ADMIN")).count();
            
            // Course statistics
            List<com.skillhub.dto.CourseResponse> courses = courseService.getAllCourses();
            long totalCourses = courses.size();
            
            // Enrollment statistics
            long totalEnrollments = enrollmentService.getTotalEnrollments();
            
            stats.put("totalUsers", totalUsers);
            stats.put("totalStudents", totalStudents);
            stats.put("totalInstructors", totalInstructors);
            stats.put("totalAdmins", totalAdmins);
            stats.put("totalCourses", totalCourses);
            stats.put("totalEnrollments", totalEnrollments);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/total-enrollments")
    public ResponseEntity<?> getTotalEnrollments() {
        try {
            long totalEnrollments = enrollmentService.getTotalEnrollments();
            return ResponseEntity.ok(totalEnrollments);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
