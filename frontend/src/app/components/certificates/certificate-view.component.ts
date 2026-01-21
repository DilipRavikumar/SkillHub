import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CertificateService } from '../../services/certificate.service';
import { Certificate } from '../../models/certificate.model';

@Component({
  selector: 'app-certificate-view',
  templateUrl: './certificate-view.component.html',
  styleUrls: ['./certificate-view.component.css']
})
export class CertificateViewComponent implements OnInit {
  certificate: Certificate | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private certificateService: CertificateService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCertificate(Number(id));
    }
  }

  loadCertificate(id: number): void {
    this.loading = true;
    this.certificateService.getCertificate(id).subscribe({
      next: (certificate) => {
        this.certificate = certificate;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load certificate';
        this.loading = false;
      }
    });
  }

  downloadCertificate(): void {
    window.print();
  }

  printCertificate(): void {
    window.print();
  }
}

