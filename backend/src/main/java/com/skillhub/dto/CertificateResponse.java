package com.skillhub.dto;

import com.skillhub.entity.Certificate;
import com.skillhub.entity.Course;
import com.skillhub.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CertificateResponse {
    
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private Long courseId;
    private String courseTitle;
    private LocalDateTime issuedDate;
    private String certificateNumber;
    private String certificateUrl;
    private Double completionPercentage;
    
    public static CertificateResponse fromEntity(Certificate certificate) {
        CertificateResponse response = new CertificateResponse();
        response.setId(certificate.getId());
        
        if (certificate.getStudent() != null) {
            response.setStudentId(certificate.getStudent().getId());
            response.setStudentName(certificate.getStudent().getName());
            response.setStudentEmail(certificate.getStudent().getEmail());
        }
        
        if (certificate.getCourse() != null) {
            response.setCourseId(certificate.getCourse().getId());
            response.setCourseTitle(certificate.getCourse().getTitle());
        }
        
        response.setIssuedDate(certificate.getIssuedDate());
        response.setCertificateNumber(certificate.getCertificateNumber());
        response.setCertificateUrl(certificate.getCertificateUrl());
        response.setCompletionPercentage(certificate.getCompletionPercentage());
        
        return response;
    }
}


