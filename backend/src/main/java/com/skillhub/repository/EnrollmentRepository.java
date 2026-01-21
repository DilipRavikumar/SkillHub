package com.skillhub.repository;

import com.skillhub.entity.Course;
import com.skillhub.entity.Enrollment;
import com.skillhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudent(User student);
    List<Enrollment> findByCourse(Course course);
    long countByCourseIn(List<Course> courses);
    long countByCourseId(Long courseId);
    boolean existsByCourseAndStudent(Course course, User student);
    Optional<Enrollment> findByStudentIdAndCourseId(Long studentId, Long courseId);
    List<Enrollment> findByStudentId(Long studentId);
    boolean existsByCourseIdAndStudentId(Long courseId, Long studentId);
    void deleteByCourseId(Long courseId);
}
