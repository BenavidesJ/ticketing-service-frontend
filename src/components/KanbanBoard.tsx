import { useEffect, useState } from "react"
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { LogOut, Plus, RefreshCw } from "lucide-react"
import { apiService } from "../lib/api-service"
import { CreateTicketDialog } from "./CreateTicketDialog"
import { TicketCard } from "./TicketCard"


interface User {
  idUsuario: number
  Nombre: string
  Apellido1: string
  Apellido2: string
  Correo: string
  Access_token: string
  Tipo_Usuario: number
}

interface Ticket {
  idTicket: number
  titulo: string
  descripcion: string
  fechaCreacion: string
  fechaActualizacion: string
  tipoTicket: number
  idSoporte: number
  idCliente: number
  prioridad: number
  estado: number
  activo: boolean
  idDepartamento: number
  estadoTicket?: { descripcionEstado: string }
  clienteReporta?: { nombre: string; apellido1: string }
  soporteAsignado?: { nombre: string; apellido1: string }
  nivelPrioridad?: { descripcionPrioridad: string }
  categoriaTicket?: { descripcionTipo: string }
  departamentoAsignado?: { descripcionDepartamento: string }
}

interface KanbanBoardProps {
  user: User
  onLogout: () => void
}

export function KanbanBoard({ user, onLogout }: KanbanBoardProps) {
  const [estadoMap, setEstadoMap] = useState<Record<string, number>>({})
  const [ticketsByStatus, setTicketsByStatus] = useState<Record<string, Ticket[]>>({})
  const [loading, setLoading] = useState(true)
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await apiService.getTickets()
      const data = response.data || {}

      // Crear el mapa de estadoNombre → idEstado
      const map: Record<string, number> = {}
      Object.entries(data).forEach(([estadoNombre, tickets]: any) => {
        if (tickets.length > 0) {
          map[estadoNombre] = tickets[0].estado // todos tienen el mismo estado numérico
        }
      })

      setEstadoMap(map)
      setTicketsByStatus(data)
    } catch (error) {
      console.error("Error fetching tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [user.Access_token])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const ticket = Object.values(ticketsByStatus)
      .flat()
      .find((t) => t.idTicket.toString() === active.id)
    setActiveTicket(ticket || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTicket(null)

    if (!over) return

    const ticketId = active.id.toString()
    const overId = over.id.toString()

    let currentStatus = ""
    let ticket: Ticket | undefined

    for (const [status, tickets] of Object.entries(ticketsByStatus)) {
      const found = tickets.find((t) => t.idTicket.toString() === ticketId)
      if (found) {
        currentStatus = status
        ticket = found
        break
      }
    }

    if (!ticket) return

    // Determinar el nuevo estado
    let newStatus: string | undefined

    // 1. Si se soltó sobre una columna directamente
    if (Object.keys(ticketsByStatus).includes(overId)) {
      newStatus = overId
    } else {
      // 2. Si se soltó sobre otro ticket: buscar a qué columna pertenece ese ticket
      for (const [estado, tickets] of Object.entries(ticketsByStatus)) {
        if (tickets.some((t) => t.idTicket.toString() === overId)) {
          newStatus = estado
          break
        }
      }
    }

    if (!newStatus || newStatus === currentStatus) return

    const newEstadoId = estadoMap[newStatus]
    if (!newEstadoId) {
      console.warn("No se encontró el ID del estado:", newStatus)
      return
    }

    try {
      await apiService.updateTicketStatus(ticket.idTicket, newEstadoId, user.idUsuario)

      setTicketsByStatus((prev) => {
        const newState = { ...prev }

        // Remover de la columna actual
        newState[currentStatus] = newState[currentStatus].filter(
          (t) => t.idTicket !== ticket!.idTicket
        )

        // Agregar a la nueva columna
        const updatedTicket = { ...ticket!, estado: newEstadoId }
        newState[newStatus!] = [...(newState[newStatus!] || []), updatedTicket]

        return newState
      })
    } catch (error) {
      console.error("Error updating ticket status:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Sistema de Tickets</h1>
              <Button variant="outline" size="sm" onClick={fetchTickets} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Ticket
              </Button>
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user.Nombre.charAt(0)}
                    {user.Apellido1.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {user.Nombre} {user.Apellido1}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(ticketsByStatus).map(([estado, tickets]) => (
              <Card key={estado} className="bg-gray-100 border-gray-200 min-h-[600px]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>{estado}</span>
                    <Badge variant="secondary">{tickets.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    id={estado}
                    data-column-id={estado}
                    className="min-h-[100px] flex flex-col space-y-3"
                  >
                    <SortableContext
                      id={estado}
                      items={tickets.map((t) => t.idTicket.toString())}
                      strategy={verticalListSortingStrategy}
                    >
                      {tickets.length === 0 ? (
                        <div className="rounded border border-dashed border-gray-300 py-8 text-center text-sm text-gray-400">
                          Arrastra aquí para agregar un ticket
                        </div>
                      ) : (
                        tickets.map((ticket) => (
                          <TicketCard key={ticket.idTicket} ticket={ticket} statusId={estado} />
                        ))
                      )}
                    </SortableContext>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>


          <DragOverlay>{activeTicket ? <TicketCard ticket={activeTicket} statusId="" isDragging /> : null}</DragOverlay>
        </DndContext>
      </div>

      <CreateTicketDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        user={user}
        onTicketCreated={fetchTickets}
      />
    </div>
  )
}
