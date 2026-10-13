import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { io } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const API_URL = "http://localhost:3000"

const planOptions = [
  { label: "FLOW-FULL", value: "FLOW-FULL" },
  { label: "FLOW-LITE", value: "FLOW-LITE" },
  { label: "FLOW-TV", value: "FLOW-TV" },
]

const failureOptions = [
  { label: "Ninguno", value: "none" },
  { label: "Billing", value: "billing" },
  { label: "Provisioning", value: "provisioning" },
]

type Activation = {
  _id: string
  customerId: string
  planId: string
  simulateFailure: string
  status: "PENDING" | "IN_PROGRESS" | "ACTIVE" | "FAILED"
  history: { eventType: string; at: string }[]
  createdAt: string
}

const statusStyles: Record<Activation["status"], string> = {
  PENDING: "bg-gray-200 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-600 text-white",
  FAILED: "bg-red-600 text-white",
}

const eventStyles: Record<string, { dot: string; text: string }> = {
  BillingAccountCreated: { dot: "bg-green-600", text: "text-green-700" },
  ProvisioningCompleted: { dot: "bg-green-600", text: "text-green-700" },
  ActivationCompleted: { dot: "bg-green-600", text: "text-green-700" },
  BillingFailed: { dot: "bg-red-600", text: "text-red-700" },
  ProvisioningFailed: { dot: "bg-red-600", text: "text-red-700" },
  ActivationFailed: { dot: "bg-red-600", text: "text-red-700" },
  BillingAccountCancelled: { dot: "bg-orange-500", text: "text-orange-700" },
}
const defaultEventStyle = { dot: "bg-gray-400", text: "text-foreground" }

// "2026-10-13T14:02:28.077Z" -> "11:02:28.077" 
function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString("es-AR") + "." + String(d.getMilliseconds()).padStart(3, "0")
}

function App() {
  const [customerId, setCustomerId] = useState("C-1234")
  const [planId, setPlanId] = useState("FLOW-FULL")
  const [simulateFailure, setSimulateFailure] = useState("none")

  const [activations, setActivations] = useState<Activation[]>([])
  const [connected, setConnected] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  //WebSocket connection
  useEffect(() => {
    const socket = io(API_URL)
    socket.on("connect", () => setConnected(true))
    socket.on("disconnect", () => setConnected(false))
    socket.on("activation.updated", (updated: Activation) => {
      setActivations((current) => {
        const others = current.filter((a) => a._id !== updated._id)
        return [updated, ...others].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      })
    })
    //close connection
    return () => {
      socket.disconnect()
    }
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      const res = await fetch(`${API_URL}/activations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, planId, simulateFailure }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.message ?? `La API respondió ${res.status}`)
      }
    } catch {
      setError("No se pudo conectar con la API. ¿Está corriendo?")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Encabezado: título a la izquierda, estado de la conexión a la derecha */}
      <header className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-bold">Activación de servicios</h1>
        <Badge className={connected ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
          {connected ? "Conectado" : "Desconectado"}
        </Badge>
      </header>

      {/* Dos columnas: formulario a la izquierda, activaciones a la derecha */}
      <main className="grid grid-cols-[300px_1fr] gap-6 items-start">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Contratar plan</CardTitle>
              <CardDescription>Elegí el cliente, el plan y si querés forzar un fallo</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="customerId">Cliente</Label>
                <Input
                  id="customerId"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="planId">Plan</Label>
                <Select value={planId} onValueChange={setPlanId}>
                  <SelectTrigger id="planId" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {planOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="simulateFailure">Forzar fallo</Label>
                <Select value={simulateFailure} onValueChange={setSimulateFailure}>
                  <SelectTrigger id="simulateFailure" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {failureOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button className="w-full" type="submit" disabled={sending}>
                {sending ? "Enviando..." : "Contratar"}
              </Button>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </CardFooter>
          </Card>
        </form>

        {/* Etapa 5: una tarjeta por activación, con su estado y su timeline */}
        <section className="flex flex-col gap-4">
          {activations.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Todavía no hay activaciones. Contratá un plan para empezar.
            </div>
          )}

          {activations.map((activation) => (
            <Card key={activation._id}>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="font-mono">{activation._id}</CardTitle>
                  <CardDescription>
                    {activation.customerId} · {activation.planId}
                    {activation.simulateFailure !== "none" && ` · falla ${activation.simulateFailure}`}
                  </CardDescription>
                </div>
                <Badge className={statusStyles[activation.status]}>{activation.status}</Badge>
              </CardHeader>
              <CardContent>
                <ol className="ml-1 border-l border-border">
                  {activation.history.map((entry, i) => {
                    const style = eventStyles[entry.eventType] ?? defaultEventStyle
                    return (
                      <li key={i} className="relative flex justify-between gap-4 py-1 pl-5 text-sm">
                        <span className={`absolute -left-[5.5px] top-2.5 size-2.5 rounded-full ${style.dot}`} />
                        <span className={style.text}>{entry.eventType}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {formatTime(entry.at)}
                        </span>
                      </li>
                    )
                  })}
                </ol>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  )
}

export default App