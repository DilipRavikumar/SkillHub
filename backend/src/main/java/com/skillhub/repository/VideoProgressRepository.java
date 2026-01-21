package com.skillhub.repository;

import com.skillhub.entity.VideoProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VideoProgressRepository extends JpaRepository<VideoProgress, Long> {
    
    @Query("SELECT vp FROM VideoProgress vp WHERE vp.student.id = :studentId AND vp.lesson.id = :lessonId")
    Optional<VideoProgress> findByStudentIdAndLessonId(@Param("studentId") Long studentId, @Param("lessonId") Long lessonId);
    
    @Query("SELECT vp FROM VideoProgress vp WHERE vp.student.id = :studentId")
    List<VideoProgress> findByStudentId(@Param("studentId") Long studentId);
    
    @Query("SELECT vp FROM VideoProgress vp WHERE vp.lesson.id = :lessonId")
    List<VideoProgress> findByLessonId(@Param("lessonId") Long lessonId);
    
    @Query("SELECT vp FROM VideoProgress vp WHERE vp.student.id = :studentId AND vp.isCompleted = true")
    List<VideoProgress> findCompletedLessonsByStudent(@Param("studentId") Long studentId);
    
    @Query("SELECT vp FROM VideoProgress vp JOIN vp.lesson l WHERE vp.student.id = :studentId AND l.course.id = :courseId")
    List<VideoProgress> findByStudentIdAndCourseId(@Param("studentId") Long studentId, @Param("courseId") Long courseId);
    
    @Query("SELECT AVG(vp.completionPercentage) FROM VideoProgress vp JOIN vp.lesson l WHERE vp.student.id = :studentId AND l.course.id = :courseId")
    Double calculateCourseProgress(@Param("studentId") Long studentId, @Param("courseId") Long courseId);
}
