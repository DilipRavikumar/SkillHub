package com.skillhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "video_progress")
public class VideoProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "watched_duration")
    private Integer watchedDuration = 0;

    @Column(name = "total_duration")
    private Integer totalDuration = 0;

    @Column(name = "completion_percentage", precision = 5, scale = 2)
    private BigDecimal completionPercentage = BigDecimal.ZERO;

    @Column(name = "last_watched_at")
    private LocalDateTime lastWatchedAt;

    @Column(name = "is_completed")
    private Boolean isCompleted = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnore
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    @JsonIgnore
    private Lesson lesson;

    public VideoProgress() {
        this.lastWatchedAt = LocalDateTime.now();
    }

    public VideoProgress(User student, Lesson lesson, Integer watchedDuration, Integer totalDuration) {
        this();
        this.student = student;
        this.lesson = lesson;
        this.watchedDuration = watchedDuration;
        this.totalDuration = totalDuration;
        this.calculateCompletionPercentage();
    }

    public void calculateCompletionPercentage() {
        if (totalDuration != null && totalDuration > 0) {
            BigDecimal percentage = BigDecimal.valueOf(watchedDuration)
                    .divide(BigDecimal.valueOf(totalDuration), 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            
            this.completionPercentage = percentage.compareTo(BigDecimal.valueOf(100)) > 0 
                    ? BigDecimal.valueOf(100) 
                    : percentage;
            
            this.isCompleted = this.completionPercentage.compareTo(BigDecimal.valueOf(100)) >= 0;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStudentId() {
        return student != null ? student.getId() : null;
    }

    public void setStudentId(Long studentId) {
        if (student == null) {
            student = new User();
        }
        student.setId(studentId);
    }

    public Long getLessonId() {
        return lesson != null ? lesson.getId() : null;
    }

    public void setLessonId(Long lessonId) {
        if (lesson == null) {
            lesson = new Lesson();
        }
        lesson.setId(lessonId);
    }

    public Integer getWatchedDuration() {
        return watchedDuration;
    }

    public void setWatchedDuration(Integer watchedDuration) {
        this.watchedDuration = watchedDuration;
        this.calculateCompletionPercentage();
    }

    public Integer getTotalDuration() {
        return totalDuration;
    }

    public void setTotalDuration(Integer totalDuration) {
        this.totalDuration = totalDuration;
        this.calculateCompletionPercentage();
    }

    public BigDecimal getCompletionPercentage() {
        return completionPercentage;
    }

    public void setCompletionPercentage(BigDecimal completionPercentage) {
        this.completionPercentage = completionPercentage;
    }

    public LocalDateTime getLastWatchedAt() {
        return lastWatchedAt;
    }

    public void setLastWatchedAt(LocalDateTime lastWatchedAt) {
        this.lastWatchedAt = lastWatchedAt;
    }

    public Boolean getIsCompleted() {
        return isCompleted;
    }

    public void setIsCompleted(Boolean isCompleted) {
        this.isCompleted = isCompleted;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public Lesson getLesson() {
        return lesson;
    }

    public void setLesson(Lesson lesson) {
        this.lesson = lesson;
    }
}
