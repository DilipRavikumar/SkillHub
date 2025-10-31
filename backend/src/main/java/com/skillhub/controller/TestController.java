package com.skillhub.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/simple")
    public ResponseEntity<String> simpleTest() {
        return ResponseEntity.ok("Simple test endpoint working!");
    }

    @GetMapping("/courses")
    public ResponseEntity<String> coursesTest() {
        return ResponseEntity.ok("Courses test endpoint working!");
    }
}
