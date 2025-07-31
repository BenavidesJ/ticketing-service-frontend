const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"
const API_URL = `${API_BASE_URL}/api/v1`

interface LoginResponse {
  success: boolean
  message: string
  data: {
    idUsuario: number
    Nombre: string
    Apellido1: string
    Apellido2: string
    Correo: string
    Access_token: string
    Tipo_Usuario: number
  }
}

interface RegisterData {
  correo: string
  password: string
  nombre: string
  apellido1: string
  apellido2: string
}

interface TicketData {
  titulo: string
  descripcion: string
  tipoTicket: number
  prioridad: number
  idDepartamento: number
  idCliente: number
  idSoporte: number
}

class ApiService {
  private async makeRequest(url: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${url}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    return data
  }

  async login(correo: string, password: string): Promise<LoginResponse> {
    return this.makeRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ correo, password }),
    })
  }

  async register(userData: RegisterData): Promise<LoginResponse> {
    return this.makeRequest("/auth/registro", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async getTickets() {
    return this.makeRequest("/ticket")
  }

  async createTicket(ticketData: TicketData) {
    console.log(ticketData)
    return this.makeRequest("/ticket", {
      method: "POST",
      body: JSON.stringify(ticketData),
    })
  }

  async updateTicketStatus(ticketId: number, nuevoEstado: number, idUsuario: number) {
    return this.makeRequest(`/ticket/${ticketId}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ nuevoEstado, idUsuario }),
    })
  }

  async addComment(ticketId: number, comentario: string, idAutor: number, token: string) {
    return this.makeRequest(`/ticket/${ticketId}/comentario`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ comentario, idAutor }),
    })
  }

  async getEstados() {
    return await this.makeRequest("/estado")
  }

}

export const apiService = new ApiService()
