import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se ha proporcionado ningún archivo" }, { status: 400 })
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo debe ser una imagen" }, { status: 400 })
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "La imagen no debe superar los 5MB" }, { status: 400 })
    }

    // Generar un nombre único para el archivo
    const extension = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${extension}`

    try {
      // Subir el archivo a Vercel Blob
      const blob = await put(fileName, file, {
        access: "public",
      })

      return NextResponse.json({ url: blob.url })
    } catch (blobError) {
      console.error("Error al subir a Vercel Blob:", blobError)
      return NextResponse.json(
        { error: "Error al procesar la carga de archivos: " + blobError.message },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error en la ruta de carga:", error)
    return NextResponse.json(
      { error: "Error al procesar la solicitud: " + (error.message || "Error desconocido") },
      { status: 500 },
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
