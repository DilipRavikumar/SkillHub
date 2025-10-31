package com.skillhub.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/video")
public class VideoController {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @GetMapping("/{filename}")
    public ResponseEntity<Resource> getVideo(@PathVariable String filename) {
        try {
            Path videoPath = Paths.get(uploadDir, "videos", filename);
            File videoFile = videoPath.toFile();

            if (!videoFile.exists()) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(videoFile);

            String contentType = Files.probeContentType(videoPath);
            if (contentType == null) {
                contentType = "video/mp4";
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentLength(videoFile.length());
            headers.set("Accept-Ranges", "bytes");
            headers.set("Cache-Control", "public, max-age=3600");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stream/{filename}")
    public ResponseEntity<Resource> streamVideo(@PathVariable String filename, 
                                               @RequestHeader(value = "Range", required = false) String range) {
        try {
            Path videoPath = Paths.get(uploadDir, "videos", filename);
            File videoFile = videoPath.toFile();

            if (!videoFile.exists()) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(videoFile);
            String contentType = Files.probeContentType(videoPath);
            if (contentType == null) {
                contentType = "video/mp4";
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.set("Accept-Ranges", "bytes");

            if (range != null) {
                long fileLength = videoFile.length();
                long start = 0;
                long end = fileLength - 1;

                if (range.startsWith("bytes=")) {
                    String[] ranges = range.substring(6).split("-");
                    if (ranges.length > 0) {
                        start = Long.parseLong(ranges[0]);
                    }
                    if (ranges.length > 1 && !ranges[1].isEmpty()) {
                        end = Long.parseLong(ranges[1]);
                    }
                }

                long contentLength = end - start + 1;
                headers.setContentLength(contentLength);
                headers.set("Content-Range", String.format("bytes %d-%d/%d", start, end, fileLength));
                
                return ResponseEntity.status(206)
                        .headers(headers)
                        .body(resource);
            } else {
                headers.setContentLength(videoFile.length());
                return ResponseEntity.ok()
                        .headers(headers)
                        .body(resource);
            }

        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadVideo(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }

            if (file.getSize() > 500 * 1024 * 1024) {
                return ResponseEntity.badRequest().body("File size exceeds 500MB");
            }

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : ".mp4";
            String filename = UUID.randomUUID().toString() + extension;

            Path uploadPath = Paths.get(uploadDir, "videos");
            Files.createDirectories(uploadPath);

            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            Map<String, Object> response = new HashMap<>();
            response.put("filename", filename);
            response.put("originalFilename", originalFilename);
            response.put("size", file.getSize());
            response.put("contentType", file.getContentType());
            
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Error uploading file: " + e.getMessage());
        }
    }
}