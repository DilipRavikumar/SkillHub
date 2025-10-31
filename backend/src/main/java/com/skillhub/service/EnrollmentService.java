package com.skillhub.service;

import com.skillhub.entity.Course;
import com.skillhub.entity.Enrollment;
import com.skillhub.entity.User;
import com.skillhub.repository.EnrollmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EnrollmentService {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private CourseService courseService;

    @Autowired
    private UserService userService;

    public Enrollment enrollStudent(Long courseId) {
        Course course = courseService.getCourseById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        User student = userService.getCurrentUser();
        
        if (enrollmentRepository.existsByCourseAndStudent(course, student)) {
            throw new RuntimeException("You are already enrolled in this course");
        }
        
        Enrollment enrollment = new Enrollment();
        enrollment.setCourse(course);
        enrollment.setStudent(student);
        enrollment.setEnrolledAt(LocalDateTime.now());
        enrollment.setProgress(0);
        
        return enrollmentRepository.save(enrollment);
    }

    public List<Enrollment> getEnrollmentsByStudent(User student) {
        return enrollmentRepository.findByStudent(student);
    }

    public List<Enrollment> getEnrollmentsByStudent() {
        User student = userService.getCurrentUser();
        return enrollmentRepository.findByStudent(student);
    }

    public long getTotalEnrollments() {
        return enrollmentRepository.count();
    }

    public long getEnrollmentsByCourses(List<Course> courses) {
        return enrollmentRepository.countByCourseIn(courses);
    }

    public long getEnrollmentCountByCourse(Long courseId) {
        return enrollmentRepository.countByCourseId(courseId);
    }

    public List<Enrollment> getEnrollmentsByCourseId(Long courseId) {
        Course course = courseService.getCourseById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + courseId));
        return enrollmentRepository.findByCourse(course);
    }

    public boolean isUserEnrolledInCourse(Long courseId, Long userId) {
        return enrollmentRepository.existsByCourseIdAndStudentId(courseId, userId);
    }

    public boolean isCurrentUserEnrolledInCourse(Long courseId) {
        try {
            User currentUser = userService.getCurrentUser();
            return enrollmentRepository.existsByCourseIdAndStudentId(courseId, currentUser.getId());
        } catch (Exception e) {
            return false;
        }
    }
}
