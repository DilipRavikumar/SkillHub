package com.skillhub.controller;

import com.skillhub.dto.CertificateResponse;
import com.skillhub.service.CertificateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/certificates")
public class CertificateController {

    @Autowired
    private CertificateService certificateService;

    /**
     * Issue a new certificate for completed course
     */
    @PostMapping("/issue/{courseId}")
    public ResponseEntity<?> issueCertificate(@PathVariable Long courseId) {
        try {
            CertificateResponse certificate = certificateService.issueCertificate(courseId);
            return ResponseEntity.ok(certificate);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    /**
     * Get all certificates for the current user
     */
    @GetMapping("/my-certificates")
    public ResponseEntity<?> getMyCertificates() {
        try {
            List<CertificateResponse> certificates = certificateService.getMyCertificates();
            return ResponseEntity.ok(certificates);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    /**
     * Get certificate by certificate number (for verification)
     */
    @GetMapping("/verify/{certificateNumber}")
    public ResponseEntity<?> verifyCertificate(@PathVariable String certificateNumber) {
        try {
            CertificateResponse certificate = certificateService.getCertificateByNumber(certificateNumber);
            return ResponseEntity.ok(certificate);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    /**
     * Get certificate by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getCertificate(@PathVariable Long id) {
        try {
            CertificateResponse certificate = certificateService.getCertificateById(id);
            return ResponseEntity.ok(certificate);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    /**
     * Check if student is eligible for certificate
     */
    @GetMapping("/eligibility/{courseId}")
    public ResponseEntity<?> checkEligibility(@PathVariable Long courseId) {
        try {
            boolean eligible = certificateService.checkCertificateEligibility(courseId);
            Double completion = certificateService.getCourseCompletionPercentage(courseId);
            
            return ResponseEntity.ok(new EligibilityResponse(eligible, completion));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    /**
     * Get completion percentage for a course
     */
    @GetMapping("/completion/{courseId}")
    public ResponseEntity<?> getCompletion(@PathVariable Long courseId) {
        try {
            Double completion = certificateService.getCourseCompletionPercentage(courseId);
            return ResponseEntity.ok(new CompletionResponse(completion));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // Helper classes for responses
    private static class EligibilityResponse {
        private boolean eligible;
        private Double completion;

        public EligibilityResponse(boolean eligible, Double completion) {
            this.eligible = eligible;
            this.completion = completion;
        }

        public boolean isEligible() {
            return eligible;
        }

        public void setEligible(boolean eligible) {
            this.eligible = eligible;
        }

        public Double getCompletion() {
            return completion;
        }

        public void setCompletion(Double completion) {
            this.completion = completion;
        }
    }

    private static class CompletionResponse {
        private Double completion;

        public CompletionResponse(Double completion) {
            this.completion = completion;
        }

        public Double getCompletion() {
            return completion;
        }

        public void setCompletion(Double completion) {
            this.completion = completion;
        }
    }
}


