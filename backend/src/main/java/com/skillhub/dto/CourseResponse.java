package com.skillhub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {
    private Long id;
    private String title;
    private String description;
    private String thumbnail;
    private Long lessonCount = 0L; // Count of lessons in the course
    private InstructorInfo instructor;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InstructorInfo {
        private Long id;
        private String name;
        private String email;
    }
}