export interface Candidate {
  date_of_birth: string | number | Date;
  language_level: string;
  id: string;
  name: string;
  information: string;
  cvFile?: File | null; // For client-side handling
  cvUrl?: string; // For stored CV path
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailList {
  id: string;
  name: string;
  emails: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CampaignStatus = "draft" | "sending" | "sent" | "failed";
export type ReplyCategory = "Yes" | "No" | "Other" | null;

export interface SentEmailLog {
  id: string;
  recipientEmail: string;
  sentAt: Date;
  status: "delivered" | "bounced" | "pending" | "failed";
  replyReceivedAt?: Date;
  replyCategory?: ReplyCategory;
  replySummary?: string;
  errorMessage?: string;
}

export interface Campaign {
  id: string;
  name: string;
  candidateId: string;
  candidate?: Candidate; // Populated
  emailListId: string;
  emailList?: EmailList; // Populated
  templateId: string;
  template?: EmailTemplate; // Populated
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
  sentEmails: SentEmailLog[];
  jobDescription?: string; // Added for generateEmailDraft
}
