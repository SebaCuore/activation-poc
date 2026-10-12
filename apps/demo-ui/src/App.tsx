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


function App() {
  return (
    <div className="max-w-5xl mx-auto p-6">

      {/* 2. Encabezado: título a la izquierda, badge a la derecha */}
      <header className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-bold">Activación de servicios</h1>
        <Badge className="bg-green-600 text-white">Conectado</Badge>
      </header>

      {/* 3. Dos columnas: 300px a la izquierda, el resto a la derecha */}
      <main className="grid grid-cols-[300px_1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contratar plan</CardTitle>
            <CardDescription>Selecciona el plan que mejor se adapte a tus necesidades</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="customerId">Cliente</Label>
              <Input id="customerId" defaultValue="C-1234" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="planId">Plan</Label>
              <Select defaultValue="FLOW-FULL">
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
              <Select  defaultValue="none">
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
          <CardFooter>
            <Button className="w-full">Contratar</Button>
          </CardFooter>
        </Card>

        <div className="border rounded-lg p-4">
          Todavía no hay activaciones.
        </div>
      </main>

    </div>
  )
}

export default App