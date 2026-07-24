import { Metadata } from 'next'
import { EventWithDetails } from '@/types/api.types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cityculture.in'

export function generateEventMetadata(event: EventWithDetails): Metadata {
  const city = event.city || event.location?.city || '';
  const category = event.category_name || event.category?.name || '';
  
  const title = `${event.title} ${city ? `in ${city}` : ''} | City Culture`
  const description = event.meta_description || event.short_description || `Experience ${event.title} ${city ? `in ${city}` : ''}. Join the City Culture community for unique ${category.toLowerCase()} events and meetups.`
  const url = `${SITE_URL}/events/${event.slug}`
  const image = event.cover_image_url || `${SITE_URL}/api/og/event/${event.slug}`
  
  const keywords = [
    event.title,
    city,
    category,
    'City Culture',
    'Events',
    'Meetups',
    'Making Friends',
    'Stranger Meetups',
    'Offline Events',
    'Community'
  ].filter(Boolean).join(', ')

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'City Culture',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
      locale: 'en_IN',
      type: 'article',
      publishedTime: event.created_at || undefined,
      modifiedTime: event.updated_at || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@citycultureindia',
    },
  }
}
