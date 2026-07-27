import { supabaseAdmin } from '../supabase/admin'

/**
 * Sends a notification to a specific user.
 * 1. Fetches the template for the given type.
 * 2. Interpolates variables into the template body.
 * 3. Creates an in-app notification record.
 * 4. Checks user preferences for multi-channel delivery (email/push).
 * 
 * @param userId - The ID of the user to notify
 * @param type - The notification type (slug) matching a template
 * @param vars - Variables to interpolate into the template: {{variable}}
 */
export async function sendNotification(
  userId: string,
  type: string,
  vars: Record<string, string>
) {
  const supabase = supabaseAdmin;

  // 1. Fetch template from notification_templates
  const { data: template, error: templateError } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('type', type)
    .eq('is_active', true)
    // We fetch the 'in_app' channel template initially to define the notification body
    .eq('channel', 'in_app')
    .single();

  if (templateError || !template) {
    console.error(`[NotificationSystem] No active in_app template found for type: ${type}`, templateError);
    return { success: false, error: 'Template not found' };
  }

  // 2. Interpolate vars into body_template
  let body = template.body_template;
  Object.entries(vars).forEach(([key, value]) => {
    // Replace all occurrences of {{key}} with value
    body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  // 3. Insert into notifications table
  const { data: notification, error: notificationError } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: type,
      title: template.subject || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      body: body,
      channel: 'in_app',
      is_read: false,
    })
    .select()
    .single();

  if (notificationError) {
    console.error('[NotificationSystem] Failed to insert notification record', notificationError);
    return { success: false, error: notificationError.message };
  }

  // 4. Check user notification preferences
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('notification_prefs, email')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    console.warn(`[NotificationSystem] User ${userId} not found or prefs inaccessible`, userError);
    return { success: true, notificationId: notification.id };
  }

  type NotificationPrefs = Record<string, { email?: boolean; in_app?: boolean; push?: boolean }>;
  const prefs = (user.notification_prefs as unknown as NotificationPrefs) || {};
  // If no specific prefs for this type, default to sending
  const typePrefs = prefs[type] || { email: true, in_app: true, push: true };

  // 5. Handle Email Delivery
  if (typePrefs.email && user.email) {
    const { error: emailError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: type,
        title: template.subject || type,
        body: body,
        channel: 'email',
        action_url: notification.action_url,
      });

    if (emailError) {
      console.error('[NotificationSystem] Failed to queue email notification record', emailError);
    } else {
      console.log(`[NotificationSystem] Email delivery record created for ${user.email} (Type: ${type})`);
    }
  }

  return { success: true, notificationId: notification.id };
}
