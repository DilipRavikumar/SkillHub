package com.skillhub.service;

import com.skillhub.entity.Lesson;
import com.skillhub.repository.LessonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LessonService {
    
    @Autowired
    private LessonRepository lessonRepository;
    
    public List<Lesson> getLessonsByCourseId(Long courseId) {
        return lessonRepository.findLessonsByCourseIdOrdered(courseId);
    }
    
    public Optional<Lesson> getLessonById(Long lessonId) {
        return lessonRepository.findById(lessonId);
    }
    
    public Lesson saveLesson(Lesson lesson) {
        return lessonRepository.save(lesson);
    }
    
    public Lesson updateLesson(Lesson lesson) {
        return lessonRepository.save(lesson);
    }
    
    public void deleteLesson(Long lessonId) {
        lessonRepository.deleteById(lessonId);
    }
    
    public Long getLessonCountByCourseId(Long courseId) {
        return lessonRepository.countByCourseId(courseId);
    }
    
    public List<Lesson> getAllLessons() {
        return lessonRepository.findAll();
    }
}
