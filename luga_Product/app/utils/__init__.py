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