import { useEffect, useState } from "react"
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { LogOut, Plus } from "lucide-react"
import { apiService } from "../lib/api-service"
import { CreateTicketDialog } from "./CreateTicketDialog"
import { TicketCard } from "./TicketCard"
import { DroppableColumn } from "./DroppableColumn"
import { TicketDetailModal } from "./TicketDetailModal"

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

interface Estado {
  idEstado: number
  descripcionEstado: string
}

interface Props {
  user: User
  onLogout: () => void
}

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()

export function KanbanBoard({ user, onLogout }: Props) {
  const [estadoMap, setEstadoMap] = useState<Record<string, number>>({})
  const [labelMap, setLabelMap] = useState<Record<string, string>>({})
  const [ticketsByStatus, setTicketsByStatus] = useState<Record<string, Ticket[]>>({})
  const [loading, setLoading] = useState(true)
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const loadData = async () => {
    setLoading(true)
    const [estadosRes, ticketsRes] = await Promise.all([
      apiService.getEstados(),
      apiService.getTickets(),
    ])
    const estados: Estado[] = estadosRes.data || []
    const map: Record<string, number> = {}
    const labels: Record<string, string> = {}
    const columns: Record<string, Ticket[]> = {}
    estados.forEach((e) => {
      const k = normalize(e.descripcionEstado)
      map[k] = e.idEstado
      labels[k] = e.descripcionEstado
      columns[k] = []
    })
    const ticketsData: Record<string, Ticket[]> = ticketsRes.data || {}
    Object.entries(ticketsData).forEach(([nombreCol, listaTickets]) => {
      const k = normalize(nombreCol)
      columns[k] = listaTickets
      if (!map[k] && listaTickets.length) map[k] = listaTickets[0].estado
      if (!labels[k]) labels[k] = nombreCol
    })
    setEstadoMap(map)
    setLabelMap(labels)
    setTicketsByStatus(columns)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [user.Access_token])

  const handleDragStart = (e: DragStartEvent) => {
    const id = e.active.id.toString()
    const ticket =
      Object.values(ticketsByStatus).flat().find((t) => t.idTicket.toString() === id) || null
    setActiveTicket(ticket)
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveTicket(null)
    if (!e.over) return
    const draggedId = Number(e.active.id)
    const overIdRaw = e.over.id.toString()
    let from = ""
    let ticket: Ticket | undefined
    for (const [col, list] of Object.entries(ticketsByStatus)) {
      const found = list.find((t) => t.idTicket === draggedId)
      if (found) {
        from = col
        ticket = found
        break
      }
    }
    if (!ticket) return
    let to = normalize(overIdRaw)
    if (!estadoMap[to]) {
      for (const [col, list] of Object.entries(ticketsByStatus)) {
        if (list.some((t) => t.idTicket.toString() === overIdRaw)) {
          to = col
          break
        }
      }
    }
    if (to === from) {
      const newOrder = [...ticketsByStatus[from]]
      const oldIdx = newOrder.findIndex((t) => t.idTicket === draggedId)
      const newIdx = newOrder.findIndex((t) => t.idTicket.toString() === overIdRaw)
      newOrder.splice(oldIdx, 1)
      newOrder.splice(newIdx, 0, ticket)
      setTicketsByStatus((prev) => ({ ...prev, [from]: newOrder }))
      return
    }
    const newEstado = estadoMap[to]
    await apiService.updateTicketStatus(ticket.idTicket, newEstado, user.idUsuario)
    setTicketsByStatus((prev) => {
      const next = { ...prev }
      next[from] = next[from].filter((t) => t.idTicket !== draggedId)
      next[to] = [...next[to], { ...ticket!, estado: newEstado }]
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Sistema de Tickets</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Ticket
              </Button>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user.Nombre[0]}
                    {user.Apellido1[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {user.Nombre} {user.Apellido1}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(ticketsByStatus).map(([estadoKey, tickets]) => (
              <DroppableColumn id={estadoKey} key={estadoKey}>
                <Card className="min-h-[600px] bg-gray-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span>{labelMap[estadoKey] || estadoKey}</span>
                      <Badge variant="secondary">{tickets.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SortableContext
                      id={estadoKey}
                      items={tickets.map((t) => t.idTicket.toString())}
                      strategy={verticalListSortingStrategy}
                    >
                      {tickets.length ? (
                        tickets.map((t) => <TicketCard key={t.idTicket} ticket={t} onTicketClick={setSelectedTicket}/>)
                      ) : (
                        <div className="rounded border border-dashed py-8 text-center text-sm text-gray-400">
                          Arrastra aquí para agregar un ticket
                        </div>
                      )}
                    </SortableContext>
                  </CardContent>
                </Card>
              </DroppableColumn>
            ))}
          </div>
          <DragOverlay>{activeTicket ? <TicketCard ticket={activeTicket} isDragging /> : null}</DragOverlay>
        </DndContext>
      </div>
      <CreateTicketDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        user={user}
        onTicketCreated={loadData}
      />
      <TicketDetailModal
        ticket={selectedTicket}
        open={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
        user={user}
        onTicketUpdated={loadData}
      />
    </div>
  )
}
