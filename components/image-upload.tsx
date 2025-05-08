"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Upload, X, ImageIcon } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  disabled?: boolean
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen (JPG, PNG, GIF, etc.)")
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar los 5MB")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al subir la imagen")
      }

      const data = await response.json()
      onChange(data.url)
    } catch (err) {
      console.error("Error al subir la imagen:", err)
      setError(err instanceof Error ? err.message : "Error al subir la imagen")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    onChange("")
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-input",
          "relative",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {value ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-md">
            <div className="absolute top-2 right-2 z-10">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleRemoveImage}
                disabled={disabled || isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Image
              src={value || "/placeholder.svg"}
              alt="Logo de la marca"
              fill
              className="object-contain"
              onError={(e) => {
                // Fallback para imágenes que no cargan
                e.currentTarget.src = "/abstract-logo.png"
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            {isUploading ? (
              <div className="flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
              </div>
            ) : (
              <>
                <div className="mb-4 rounded-full bg-primary/10 p-4">
                  <ImageIcon className="h-8 w-8 text-primary" />
                </div>
                <p className="mb-2 text-sm font-medium">Arrastra y suelta una imagen aquí</p>
                <p className="mb-4 text-xs text-muted-foreground">
                  O haz clic para seleccionar un archivo (JPG, PNG, GIF, máx. 5MB)
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={disabled || isUploading}
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Seleccionar Imagen
                </Button>
              </>
            )}
          </div>
        )}
        <Input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

export default ImageUpload
