import sgMail from "@sendgrid/mail";

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn(
    "SENDGRID_API_KEY is not set. Email functionality will not work."
  );
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private fromEmail: string;
  private isConfigured: boolean;

  constructor() {
    // Use environment variable or fallback
    this.fromEmail =
      process.env.SENDGRID_FROM_EMAIL || "varunsinghh2409@gmail.com";
    this.isConfigured = !!process.env.SENDGRID_API_KEY;

    if (!this.isConfigured) {
      console.warn(
        "Email service is not properly configured. Emails will be logged but not sent."
      );
    }
  }

  private async sendEmail(msg: EmailTemplate): Promise<boolean> {
    if (!this.isConfigured) {
      console.log("Would send email:", msg);
      return true;
    }

    try {
      await sgMail.send({
        ...msg,
        from: this.fromEmail,
      });
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  async sendWelcomeEmail(
    userEmail: string,
    username: string
  ): Promise<boolean> {
    console.log(
      `Attempting to send welcome email to ${userEmail} (${username})`
    );

    const msg: EmailTemplate = {
      to: userEmail,
      subject: "Welcome to Samvaad - Your Debate Journey Begins!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .features { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .feature { background: white; padding: 15px; border-radius: 8px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Welcome to Samvaad!</h1>
              <p>Where Ideas Clash and Minds Grow</p>
            </div>
            <div class="content">
              <h2>Hello ${username}! 👋</h2>
              <p>Welcome to the most exciting debate platform on the internet! We're thrilled to have you join our community of passionate debaters.</p>
              
              <div class="features">
                <div class="feature">
                  <h3>🤖 AI-Powered Feedback</h3>
                  <p>Get real-time analysis of your arguments</p>
                </div>
                <div class="feature">
                  <h3>🎤 Text & Audio Debates</h3>
                  <p>Choose your preferred debate format</p>
                </div>
                <div class="feature">
                  <h3>🏆 Gamified Learning</h3>
                  <p>Earn XP and climb the leaderboards</p>
                </div>
                <div class="feature">
                  <h3>💬 Global Chat</h3>
                  <p>Support your favorite debaters live</p>
                </div>
              </div>

              <p><strong>Ready to start your debate journey?</strong></p>
              <a href="${
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
              }/debates" class="button">Start Debating Now!</a>
              
              <p>Here's what you can do next:</p>
              <ul>
                <li>🔍 Browse ongoing debates and join the conversation</li>
                <li>✨ Create your first debate on any topic you're passionate about</li>
                <li>📊 Check out the leaderboard and see top debaters</li>
                <li>🎯 Complete your profile to get better matched opponents</li>
              </ul>

              <p>If you have any questions, feel free to reach out to us. Happy debating!</p>
              
              <p>Best regards,<br>The Samvaad Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to Samvaad, ${username}! Your debate journey begins now. Visit ${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/debates to start debating!`,
    };

    return await this.sendEmail(msg);
  }

  async sendDebateJoinedNotification(
    creatorEmail: string,
    creatorName: string,
    joinerName: string,
    debateTitle: string,
    debateId: string
  ): Promise<boolean> {
    console.log(`Sending debate joined notification to ${creatorEmail}`);

    const msg: EmailTemplate = {
      to: creatorEmail,
      subject: `🎯 Someone joined your debate: "${debateTitle}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .debate-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Your Debate Has an Opponent!</h1>
              <p>Time to showcase your debating skills</p>
            </div>
            <div class="content">
              <h2>Great news, ${creatorName}!</h2>
              <p><strong>${joinerName}</strong> has joined your debate and is ready to challenge your arguments!</p>
              
              <div class="debate-info">
                <h3>📋 Debate Details:</h3>
                <p><strong>Title:</strong> ${debateTitle}</p>
                <p><strong>Opponent:</strong> ${joinerName}</p>
                <p><strong>Status:</strong> Ready to begin</p>
              </div>

              <p>🔥 <strong>Both participants need to be online and click "Begin" to start the debate!</strong></p>
              
              <a href="${
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
              }/debates/${debateId}" class="button">Join Your Debate Now!</a>
              
              <p><strong>💡 Pro Tips:</strong></p>
              <ul>
                <li>🎯 Prepare your opening arguments</li>
                <li>📚 Gather evidence to support your position</li>
                <li>🤝 Keep the discussion respectful and engaging</li>
                <li>🤖 Use AI feedback to improve your arguments</li>
              </ul>

              <p>Good luck and may the best argument win!</p>
              
              <p>Best regards,<br>The Samvaad Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `${joinerName} joined your debate "${debateTitle}"! Visit ${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/debates/${debateId} to start debating.`,
    };

    return await this.sendEmail(msg);
  }

  async sendDebateAcceptedNotification(
    joinerEmail: string,
    joinerName: string,
    creatorName: string,
    debateTitle: string,
    debateId: string
  ): Promise<boolean> {
    console.log(`Sending debate accepted notification to ${joinerEmail}`);

    const msg: EmailTemplate = {
      to: joinerEmail,
      subject: `✅ You've joined the debate: "${debateTitle}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .debate-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 You're In The Debate!</h1>
              <p>Time to make your arguments count</p>
            </div>
            <div class="content">
              <h2>Welcome to the arena, ${joinerName}!</h2>
              <p>You've successfully joined the debate and are now ready to face off against <strong>${creatorName}</strong>!</p>
              
              <div class="debate-info">
                <h3>📋 Debate Details:</h3>
                <p><strong>Title:</strong> ${debateTitle}</p>
                <p><strong>Opponent:</strong> ${creatorName}</p>
                <p><strong>Your Role:</strong> Present the opposing argument</p>
              </div>

              <p>⚡ <strong>Both participants need to be online and click "Begin" to start the debate!</strong></p>
              
              <a href="${
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
              }/debates/${debateId}" class="button">Enter The Debate Room!</a>
              
              <p><strong>🎯 Debate Strategy Tips:</strong></p>
              <ul>
                <li>📖 Research your position thoroughly</li>
                <li>🎯 Focus on logical, evidence-based arguments</li>
                <li>👂 Listen carefully to your opponent's points</li>
                <li>🤖 Use AI insights to strengthen your arguments</li>
                <li>💬 Engage with the global chat audience</li>
              </ul>

              <p>Show them what you've got!</p>
              
              <p>Best regards,<br>The Samvaad Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `You joined the debate "${debateTitle}" against ${creatorName}! Visit ${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/debates/${debateId} to start debating.`,
    };

    return await this.sendEmail(msg);
  }

  async sendDebateWinnerEmail(
    userEmail: string,
    username: string,
    debateTitle: string,
    debateId: string,
    finalScore: number
  ): Promise<boolean> {
    console.log(`Sending winner notification to ${userEmail}`);

    const msg: EmailTemplate = {
      to: userEmail,
      subject: `🏆 Congratulations! You won the debate: "${debateTitle}"`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #fbbf24; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .score-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #fbbf24; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 VICTORY!</h1>
            <p>You dominated the debate arena!</p>
          </div>
          <div class="content">
            <h2>Congratulations, ${username}! 🎉</h2>
            <p>You've emerged victorious in the debate <strong>"${debateTitle}"</strong>!</p>
            
            <div class="score-box">
              <h3>🎯 Your Final Score</h3>
              <div style="font-size: 48px; font-weight: bold; color: #fbbf24;">${finalScore}/100</div>
              <p>Outstanding performance!</p>
            </div>

            <p><strong>🎁 Rewards Earned:</strong></p>
            <ul>
              <li>🏆 +1 Win to your record</li>
              <li>⭐ +100 XP Base Reward</li>
              <li>🎯 +50 XP Victory Bonus</li>
              <li>📈 ELO Rating Increase</li>
              <li>🏅 Potential Achievement Unlocks</li>
            </ul>

            <a href="${
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            }/debates/${debateId}" class="button">View Debate Results</a>
            
            <p><strong>🚀 Keep the momentum going:</strong></p>
            <ul>
              <li>🎯 Challenge more opponents</li>
              <li>📊 Check your updated leaderboard position</li>
              <li>🏆 Aim for achievement unlocks</li>
              <li>💬 Share your victory with the community</li>
            </ul>

            <p>Your debating skills are truly impressive. Keep up the excellent work!</p>
            
            <p>Best regards,<br>The Samvaad Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
      text: `Congratulations ${username}! You won the debate "${debateTitle}" with a score of ${finalScore}/100. View results: ${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/debates/${debateId}`,
    };

    return await this.sendEmail(msg);
  }

  async sendDebateLoserEmail(
    userEmail: string,
    username: string,
    debateTitle: string,
    debateId: string,
    finalScore: number
  ): Promise<boolean> {
    console.log(`Sending participation notification to ${userEmail}`);

    const msg: EmailTemplate = {
      to: userEmail,
      subject: `💪 Great effort in the debate: "${debateTitle}"`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .score-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💪 Well Fought!</h1>
            <p>Every debate makes you stronger</p>
          </div>
          <div class="content">
            <h2>Great effort, ${username}! 👏</h2>
            <p>You put up an excellent fight in the debate <strong>"${debateTitle}"</strong>. While you didn't win this time, your participation and arguments were valuable!</p>
            
            <div class="score-box">
              <h3>📊 Your Performance</h3>
              <div style="font-size: 36px; font-weight: bold; color: #6366f1;">${finalScore}/100</div>
              <p>Solid performance with room to grow!</p>
            </div>

            <p><strong>🎁 You Still Earned:</strong></p>
            <ul>
              <li>⭐ +50 XP Participation Reward</li>
              <li>📈 Valuable debate experience</li>
              <li>🤖 AI feedback for improvement</li>
              <li>🏅 Progress toward achievements</li>
            </ul>

            <a href="${
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            }/debates/${debateId}" class="button">Review Debate & AI Feedback</a>
            
            <p><strong>💡 Tips for your next debate:</strong></p>
            <ul>
              <li>📚 Research your topic thoroughly</li>
              <li>🎯 Use more evidence and examples</li>
              <li>🤖 Pay attention to AI feedback during debates</li>
              <li>💬 Practice with different debate topics</li>
              <li>👥 Watch top debaters for inspiration</li>
            </ul>

            <p>Remember: Every great debater has lost debates. What matters is learning and improving!</p>
            
            <p>Best regards,<br>The Samvaad Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
      text: `Good effort in the debate "${debateTitle}"! Your score: ${finalScore}/100. Review the debate and AI feedback: ${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/debates/${debateId}`,
    };

    return await this.sendEmail(msg);
  }

  async sendDebateRequestNotification(
    userEmail: string,
    username: string,
    challengerName: string,
    debateTopic: string,
    requestId: string
  ): Promise<boolean> {
    console.log(`Sending debate request notification to ${userEmail}`);

    const msg: EmailTemplate = {
      to: userEmail,
      subject: `⚡ ${challengerName} challenges you to a debate!`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .topic-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚡ DEBATE CHALLENGE!</h1>
            <p>Someone wants to test your skills</p>
          </div>
          <div class="content">
            <h2>Hey ${username}! 👋</h2>
            <p><strong>${challengerName}</strong> has challenged you to a debate!</p>
            
            <div class="topic-box">
              <h3>💭 Debate Topic:</h3>
              <p style="font-size: 18px; font-weight: bold;">"${debateTopic}"</p>
            </div>

            <p>🔥 <strong>Are you ready to accept this challenge?</strong></p>
            
            <a href="${
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            }/find-opponent" class="button">View Challenge & Respond</a>
            
            <p><strong>⏰ Quick reminder:</strong></p>
            <ul>
              <li>🎯 Prepare your arguments</li>
              <li>🤖 Use AI feedback to your advantage</li>
              <li>🏆 Earn XP and climb the leaderboard</li>
              <li>💬 Engage with the audience in global chat</li>
            </ul>

            <p>Don't keep them waiting - respond to the challenge now!</p>
            
            <p>Best regards,<br>The Samvaad Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
      text: `${challengerName} challenged you to debate "${debateTopic}"! Respond at: ${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/find-opponent`,
    };

    return await this.sendEmail(msg);
  }
}

export const emailService = new EmailService();
