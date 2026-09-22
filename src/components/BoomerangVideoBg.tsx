import { useEffect, useRef, useState } from 'react'

const VIDEO_SRC =
  'https://meez.design/web/media/prompt-media/v/83285e780cd09e92.mp4'
const MAX_CAPTURE_WIDTH = 960
const FRAME_INTERVAL = 1000 / 30

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: () => void) => number
  cancelVideoFrameCallback?: (handle: number) => void
}

export default function BoomerangVideoBg() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const framesRef = useRef<HTMLCanvasElement[]>([])
  const capturedTimesRef = useRef<Set<number>>(new Set())
  const capturingRef = useRef(false)
  const [framesReady, setFramesReady] = useState(false)

  useEffect(() => {
    const video = videoRef.current as VideoWithFrameCallback | null
    if (!video) return

    let cancelled = false
    let stopCaptureLoop: (() => void) | undefined

    const captureFrame = () => {
      if (!capturingRef.current || cancelled) return
      if (video.readyState < 2 || video.videoWidth === 0) return

      const time = video.currentTime
      if (capturedTimesRef.current.has(time)) return
      capturedTimesRef.current.add(time)

      const scale = Math.min(1, MAX_CAPTURE_WIDTH / video.videoWidth)
      const width = Math.round(video.videoWidth * scale)
      const height = Math.round(video.videoHeight * scale)

      const frame = document.createElement('canvas')
      frame.width = width
      frame.height = height
      const ctx = frame.getContext('2d', { alpha: false })
      if (!ctx) return

      try {
        ctx.drawImage(video, 0, 0, width, height)
        framesRef.current.push(frame)
      } catch {
        capturingRef.current = false
      }
    }

    const startCaptureLoop = () => {
      if (typeof video.requestVideoFrameCallback === 'function') {
        let handle = 0
        const tick = () => {
          captureFrame()
          if (!capturingRef.current || cancelled) return
          handle = video.requestVideoFrameCallback!(tick)
        }
        handle = video.requestVideoFrameCallback(tick)
        stopCaptureLoop = () => video.cancelVideoFrameCallback?.(handle)
        return
      }

      let raf = 0
      const tick = () => {
        captureFrame()
        if (!capturingRef.current || cancelled) return
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
      stopCaptureLoop = () => cancelAnimationFrame(raf)
    }

    const begin = () => {
      if (cancelled || capturingRef.current) return
      capturingRef.current = true
      framesRef.current = []
      capturedTimesRef.current = new Set()
      video.muted = true
      video.loop = false
      video.playsInline = true
      void video.play()
      startCaptureLoop()
    }

    const finish = () => {
      captureFrame()
      capturingRef.current = false
      stopCaptureLoop?.()
      if (cancelled) return
      if (framesRef.current.length > 0) {
        setFramesReady(true)
        return
      }
      video.loop = true
      void video.play()
    }

    video.addEventListener('loadeddata', begin)
    video.addEventListener('ended', finish)

    if (video.readyState >= 2) begin()

    return () => {
      cancelled = true
      capturingRef.current = false
      stopCaptureLoop?.()
      video.removeEventListener('loadeddata', begin)
      video.removeEventListener('ended', finish)
      video.pause()
    }
  }, [])

  useEffect(() => {
    if (!framesReady) return

    const canvas = canvasRef.current
    const frames = framesRef.current
    if (!canvas || frames.length === 0) return

    const first = frames[0]
    canvas.width = first.width
    canvas.height = first.height
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    let index = 0
    let direction = 1
    ctx.drawImage(frames[0], 0, 0)

    if (frames.length === 1) return

    const interval = window.setInterval(() => {
      if (index >= frames.length - 1) direction = -1
      else if (index <= 0) direction = 1
      index += direction
      ctx.drawImage(frames[index], 0, 0)
    }, FRAME_INTERVAL)

    return () => window.clearInterval(interval)
  }, [framesReady])

  return (
    <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
      <div className="relative h-full w-full scale-[1.15] origin-top overflow-hidden">
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          crossOrigin="anonymous"
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ display: framesReady ? 'none' : 'block' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ display: framesReady ? 'block' : 'none' }}
        />
      </div>
    </div>
  )
}
