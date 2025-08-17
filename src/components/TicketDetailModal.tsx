import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Separator } from "./ui/separator"
import { ScrollArea } from "./ui/scroll-area"
import { Alert, AlertDescription } from "./ui/alert"
import { AlertCircle, Building, Tag, MessageSquare, Send } from "lucide-react"
import { apiService } from "../lib/api-service"

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

interface Comment {
  idcomentarios: number
  comentario: string
  idTicket: number
  idAutor: number
  fechaCreacion: string
  activo: boolean
  autorComentario?: { nombre: string; apellido1: string }
}

interface TicketDetailModalProps {
  ticket: Ticket | null
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
  onTicketUpdated: () => void
}

export function TicketDetailModal({ ticket, open, onOpenChange, user, onTicketUpdated }: TicketDetailModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

useEffect(() => {
  if (!open || !ticket?.idTicket) return

  let cancelled = false
  ;(async () => {
    try {
      const newComments = await apiService.getComments(ticket.idTicket)
      if (!cancelled) setComments(newComments.data)
    } catch (e) {
      console.error(e)
      if (!cancelled) setComments([])
    }
  })()

  return () => {
    cancelled = true
  }
}, [open, ticket?.idTicket])


  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticket || !newComment.trim()) return

    setLoading(true)
    setError("")

    try {
      await apiService.addComment(ticket.idTicket, newComment.trim(), user.idUsuario)

      // Add the new comment to the local state
      const newCommentObj: Comment = {
        idcomentarios: Date.now(), // Temporary ID
        comentario: newComment.trim(),
        idTicket: ticket.idTicket,
        idAutor: user.idUsuario,
        fechaCreacion: new Date().toISOString(),
        activo: true,
        autorComentario: { nombre: user.Nombre, apellido1: user.Apellido1 },
      }

      setComments((prev) => [...prev, newCommentObj])
      setNewComment("")
      onTicketUpdated()
    } catch (err: any) {
      setError(err.message || "Error al agregar comentario")
    } finally {
      setLoading(false)
    }
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "abierto":
        return "bg-red-100 text-red-800 border-red-200"
      case "en progreso":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "en revisión":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "cerrado":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (!ticket) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold mb-2">{ticket.titulo}</DialogTitle>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>#{ticket.idTicket}</span>
                <span>•</span>
                <span>Creado el {formatDateShort(ticket.fechaCreacion)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {ticket.estadoTicket && (
                <Badge variant="outline" className={getStatusColor(ticket.estadoTicket.descripcionEstado)}>
                  {ticket.estadoTicket.descripcionEstado}
                </Badge>
              )}
              {ticket.nivelPrioridad && (
                <Badge variant="outline" className={getPriorityColor(ticket.nivelPrioridad.descripcionPrioridad)}>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {ticket.nivelPrioridad.descripcionPrioridad}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Main Content */}
            <div className="lg:col-span-2 flex flex-col">
              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Descripción</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{ticket.descripcion}</p>
                </div>
              </div>

              {/* Comments Section */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-4 w-4" />
                  <h3 className="font-semibold">Comentarios ({comments.length})</h3>
                </div>

                {/* Comments List */}
                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-4 pr-4">
                    {comments.map((comment) => (
                      <div key={comment.idcomentarios} className="bg-white border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {comment.autorComentario?.nombre?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {comment.autorComentario?.nombre} {comment.autorComentario?.apellido1}
                              </span>
                              <span className="text-xs text-gray-500">{formatDate(comment.fechaCreacion)}</span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.comentario}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No hay comentarios aún</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Add Comment Form */}
                {ticket.estado !== 4 && ( // Don't allow comments on closed tickets
                  <form onSubmit={handleAddComment} className="flex-shrink-0">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Agregar un comentario..."
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                      <Button type="submit" disabled={loading || !newComment.trim()} size="sm" className="self-end">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    {error && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </form>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Ticket Details */}
              <div>
                <h3 className="font-semibold mb-4">Detalles del Ticket</h3>
                <div className="space-y-4">
                  {/* Type */}
                  {ticket.categoriaTicket && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label className="text-xs text-gray-500">Tipo</Label>
                        <p className="text-sm font-medium">{ticket.categoriaTicket.descripcionTipo}</p>
                      </div>
                    </div>
                  )}

                  {/* Department */}
                  {ticket.departamentoAsignado && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label className="text-xs text-gray-500">Departamento</Label>
                        <p className="text-sm font-medium">{ticket.departamentoAsignado.descripcionDepartamento}</p>
                      </div>
                    </div>
                  )}

                  {/* Assigned to */}
                  {ticket.soporteAsignado && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{ticket.soporteAsignado.nombre.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Label className="text-xs text-gray-500">Asignado a</Label>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {ticket.soporteAsignado.nombre.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium">
                            {ticket.soporteAsignado.nombre} {ticket.soporteAsignado.apellido1}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reporter */}
                  {ticket.clienteReporta && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{ticket.clienteReporta.nombre.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Label className="text-xs text-gray-500">Reportado por</Label>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {ticket.clienteReporta.nombre.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium">
                            {ticket.clienteReporta.nombre} {ticket.clienteReporta.apellido1}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Dates */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <Label className="text-xs text-gray-500">Fecha de creación</Label>
                        <p className="text-sm">{formatDate(ticket.fechaCreacion)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div>
                        <Label className="text-xs text-gray-500">Última actualización</Label>
                        <p className="text-sm">{formatDate(ticket.fechaActualizacion)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
