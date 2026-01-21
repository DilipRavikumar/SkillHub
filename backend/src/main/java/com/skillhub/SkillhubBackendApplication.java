package com.skillhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.actuate.autoconfigure.metrics.SystemMetricsAutoConfiguration;

@SpringBootApplication(exclude = {SystemMetricsAutoConfiguration.class})
public class SkillhubBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SkillhubBackendApplication.class, args);
    }

}
