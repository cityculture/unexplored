'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SupabaseClient, User } from '@supabase/supabase-js'
import { Database, Json } from '@/types/database.types'

type AppSupabaseClient = SupabaseClient<Database>

type AdminAuthSuccess = { user: User; role: string; error?: never };
type AdminAuthError = { error: string; status: number; user?: never; role?: never };
type AdminAuthResult = AdminAuthSuccess | AdminAuthError;

function isAdminAuthSuccess(result: AdminAuthResult): result is AdminAuthSuccess {
  return !('error' in result);
}

// Helper for audit logging
async function logAuditAction(supabase: AppSupabaseClient, {
  actorId,
  actorRole,
  action,
  entityType,
  entityId,
  oldValues = null,
  newValues = null,
  metadata = {}
}: {
  actorId: string,
  actorRole: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValues?: unknown,
  newValues?: unknown,
  metadata?: Record<string, unknown>
}) {
  await supabase
    .from('audit_logs')
    .insert({
      actor_id: actorId,
      actor_role: actorRole,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues as Json,
      new_values: newValues as Json,
      metadata: metadata as Json
    })
}

// Helper for validating admin role
async function validateAdminRole(supabase: AppSupabaseClient, allowedRoles: string[] = ['admin']): Promise<AdminAuthResult> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  if (!role || !allowedRoles.includes(role)) {
    return { error: 'Forbidden', status: 403 }
  }

  return { user, role }
}

export async function toggleFeaturedEvent(eventId: string, isFeatured: boolean) {
  const supabase = await createClient()
  const admin = await validateAdminRole(supabase)
  if (!isAdminAuthSuccess(admin)) return { success: false, error: admin.error }

  const { error } = await supabase
    .from('events')
    .update({ is_featured: isFeatured })
    .eq('id', eventId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Audit Logs
  await logAuditAction(supabase, {
    actorId: admin.user.id,
    actorRole: admin.role,
    action: isFeatured ? 'event.featured.enabled' : 'event.featured.disabled',
    entityType: 'event',
    entityId: eventId,
    newValues: { is_featured: isFeatured }
  })

  revalidatePath('/', 'page')
  revalidatePath('/events', 'page')
  return { success: true }
}

export async function toggleSponsoredEvent(eventId: string, isSponsored: boolean) {
  const supabase = await createClient()
  const admin = await validateAdminRole(supabase)
  if (!isAdminAuthSuccess(admin)) return { success: false, error: admin.error }

  const { error } = await supabase
    .from('events')
    .update({ is_sponsored: isSponsored })
    .eq('id', eventId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Audit Logs
  await logAuditAction(supabase, {
    actorId: admin.user.id,
    actorRole: admin.role,
    action: isSponsored ? 'event.sponsored.enabled' : 'event.sponsored.disabled',
    entityType: 'event',
    entityId: eventId,
    newValues: { is_sponsored: isSponsored }
  })

  revalidatePath('/', 'page')
  return { success: true }
}

export async function approveHostAction(hostProfileId: string, approved: boolean) {
  const supabase = await createClient()
  const admin = await validateAdminRole(supabase)
  if (!isAdminAuthSuccess(admin)) return { success: false, error: admin.error }

  // 2. Update host_profiles
  const { data: hostProfile, error: updateError } = await supabase
    .from('host_pages')
    .update({ 
      is_approved: approved,
      approved_by: admin.user.id,
      approved_at: new Date().toISOString()
    })
    .eq('id', hostProfileId)
    .select('user_id, display_name')
    .single()

  if (updateError || !hostProfile) return { success: false, error: updateError?.message || 'Failed to update host profile' }

  // 3. Audit Logs
  await logAuditAction(supabase, {
    actorId: admin.user.id,
    actorRole: admin.role,
    action: approved ? 'host.approved' : 'host.rejected',
    entityType: 'host_profile',
    entityId: hostProfileId,
    newValues: { is_approved: approved }
  })

  // 4. Send notification if approved
  const { sendNotification } = await import('@/lib/notifications/send')
  
  if (approved) {
    await sendNotification(hostProfile.user_id, 'host_approved', {
      host_name: hostProfile.display_name
    })
  }

  revalidatePath('/admin/hosts', 'page')
  return { success: true }
}

export async function resolveReportAction(reportId: string, status: 'resolved' | 'dismissed', note: string) {
  const supabase = await createClient()
  const admin = await validateAdminRole(supabase, ['admin', 'moderator'])
  if (!isAdminAuthSuccess(admin)) return { success: false, error: admin.error }

  // Update report
  const { error: updateError } = await supabase
    .from('reports')
    .update({ 
      status, 
      resolution_note: note, 
      reviewed_by: admin.user.id, 
      reviewed_at: new Date().toISOString() 
    })
    .eq('id', reportId)

  if (updateError) return { success: false, error: updateError.message }

  // Audit Logs
  await logAuditAction(supabase, {
    actorId: admin.user.id,
    actorRole: admin.role,
    action: `report.${status}`,
    entityType: 'report',
    entityId: reportId,
    metadata: { note }
  })

  revalidatePath('/admin/reports', 'page')
  revalidatePath('/admin/admin-dashboard', 'page')
  return { success: true }
}

export async function suspendEventAction(eventId: string, reason: string) {
  const supabase = await createClient()
  const admin = await validateAdminRole(supabase)
  if (!isAdminAuthSuccess(admin)) return { success: false, error: admin.error }

  // Update events
  const { data: event, error: updateError } = await supabase
    .from('events')
    .update({ status: 'suspended', admin_notes: reason })
    .eq('id', eventId)
    .select('host_id, title')
    .single()

  if (updateError) return { success: false, error: updateError.message }

  // Audit Logs
  await logAuditAction(supabase, {
    actorId: admin.user.id,
    actorRole: admin.role,
    action: 'event.suspended',
    entityType: 'event',
    entityId: eventId,
    metadata: { reason }
  })

  // Send notification to host
  const { sendNotification } = await import('@/lib/notifications/send')
  await sendNotification(event.host_id, 'event_suspended', {
    event_title: event.title,
    reason: reason
  })

  revalidatePath('/admin/events', 'page')
  revalidatePath(`/events/${eventId}`, 'page')
  return { success: true }
}

export async function approveEventAction(eventId: string) {
  const supabase = await createClient()
  const admin = await validateAdminRole(supabase)
  if (!isAdminAuthSuccess(admin)) return { success: false, error: admin.error }

  // Update events
  const { data: event, error: updateError } = await supabase
    .from('events')
    .update({ status: 'published', admin_notes: 'Approved by admin', published_at: new Date().toISOString() })
    .eq('id', eventId)
    .select('host_id, title')
    .single()

  if (updateError) return { success: false, error: updateError.message }

  // Audit Logs
  await logAuditAction(supabase, {
    actorId: admin.user.id,
    actorRole: admin.role,
    action: 'event.approved',
    entityType: 'event',
    entityId: eventId
  })

  // Send notification to host
  const { sendNotification } = await import('@/lib/notifications/send')
  await sendNotification(event.host_id, 'event_approved', {
    event_title: event.title
  })

  revalidatePath('/admin/events', 'page')
  revalidatePath(`/events/${eventId}`, 'page')
  return { success: true }
}

export async function suspendUserAction(userId: string, reason: string, until?: string) {
  const supabase = await createClient()
  const admin = await validateAdminRole(supabase)
  if (!isAdminAuthSuccess(admin)) return { success: false, error: admin.error }

  // Update users
  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      is_suspended: true, 
      suspension_reason: reason, 
      suspended_until: until || null 
    })
    .eq('id', userId)

  if (updateError) return { success: false, error: updateError.message }

  // Audit Logs
  await logAuditAction(supabase, {
    actorId: admin.user.id,
    actorRole: admin.role,
    action: 'user.suspended',
    entityType: 'user',
    entityId: userId,
    metadata: { reason, until }
  })

  // Invalidate all sessions
  await supabase
    .from('user_sessions')
    .delete()
    .eq('user_id', userId)

  revalidatePath('/admin/users', 'page')
  revalidatePath('/admin/admin-dashboard', 'page')
  return { success: true }
}

export async function unsuspendUserAction(userId: string) {
  const supabase = await createClient()
  const admin = await validateAdminRole(supabase)
  if (!isAdminAuthSuccess(admin)) return { success: false, error: admin.error }

  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      is_suspended: false, 
      suspension_reason: null, 
      suspended_until: null 
    })
    .eq('id', userId)

  if (updateError) return { success: false, error: updateError.message }

  // Audit Logs
  await logAuditAction(supabase, {
    actorId: admin.user.id,
    actorRole: admin.role,
    action: 'user.unsuspended',
    entityType: 'user',
    entityId: userId
  })

  revalidatePath('/admin/users', 'page')
  revalidatePath('/admin/admin-dashboard', 'page')
  return { success: true }
}

export async function unsuspendEventAction(eventId: string) {
  const supabase = await createClient()
  const admin = await validateAdminRole(supabase)
  if (!isAdminAuthSuccess(admin)) return { success: false, error: admin.error }

  const { error: updateError } = await supabase
    .from('events')
    .update({ status: 'published', admin_notes: 'Unsuspended by admin' })
    .eq('id', eventId)
    .select('title')
    .single()

  if (updateError) return { success: false, error: updateError.message }

  // Audit Logs
  await logAuditAction(supabase, {
    actorId: admin.user.id,
    actorRole: admin.role,
    action: 'event.unsuspended',
    entityType: 'event',
    entityId: eventId
  })

  revalidatePath('/admin/events', 'page')
  revalidatePath('/admin/admin-dashboard', 'page')
  revalidatePath(`/events/${eventId}`, 'page')
  return { success: true }
}

export async function processPayoutAction(payoutId: string) {
  const supabase = await createClient()
  const admin = await validateAdminRole(supabase)
  if (!isAdminAuthSuccess(admin)) return { success: false, error: admin.error }

  // 1. Fetch payout details
  const { data: payout, error: fetchError } = await supabase
    .from('payouts')
    .select('*, host:users(email, host_pages(razorpay_account_id))')
    .eq('id', payoutId)
    .single()

  if (fetchError || !payout) return { success: false, error: 'Payout not found' }

  // 2. Mock Razorpay Payout API Call
  const mockRazorpayPayoutId = `pout_${Math.random().toString(36).substring(2, 11)}`

  // 3. Update payout status
  const { error: updateError } = await supabase
    .from('payouts')
    .update({ 
      status: 'paid', 
      razorpay_payout_id: mockRazorpayPayoutId, 
      paid_at: new Date().toISOString() 
    })
    .eq('id', payoutId)

  if (updateError) return { success: false, error: updateError.message }

  // 4. Audit Log
  await logAuditAction(supabase, {
    actorId: admin.user.id,
    actorRole: admin.role,
    action: 'payout.processed',
    entityType: 'payout',
    entityId: payoutId,
    metadata: { amount: payout.net_amount }
  })

  revalidatePath('/admin/payouts', 'page')
  return { success: true }
}

export async function verifyHostAction(hostId: string, verified: boolean) {
  const supabase = await createClient()
  const admin = await validateAdminRole(supabase)
  if (!isAdminAuthSuccess(admin)) return { success: false, error: admin.error }

  // 1. Get user_id from host_profile
  const { data: hostProfile, error: fetchError } = await supabase
    .from('host_pages')
    .select('user_id')
    .eq('id', hostId)
    .single()

  if (fetchError || !hostProfile) return { success: false, error: 'Host not found' }

  // 2. Update users table (standard verification field)
  const { error: updateError } = await supabase
    .from('users')
    .update({ is_verified: verified })
    .eq('id', hostProfile.user_id)

  if (updateError) return { success: false, error: updateError.message }

  // Audit Logs
  await logAuditAction(supabase, {
    actorId: admin.user.id,
    actorRole: admin.role,
    action: verified ? 'host.verified' : 'host.unverified',
    entityType: 'host_profile',
    entityId: hostId
  })

  revalidatePath('/admin/hosts', 'page')
  return { success: true }
}

export async function upsertCategoryAction(category: {
  id?: string
  name: string
  slug: string
  description?: string
  icon_url?: string
  color_hex?: string
  parent_id?: string
  is_active?: boolean
  sort_order?: number
}) {
  const supabase = await createClient()
  const admin = await validateAdminRole(supabase)
  if (!isAdminAuthSuccess(admin)) return { success: false, error: admin.error }

  const { error } = await (supabase
    .from('categories') as any)
    .upsert({
      ...category,
      updated_at: new Date().toISOString()
    })

  if (error) return { success: false, error: error.message }

  // Audit Logs
  await logAuditAction(supabase, {
    actorId: admin.user.id,
    actorRole: admin.role,
    action: category.id ? 'category.updated' : 'category.created',
    entityType: 'category',
    entityId: category.id || 'new',
    newValues: category
  })

  revalidatePath('/admin/categories', 'layout')
  return { success: true }
}

export async function deleteCategoryAction(id: string) {
  const supabase = await createClient()
  const admin = await validateAdminRole(supabase)
  if (!isAdminAuthSuccess(admin)) return { success: false, error: admin.error }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  // Audit Logs
  await logAuditAction(supabase, {
    actorId: admin.user.id,
    actorRole: admin.role,
    action: 'category.deleted',
    entityType: 'category',
    entityId: id
  })

  revalidatePath('/admin/categories', 'layout')
  return { success: true }
}

export async function updatePlatformConfigAction(key: string, value: string) {
  const supabase = await createClient()
  const admin = await validateAdminRole(supabase)
  if (!isAdminAuthSuccess(admin)) return { success: false, error: admin.error }

  const { error } = await supabase
    .from('platform_config')
    .upsert({
      key,
      value,
      updated_by: admin.user.id,
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' })

  if (error) return { success: false, error: error.message }

  // Audit Logs
  await logAuditAction(supabase, {
    actorId: admin.user.id,
    actorRole: admin.role,
    action: 'config.updated',
    entityType: 'config',
    entityId: key,
    newValues: { value }
  })

  revalidatePath('/admin/config', 'layout')
  return { success: true }
}

export async function manageFeaturedSlotAction(
  eventId: string, 
  slotType: 'homepage_hero' | 'homepage_grid' | 'category_top' | 'city_top' | 'sponsored' | 'none',
  city?: string,
  categoryId?: string
) {
  const supabase = await createClient()
  const admin = await validateAdminRole(supabase)
  if (!isAdminAuthSuccess(admin)) return { success: false, error: admin.error }

  if (slotType === 'none') {
    const { error } = await supabase
      .from('featured_slots')
      .delete()
      .eq('event_id', eventId)
    
    if (error) return { success: false, error: error.message }

    // Audit Logs
    await logAuditAction(supabase, {
      actorId: admin.user.id,
      actorRole: admin.role,
      action: 'featured_slot.removed',
      entityType: 'event',
      entityId: eventId
    })

  } else {
    const { error } = await supabase
      .from('featured_slots')
      .upsert({
        event_id: eventId,
        slot_type: slotType,
        city: city || null,
        category_id: categoryId || null,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'event_id' })

    if (error) return { success: false, error: error.message }

    // Audit Logs
    await logAuditAction(supabase, {
      actorId: admin.user.id,
      actorRole: admin.role,
      action: 'featured_slot.assigned',
      entityType: 'event',
      entityId: eventId,
      newValues: { slotType, city, categoryId }
    })
  }

  revalidatePath('/admin/featured', 'page')
  revalidatePath('/', 'page')
  return { success: true }
}

export async function triggerAnalyticsSnapshotAction(daysAgo: number = 1) {
  const supabase = await createClient()
  const admin = await validateAdminRole(supabase)
  if (!isAdminAuthSuccess(admin)) return { success: false, error: admin.error }

  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() - daysAgo)
  const targetStr = targetDate.toISOString().split('T')[0]
  
  // 1. New Users
  const { count: newUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', targetStr + 'T00:00:00Z')
    .lt('created_at', targetStr + 'T23:59:59Z')

  // 2. New Events
  const { count: newEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', targetStr + 'T00:00:00Z')
    .lt('created_at', targetStr + 'T23:59:59Z')

  // 3. Bookings & Revenue
  const { data: bookingStats } = await supabase
    .from('bookings')
    .select('platform_fee, total_amount')
    .eq('status', 'confirmed')
    .gte('paid_at', targetStr + 'T00:00:00Z')
    .lt('paid_at', targetStr + 'T23:59:59Z')
  
  const totalBookings = bookingStats?.length || 0
  const totalRevenue = bookingStats?.reduce((acc: number, curr) => acc + Number(curr.total_amount), 0) || 0
  const totalPlatformFee = bookingStats?.reduce((acc: number, curr) => acc + Number(curr.platform_fee), 0) || 0

  // 4. Upsert into analytics_daily
  const { error } = await supabase
    .from('analytics_daily')
    .upsert({
      snapshot_date: targetStr,
      metric_type: 'platform',
      new_users: newUsers || 0,
      new_events: newEvents || 0,
      total_bookings: totalBookings,
      total_revenue: totalRevenue,
      total_platform_fee: totalPlatformFee,
      page_views: 0
    }, { onConflict: 'snapshot_date,metric_type' })

  if (error) return { success: false, error: error.message }

  // Audit Logs
  await logAuditAction(supabase, {
    actorId: admin.user.id,
    actorRole: admin.role,
    action: 'analytics.snapshot_triggered',
    entityType: 'analytics',
    entityId: targetStr
  })

  revalidatePath('/admin/analytics', 'page')
  return { success: true, date: targetStr }
}

export async function sendHostMessageAction(hostUserId: string, message: string) {
  const supabase = await createClient()
  const admin = await validateAdminRole(supabase)
  if (!isAdminAuthSuccess(admin)) return { success: false, error: admin.error }

  // 1. Log in audit (optional but good)
  await logAuditAction(supabase, {
    actorId: admin.user.id,
    actorRole: admin.role,
    action: 'host.message_sent',
    entityType: 'user',
    entityId: hostUserId,
    metadata: { message_preview: message.substring(0, 50) + '...' }
  })

  // 2. Send notification
  const { sendNotification } = await import('@/lib/notifications/send')
  await sendNotification(hostUserId, 'admin_message', {
    message_content: message,
    sent_by: 'Platform Administrator'
  })

  return { success: true }
}
