import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CertificateService } from '../../services/certificate.service';
import { NotificationService } from '../../services/notification.service';
import { Certificate } from '../../models/certificate.model';

@Component({
  selector: 'app-my-certificates',
  templateUrl: './my-certificates.component.html',
  styleUrls: ['./my-certificates.component.css']
})
export class MyCertificatesComponent implements OnInit {
  certificates: Certificate[] = [];
  loading = true;
  error = '';

  constructor(
    private certificateService: CertificateService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCertificates();
  }

  loadCertificates(): void {
    this.loading = true;
    this.certificateService.getMyCertificates().subscribe({
      next: (certificates) => {
        // Filter out duplicate certificates (keep only the most recent one per course)
        const uniqueCertificates = this.removeDuplicateCertificates(certificates);
        this.certificates = uniqueCertificates;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load certificates';
        this.loading = false;
        this.notificationService.showError('Failed to load certificates');
      }
    });
  }

  private removeDuplicateCertificates(certificates: Certificate[]): Certificate[] {
    const certificateMap = new Map<number, Certificate>();
    
    // Keep only the most recent certificate for each course
    certificates.forEach(cert => {
      const courseId = cert.courseId;
      if (!certificateMap.has(courseId)) {
        certificateMap.set(courseId, cert);
      } else {
        const existingCert = certificateMap.get(courseId);
        // Compare by date, keep the most recent one
        if (existingCert && cert.issuedDate && existingCert.issuedDate) {
          const certDate = new Date(cert.issuedDate);
          const existingDate = new Date(existingCert.issuedDate);
          if (certDate > existingDate) {
            certificateMap.set(courseId, cert);
          }
        }
      }
    });
    
    return Array.from(certificateMap.values());
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  viewCertificate(id: number): void {
    this.router.navigate(['/certificate', id]);
  }

  downloadCertificate(id: number): void {
    this.router.navigate(['/certificate', id]);
  }
}

