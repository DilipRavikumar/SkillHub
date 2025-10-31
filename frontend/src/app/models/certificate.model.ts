export interface Certificate {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseId: number;
  courseTitle: string;
  issuedDate: string;
  certificateNumber: string;
  certificateUrl: string;
  completionPercentage: number;
}

export interface CertificateEligibility {
  eligible: boolean;
  completion: number | null;
}


