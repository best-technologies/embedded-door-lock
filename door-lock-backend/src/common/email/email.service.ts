import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { AppConfigService } from '../../config/config.service';
import { LoggerService } from '../logger/logger.service';
import { registrationEmailTemplate } from './templates/registration.template';
import { passwordResetEmailTemplate } from './templates/password-reset.template';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: AppConfigService,
    private readonly logger: LoggerService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.smtpHost,
      port: this.configService.smtpPort,
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.smtpUser,
        pass: this.configService.smtpPassword,
      },
    });
  }

  /**
   * Send registration email with auto-generated password
   */
  async sendRegistrationEmail(
    email: string,
    firstName: string,
    password: string,
    userId: string,
  ): Promise<void> {
    try {
      this.logger.info(`Sending registration email to: ${email}`, 'EmailService');

      const html = registrationEmailTemplate({
        firstName,
        email,
        password,
        userId,
        companyName: this.configService.smtpFromName,
      });

      const mailOptions = {
        from: `"${this.configService.smtpFromName}" <${this.configService.smtpFromEmail}>`,
        to: email,
        subject: 'Welcome to Door Lock System - Your Account Details',
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.success(
        `Registration email sent successfully to ${email}. Message ID: ${info.messageId}`,
        'EmailService',
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to send registration email to ${email}: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'EmailService',
      );
      throw error;
    }
  }

  /**
   * Send password reset verification code
   */
  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    verificationCode: string,
  ): Promise<void> {
    try {
      this.logger.info(`Sending password reset email to: ${email}`, 'EmailService');

      const html = passwordResetEmailTemplate({
        firstName,
        verificationCode,
        companyName: this.configService.smtpFromName,
      });

      const mailOptions = {
        from: `"${this.configService.smtpFromName}" <${this.configService.smtpFromEmail}>`,
        to: email,
        subject: 'Password Reset Verification Code',
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.success(
        `Password reset email sent successfully to ${email}. Message ID: ${info.messageId}`,
        'EmailService',
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to send password reset email to ${email}: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'EmailService',
      );
      throw error;
    }
  }

  /**
   * Verify email service connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.success('Email service connection verified', 'EmailService');
      return true;
    } catch (error: any) {
      this.logger.error(
        `Email service connection failed: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'EmailService',
      );
      return false;
    }
  }
}

