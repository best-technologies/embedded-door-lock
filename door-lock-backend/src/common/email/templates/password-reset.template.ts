export interface PasswordResetEmailData {
  firstName: string;
  verificationCode: string;
  companyName: string;
}

export function passwordResetEmailTemplate(data: PasswordResetEmailData): string {
  const { firstName, verificationCode, companyName } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Verification</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f5f5f5;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .email-header {
            background-color: #ffffff;
            padding: 40px 30px 30px;
            border-bottom: 1px solid #e5e5e5;
        }
        .email-header h1 {
            color: #1a1a1a;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
        }
        .email-body {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 16px;
            color: #333333;
            margin-bottom: 20px;
        }
        .content {
            color: #555555;
            font-size: 15px;
            margin-bottom: 25px;
            line-height: 1.6;
        }
        .verification-code-box {
            background-color: #f8f9fa;
            border: 2px solid #e5e5e5;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
        }
        .code-label {
            color: #666666;
            font-size: 12px;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }
        .verification-code {
            font-size: 36px;
            color: #1a1a1a;
            font-weight: 600;
            font-family: 'Courier New', monospace;
            letter-spacing: 6px;
            padding: 15px;
            display: inline-block;
            min-width: 250px;
        }
        .notice-box {
            background-color: #f8f9fa;
            border-left: 3px solid #6c757d;
            padding: 15px 20px;
            margin: 25px 0;
        }
        .notice-box p {
            color: #495057;
            font-size: 14px;
            margin: 0;
            line-height: 1.5;
        }
        .notice-box strong {
            display: block;
            margin-bottom: 5px;
            color: #333333;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #6c757d;
            font-size: 13px;
            border-top: 1px solid #e5e5e5;
        }
        .footer p {
            margin-bottom: 8px;
        }
        .divider {
            height: 1px;
            background-color: #e5e5e5;
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Password Reset Request</h1>
        </div>
        
        <div class="email-body">
            <p class="greeting">Hello ${firstName},</p>
            
            <div class="content">
                <p>We received a request to reset your password. Use the verification code below to proceed with resetting your password.</p>
            </div>

            <div class="verification-code-box">
                <div class="code-label">Verification Code</div>
                <div class="verification-code">${verificationCode}</div>
            </div>

            <div class="notice-box">
                <p>
                    <strong>Code Expiration</strong>
                    This code will expire in 15 minutes. If you didn't request a password reset, please ignore this email.
                </p>
            </div>

            <div class="notice-box">
                <p>
                    <strong>Security Notice</strong>
                    Never share this code with anyone. Our support team will never ask for your verification code.
                </p>
            </div>

            <div class="content">
                <p>Enter this code in the password reset form along with your new password to complete the process.</p>
            </div>

            <div class="divider"></div>

            <div class="content" style="font-size: 14px; color: #6c757d;">
                <p><strong>Didn't request this?</strong></p>
                <p>If you didn't request a password reset, you can safely ignore this email. Your account remains secure.</p>
            </div>
        </div>

        <div class="footer">
            <p><strong>${companyName}</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>If you have concerns about your account security, please contact support immediately.</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

