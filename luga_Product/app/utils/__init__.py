def verification_email_content(url):
    return f"""
        <html>
            <head>
                <style>
                    .container {{
                        width: 100%;
                        background-color: #f3f3f3;
                        padding: 20px 0;
                        font-family: Arial, sans-serif;
                    }}
                    .email-container {{
                        width: 80%;
                        max-width: 600px;
                        margin: auto;
                        background-color: #fff;
                        padding: 20px;
                        border-radius: 5px;
                        box-shadow: 0px 0px 10px rgba(0,0,0,0.1);
                    }}
                    .logo {{
                        width: 100%;
                        text-align: center;
                        padding: 20px 0;
                    }}
                    .logo img {{
                        max-width: 200px;
                    }}
                    .content {{
                        padding: 20px;
                    }}
                    .button {{
                        display: inline-block;
                        padding: 10px 20px;
                        background-color: #007bff;
                        color: #fff;
                        text-decoration: none;
                        border-radius: 5px;
                        margin-top: 20px;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="email-container">
                        <div class="logo">
                            <img src="https://www.luga.app/assets/logo-RXpjVtIv.jpeg" alt="App Logo">
                        </div>
                        <div class="content">
                            <p>Hi: </p>
                            <p>Thanks for registering! Please click the button below to verify your email:</p>
                            <a href="{url}" class="button">Verify Email</a>
                            <p>If you did not sign up for an account, you can safely ignore this email.</p>
                            <p>Thanks <br>LugaAI Team</p>
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
                            <img src="https://www.luga.app/assets/logo-RXpjVtIv.jpeg" alt="App Logo">
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