import type React from "react"
import { useState } from "react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Alert, AlertDescription } from "./ui/alert"
import { apiService } from "../lib/api-service"

interface User {
  idUsuario: number
  Nombre: string
  Apellido1: string
  Apellido2: string
  Correo: string
  Access_token: string
  Tipo_Usuario: number
}

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onTicketCreated: () => void
}

export function CreateTicketDialog({ open, onOpenChange, user, onTicketCreated }: CreateTicketDialogProps) {
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    tipoTicket: "",
    prioridad: "",
    idDepartamento: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const ticketData = {
        ...formData,
        tipoTicket: Number.parseInt(formData.tipoTicket),
        prioridad: Number.parseInt(formData.prioridad),
        idDepartamento: Number.parseInt(formData.idDepartamento),
        idCliente: user.idUsuario,
        idSoporte: user.idUsuario, 
      }

      await apiService.createTicket(ticketData, user.Access_token)

      // Reset form
      setFormData({
        titulo: "",
        descripcion: "",
        tipoTicket: "",
        prioridad: "",
        idDepartamento: "",
      })

      onTicketCreated()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Error al crear el ticket")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Ticket</DialogTitle>
          <DialogDescription>Completa la información para crear un nuevo ticket de soporte.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Describe brevemente el problema"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Describe detalladamente el problema"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoTicket">Tipo de Ticket</Label>
                <Select
                  value={formData.tipoTicket}
                  onValueChange={(value: any) => setFormData({ ...formData, tipoTicket: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Problema técnico</SelectItem>
                    <SelectItem value="2">Solicitud de acceso</SelectItem>
                    <SelectItem value="3">Error en sistema</SelectItem>
                    <SelectItem value="4">Consulta general</SelectItem>
                    <SelectItem value="5">Reinstalación de software</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioridad">Prioridad</Label>
                <Select
                  value={formData.prioridad}
                  onValueChange={(value:any) => setFormData({ ...formData, prioridad: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Baja</SelectItem>
                    <SelectItem value="2">Media</SelectItem>
                    <SelectItem value="3">Alta</SelectItem>
                    <SelectItem value="4">Crítica</SelectItem>
                    <SelectItem value="5">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="departamento">Departamento</Label>
              <Select
                value={formData.idDepartamento}
                onValueChange={(value:any) => setFormData({ ...formData, idDepartamento: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">IT</SelectItem>
                  <SelectItem value="2">Recursos Humanos</SelectItem>
                  <SelectItem value="3">Finanzas</SelectItem>
                  <SelectItem value="4">Operaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
