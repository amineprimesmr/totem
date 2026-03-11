import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailsService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private prisma: PrismaService) {
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async send(options: {
    to: string;
    subject: string;
    html: string;
    trigger?: string;
    sentById?: string;
    entityType?: string;
    entityId?: string;
    templateId?: string;
  }) {
    if (!this.transporter) {
      console.log('[Email] (no SMTP) would send to', options.to, options.subject);
      await this.log(options);
      return;
    }
    const from = process.env.EMAIL_FROM ?? 'Totem <noreply@totem.fr>';
    await this.transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    await this.log(options);
  }

  private async log(options: {
    to: string;
    subject: string;
    html: string;
    trigger?: string;
    sentById?: string;
    entityType?: string;
    entityId?: string;
    templateId?: string;
  }) {
    await this.prisma.emailLog.create({
      data: {
        to: options.to,
        subject: options.subject,
        body: options.html,
        trigger: options.trigger,
        sentById: options.sentById,
        entityType: options.entityType,
        entityId: options.entityId,
        templateId: options.templateId,
      },
    });
  }

  async getTemplates() {
    return this.prisma.emailTemplate.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async getTemplate(key: string) {
    return this.prisma.emailTemplate.findUnique({
      where: { key },
    });
  }

  async renderTemplate(
    key: string,
    variables: Record<string, string>,
  ): Promise<{ subject: string; body: string } | null> {
    const t = await this.getTemplate(key);
    if (!t) return null;
    let subject = t.subject;
    let body = t.body;
    for (const [k, v] of Object.entries(variables)) {
      subject = subject.replace(new RegExp(`{{${k}}}`, 'g'), v);
      body = body.replace(new RegExp(`{{${k}}}`, 'g'), v);
    }
    return { subject, body };
  }

  async sendTemplate(
    key: string,
    to: string,
    variables: Record<string, string>,
    opts?: { trigger?: string; entityType?: string; entityId?: string; sentById?: string },
  ) {
    const rendered = await this.renderTemplate(key, variables);
    if (!rendered) return;
    await this.send({
      to,
      subject: rendered.subject,
      html: rendered.body,
      trigger: opts?.trigger ?? key,
      entityType: opts?.entityType,
      entityId: opts?.entityId,
      sentById: opts?.sentById,
    });
  }
}
