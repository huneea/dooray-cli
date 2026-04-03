export interface Config {
  version: 1;
  apiKey: string;
  baseUrl: string;
  imapHost?: string;
  imapPort?: number;
  imapUsername?: string;
  imapPassword?: string;
  smtpHost?: string;
  smtpPort?: number;
}

export const DEFAULTS = {
  baseUrl: "https://api.dooray.com",
  imapHost: "imap.dooray.com",
  imapPort: 993,
  smtpHost: "smtp.dooray.com",
  smtpPort: 465,
} as const;
