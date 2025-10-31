package com.skillhub.service;

import com.amazonaws.HttpMethod;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URL;
import java.util.Date;
import java.util.UUID;

@Service
public class S3Service {

    @Autowired
    private AmazonS3 s3Client;

    @Value("${aws.s3.bucket.thumbnails}")
    private String thumbnailsBucket;

    @Value("${aws.s3.bucket.videos}")
    private String videosBucket;

    @Value("${aws.s3.presigned.url.expiration:3600}")
    private long presignedUrlExpiration;

    public String uploadThumbnail(MultipartFile file) throws IOException {
        String fileName = generateFileName(file.getOriginalFilename());
        String key = "thumbnails/" + fileName;
        
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(file.getSize());
        metadata.setContentType(file.getContentType());
        
        PutObjectRequest putObjectRequest = new PutObjectRequest(
                thumbnailsBucket, 
                key, 
                file.getInputStream(), 
                metadata
        );
        
        s3Client.putObject(putObjectRequest);
        
        return s3Client.getUrl(thumbnailsBucket, key).toString();
    }

    public String uploadVideo(MultipartFile file) throws IOException {
        String fileName = generateFileName(file.getOriginalFilename());
        String key = "videos/" + fileName;
        
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(file.getSize());
        metadata.setContentType(file.getContentType());
        
        PutObjectRequest putObjectRequest = new PutObjectRequest(
                videosBucket, 
                key, 
                file.getInputStream(), 
                metadata
        );
        
        s3Client.putObject(putObjectRequest);
        
        return s3Client.getUrl(videosBucket, key).toString();
    }

    public String generatePresignedUrl(String videoUrl) {
        try {
            java.net.URL url = new java.net.URL(videoUrl);
            String host = url.getHost();
            String path = url.getPath();
            
            // Parse S3 URL format: https://bucket-name.s3.region.amazonaws.com/path/to/file
            // Or: https://s3.region.amazonaws.com/bucket-name/path/to/file
            String bucketName;
            String key;
            
            if (host.contains(".s3.")) {
                // Format: bucket-name.s3.region.amazonaws.com
                bucketName = host.substring(0, host.indexOf(".s3."));
                key = path.startsWith("/") ? path.substring(1) : path;
            } else if (host.startsWith("s3.")) {
                // Format: s3.region.amazonaws.com/bucket-name/path
                String[] pathParts = path.split("/", 3);
                if (pathParts.length >= 2) {
                    bucketName = pathParts[1];
                    key = pathParts.length > 2 ? pathParts[2] : "";
                } else {
                    // Fallback: try to extract from videosBucket configuration
                    bucketName = videosBucket;
                    key = path.startsWith("/") ? path.substring(1) : path;
                }
            } else {
                // If URL doesn't match S3 format, try using configured bucket
                bucketName = videosBucket;
                key = path.startsWith("/") ? path.substring(1) : path;
            }
            
            // If key is empty, this might not be a valid S3 URL
            if (key == null || key.isEmpty()) {
                System.err.println("Warning: Could not extract S3 key from URL: " + videoUrl);
                return videoUrl;
            }
            
            Date expiration = new Date();
            expiration.setTime(expiration.getTime() + (presignedUrlExpiration * 1000));
            
            GeneratePresignedUrlRequest request = new GeneratePresignedUrlRequest(bucketName, key, HttpMethod.GET);
            request.setExpiration(expiration);
            
            URL presignedUrl = s3Client.generatePresignedUrl(request);
            System.out.println("Generated presigned URL for bucket: " + bucketName + ", key: " + key);
            return presignedUrl.toString();
        } catch (Exception e) {
            System.err.println("Error generating presigned URL for: " + videoUrl + ", error: " + e.getMessage());
            e.printStackTrace();
            return videoUrl;
        }
    }

    private String generateFileName(String originalFilename) {
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        return UUID.randomUUID().toString() + extension;
    }
}
