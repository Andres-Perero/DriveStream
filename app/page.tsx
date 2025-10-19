"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Loader2, Film, Folder, ArrowLeft, Moon, Sun, Home, ChevronRight, ArrowUpDown } from "lucide-react"
import VideoPlayer from "@/components/video-player"

interface DriveFile {
  id: string
  name: string
  mimeType: string
  thumbnailLink?: string
  size?: string
  videoMediaMetadata?: {
    durationMillis?: string
  }
}

type SortOrder = "asc" | "desc"

export default function HomePage() {
  const [items, setItems] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<DriveFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folderHistory, setFolderHistory] = useState<Array<{ id: string | null; name: string }>>([])
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [breadcrumbPath, setBreadcrumbPath] = useState<string[]>(["Inicio"])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  useEffect(() => {
    fetchItems()
  }, [currentFolderId])

  const fetchItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(currentFolderId ? `/api/drive-list?folderId=${currentFolderId}` : `/api/drive-list`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || "Error al cargar los archivos")
      }

      const data = await response.json()
      setItems(data.files || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      console.error("[v0] Error fetching items:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleFolderClick = (folder: DriveFile) => {
    setFolderHistory([...folderHistory, { id: currentFolderId, name: breadcrumbPath[breadcrumbPath.length - 1] }])
    setBreadcrumbPath([...breadcrumbPath, folder.name])
    setCurrentFolderId(folder.id)
  }

  const handleBackClick = () => {
    if (folderHistory.length > 0) {
      const previous = folderHistory[folderHistory.length - 1]
      setCurrentFolderId(previous.id)
      setFolderHistory(folderHistory.slice(0, -1))
      setBreadcrumbPath(breadcrumbPath.slice(0, -1))
    }
  }

  const handleItemClick = async (item: DriveFile) => {
    if (item.mimeType === "application/vnd.google-apps.folder") {
      handleFolderClick(item)
    } else {
      setSelectedVideo(item)
    }
  }

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return "N/A"
    const size = Number.parseInt(bytes)
    if (size < 1024) return size + " B"
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB"
    if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + " MB"
    return (size / (1024 * 1024 * 1024)).toFixed(1) + " GB"
  }

  const formatDuration = (durationMillis?: string) => {
    if (!durationMillis) return null
    const totalSeconds = Math.floor(Number.parseInt(durationMillis) / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleGoToRoot = () => {
    setCurrentFolderId(null)
    setFolderHistory([])
    setBreadcrumbPath(["Inicio"])
  }

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  const getCurrentFolderName = (): string => {
    if (currentFolderId === null) return "Inicio"
    if (folderHistory.length > 0) {
      const lastFolder = items.find((item) => item.id === currentFolderId)
      return lastFolder?.name || "Carpeta"
    }
    return "Carpeta"
  }

  const sortItems = (itemsToSort: DriveFile[], order: SortOrder) => {
    return [...itemsToSort].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name, "es", { sensitivity: "base" })
      return order === "asc" ? comparison : -comparison
    })
  }

  const folders = sortItems(
    items.filter((item) => item.mimeType === "application/vnd.google-apps.folder"),
    sortOrder,
  )
  const videos = sortItems(
    items.filter((item) => item.mimeType.includes("video")),
    sortOrder,
  )

  if (selectedVideo) {
    return (
      <VideoPlayer
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
        onBack={handleBackClick}
        onHome={handleGoToRoot}
        showNavigation={folderHistory.length > 0 || currentFolderId !== null}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
              </div>
              <h1 className="text-base sm:text-lg font-bold text-foreground truncate">DriveVideo</h1>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://ok.ru/profile/591200398770", "_blank")}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                title="Visitar perfil de OK.ru"
              >
                <svg
                  fill="currentColor"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                >
                  <path d="M11.986 12.341c-2.825 0-5.173-2.346-5.173-5.122C6.813 4.347 9.161 2 11.987 2c2.922 0 5.173 2.346 5.173 5.219a5.142 5.142 0 0 1-5.157 5.123l-.017-.001zm0-7.324c-1.196 0-2.106 1.005-2.106 2.203 0 1.196.91 2.106 2.107 2.106 1.245 0 2.107-.91 2.107-2.106.001-1.199-.862-2.203-2.108-2.203zm2.06 11.586 2.923 2.825c.575.621.575 1.531 0 2.106-.622.621-1.581.621-2.06 0l-2.922-2.873-2.826 2.873c-.287.287-.671.43-1.103.43-.335 0-.718-.144-1.054-.43-.575-.575-.575-1.485 0-2.107l2.97-2.825a13.49 13.49 0 0 1-3.063-1.339c-.719-.383-.862-1.34-.479-2.059.479-.718 1.341-.909 2.108-.43a6.62 6.62 0 0 0 6.897 0c.767-.479 1.676-.288 2.107.43.432.719.239 1.675-.432 2.059-.909.575-1.963 1.006-3.065 1.341l-.001-.001z" />
                </svg>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                {theme === "dark" ? (
                  <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </Button>
              {currentFolderId !== null && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoToRoot}
                  className="h-7 sm:h-8 px-2 sm:px-3 bg-transparent"
                >
                  <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Inicio</span>
                </Button>
              )}
              {folderHistory.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackClick}
                  className="h-7 sm:h-8 px-2 sm:px-3 bg-transparent"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Atrás</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchItems}
                disabled={loading}
                className="h-7 sm:h-8 px-2 sm:px-3 bg-transparent hidden xs:flex"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : "Actualizar"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {breadcrumbPath.length > 1 && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            {breadcrumbPath.map((pathName, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <ChevronRight className="w-4 h-4" />}
                <button
                  onClick={() => {
                    if (index === 0) {
                      handleGoToRoot()
                    } else {
                      const targetHistory = folderHistory[index - 1]
                      setCurrentFolderId(targetHistory.id)
                      setFolderHistory(folderHistory.slice(0, index - 1))
                      setBreadcrumbPath(breadcrumbPath.slice(0, index + 1))
                    }
                  }}
                  className={`hover:text-foreground transition-colors ${
                    index === breadcrumbPath.length - 1 ? "text-foreground font-medium" : ""
                  }`}
                >
                  {pathName}
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {folders.length > 0 && `${folders.length} carpeta${folders.length !== 1 ? "s" : ""}`}
              {folders.length > 0 && videos.length > 0 && " • "}
              {videos.length > 0 && `${videos.length} video${videos.length !== 1 ? "s" : ""}`}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSortOrder}
              className="h-7 sm:h-8 px-2 sm:px-3 gap-1.5 bg-transparent"
            >
              <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">{sortOrder === "asc" ? "A-Z" : "Z-A"}</span>
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-primary" />
            <p className="text-sm sm:text-base text-muted-foreground">Cargando archivos...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Film className="w-7 h-7 sm:w-8 sm:h-8 text-destructive" />
            </div>
            <p className="text-sm sm:text-base text-destructive font-medium text-center px-4">{error}</p>
            <Button onClick={fetchItems} variant="outline" size="sm">
              Reintentar
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center">
              <Film className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground" />
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">No se encontraron archivos</p>
          </div>
        ) : (
          <>
            {folders.length > 0 && (
              <div className="mb-5 sm:mb-6">
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2.5 sm:mb-3 flex items-center gap-2">
                  <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  Carpetas
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5 sm:gap-3">
                  {folders.map((folder) => (
                    <Card
                      key={folder.id}
                      className="group overflow-hidden hover:shadow-md hover:border-primary/50 transition-all duration-200 cursor-pointer border bg-card/50 backdrop-blur-sm"
                      onClick={() => handleItemClick(folder)}
                    >
                      <div className="relative aspect-square bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center">
                          <Folder className="w-8 h-8 sm:w-10 sm:h-10 text-primary/70 group-hover:scale-110 group-hover:text-primary transition-all duration-200" />
                        </div>
                      </div>
                      <div className="p-1.5 sm:p-2">
                        <h3 className="font-medium text-foreground text-[11px] sm:text-xs line-clamp-2 leading-tight">
                          {folder.name}
                        </h3>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {videos.length > 0 && (
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-foreground mb-2.5 sm:mb-3 flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  Videos
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5 sm:gap-3">
                  {videos.map((video, index) => (
                    <Card
                      key={index}
                      className="group overflow-hidden hover:shadow-md hover:border-primary/50 transition-all duration-200 cursor-pointer border bg-card/50 backdrop-blur-sm"
                      onClick={() => handleItemClick(video)}
                    >
                      <div className="relative aspect-video bg-muted overflow-hidden">
                        {video.thumbnailLink ? (
                          <img
                            src={video.thumbnailLink || "/placeholder.svg"}
                            alt={video.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                            <Film className="w-6 h-6 sm:w-8 sm:h-8 text-primary/40" />
                          </div>
                        )}
                        {formatDuration(video.videoMediaMetadata?.durationMillis) && (
                          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded">
                            {formatDuration(video.videoMediaMetadata?.durationMillis)}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/90 flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-200">
                            <Play className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="p-1.5 sm:p-2">
                        <h3 className="font-medium text-foreground text-[11px] sm:text-xs line-clamp-2 leading-tight mb-0.5 sm:mb-1">
                          {video.name}
                        </h3>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                          {formatFileSize(video.size)}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
