"use client"
import { Play, ArrowLeft, Home, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  video: {
    id: string
    name: string
    mimeType: string
  }
  onClose: () => void
  onBack?: () => void
  onHome?: () => void
  showNavigation?: boolean
}

export default function VideoPlayer({ video, onClose, onBack, onHome, showNavigation = false }: VideoPlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showPlayButton, setShowPlayButton] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)

  const embedUrl = `https://drive.google.com/file/d/${video.id}/preview`

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
      setIsFullscreen(false)
    } else {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    }
  }

  const handleMouseMove = () => {
    setShowControls(true)

    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
    }

    const timeout = setTimeout(() => {
      setShowControls(false)
    }, 3000)

    setControlsTimeout(timeout)
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "s" || e.key === "S" || e.key === "p" || e.key === "P" || e.key === "u" || e.key === "U")
      ) {
        e.preventDefault()
        return
      }

      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          onClose()
        }
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault()
        toggleFullscreen()
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    window.addEventListener("keydown", handleKeyPress)
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    const container = videoContainerRef.current
    if (container) {
      container.addEventListener("contextmenu", handleContextMenu)
    }

    const timeout = setTimeout(() => {
      setShowControls(false)
    }, 3000)
    setControlsTimeout(timeout)

    return () => {
      window.removeEventListener("keydown", handleKeyPress)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      if (container) {
        container.removeEventListener("contextmenu", handleContextMenu)
      }
      if (controlsTimeout) {
        clearTimeout(controlsTimeout)
      }
    }
  }, [onClose])

  const handleClose = () => {
    onClose()
  }

  const handleBackClick = () => {
    if (onBack) {
      onBack()
      onClose()
    }
  }

  const handleHomeClick = () => {
    if (onHome) {
      onHome()
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={handleClose}
      onMouseMove={handleMouseMove}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      <div
        ref={videoContainerRef}
        className={`relative w-full bg-black rounded-lg overflow-hidden shadow-2xl ${
          isFullscreen ? "h-full max-w-none max-h-none" : "max-w-5xl max-h-[100vh]"
        }`}
        onClick={(e) => e.stopPropagation()}
        onDragStart={(e) => e.preventDefault()}
      >
        <div
          className={`absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/90 to-transparent p-2 sm:p-3 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-white font-semibold text-xs sm:text-sm md:text-base line-clamp-1 text-balance max-w-[60%] pr-2">
              {video.name}
            </h2>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {showNavigation && onHome && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleHomeClick}
                  className="h-7 sm:h-8 px-2 sm:px-3 text-white hover:bg-white/20"
                >
                  <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Inicio</span>
                </Button>
              )}
              {showNavigation && onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackClick}
                  className="h-7 sm:h-8 px-2 sm:px-3 text-white hover:bg-white/20"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Atrás</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-white hover:bg-white/20"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="relative bg-black aspect-video">
          {showPlayButton && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 cursor-pointer"
              onClick={() => setShowPlayButton(false)}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/90 flex items-center justify-center transform hover:scale-110 transition-transform duration-200 shadow-2xl">
                <Play className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground ml-1" />
              </div>
            </div>
          )}

          <div
            className="absolute inset-0 z-[5]"
            style={{ pointerEvents: "none" }}
            onContextMenu={(e) => e.preventDefault()}
          />

          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
            style={{ border: "none", pointerEvents: "auto" }}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>
    </div>
  )
}
