"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface QueryResult {
  success: boolean
  message: string
  rowCount?: number
  rows?: any[]
  error?: string
}

export default function TestQueryPage() {
  const [result, setResult] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeQuery = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/test-query")
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    executeQuery()
  }, [])

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Prueba de Consulta SQL</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Ejecutando consulta...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="font-bold">Error</p>
              <p>{error}</p>
              <Button onClick={executeQuery} className="mt-4">
                Intentar de nuevo
              </Button>
            </div>
          ) : result ? (
            <div>
              {result.success ? (
                <div>
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                    <p>{result.message}</p>
                    <p>Se encontraron {result.rowCount} registros.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead>
                        <tr>
                          {result.rows && result.rows.length > 0
                            ? Object.keys(result.rows[0]).map((key) => (
                                <th key={key} className="px-4 py-2 border bg-gray-50 text-left">
                                  {key}
                                </th>
                              ))
                            : null}
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows?.map((row, rowIndex) => (
                          <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-gray-50" : ""}>
                            {Object.values(row).map((value, colIndex) => (
                              <td key={colIndex} className="px-4 py-2 border">
                                {value !== null ? value : "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button onClick={executeQuery} className="mt-4">
                    Actualizar
                  </Button>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  <p className="font-bold">Error</p>
                  <p>{result.error || "Error desconocido"}</p>
                  <Button onClick={executeQuery} className="mt-4">
                    Intentar de nuevo
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
