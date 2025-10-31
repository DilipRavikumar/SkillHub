package com.skillhub.controller;

import com.skillhub.dto.CourseRequest;
import com.skillhub.dto.CourseResponse;
import com.skillhub.entity.Course;
import com.skillhub.entity.User;
import com.skillhub.service.CourseService;
import com.skillhub.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/courses")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @Autowired
    private UserService userService;

    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Courses API is working!");
    }

    @GetMapping
    public ResponseEntity<?> getAllCourses() {
        try {
            List<CourseResponse> courses = courseService.getAllCourses();
            return ResponseEntity.ok(courses);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createCourse(@RequestBody CourseRequest courseRequest) {
        try {
            User currentUser = userService.getCurrentUser();
            if (!currentUser.getRole().getRoleName().equals("INSTRUCTOR") && 
                !currentUser.getRole().getRoleName().equals("ADMIN")) {
                return ResponseEntity.badRequest().body("Only instructors can create courses");
            }
            
            Course course = courseService.createCourse(courseRequest);
            return ResponseEntity.ok(course);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCourseById(@PathVariable Long id) {
        try {
            Optional<Course> course = courseService.getCourseByIdPublic(id);
            if (course.isPresent()) {
                return ResponseEntity.ok(course.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCourse(@PathVariable Long id, @RequestBody CourseRequest courseRequest) {
        try {
            Course course = courseService.updateCourse(id, courseRequest);
            return ResponseEntity.ok(course);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        try {
            courseService.deleteCourse(id);
            return ResponseEntity.ok("Course deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/instructor/my-courses")
    public ResponseEntity<?> getMyCourses() {
        try {
            User instructor = userService.getCurrentUser();
            List<Course> courses = courseService.getCoursesByInstructor(instructor);
            return ResponseEntity.ok(courses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
