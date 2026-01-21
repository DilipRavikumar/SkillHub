import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Certificate, CertificateEligibility } from '../models/certificate.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private apiUrl = `${environment.apiUrl}/certificates`;

  constructor(private http: HttpClient) {}

  /**
   * Issue a new certificate for completed course
   */
  issueCertificate(courseId: number): Observable<Certificate> {
    return this.http.post<Certificate>(`${this.apiUrl}/issue/${courseId}`, {});
  }

  /**
   * Get all certificates for the current user
   */
  getMyCertificates(): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.apiUrl}/my-certificates`);
  }

  /**
   * Verify certificate by certificate number
   */
  verifyCertificate(certificateNumber: string): Observable<Certificate> {
    return this.http.get<Certificate>(`${this.apiUrl}/verify/${certificateNumber}`);
  }

  /**
   * Get certificate by ID
   */
  getCertificate(id: number): Observable<Certificate> {
    return this.http.get<Certificate>(`${this.apiUrl}/${id}`);
  }

  /**
   * Check if student is eligible for certificate
   */
  checkEligibility(courseId: number): Observable<CertificateEligibility> {
    return this.http.get<CertificateEligibility>(`${this.apiUrl}/eligibility/${courseId}`);
  }

  /**
   * Get course completion percentage
   */
  getCompletionPercentage(courseId: number): Observable<{ completion: number }> {
    return this.http.get<{ completion: number }>(`${this.apiUrl}/completion/${courseId}`);
  }
}


