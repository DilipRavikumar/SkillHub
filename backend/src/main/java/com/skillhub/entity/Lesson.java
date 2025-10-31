package com.skillhub.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "lessons")
public class Lesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    @JsonBackReference
    private Course course;

    @Transient
    private Long courseId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "video_url", length = 500)
    private String videoUrl;

    @Column(name = "video_filename")
    private String videoFilename;

    @Column(name = "video_duration")
    private Integer videoDuration = 0;

    @Column(name = "lesson_order")
    private Integer lessonOrder = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "lesson", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<com.skillhub.entity.VideoProgress> videoProgressRecords;

    public Lesson() {
        this.createdAt = LocalDateTime.now();
    }

    public Lesson(String title, String description, String videoUrl, Integer videoDuration, Integer lessonOrder) {
        this();
        this.title = title;
        this.description = description;
        this.videoUrl = videoUrl;
        this.videoDuration = videoDuration;
        this.lessonOrder = lessonOrder;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public String getVideoFilename() {
        return videoFilename;
    }

    public void setVideoFilename(String videoFilename) {
        this.videoFilename = videoFilename;
    }

    public Integer getVideoDuration() {
        return videoDuration;
    }

    public void setVideoDuration(Integer videoDuration) {
        this.videoDuration = videoDuration;
    }

    public Integer getLessonOrder() {
        return lessonOrder;
    }

    public void setLessonOrder(Integer lessonOrder) {
        this.lessonOrder = lessonOrder;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
        if (course != null) {
            this.courseId = course.getId();
        }
    }

    public Long getCourseId() {
        if (courseId != null) {
            return courseId;
        }
        if (course != null) {
            return course.getId();
        }
        return null;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }
}
