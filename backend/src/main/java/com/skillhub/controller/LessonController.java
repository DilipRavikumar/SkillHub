package com.skillhub.controller;

import com.skillhub.entity.Lesson;
import com.skillhub.entity.User;
import com.skillhub.service.LessonService;
import com.skillhub.service.UserService;
import com.skillhub.service.EnrollmentService;
import com.skillhub.service.S3Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class LessonController {

    @Autowired
    private LessonService lessonService;
    
    @Autowired
    private UserService userService;

    @Autowired
    private EnrollmentService enrollmentService;

    @Autowired
    private S3Service s3Service;

    @GetMapping("/courses/{courseId}/lessons")
    public ResponseEntity<?> getLessonsByCourse(@PathVariable Long courseId) {
        try {
            User currentUser = userService.getCurrentUser();
            List<Lesson> lessons = lessonService.getLessonsByCourseId(courseId);
            
            // Check access permission
            String userRole = null;
            boolean canAccess = false;
            if (currentUser != null && currentUser.getRole() != null) {
                userRole = currentUser.getRole().getRoleName();
                if ("INSTRUCTOR".equals(userRole) || "ADMIN".equals(userRole)) {
                    canAccess = true;
                } else {
                    canAccess = enrollmentService.isCurrentUserEnrolledInCourse(courseId);
                }
            }
            
            // Generate presigned URLs for S3 videos if user has access
            if (canAccess) {
                for (Lesson lesson : lessons) {
                    if (lesson.getVideoFilename() != null && 
                        (lesson.getVideoFilename().startsWith("https://") || lesson.getVideoFilename().startsWith("http://"))) {
                        String presignedUrl = s3Service.generatePresignedUrl(lesson.getVideoFilename());
                        lesson.setVideoFilename(presignedUrl);
                    }
                    if (lesson.getVideoUrl() != null && 
                        (lesson.getVideoUrl().startsWith("https://") || lesson.getVideoUrl().startsWith("http://"))) {
                        String presignedUrl = s3Service.generatePresignedUrl(lesson.getVideoUrl());
                        lesson.setVideoUrl(presignedUrl);
                    }
                }
            }
            
            return ResponseEntity.ok(lessons);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/lessons/{lessonId}")
    public ResponseEntity<?> getLessonById(@PathVariable Long lessonId) {
        try {
            return lessonService.getLessonById(lessonId)
                    .map(lesson -> {
                        User currentUser = userService.getCurrentUser();
                        
                        String userRole = null;
                        if (currentUser != null && currentUser.getRole() != null) {
                            userRole = currentUser.getRole().getRoleName();
                        }
                        
                        boolean canAccess = false;
                        
                        if ("INSTRUCTOR".equals(userRole) || "ADMIN".equals(userRole)) {
                            canAccess = true;
                        } else if (currentUser != null) {
                            Long courseId = lesson.getCourse() != null ? lesson.getCourse().getId() : null;
                            if (courseId != null) {
                                canAccess = enrollmentService.isCurrentUserEnrolledInCourse(courseId);
                            }
                        }
                        
                        if (canAccess && lesson.getVideoFilename() != null && 
                            (lesson.getVideoFilename().startsWith("https://") || lesson.getVideoFilename().startsWith("http://"))) {
                            String presignedUrl = s3Service.generatePresignedUrl(lesson.getVideoFilename());
                            lesson.setVideoFilename(presignedUrl);
                        }
                        
                        // Also handle videoUrl field if it's an S3 URL
                        if (canAccess && lesson.getVideoUrl() != null && 
                            (lesson.getVideoUrl().startsWith("https://") || lesson.getVideoUrl().startsWith("http://"))) {
                            String presignedUrl = s3Service.generatePresignedUrl(lesson.getVideoUrl());
                            lesson.setVideoUrl(presignedUrl);
                        }
                        
                        return ResponseEntity.ok(lesson);
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/courses/{courseId}/lessons")
    public ResponseEntity<?> createLesson(@PathVariable Long courseId, @RequestBody Lesson lesson) {
        try {
            User currentUser = userService.getCurrentUser();
            if (!currentUser.getRole().getRoleName().equals("INSTRUCTOR") && 
                !currentUser.getRole().getRoleName().equals("ADMIN")) {
                return ResponseEntity.badRequest().body("Access denied. Instructor role required.");
            }

            // Set the course relationship instead of courseId
            lesson.setCourse(new com.skillhub.entity.Course());
            lesson.getCourse().setId(courseId);
            Lesson savedLesson = lessonService.saveLesson(lesson);
            return ResponseEntity.ok(savedLesson);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/lessons/{lessonId}")
    public ResponseEntity<?> updateLesson(@PathVariable Long lessonId, @RequestBody Lesson lesson) {
        try {
            User currentUser = userService.getCurrentUser();
            if (!currentUser.getRole().getRoleName().equals("INSTRUCTOR") && 
                !currentUser.getRole().getRoleName().equals("ADMIN")) {
                return ResponseEntity.badRequest().body("Access denied. Instructor role required.");
            }

            return lessonService.getLessonById(lessonId)
                    .map(existingLesson -> {
                        existingLesson.setTitle(lesson.getTitle());
                        existingLesson.setDescription(lesson.getDescription());
                        existingLesson.setVideoUrl(lesson.getVideoUrl());
                        existingLesson.setVideoFilename(lesson.getVideoFilename());
                        existingLesson.setVideoDuration(lesson.getVideoDuration());
                        existingLesson.setLessonOrder(lesson.getLessonOrder());
                        return ResponseEntity.ok(lessonService.saveLesson(existingLesson));
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/lessons/{lessonId}")
    public ResponseEntity<?> deleteLesson(@PathVariable Long lessonId) {
        try {
            User currentUser = userService.getCurrentUser();
            if (!currentUser.getRole().getRoleName().equals("INSTRUCTOR") && 
                !currentUser.getRole().getRoleName().equals("ADMIN")) {
                return ResponseEntity.badRequest().body("Access denied. Instructor role required.");
            }

            lessonService.deleteLesson(lessonId);
            return ResponseEntity.ok("Lesson deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
