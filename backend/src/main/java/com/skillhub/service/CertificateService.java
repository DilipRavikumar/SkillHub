package com.skillhub.service;

import com.skillhub.dto.CertificateResponse;
import com.skillhub.entity.Certificate;
import com.skillhub.entity.Course;
import com.skillhub.entity.User;
import com.skillhub.repository.CertificateRepository;
import com.skillhub.repository.CourseRepository;
import com.skillhub.repository.VideoProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CertificateService {

    @Autowired
    private CertificateRepository certificateRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private VideoProgressRepository videoProgressRepository;

    @Autowired
    private EmailService emailService;

    @Value("${app.base.url:}")
    private String configuredBaseUrl;

    private static final double CERTIFICATION_THRESHOLD = 80.0; // 80% completion required

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
                // Or could be served via nginx on same domain
                return "http://" + host;
            }
        } catch (Exception e) {
            System.out.println("Could not get base URL from request context: " + e.getMessage());
        }
        
        // Priority 3: Final fallback for local development
        return "http://localhost:4200";
    }

    /**
     * Check if student is eligible for certificate and issue it if not already issued
     */
    @Transactional
    public CertificateResponse issueCertificate(Long courseId) {
        User student = userService.getCurrentUser();
        
        // Check if certificate already exists (and get it if it does)
        Optional<Certificate> existingCertificate = certificateRepository.findByStudentIdAndCourseId(student.getId(), courseId);
        if (existingCertificate.isPresent()) {
            // Certificate already exists, return it instead of throwing error
            return CertificateResponse.fromEntity(existingCertificate.get());
        }
        
        // Get course
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        // Check completion percentage
        Double completionPercentage = videoProgressRepository.calculateCourseProgress(student.getId(), courseId);
        
        if (completionPercentage == null || completionPercentage < CERTIFICATION_THRESHOLD) {
            throw new RuntimeException("Course not completed. Completion: " + 
                    (completionPercentage != null ? completionPercentage + "%" : "0%") + 
                    ". Required: " + CERTIFICATION_THRESHOLD + "%");
        }
        
        // Create certificate
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
        
        certificate = certificateRepository.save(certificate);
        
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
            // Log error but don't fail certificate issuance
            System.err.println("Failed to send certificate email: " + e.getMessage());
        }
        
        return CertificateResponse.fromEntity(certificate);
    }

    /**
     * Get all certificates for the current student
     */
    public List<CertificateResponse> getMyCertificates() {
        User student = userService.getCurrentUser();
        List<Certificate> certificates = certificateRepository.findByStudentId(student.getId());
        return certificates.stream()
                .map(CertificateResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get certificate by certificate number
     */
    public CertificateResponse getCertificateByNumber(String certificateNumber) {
        Certificate certificate = certificateRepository.findByCertificateNumber(certificateNumber)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));
        return CertificateResponse.fromEntity(certificate);
    }

    /**
     * Get certificate by ID
     */
    public CertificateResponse getCertificateById(Long id) {
        Certificate certificate = certificateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));
        return CertificateResponse.fromEntity(certificate);
    }

    /**
     * Get all certificates for a specific course
     */
    public List<CertificateResponse> getCertificatesByCourse(Long courseId) {
        List<Certificate> certificates = certificateRepository.findByCourseId(courseId);
        return certificates.stream()
                .map(CertificateResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Check if student has completed course and is eligible for certificate
     */
    public boolean checkCertificateEligibility(Long courseId) {
        User student = userService.getCurrentUser();
        
        // Check if certificate already issued
        if (certificateRepository.existsByStudentIdAndCourseId(student.getId(), courseId)) {
            return true; // Already has certificate
        }
        
        // Check completion percentage
        Double completionPercentage = videoProgressRepository.calculateCourseProgress(student.getId(), courseId);
        
        return completionPercentage != null && completionPercentage >= CERTIFICATION_THRESHOLD;
    }

    /**
     * Get course completion percentage for current student
     */
    public Double getCourseCompletionPercentage(Long courseId) {
        User student = userService.getCurrentUser();
        return videoProgressRepository.calculateCourseProgress(student.getId(), courseId);
    }
}

