package com.skillhub.controller;

import com.skillhub.entity.VideoProgress;
import com.skillhub.entity.User;
import com.skillhub.service.VideoProgressService;
import com.skillhub.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class VideoProgressController {

    @Autowired
    private VideoProgressService videoProgressService;
    
    @Autowired
    private UserService userService;

    @PostMapping("/video-progress")
    public ResponseEntity<?> updateVideoProgress(@RequestBody Map<String, Object> progressData) {
        try {
            User currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.badRequest().body("User not authenticated");
            }
            
            if (currentUser.getRole() == null) {
                return ResponseEntity.badRequest().body("User role not found");
            }
            
            if (!currentUser.getRole().getRoleName().equals("STUDENT") && 
                !currentUser.getRole().getRoleName().equals("ADMIN")) {
                return ResponseEntity.badRequest().body("Access denied. Student role required.");
            }

            Long lessonId = Long.valueOf(progressData.get("lessonId").toString());
            Integer watchedDuration = Integer.valueOf(progressData.get("watchedDuration").toString());

            VideoProgress progress = videoProgressService.updateProgress(currentUser.getId(), lessonId, watchedDuration);
            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            System.err.println("Error in updateVideoProgress: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/video-progress/{lessonId}")
    public ResponseEntity<?> getVideoProgress(@PathVariable Long lessonId) {
        try {
            User currentUser = userService.getCurrentUser();
            if (currentUser.getRole() == null) {
                return ResponseEntity.badRequest().body("User role not found");
            }
            
            if (!currentUser.getRole().getRoleName().equals("STUDENT") && 
                !currentUser.getRole().getRoleName().equals("ADMIN")) {
                return ResponseEntity.badRequest().body("Access denied. Student role required.");
            }

            Optional<VideoProgress> progress = videoProgressService.getProgress(currentUser.getId(), lessonId);
            if (progress.isPresent()) {
                VideoProgress videoProgress = progress.get();
                System.out.println("=== Returning VideoProgress ===");
                System.out.println("Watched Duration: " + videoProgress.getWatchedDuration());
                System.out.println("Total Duration: " + videoProgress.getTotalDuration());
                System.out.println("Completion Percentage: " + videoProgress.getCompletionPercentage());
                System.out.println("Is Completed: " + videoProgress.getIsCompleted());
                return ResponseEntity.ok(videoProgress);
            } else {
                Map<String, Object> defaultProgress = new HashMap<>();
                defaultProgress.put("watchedDuration", 0);
                defaultProgress.put("completionPercentage", 0);
                defaultProgress.put("isCompleted", false);
                return ResponseEntity.ok(defaultProgress);
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/student/progress")
    public ResponseEntity<?> getStudentProgress() {
        try {
            User currentUser = userService.getCurrentUser();
            if (!currentUser.getRole().getRoleName().equals("STUDENT") && 
                !currentUser.getRole().getRoleName().equals("ADMIN")) {
                return ResponseEntity.badRequest().body("Access denied. Student role required.");
            }

            List<VideoProgress> progress = videoProgressService.getStudentProgress(currentUser.getId());
            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/courses/{courseId}/progress")
    public ResponseEntity<?> getCourseProgress(@PathVariable Long courseId) {
        try {
            User currentUser = userService.getCurrentUser();
            if (!currentUser.getRole().getRoleName().equals("STUDENT") && 
                !currentUser.getRole().getRoleName().equals("ADMIN")) {
                return ResponseEntity.badRequest().body("Access denied. Student role required.");
            }

            List<VideoProgress> progress = videoProgressService.getCourseProgress(currentUser.getId(), courseId);
            Double courseProgress = videoProgressService.calculateCourseProgress(currentUser.getId(), courseId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("lessonProgress", progress);
            response.put("courseProgress", courseProgress);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/video-progress/{lessonId}/complete")
    public ResponseEntity<?> markLessonCompleted(@PathVariable Long lessonId) {
        try {
            User currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.badRequest().body("User not authenticated");
            }
            
            if (!currentUser.getRole().getRoleName().equals("STUDENT") && 
                !currentUser.getRole().getRoleName().equals("ADMIN")) {
                return ResponseEntity.badRequest().body("Access denied. Student role required.");
            }

            VideoProgress progress = videoProgressService.markLessonCompleted(currentUser.getId(), lessonId);
            if (progress != null) {
                return ResponseEntity.ok(progress);
            } else {
                return ResponseEntity.badRequest().body("Lesson progress not found");
            }
        } catch (Exception e) {
            System.err.println("Error in markLessonCompleted: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/lesson/{lessonId}/accessibility")
    public ResponseEntity<?> checkLessonAccessibility(@PathVariable Long lessonId) {
        try {
            User currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.badRequest().body("User not authenticated");
            }
            
            if (!currentUser.getRole().getRoleName().equals("STUDENT") && 
                !currentUser.getRole().getRoleName().equals("ADMIN")) {
                return ResponseEntity.badRequest().body("Access denied. Student role required.");
            }

            System.out.println("Checking accessibility for user: " + currentUser.getId() + ", lesson: " + lessonId);
            boolean isAccessible = videoProgressService.isLessonAccessible(currentUser.getId(), lessonId);
            System.out.println("Accessibility result: " + isAccessible);
            
            Map<String, Object> response = new HashMap<>();
            response.put("isAccessible", isAccessible);
            response.put("lessonId", lessonId);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error in checkLessonAccessibility: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/courses/{courseId}/next-lesson")
    public ResponseEntity<?> getNextAccessibleLesson(@PathVariable Long courseId) {
        try {
            User currentUser = userService.getCurrentUser();
            if (!currentUser.getRole().getRoleName().equals("STUDENT") && 
                !currentUser.getRole().getRoleName().equals("ADMIN")) {
                return ResponseEntity.badRequest().body("Access denied. Student role required.");
            }

            Optional<com.skillhub.entity.Lesson> nextLesson = videoProgressService.getNextAccessibleLesson(currentUser.getId(), courseId);
            
            if (nextLesson.isPresent()) {
                return ResponseEntity.ok(nextLesson.get());
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("message", "No more lessons available or all lessons completed");
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
