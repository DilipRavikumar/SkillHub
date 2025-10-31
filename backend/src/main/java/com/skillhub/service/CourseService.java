package com.skillhub.service;

import com.skillhub.dto.CourseRequest;
import com.skillhub.dto.CourseResponse;
import com.skillhub.entity.Course;
import com.skillhub.entity.User;
import com.skillhub.repository.CourseRepository;
import com.skillhub.repository.CertificateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CourseService {

    private static final Logger logger = LoggerFactory.getLogger(CourseService.class);

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private LessonService lessonService;
    
    @Autowired
    private CertificateRepository certificateRepository;

    public List<CourseResponse> getAllCourses() {
        logger.info("Starting getAllCourses method");
        try {
            List<Course> courses = courseRepository.findAll();
            logger.info("Found {} courses", courses.size());
            return courses.stream()
                    .map(course -> {
                        try {
                            User instructor = course.getInstructor();
                            logger.debug("Processing course: {} with instructor: {}", course.getTitle(), instructor != null ? instructor.getName() : "null");
                            
                            // Get lesson count for this course
                            Long lessonCount = 0L;
                            try {
                                List<com.skillhub.entity.Lesson> lessons = lessonService.getLessonsByCourseId(course.getId());
                                lessonCount = (long) (lessons != null ? lessons.size() : 0);
                            } catch (Exception e) {
                                logger.warn("Could not load lessons for course {}: {}", course.getId(), e.getMessage());
                                lessonCount = 0L;
                            }
                            
                            return new CourseResponse(
                                    course.getId(),
                                    course.getTitle(),
                                    course.getDescription(),
                                    course.getThumbnail(),
                                    lessonCount,
                                    instructor != null ? new CourseResponse.InstructorInfo(
                                            instructor.getId(),
                                            instructor.getName(),
                                            instructor.getEmail()
                                    ) : new CourseResponse.InstructorInfo(
                                            null,
                                            "Unknown Instructor",
                                            null
                                    )
                            );
                        } catch (Exception e) {
                            logger.error("Error processing course {}: {}", course.getTitle(), e.getMessage());
                            // If there's an issue with instructor, return basic course info
                            return new CourseResponse(
                                    course.getId(),
                                    course.getTitle(),
                                    course.getDescription(),
                                    course.getThumbnail(),
                                    0L,
                                    new CourseResponse.InstructorInfo(
                                            null,
                                            "Unknown Instructor",
                                            null
                                    )
                            );
                        }
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error in getAllCourses: {}", e.getMessage(), e);
            // Return empty list if there's any error
            return List.of();
        }
    }

    public List<Course> getAllCoursesAsEntities() {
        return courseRepository.findAll();
    }

    public Course createCourse(CourseRequest courseRequest) {
        User instructor = userService.getCurrentUser();
        
        Course course = new Course();
        course.setTitle(courseRequest.getTitle());
        course.setDescription(courseRequest.getDescription());
        course.setThumbnail(courseRequest.getThumbnail());
        course.setInstructor(instructor);
        
        return courseRepository.save(course);
    }

    public Optional<Course> getCourseById(Long id) {
        Optional<Course> courseOpt = courseRepository.findById(id);
        if (courseOpt.isPresent()) {
            Course course = courseOpt.get();
            // Load lessons for the course
            course.setLessons(lessonService.getLessonsByCourseId(id));
            return Optional.of(course);
        }
        return courseOpt;
    }
    
    public Optional<Course> getCourseByIdPublic(Long id) {
        // Public version that doesn't require authentication
        try {
            Optional<Course> courseOpt = courseRepository.findById(id);
            if (courseOpt.isPresent()) {
                Course course = courseOpt.get();
                // Load lessons for the course
                if (lessonService != null) {
                    course.setLessons(lessonService.getLessonsByCourseId(id));
                }
                return Optional.of(course);
            }
            return courseOpt;
        } catch (Exception e) {
            logger.error("Error in getCourseByIdPublic for id {}: {}", id, e.getMessage(), e);
            return courseRepository.findById(id); // Return course without lessons if there's an error
        }
    }

    public List<Course> getCoursesByInstructor(User instructor) {
        return courseRepository.findByInstructor(instructor);
    }

    public Course updateCourse(Long id, CourseRequest courseRequest) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        User currentUser = userService.getCurrentUser();
        if (!course.getInstructor().getId().equals(currentUser.getId()) && 
            !currentUser.getRole().getRoleName().equals("ADMIN")) {
            throw new RuntimeException("You can only update your own courses");
        }
        
        course.setTitle(courseRequest.getTitle());
        course.setDescription(courseRequest.getDescription());
        course.setThumbnail(courseRequest.getThumbnail());
        
        return courseRepository.save(course);
    }

    @Transactional
    public void deleteCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        User currentUser = userService.getCurrentUser();
        if (!course.getInstructor().getId().equals(currentUser.getId()) && 
            !currentUser.getRole().getRoleName().equals("ADMIN")) {
            throw new RuntimeException("You can only delete your own courses");
        }
        
        // Delete related records first to avoid foreign key constraint violations
        try {
            // Delete certificates manually (not cascaded as requested)
            certificateRepository.deleteByCourseId(id);
            
            // Delete the course - this will cascade delete:
            // 1. Lessons (via CascadeType.ALL on @OneToMany)
            // 2. Enrollments (via CascadeType.ALL + orphanRemoval on @OneToMany)
            // 3. VideoProgress (via Lesson -> VideoProgress cascade)
            courseRepository.delete(course);
            
            logger.info("Course {} deleted successfully with cascade delete", id);
        } catch (Exception e) {
            logger.error("Error deleting course {}: {}", id, e.getMessage());
            throw new RuntimeException("Error deleting course: " + e.getMessage());
        }
    }

    // Admin methods
    public Course updateCourse(Long id, Course courseDetails) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        if (courseDetails.getTitle() != null) {
            course.setTitle(courseDetails.getTitle());
        }
        if (courseDetails.getDescription() != null) {
            course.setDescription(courseDetails.getDescription());
        }
        if (courseDetails.getInstructor() != null) {
            course.setInstructor(courseDetails.getInstructor());
        }

        return courseRepository.save(course);
    }
}
