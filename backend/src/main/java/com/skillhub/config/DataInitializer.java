package com.skillhub.config;

import com.skillhub.entity.Role;
import com.skillhub.entity.User;
import com.skillhub.repository.RoleRepository;
import com.skillhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Initialize roles if they don't exist
        if (roleRepository.count() == 0) {
            Role adminRole = new Role();
            adminRole.setRoleName("ADMIN");
            roleRepository.save(adminRole);

            Role instructorRole = new Role();
            instructorRole.setRoleName("INSTRUCTOR");
            roleRepository.save(instructorRole);

            Role studentRole = new Role();
            studentRole.setRoleName("STUDENT");
            roleRepository.save(studentRole);

            System.out.println("Initial roles created successfully!");
        }

        // Create default users if they don't exist
        if (userRepository.count() == 0) {
            Role adminRole = roleRepository.findByRoleName("ADMIN").orElseThrow();
            Role instructorRole = roleRepository.findByRoleName("INSTRUCTOR").orElseThrow();
            Role studentRole = roleRepository.findByRoleName("STUDENT").orElseThrow();

            // Create admin user
            User admin = new User();
            admin.setName("Admin User");
            admin.setEmail("admin@skillhub.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(adminRole);
            userRepository.save(admin);

            // Create instructor user
            User instructor = new User();
            instructor.setName("John Instructor");
            instructor.setEmail("instructor@skillhub.com");
            instructor.setPassword(passwordEncoder.encode("instructor123"));
            instructor.setRole(instructorRole);
            userRepository.save(instructor);

            // Create student user
            User student = new User();
            student.setName("Jane Student");
            student.setEmail("student@skillhub.com");
            student.setPassword(passwordEncoder.encode("student123"));
            student.setRole(studentRole);
            userRepository.save(student);

            System.out.println("Default users created successfully!");
            System.out.println("Admin: admin@skillhub.com / admin123");
            System.out.println("Instructor: instructor@skillhub.com / instructor123");
            System.out.println("Student: student@skillhub.com / student123");
        }
    }
}
