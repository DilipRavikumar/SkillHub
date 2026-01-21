package com.skillhub.service;

import com.skillhub.entity.VideoProgress;
import com.skillhub.entity.Lesson;
import com.skillhub.entity.User;
import com.skillhub.repository.VideoProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class VideoProgressService {
    
    @Autowired
    private VideoProgressRepository videoProgressRepository;
    
    @Autowired
    private LessonService lessonService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private CertificateAutoIssueService certificateAutoIssueService;
    
    public VideoProgress updateProgress(Long studentId, Long lessonId, Integer watchedDuration) {
        Optional<VideoProgress> existingProgress = videoProgressRepository.findByStudentIdAndLessonId(studentId, lessonId);
        
        VideoProgress progress;
        if (existingProgress.isPresent()) {
            progress = existingProgress.get();
            
            if (watchedDuration > progress.getWatchedDuration()) {
                progress.setWatchedDuration(watchedDuration);
            }
            
            if (progress.getTotalDuration() == null || progress.getTotalDuration() == 0) {
                Optional<Lesson> lesson = lessonService.getLessonById(lessonId);
                Integer totalDuration = lesson.map(Lesson::getVideoDuration).orElse(watchedDuration);
                progress.setTotalDuration(totalDuration);
            }
            
            if (progress.getTotalDuration() == null || progress.getTotalDuration() == 0) {
                progress.setTotalDuration(watchedDuration);
            }
        } else {
            Optional<Lesson> lessonOpt = lessonService.getLessonById(lessonId);
            Integer totalDuration = lessonOpt.map(Lesson::getVideoDuration).orElse(watchedDuration);
            
            User student = userService.getUserById(studentId);
            Lesson lesson = lessonOpt.orElseThrow(() -> new RuntimeException("Lesson not found"));
            
            progress = new VideoProgress(student, lesson, watchedDuration, totalDuration);
        }
        
        progress.calculateCompletionPercentage();
        
        java.math.BigDecimal completionPercentage = progress.getCompletionPercentage();
        int totalDuration = progress.getTotalDuration() != null ? progress.getTotalDuration() : 0;
        
        if (totalDuration >= 20) {
            if (completionPercentage.compareTo(java.math.BigDecimal.valueOf(50)) >= 0) {
                progress.setIsCompleted(true);  
            }
        } else {
            if (completionPercentage.compareTo(java.math.BigDecimal.valueOf(90)) >= 0) {
                progress.setIsCompleted(true);
            }
        }
        
        VideoProgress savedProgress = videoProgressRepository.save(progress);
        
        if (savedProgress.getIsCompleted()) {
            new Thread(() -> certificateAutoIssueService.checkAndIssueCertificates(studentId)).start();
        }
        
        return savedProgress;
    }
    
    public Optional<VideoProgress> getProgress(Long studentId, Long lessonId) {
        return videoProgressRepository.findByStudentIdAndLessonId(studentId, lessonId);
    }
    
    public List<VideoProgress> getStudentProgress(Long studentId) {
        return videoProgressRepository.findByStudentId(studentId);
    }
    
    public List<VideoProgress> getCourseProgress(Long studentId, Long courseId) {
        return videoProgressRepository.findByStudentIdAndCourseId(studentId, courseId);
    }
    
    public List<VideoProgress> getCompletedLessons(Long studentId) {
        return videoProgressRepository.findCompletedLessonsByStudent(studentId);
    }
    
    public Double calculateCourseProgress(Long studentId, Long courseId) {
        Double progress = videoProgressRepository.calculateCourseProgress(studentId, courseId);
        // Cap progress at 100%
        if (progress != null) {
            return Math.min(Math.max(progress, 0.0), 100.0);
        }
        return 0.0;
    }
    
    public VideoProgress markLessonCompleted(Long studentId, Long lessonId) {
        Optional<VideoProgress> existingProgress = videoProgressRepository.findByStudentIdAndLessonId(studentId, lessonId);
        
        VideoProgress videoProgress;
        if (existingProgress.isPresent()) {
            videoProgress = existingProgress.get();
            // Update if not already marked as completed
            if (!videoProgress.getIsCompleted()) {
                videoProgress.setIsCompleted(true);
                videoProgress.setCompletionPercentage(java.math.BigDecimal.valueOf(100));
            }
        } else {
            // Create new progress entry if doesn't exist
            Optional<Lesson> lessonOpt = lessonService.getLessonById(lessonId);
            Integer totalDuration = lessonOpt.map(Lesson::getVideoDuration).orElse(600); // Default to 10 minutes
            
            User student = userService.getUserById(studentId);
            Lesson lesson = lessonOpt.orElseThrow(() -> new RuntimeException("Lesson not found"));
            
            videoProgress = new VideoProgress(student, lesson, totalDuration, totalDuration);
            videoProgress.setIsCompleted(true);
            videoProgress.setCompletionPercentage(java.math.BigDecimal.valueOf(100));
        }
        
        return videoProgressRepository.save(videoProgress);
    }
    
    /**
     * Check if a lesson is accessible to a student based on sequential completion
     */
    public boolean isLessonAccessible(Long studentId, Long lessonId) {
        // Get the lesson to find its order
        Optional<Lesson> lessonOpt = lessonService.getLessonById(lessonId);
        if (!lessonOpt.isPresent()) {
            return false;
        }
        
        Lesson lesson = lessonOpt.get();
        Integer lessonOrder = lesson.getLessonOrder();
        
        // First lesson (order 1) is always accessible
        if (lessonOrder == 1) {
            return true;
        }
        
        // Check if previous lesson is completed
        Long courseId = lesson.getCourse().getId();
        List<Lesson> courseLessons = lessonService.getLessonsByCourseId(courseId);
        
        // Find the previous lesson
        Optional<Lesson> previousLessonOpt = courseLessons.stream()
            .filter(l -> l.getLessonOrder() == lessonOrder - 1)
            .findFirst();
            
        if (!previousLessonOpt.isPresent()) {
            return false;
        }
        
        // Check if previous lesson is completed
        Optional<VideoProgress> previousProgress = videoProgressRepository.findByStudentIdAndLessonId(
            studentId, previousLessonOpt.get().getId());
            
        return previousProgress.isPresent() && previousProgress.get().getIsCompleted();
    }
    
    /**
     * Get the next accessible lesson for a student in a course
     */
    public Optional<Lesson> getNextAccessibleLesson(Long studentId, Long courseId) {
        List<Lesson> courseLessons = lessonService.getLessonsByCourseId(courseId);
        
        // Sort lessons by order
        courseLessons.sort((l1, l2) -> Integer.compare(l1.getLessonOrder(), l2.getLessonOrder()));
        
        for (Lesson lesson : courseLessons) {
            if (isLessonAccessible(studentId, lesson.getId())) {
                // Check if this lesson is not completed yet
                Optional<VideoProgress> progress = videoProgressRepository.findByStudentIdAndLessonId(
                    studentId, lesson.getId());
                if (!progress.isPresent() || !progress.get().getIsCompleted()) {
                    return Optional.of(lesson);
                }
            }
        }
        
        return Optional.empty();
    }
}
