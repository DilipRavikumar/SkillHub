package com.skillhub.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.email.from:SkillHub <noreply@skillhub.com>}")
    private String fromEmail;

    @Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    /**
     * Send welcome email to new users
     */
    public void sendWelcomeEmail(String toEmail, String userName) {
        System.out.println("=== EmailService.sendWelcomeEmail called ===");
        System.out.println("Email enabled: " + emailEnabled);
        System.out.println("From email: " + fromEmail);
        System.out.println("To email: " + toEmail);
        
        if (!emailEnabled) {
            System.out.println("Email notifications are disabled. Skipping welcome email to: " + toEmail);
            return;
        }

        try {
            System.out.println("Creating welcome email message...");
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("🎉 Welcome to SkillHub, " + userName + "!");
            message.setText(
                "Hello " + userName + "! 👋\n\n" +
                "🎊 Congratulations on joining SkillHub! 🎊\n\n" +
                "We're thrilled to have you as part of our learning community! Here's what you can do:\n\n" +
                "✨ Browse thousands of courses\n" +
                "📚 Learn at your own pace\n" +
                "🏆 Earn certificates upon completion\n" +
                "👥 Connect with instructors and fellow learners\n\n" +
                "Ready to start your learning journey? Head over to our course catalog and find something that interests you!\n\n" +
                "If you have any questions, feel free to reach out to our support team. We're here to help! 💪\n\n" +
                "Happy Learning! 📖\n\n" +
                "Best regards,\n" +
                "🌟 The SkillHub Team 🌟"
            );

            System.out.println("Attempting to send welcome email via mailSender...");
            mailSender.send(message);
            System.out.println("✓✓✓ Welcome email sent successfully to: " + toEmail);
        } catch (Exception e) {
            System.err.println("✗✗✗ Failed to send welcome email!");
            System.err.println("Error: " + e.getMessage());
            System.err.println("Error class: " + e.getClass().getName());
            e.printStackTrace();
        }
    }

    /**
     * Send login notification email
     */
    public void sendLoginNotification(String toEmail, String userName) {
        System.out.println("=== EmailService.sendLoginNotification called ===");
        System.out.println("Email enabled: " + emailEnabled);
        System.out.println("From email: " + fromEmail);
        System.out.println("To email: " + toEmail);
        
        if (!emailEnabled) {
            System.out.println("Email notifications are disabled. Skipping login email to: " + toEmail);
            return;
        }

        try {
            System.out.println("Creating email message...");
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("🔐 Login Notification - SkillHub");
            message.setText(
                "Hello " + userName + "! 👋\n\n" +
                "You have successfully logged into your SkillHub account. ✅\n\n" +
                "📅 Login time: " + java.time.LocalDateTime.now().toString() + "\n\n" +
                "🔒 Security Notice:\n" +
                "If this wasn't you, please contact our support team immediately to secure your account.\n\n" +
                "Stay safe and keep learning! 📚\n\n" +
                "Best regards,\n" +
                "🛡️ The SkillHub Security Team"
            );

            System.out.println("Attempting to send email via mailSender...");
            mailSender.send(message);
            System.out.println("✓✓✓ Login notification email sent successfully to: " + toEmail);
        } catch (Exception e) {
            System.err.println("✗✗✗ Failed to send login notification email!");
            System.err.println("Error: " + e.getMessage());
            System.err.println("Error class: " + e.getClass().getName());
            e.printStackTrace();
        }
    }

    /**
     * Send certificate issuance email
     */
    public void sendCertificateEmail(String toEmail, String userName, String courseName, 
                                     String certificateNumber, String certificateUrl) {
        System.out.println("=== EmailService.sendCertificateEmail called ===");
        System.out.println("Email enabled: " + emailEnabled);
        System.out.println("To email: " + toEmail);
        System.out.println("Course: " + courseName);
        
        if (!emailEnabled) {
            System.out.println("Email notifications are disabled. Skipping certificate email to: " + toEmail);
            return;
        }

        try {
            System.out.println("Creating certificate email message...");
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("🏆 Congratulations! Your Certificate is Ready - " + courseName);
            message.setText(
                "Hello " + userName + "! 👋\n\n" +
                "🎉🎊 CONGRATULATIONS! 🎊🎉\n\n" +
                "You have successfully completed the course:\n" +
                "📚 " + courseName + "\n\n" +
                "🏆 Your certificate has been issued and is now available!\n\n" +
                "📜 Certificate Details:\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "📋 Certificate Number: " + certificateNumber + "\n" +
                "📖 Course: " + courseName + "\n" +
                "🔗 View Certificate: " + certificateUrl + "\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "✨ You can access your certificate anytime from your SkillHub dashboard.\n\n" +
                "Keep up the amazing work! Your dedication to learning is inspiring! 💪🌟\n\n" +
                "Best regards,\n" +
                "🎓 The SkillHub Team 🎓"
            );

            System.out.println("Attempting to send certificate email via mailSender...");
            mailSender.send(message);
            System.out.println("✓✓✓ Certificate email sent successfully to: " + toEmail);
        } catch (Exception e) {
            System.err.println("✗✗✗ Failed to send certificate email!");
            System.err.println("Error: " + e.getMessage());
            System.err.println("Error class: " + e.getClass().getName());
            e.printStackTrace();
        }
    }
}

