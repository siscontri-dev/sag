"use client"

import { useCallback } from "react"

// ... resto del código ...

// Actualizar la definición de tipos para las columnas
export interface ColumnaInforme {
  id: string
  header: string
  accessor: string
  align?: "left" | "right" | "center"
  isNumeric?: boolean
  format?: (value: any) => string // Opcional ahora
  formatType?: "number" | "date" | "currency" // Nuevo campo para indicar el tipo de formato
}

// ... resto del código ...

// Dentro del componente, actualizar la función que formatea los valores
const getCellValue = useCallback((item: any, column: ColumnaInforme) => {
  const value = item[column.accessor]
  if (value === undefined || value === null) return "-"

  // Si hay una función de formato personalizada, usarla
  if (column.format) {
    return column.format(value)
  }

  // Si no hay función pero hay un tipo de formato, aplicar el formato correspondiente
  if (column.formatType) {
    switch (column.formatType) {
      case "number":
        return typeof value === "number" ? value.toLocaleString() : value
      case "date":
        return typeof value === "string" ? new Date(value).toLocaleDateString() : value
      case "currency":
        return typeof value === "number" ? `$${value.toLocaleString()}` : value
      default:
        return value
    }
  }

  return value
}, [])

// ... resto del código ...
