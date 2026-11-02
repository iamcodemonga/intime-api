import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export type InspectionCompletedEmailInput = {
  to: string;
  driverFirstName: string;
  driverLastName: string;
  vehicleNumber: string;
  make: string;
  model: string;
  year: number;
  compositeScore: number;
  passMark: number;
  checksPassed: number;
  checksFailed: number;
  pdfAttachment?: {
    filename: string;
    content: Buffer;
  };
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private client: Resend | null = null;

  constructor(private readonly config: ConfigService) {}

  private getClient(): Resend | null {
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    if (!apiKey) return null;
    if (!this.client) {
      this.client = new Resend(apiKey);
    }
    return this.client;
  }

  private resolveFromAddress(): string {
    const sandboxFrom = 'Intime <onboarding@resend.dev>';
    const from =
      this.config.get<string>('EMAIL_FROM')?.trim() ||
      this.config.get<string>('RESEND_FROM_EMAIL')?.trim() ||
      sandboxFrom;

    if (from.includes('onboarding@resend.dev')) {
      this.logger.warn(
        'EMAIL_FROM / RESEND_FROM_EMAIL unset or sandbox; Resend only allows sending to the account owner email',
      );
    }

    return from;
  }

  async sendInspectionCompleted(
    input: InspectionCompletedEmailInput,
  ): Promise<boolean> {
    const client = this.getClient();
    const from = this.resolveFromAddress();

    if (!client) {
      this.logger.warn(
        'RESEND_API_KEY is not set; skipping inspection completion email',
      );
      return false;
    }

    const passed = input.compositeScore >= input.passMark;
    const driverFullName =
      `${input.driverFirstName} ${input.driverLastName}`.trim();
    const subject = `Inspection ${passed ? 'passed' : 'completed'} — ${input.vehicleNumber}`;
    const text = [
      `Hi ${driverFullName},`,
      '',
      `Your vehicle inspection for ${input.year} ${input.make} ${input.model} (${input.vehicleNumber}) is complete.`,
      '',
      `Score: ${input.compositeScore}% (pass mark ${input.passMark}%)`,
      `Checks passed: ${input.checksPassed}`,
      `Checks failed: ${input.checksFailed}`,
      `Result: ${passed ? 'PASS' : 'BELOW PASS MARK'}`,
      '',
      '— Intime',
    ].join('\n');

    const html = `
      <p>Hi ${escapeHtml(driverFullName)},</p>
      <p>Your vehicle inspection for <strong>${escapeHtml(String(input.year))} ${escapeHtml(input.make)} ${escapeHtml(input.model)}</strong> (<strong>${escapeHtml(input.vehicleNumber)}</strong>) is complete.</p>
      <ul>
        <li>Score: <strong>${input.compositeScore}%</strong> (pass mark ${input.passMark}%)</li>
        <li>Checks passed: ${input.checksPassed}</li>
        <li>Checks failed: ${input.checksFailed}</li>
        <li>Result: <strong>${passed ? 'PASS' : 'BELOW PASS MARK'}</strong></li>
      </ul>
      <p>— Intime</p>
    `;

    const { error } = await client.emails.send({
      from,
      to: input.to,
      subject,
      text,
      html,
      attachments: input.pdfAttachment
        ? [
            {
              filename: input.pdfAttachment.filename,
              content: input.pdfAttachment.content,
              contentType: 'application/pdf',
            },
          ]
        : undefined,
    });

    if (error) {
      this.logger.error(`Failed to send inspection email: ${error.message}`);
      return false;
    }

    return true;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
