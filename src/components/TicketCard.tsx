import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Calendar, User, AlertCircle } from "lucide-react"

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

interface TicketCardProps {
  ticket: Ticket
  statusId?: string
  isDragging?: boolean
}

export function TicketCard({ ticket, statusId, isDragging = false }: TicketCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: ticket.idTicket.toString(),
    data: {
      type: "ticket",
      ticket,
      statusId,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "alta":
        return "bg-red-100 text-red-800 border-red-200"
      case "media":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "baja":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow mb-2 ${
        isDragging || isSortableDragging ? "shadow-lg" : ""
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-sm line-clamp-2">{ticket.titulo}</h3>
          <Badge variant="outline" className="text-xs">
            #{ticket.idTicket}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{ticket.descripcion}</p>

        <div className="space-y-2">
          {/* Priority */}
          {ticket.nivelPrioridad && (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3 w-3" />
              <Badge
                variant="outline"
                className={`text-xs ${getPriorityColor(ticket.nivelPrioridad.descripcionPrioridad)}`}
              >
                {ticket.nivelPrioridad.descripcionPrioridad}
              </Badge>
            </div>
          )}

          {/* Type */}
          {ticket.categoriaTicket && (
            <Badge variant="secondary" className="text-xs">
              {ticket.categoriaTicket.descripcionTipo}
            </Badge>
          )}

          {/* Assigned to */}
          {ticket.soporteAsignado && (
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              <span className="text-xs text-gray-600">
                {ticket.soporteAsignado.nombre} {ticket.soporteAsignado.apellido1}
              </span>
            </div>
          )}

          {/* Client */}
          {ticket.clienteReporta && (
            <div className="flex items-center gap-2">
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-xs">{ticket.clienteReporta.nombre.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-600">
                {ticket.clienteReporta.nombre} {ticket.clienteReporta.apellido1}
              </span>
            </div>
          )}

          {/* Date */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Calendar className="h-3 w-3" />
            <span className="text-xs text-gray-500">{formatDate(ticket.fechaCreacion)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
