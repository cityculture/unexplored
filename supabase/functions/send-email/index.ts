import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.11.0"

interface EmailItem {
  name: string;
  quantity: number;
  price: number | string;
}

interface EmailMetadata {
  items?: EmailItem[];
  total?: number | string;
  ref?: string;
}

interface EmailRequest {
  notification_id?: string;
  user_id?: string;
  type?: string;
  subject: string;
  body: string;
  action_url?: string;
  meta_data?: EmailMetadata;
  recipient_email?: string;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || ""

serve(async (req: Request) => {
  try {
    const { 
      notification_id, 
      user_id, 
      subject, 
      body, 
      action_url, 
      meta_data,
      recipient_email 
    }: EmailRequest = await req.json()

    // 1. Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // 2. Fetch user's actual email or use provided recipient_email
    let recipientEmail = recipient_email || "";
    let recipientName = "there";

    if (user_id && !recipientEmail) {
      const { data: user, error: userError } = await supabaseClient
        .from("users")
        .select("email, username")
        .eq("id", user_id)
        .single()
      
      if (!userError && user) {
        recipientEmail = user.email
        recipientName = (user as any).username || "there"
      }
    }

    if (!recipientEmail) {
      throw new Error(`No recipient email found.`)
    }

    // 3. Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "City Culture <team@cityculture.in>",
        to: [recipientEmail],
        subject: subject,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1f2937; background-color: #f9fafb;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #4F46E5; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">City Culture</h1>
            </div>
            
            <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
              <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">Hi ${recipientName},</h2>
              <p style="font-size: 16px; line-height: 26px; color: #4b5563; margin-bottom: 24px;">${body}</p>
              
              ${meta_data?.items ? `
                <div style="margin: 32px 0; border-top: 1px solid #f3f4f6; padding-top: 24px;">
                  <h3 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 16px;">Transaction Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    ${meta_data.items.map((item: EmailItem) => `
                      <tr>
                        <td style="padding: 12px 0; font-size: 15px; color: #374151;">${item.name} x ${item.quantity}</td>
                        <td style="padding: 12px 0; font-size: 15px; font-weight: 600; color: #111827; text-align: right;">₹${item.price}</td>
                      </tr>
                    `).join('')}
                    <tr style="border-top: 1px solid #f3f4f6;">
                      <td style="padding: 16px 0 4px; font-weight: 700; font-size: 16px; color: #111827;">Total Paid</td>
                      <td style="padding: 16px 0 4px; font-weight: 700; font-size: 18px; color: #4F46E5; text-align: right;">₹${meta_data.total}</td>
                    </tr>
                    ${meta_data.ref ? `
                      <tr>
                        <td colspan="2" style="font-size: 12px; color: #9ca3af; padding-top: 12px;">Ref: <code style="background-color: #f3f4f6; padding: 2px 4px; border-radius: 4px;">${meta_data.ref}</code></td>
                      </tr>
                    ` : ''}
                  </table>
                </div>
              ` : ''}

              ${action_url ? `
                <div style="margin-top: 40px; text-align: center;">
                  <a href="${action_url}" style="background-color: #4F46E5; color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);">
                    ${subject.toLowerCase().includes('password') ? 'Reset Password' : 'View Details'}
                  </a>
                </div>
                ${subject.toLowerCase().includes('password') ? `
                  <p style="margin-top: 32px; font-size: 13px; color: #9ca3af; line-height: 20px; text-align: center;">
                    If you didn't request a password reset, you can safely ignore this email. This link will expire shortly.
                  </p>
                ` : ''}
              ` : ''}
            </div>
            
            <div style="margin-top: 32px; text-align: center; font-size: 13px; color: #9ca3af; line-height: 20px;">
              <p style="margin-bottom: 8px;">You're receiving this because you use City Culture.</p>
              <p style="margin: 0;">&copy; 2026 City Culture. All rights reserved.</p>
              <p style="margin: 4px 0;">A Brand of Salty Media Production (opc) Pvt Ltd</p>
            </div>
          </div>
        `,
      }),
    })

    const resData = (await res.json()) as Record<string, unknown>

    if (!res.ok) {
      console.error('Resend API error:', resData)
      throw new Error(`Resend API error: ${JSON.stringify(resData)}`)
    }

    // 4. Update notification record if exists
    if (notification_id) {
      await supabaseClient
        .from("notifications")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", notification_id)
    }

    return new Response(JSON.stringify({ success: true, resData }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    })
  }
})
