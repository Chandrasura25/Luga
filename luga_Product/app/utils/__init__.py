def verification_email_content(url):
    return f"""
    <html>
        <head>
            <style>
                body {{
                    margin: 0;
                    padding: 0;
                    background-color: #f3f3f3;
                    font-family: Arial, sans-serif;
                    color: #333;
                }}
                .container {{
                    width: 100%;
                    padding: 40px 0;
                }}
                .email-wrapper {{
                    width: 90%;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                }}
                .header {{
                    background-color: #ffffff;
                    padding: 30px 0;
                    text-align: center;
                }}
                .header img {{
                    max-width: 150px;
                }}
                .content {{
                    padding: 30px;
                    line-height: 1.6;
                }}
                .content p {{
                    margin: 15px 0;
                }}
                .button {{
                    display: inline-block;
                    padding: 12px 25px;
                    background-color: #007bff;
                    color: #ffffff !important;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                    margin-top: 20px;
                }}
                .footer {{
                    padding: 20px 30px;
                    font-size: 13px;
                    text-align: center;
                    color: #888;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="email-wrapper">
                    <div class="header">
                      <img src="https://luga.s3.ap-northeast-1.amazonaws.com/luga.png" alt="Luga Logo" width="200" />
                    </div>
                    <div class="content">
                        <p>Hi there,</p>
                        <p>Thank you for registering with LugaAI. To complete your sign-up, please verify your email address by clicking the button below:</p>
                        <p style="text-align: center;">
                            <a href="{url}" class="button">Verify Email</a>
                        </p>
                        <p>If you did not create this account, you can safely ignore this message.</p>
                        <p>Best regards,<br>LugaAI Team</p>
                    </div>
                    <div class="footer">
                        © {2025} LugaAI. All rights reserved.
                    </div>
                </div>
            </div>
        </body>
    </html>
    """

def forgot_password_email_content(code):
    return f"""
        <html>
            <head>
                <style>
                    .container {{
                        width: 100%;
                        background-color: #e9ecef;
                        padding: 30px 0;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    }}
                    .email-container {{
                        width: 90%;
                        max-width: 650px;
                        margin: auto;
                        background-color: #ffffff;
                        padding: 25px;
                        border-radius: 8px;
                        box-shadow: 0px 4px 12px rgba(0,0,0,0.15);
                    }}
                    .logo {{
                        width: 100%;
                        text-align: center;
                        padding: 25px 0;
                    }}
                    .logo img {{
                        max-width: 180px;
                    }}
                    .content {{
                        padding: 25px;
                        line-height: 1.6;
                        color: #333333;
                    }}
                    .button {{
                        display: inline-block;
                        padding: 12px 25px;
                        background-color: #28a745;
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 5px;
                        margin-top: 25px;
                        font-weight: bold;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="email-container">
                        <div class="logo">
                          <img src="https://luga.s3.ap-northeast-1.amazonaws.com/luga.png" alt="Luga Logo" width="200" />
                        </div>
                        <div class="content">
                            <p>Hello,</p>
                            <p>We have received a request to reset your password. Please use the code below to proceed with resetting your password:</p>
                            <p class="button">{code}</p>
                            <p>If you did not request a password reset, please disregard this email.</p>
                            <p>Best regards, <br>The LugaAI Team</p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    """