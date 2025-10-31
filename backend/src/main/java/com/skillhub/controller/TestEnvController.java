package com.skillhub.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestEnvController {

    @Value("${aws.access.key}")
    private String awsAccessKey;

    @Value("${aws.region}")
    private String awsRegion;

    @GetMapping("/api/test-env")
    public String testEnv() {
        return "AWS Region: " + awsRegion + ", Access Key length: " + (awsAccessKey != null ? awsAccessKey.length() : 0);
    }
}