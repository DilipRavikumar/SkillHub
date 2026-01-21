package com.skillhub.service;

import com.skillhub.entity.Certificate;
import com.skillhub.entity.Course;
import com.skillhub.entity.User;
import com.skillhub.repository.CertificateRepository;
import com.skillhub.repository.CourseRepository;
import com.skillhub.repository.EnrollmentRepository;
import com.skillhub.repository.VideoProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Service to automatically issue certificates for eligible courses
 */
@Service
public class CertificateAutoIssueService {

    @Autowired
    private CertificateRepository certificateRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private VideoProgressRepository videoProgressRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EmailService emailService;

    @Value("${app.base.url:}")
    private String configuredBaseUrl;

    private static final double CERTIFICATION_THRESHOLD = 80.0;

    /**
     * Get base URL from request context or configuration (like window.location in browser)
     */
    private String getBaseUrl() {
        // Priority 1: Use configured base URL if provided
        if (configuredBaseUrl != null && !configuredBaseUrl.isEmpty()) {
            return configuredBaseUrl;
        }
        
        try {
            // Priority 2: Try to get from request context (like window.location.origin)
            String requestBaseUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .scheme("http")
                    .build()
                    .toUriString();
            
            if (requestBaseUrl != null && !requestBaseUrl.isEmpty()) {
                // Extract host from request (remove backend port 8080)
                String host = requestBaseUrl.replace(":8080", "").replace("http://", "").replace("https://", "");
                
                // For localhost, append frontend dev port
                if (host.equals("localhost") || host.startsWith("127.0.0.1")) {
                    return "http://" + host + ":4200";
                }
                
                // For production (IP or domain), frontend is usually on port 80 (default HTTP)
                return "http://" + host;
            }
        } catch (Exception e) {
            // No request context available (e.g., scheduled job)
            System.out.println("No request context available for base URL: " + e.getMessage());
        }
        
        // Priority 3: Final fallback for local development
        return "http://localhost:4200";
    }

    /**
     * Automatically issue certificates for all eligible courses for a student
     * Call this method when a student completes a lesson
     */
    public void checkAndIssueCertificates(Long studentId) {
        // Get all enrollments for the student
        List<Long> enrolledCourseIds = enrollmentRepository.findByStudentId(studentId)
                .stream()
                .map(e -> e.getCourse().getId())
                .toList();

        // Check each course for certificate eligibility
        for (Long courseId : enrolledCourseIds) {
            // Skip if certificate already exists
            if (certificateRepository.existsByStudentIdAndCourseId(studentId, courseId)) {
                continue;
            }

            // Check completion percentage
            Double completionPercentage = videoProgressRepository
                    .calculateCourseProgress(studentId, courseId);

            // Issue certificate if eligible (80%+)
            if (completionPercentage != null && completionPercentage >= CERTIFICATION_THRESHOLD) {
                issueCertificate(studentId, courseId, completionPercentage);
            }
        }
    }

    /**
     * Issue a certificate for a completed course
     */
    private void issueCertificate(Long studentId, Long courseId, Double completionPercentage) {
        try {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("Course not found"));
            
            // Get student from enrollment
            User student = enrollmentRepository
                    .findByStudentIdAndCourseId(studentId, courseId)
                    .orElseThrow(() -> new RuntimeException("Enrollment not found"))
                    .getStudent();
            
            Certificate certificate = new Certificate();
            certificate.setStudent(student);
            certificate.setCourse(course);
            certificate.setIssuedDate(LocalDateTime.now());
            certificate.setCompletionPercentage(completionPercentage);

            // Generate unique certificate number
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String uniqueId = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            certificate.setCertificateNumber("SH-" + timestamp + "-" + uniqueId);
            // Generate certificate URL using request context (like window.location)
            String baseUrl = getBaseUrl();
            String certificateUrl = baseUrl + "/certificate/" + certificate.getCertificateNumber();
            certificate.setCertificateUrl(certificateUrl);

            certificateRepository.save(certificate);
            System.out.println("Certificate issued for student: " + studentId + ", course: " + courseId);
            
            // Send certificate email notification
            try {
                emailService.sendCertificateEmail(
                    student.getEmail(),
                    student.getName(),
                    course.getTitle(),
                    certificate.getCertificateNumber(),
                    certificate.getCertificateUrl()
                );
            } catch (Exception e) {
                System.err.println("Failed to send certificate email: " + e.getMessage());
            }
        } catch (Exception e) {
            System.err.println("Error issuing certificate: " + e.getMessage());
        }
    }

    /**
     * Batch process to issue certificates for all eligible students
     * Run this periodically to ensure no certificates are missed
     */
    @Scheduled(cron = "0 0 * * * *") // Run every hour
    public void autoIssueCertificatesForAllStudents() {
        // This would scan all students and issue certificates
        // Implementation depends on your requirements
    }
}

        