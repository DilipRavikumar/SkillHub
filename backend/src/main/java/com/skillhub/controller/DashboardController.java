package com.skillhub.controller;

import com.skillhub.entity.Course;
import com.skillhub.entity.Enrollment;
import com.skillhub.entity.User;
import com.skillhub.service.CourseService;
import com.skillhub.service.EnrollmentService;
import com.skillhub.service.UserService;
import com.skillhub.service.VideoProgressService;
import com.skillhub.service.CertificateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.skillhub.entity.Enrollment;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class DashboardController {

    @Autowired
    private UserService userService;

    @Autowired
    private CourseService courseService;

    @Autowired
    private EnrollmentService enrollmentService;
    
    @Autowired
    private VideoProgressService videoProgressService;
    
    @Autowired
    private CertificateService certificateService;

    @GetMapping("/admin/dashboard")
    public ResponseEntity<?> getAdminDashboard() {
        try {
            User currentUser = userService.getCurrentUser();
            if (!currentUser.getRole().getRoleName().equals("ADMIN")) {
                return ResponseEntity.badRequest().body("Access denied. Admin role required.");
            }

            Map<String, Object> dashboard = new HashMap<>();
            
            // Basic statistics
            List<User> allUsers = userService.getAllUsers();
            List<Course> allCourses = courseService.getAllCoursesAsEntities();
            long totalEnrollments = enrollmentService.getTotalEnrollments();
            
            dashboard.put("totalUsers", allUsers.size());
            dashboard.put("totalCourses", allCourses.size());
            dashboard.put("totalEnrollments", totalEnrollments);
            
            // Recent users (last 5 users) - Simplified structure to fix [OBJECT OBJECT] issue
            List<Map<String, Object>> recentUsers = allUsers.stream()
                    .sorted((u1, u2) -> Long.compare(u2.getId(), u1.getId())) // Sort by ID desc
                    .limit(5)
                    .map(user -> {
                        Map<String, Object> userData = new HashMap<>();
                        userData.put("name", user.getName());
                        userData.put("email", user.getEmail());
                        userData.put("role", user.getRole().getRoleName());
                        return userData;
                    })
                    .collect(java.util.stream.Collectors.toList());
            dashboard.put("recentUsers", recentUsers);
            
            // Top courses - Removed students count as requested
            List<Map<String, Object>> topCourses = allCourses.stream()
                    .map(course -> {
                        Map<String, Object> courseData = new HashMap<>();
                        courseData.put("title", course.getTitle());
                        courseData.put("instructor", course.getInstructor().getName());
                        return courseData;
                    })
                    .limit(5)
                    .collect(java.util.stream.Collectors.toList());
            dashboard.put("topCourses", topCourses);
            
            // User distribution by role
            Map<String, Object> userDistribution = new HashMap<>();
            long adminCount = allUsers.stream().filter(u -> u.getRole().getRoleName().equals("ADMIN")).count();
            long instructorCount = allUsers.stream().filter(u -> u.getRole().getRoleName().equals("INSTRUCTOR")).count();
            long studentCount = allUsers.stream().filter(u -> u.getRole().getRoleName().equals("STUDENT")).count();
            
            userDistribution.put("admin", adminCount);
            userDistribution.put("instructor", instructorCount);
            userDistribution.put("student", studentCount);
            userDistribution.put("total", allUsers.size());
            dashboard.put("userDistribution", userDistribution);
            
            // Platform overview data for charts
            Map<String, Object> platformOverview = new HashMap<>();
            platformOverview.put("users", allUsers.size());
            platformOverview.put("courses", allCourses.size());
            platformOverview.put("enrollments", totalEnrollments);
            platformOverview.put("lessons", allCourses.stream().mapToInt(c -> c.getLessons() != null ? c.getLessons().size() : 0).sum());
            dashboard.put("platformOverview", platformOverview);

            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/instructor/dashboard")
    public ResponseEntity<?> getInstructorDashboard() {
        try {
            User currentUser = userService.getCurrentUser();
            if (!currentUser.getRole().getRoleName().equals("INSTRUCTOR") && 
                !currentUser.getRole().getRoleName().equals("ADMIN")) {
                return ResponseEntity.badRequest().body("Access denied. Instructor role required.");
            }

            List<Course> myCourses = courseService.getCoursesByInstructor(currentUser);
            long totalEnrollments = enrollmentService.getEnrollmentsByCourses(myCourses);

            // Add enrollment count to each course
            List<Map<String, Object>> coursesWithEnrollmentCount = myCourses.stream()
                    .map(course -> {
                        Map<String, Object> courseData = new HashMap<>();
                        courseData.put("id", course.getId());
                        courseData.put("title", course.getTitle());
                        courseData.put("description", course.getDescription());
                        courseData.put("thumbnail", course.getThumbnail());
                        courseData.put("instructor", course.getInstructor());
                        courseData.put("lessons", course.getLessons());
                        courseData.put("enrollmentCount", enrollmentService.getEnrollmentCountByCourse(course.getId()));
                        return courseData;
                    })
                    .collect(java.util.stream.Collectors.toList());

            // Calculate total unique students across all courses
            Set<Long> uniqueStudentIds = new HashSet<>();
            for (Course course : myCourses) {
                List<Enrollment> enrollments = enrollmentService.getEnrollmentsByCourseId(course.getId());
                for (Enrollment enrollment : enrollments) {
                    uniqueStudentIds.add(enrollment.getStudent().getId());
                }
            }
            long totalStudents = uniqueStudentIds.size();

            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("myCourses", coursesWithEnrollmentCount);
            dashboard.put("totalEnrollments", totalEnrollments);
            dashboard.put("totalStudents", totalStudents);

            return ResponseEntity.ok(dashboard);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("User not found")) {
                return ResponseEntity.status(401).body("Authentication failed. Please login again.");
            }
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/student/dashboard")
    public ResponseEntity<?> getStudentDashboard() {
        try {
            User currentUser = userService.getCurrentUser();
            if (!currentUser.getRole().getRoleName().equals("STUDENT") && 
                !currentUser.getRole().getRoleName().equals("ADMIN")) {
                return ResponseEntity.badRequest().body("Access denied. Student role required.");
            }

            List<Enrollment> myEnrollments = enrollmentService.getEnrollmentsByStudent(currentUser);
            
            // Enhance enrollments with calculated progress
            List<Map<String, Object>> enhancedEnrollments = myEnrollments.stream()
                    .map(enrollment -> {
                        Map<String, Object> enrollmentData = new HashMap<>();
                        enrollmentData.put("id", enrollment.getId());
                        enrollmentData.put("course", enrollment.getCourse());
                        enrollmentData.put("student", enrollment.getStudent());
                        enrollmentData.put("enrolledAt", enrollment.getEnrolledAt());
                        
                        // Calculate actual progress from video progress
                        Double calculatedProgress = videoProgressService.calculateCourseProgress(
                            currentUser.getId(), enrollment.getCourse().getId());
                        enrollmentData.put("progress", calculatedProgress != null ? calculatedProgress.intValue() : 0);
                        
                        return enrollmentData;
                    })
                    .collect(java.util.stream.Collectors.toList());

            // Get certificates for the student
            List<com.skillhub.dto.CertificateResponse> certificates = certificateService.getMyCertificates();
            
            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("myEnrolledCourses", enhancedEnrollments);
            dashboard.put("certificates", certificates);

            return ResponseEntity.ok(dashboard);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("User not found")) {
                return ResponseEntity.status(401).body("Authentication failed. Please login again.");
            }
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }


    @GetMapping("/stats")
    public ResponseEntity<?> getPublicStats() {
        try {
            List<User> allUsers = userService.getAllUsers();
            long totalStudents = allUsers.stream().filter(u -> u.getRole().getRoleName().equals("STUDENT")).count();
            long totalInstructors = allUsers.stream().filter(u -> u.getRole().getRoleName().equals("INSTRUCTOR")).count();
            List<Course> allCourses = courseService.getAllCoursesAsEntities();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalStudents", (int) totalStudents);
            stats.put("totalInstructors", (int) totalInstructors);
            stats.put("totalCourses", allCourses.size());

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            // If there's an error accessing users (e.g., no auth), just return course count
            try {
                List<Course> allCourses = courseService.getAllCoursesAsEntities();
                Map<String, Object> stats = new HashMap<>();
                stats.put("totalStudents", 0);
                stats.put("totalInstructors", 0);
                stats.put("totalCourses", allCourses.size());
                return ResponseEntity.ok(stats);
            } catch (Exception ex) {
                return ResponseEntity.badRequest().body("Error: " + ex.getMessage());
            }
        }
    }
}
