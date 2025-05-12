"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"

export default function FixTicketsPage() {
  const [checkResult, setCheckResult] = useState(null)
  const [fixResult, setFixResult] = useState(null)
  const [testResult, setTestResult] = useState(null)
  const [loading, setLoading] = useState({ check: false, fix: false, test: false })
  const [testTicket, setTestTicket] = useState("123")
  const [error, setError] = useState(null)

  const checkTickets = async () => {
    try {
      setLoading({ ...loading, check: true })
      setError(null)
      const response = await fetch("/api/check-tickets")
      const data = await response.json()
      setCheckResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading({ ...loading, check: false })
    }
  }

  const fixTickets = async () => {
    try {
      setLoading({ ...loading, fix: true })
      setError(null)
      const response = await fetch("/api/fix-tickets")
      const data = await response.json()
      setFixResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading({ ...loading, fix: false })
    }
  }

  const testTicketInsert = async () => {
    try {
      setLoading({ ...loading, test: true })
      setError(null)
      const response = await fetch(`/api/test-ticket-insert?ticket=${testTicket}`)
      const data = await response.json()
      setTestResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading({ ...loading, test: false })
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Herramienta de Diagnóstico y Corrección de Tickets</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="check">
        <TabsList className="mb-4">
          <TabsTrigger value="check">Verificar</TabsTrigger>
          <TabsTrigger value="fix">Corregir</TabsTrigger>
          <TabsTrigger value="test">Probar</TabsTrigger>
        </TabsList>

        <TabsContent value="check">
          <Card>
            <CardHeader>
              <CardTitle>Verificar Estructura de Tickets</CardTitle>
              <CardDescription>Verifica la estructura actual de la tabla, triggers y restricciones.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={checkTickets} disabled={loading.check}>
                {loading.check ? "Verificando..." : "Verificar Tickets"}
              </Button>

              {checkResult && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Resultado:</h3>
                  <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                    <pre>{JSON.stringify(checkResult, null, 2)}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fix">
          <Card>
            <CardHeader>
              <CardTitle>Corregir Configuración de Tickets</CardTitle>
              <CardDescription>
                Elimina triggers problemáticos y crea un nuevo trigger que respete los valores de ticket.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fixTickets} disabled={loading.fix} variant="destructive">
                {loading.fix ? "Corrigiendo..." : "Corregir Tickets"}
              </Button>

              {fixResult && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Resultado:</h3>
                  <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                    <pre>{JSON.stringify(fixResult, null, 2)}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Probar Inserción de Ticket</CardTitle>
              <CardDescription>Prueba si los valores de ticket se respetan al insertar.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Input
                  type="number"
                  value={testTicket}
                  onChange={(e) => setTestTicket(e.target.value)}
                  placeholder="Valor de ticket"
                  className="max-w-xs"
                />
                <Button onClick={testTicketInsert} disabled={loading.test}>
                  {loading.test ? "Probando..." : "Probar Inserción"}
                </Button>
              </div>

              {testResult && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Resultado:</h3>
                  <Alert variant={testResult.data?.resultado?.includes("ÉXITO") ? "default" : "destructive"}>
                    <AlertTitle>{testResult.data?.resultado?.split(":")[0]}</AlertTitle>
                    <AlertDescription>{testResult.data?.resultado?.split(":")[1]}</AlertDescription>
                  </Alert>
                  <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 mt-4">
                    <pre>{JSON.stringify(testResult, null, 2)}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
