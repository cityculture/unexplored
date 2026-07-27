export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  action_url?: string;
  action_text?: string;
  recipient_name?: string;
  meta_data?: {
    items?: Array<{ name: string; quantity: number; price: number | string }>;
    total?: number | string;
    ref?: string;
  };
}

export async function sendResendEmail(options: SendEmailOptions): Promise<{ success: boolean; data?: any; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY || '';
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'City Culture <team@cityculture.in>';
  
  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  const recipientName = options.recipient_name || 'Member';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1f2937; background-color: #f9fafb;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #4F46E5; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">City Culture</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">Hi ${recipientName},</h2>
        <p style="font-size: 16px; line-height: 26px; color: #4b5563; margin-bottom: 24px;">${options.body}</p>
        
        ${options.meta_data?.items ? `
          <div style="margin: 32px 0; border-top: 1px solid #f3f4f6; padding-top: 24px;">
            <h3 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 16px;">Transaction Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${options.meta_data.items.map((item) => `
                <tr>
                  <td style="padding: 12px 0; font-size: 15px; color: #374151;">${item.name} x ${item.quantity}</td>
                  <td style="padding: 12px 0; font-size: 15px; font-weight: 600; color: #111827; text-align: right;">₹${item.price}</td>
                </tr>
              `).join('')}
              <tr style="border-top: 1px solid #f3f4f6;">
                <td style="padding: 16px 0 4px; font-weight: 700; font-size: 16px; color: #111827;">Total Paid</td>
                <td style="padding: 16px 0 4px; font-weight: 700; font-size: 18px; color: #4F46E5; text-align: right;">₹${options.meta_data.total}</td>
              </tr>
              ${options.meta_data.ref ? `
                <tr>
                  <td colspan="2" style="font-size: 12px; color: #9ca3af; padding-top: 12px;">Ref: <code style="background-color: #f3f4f6; padding: 2px 4px; border-radius: 4px;">${options.meta_data.ref}</code></td>
                </tr>
              ` : ''}
            </table>
          </div>
        ` : ''}

        ${options.action_url ? `
          <div style="margin-top: 40px; text-align: center;">
            <a href="${options.action_url}" style="background-color: #4F46E5; color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
              ${options.action_text || (options.subject.toLowerCase().includes('password') ? 'Reset Password' : 'View Details')}
            </a>
          </div>
        ` : ''}
      </div>
      
      <div style="margin-top: 32px; text-align: center; font-size: 13px; color: #9ca3af; line-height: 20px;">
        <p style="margin-bottom: 8px;">You're receiving this because you use City Culture.</p>
        <p style="margin: 0;">&copy; 2026 City Culture. All rights reserved.</p>
        <p style="margin: 4px 0;">A Brand of Salty Media Production (opc) Pvt Ltd</p>
      </div>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipients,
        subject: options.subject,
        html: html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Resend Email Error:', data);
      return { success: false, error: data?.message || 'Failed to send email' };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Resend fetch exception:', err);
    return { success: false, error: err?.message || 'Email service error' };
  }
}
