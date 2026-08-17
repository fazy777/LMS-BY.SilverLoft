"use client"
import React, { useRef, useEffect } from 'react'

interface UniversalVideoPlayerProps {
  videoIdOrUrl?: string | null
  title?: string
  autoPlay?: boolean
  playbackSpeed?: number
  onEnded?: () => void
  className?: string
  fallbackUrl?: string
}

/**
 * Extracts a YouTube embed URL if the string is a YouTube URL or standard 11-character ID.
 */
export function getYouTubeEmbedUrl(urlOrId?: string | null, autoPlay = true): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null
  const clean = urlOrId.trim()

  // Match full YouTube URLs, short URLs, embeds, or shorts
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i
  const match = clean.match(ytRegex)
  if (match && match[1]) {
    return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=${autoPlay ? 1 : 0}&rel=0&modestbranding=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`
  }

  // Match pure 11-char alphanumeric ID (e.g. dQw4w9WgXcQ)
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean) && !clean.includes('.') && !clean.includes('/')) {
    return `https://www.youtube-nocookie.com/embed/${clean}?autoplay=${autoPlay ? 1 : 0}&rel=0&modestbranding=1&enablejsapi=1`
  }

  return null
}

/**
 * Extracts a Vimeo embed URL if applicable.
 */
export function getVimeoEmbedUrl(urlOrId?: string | null, autoPlay = true): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null
  const clean = urlOrId.trim()
  const vimeoRegex = /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i
  const match = clean.match(vimeoRegex)
  if (match && match[1]) {
    return `https://player.vimeo.com/video/${match[1]}?autoplay=${autoPlay ? 1 : 0}&title=0&byline=0&portrait=0`
  }
  return null
}

/**
 * Resolves any video source into a valid streamable URL.
 */
export function resolveDirectVideoUrl(videoIdOrUrl?: string | null, fallbackUrl?: string): string {
  if (!videoIdOrUrl || videoIdOrUrl.trim() === '') {
    return fallbackUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  }
  const clean = videoIdOrUrl.trim()
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean
  }
  if (clean.startsWith('lms/') || clean.startsWith('upload-') || clean.startsWith('lesson-')) {
    return `https://res.cloudinary.com/ss3mteu4/video/upload/${clean}.mp4`
  }
  return clean
}

export default function UniversalVideoPlayer({
  videoIdOrUrl,
  title = 'Course Video',
  autoPlay = true,
  playbackSpeed = 1,
  onEnded,
  className = 'w-full h-full object-contain',
  fallbackUrl,
}: UniversalVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed
    }
  }, [playbackSpeed])

  const youtubeEmbed = getYouTubeEmbedUrl(videoIdOrUrl, autoPlay)
  const vimeoEmbed = getVimeoEmbedUrl(videoIdOrUrl, autoPlay)

  // 1. YouTube Player Embed
  if (youtubeEmbed) {
    return (
      <iframe
        key={youtubeEmbed}
        src={youtubeEmbed}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className={`w-full h-full border-0 ${className}`}
      />
    )
  }

  // 2. Vimeo Player Embed
  if (vimeoEmbed) {
    return (
      <iframe
        key={vimeoEmbed}
        src={vimeoEmbed}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className={`w-full h-full border-0 ${className}`}
      />
    )
  }

  // 3. HTML5 Direct Video Player (MP4, WebM, Cloudinary, HLS)
  const directSrc = resolveDirectVideoUrl(videoIdOrUrl, fallbackUrl)

  return (
    <video
      ref={videoRef}
      key={directSrc}
      src={directSrc}
      controls
      autoPlay={autoPlay}
      playsInline
      onEnded={onEnded}
      className={className}
    />
  )
}
