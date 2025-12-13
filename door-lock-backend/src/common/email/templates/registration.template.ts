export interface RegistrationEmailData {
  firstName: string;
  email: string;
  password: string;
  userId: string;
  companyName: string;
}

export function registrationEmailTemplate(data: RegistrationEmailData): string {
  const { firstName, email, password, userId, companyName } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ${companyName}</title>
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
            background-color: #f4f4f4;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .email-header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        .email-body {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #333333;
            margin-bottom: 20px;
        }
        .content {
            color: #555555;
            font-size: 16px;
            margin-bottom: 30px;
        }
        .credentials-box {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 30px 0;
            border-radius: 4px;
        }
        .credential-item {
            margin-bottom: 15px;
        }
        .credential-label {
            font-weight: 600;
            color: #333333;
            font-size: 14px;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .credential-value {
            font-size: 18px;
            color: #667eea;
            font-weight: 600;
            font-family: 'Courier New', monospace;
            background-color: #ffffff;
            padding: 10px 15px;
            border-radius: 4px;
            display: inline-block;
            min-width: 200px;
        }
        .warning-box {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 4px;
            padding: 15px;
            margin: 30px 0;
        }
        .warning-box p {
            color: #856404;
            font-size: 14px;
            margin: 0;
        }
        .warning-box strong {
            display: block;
            margin-bottom: 5px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #777777;
            font-size: 14px;
        }
        .footer p {
            margin-bottom: 10px;
        }
        .divider {
            height: 1px;
            background-color: #e0e0e0;
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Welcome to ${companyName}!</h1>
        </div>
        
        <div class="email-body">
            <p class="greeting">Hello ${firstName},</p>
            
            <div class="content">
                <p>Your account has been successfully created. Below are your login credentials:</p>
            </div>

            <div class="credentials-box">
                <div class="credential-item">
                    <div class="credential-label">User ID</div>
                    <div class="credential-value">${userId}</div>
                </div>
                <div class="credential-item">
                    <div class="credential-label">Email Address</div>
                    <div class="credential-value" style="font-size: 14px; font-family: Arial, sans-serif;">${email}</div>
                </div>
                <div class="credential-item">
                    <div class="credential-label">Temporary Password</div>
                    <div class="credential-value">${password}</div>
                </div>
            </div>

            <div class="warning-box">
                <p>
                    <strong>⚠️ Important Security Notice</strong>
                    Please change your password immediately after your first login for security purposes.
                </p>
            </div>

            <div class="content">
                <p>You can now sign in to your account using the credentials above.</p>
                <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            </div>

            <div class="divider"></div>

            <div class="content" style="font-size: 14px; color: #777777;">
                <p><strong>Next Steps:</strong></p>
                <ol style="margin-left: 20px; margin-top: 10px;">
                    <li>Sign in using your email and temporary password</li>
                    <li>Change your password to something secure and memorable</li>
                    <li>Complete your profile setup</li>
                </ol>
            </div>
        </div>

        <div class="footer">
            <p><strong>${companyName}</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>If you did not create this account, please contact support immediately.</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

