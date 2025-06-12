export interface Board {
  _id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Column {
  _id: string
  name: string
  boardId: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface Task {
  _id: string
  title: string
  description?: string
  columnId: string
  boardId: string
  priority: "Alta" | "Media" | "Baja"
  dueDate?: string
  members: string[]
  createdAt: string
  updatedAt: string
}

export interface Rule {
  id: string
  condition: (facts: Facts) => boolean
  action: (facts: Facts) => Promise<ActionResult>
  priority: number
}

export interface Facts {
  boardId?: string | null
  userId?: string
  message: string
  intent?: string
  entities?: any
  [key: string]: any
}

export interface ActionResult {
  success: boolean
  message: string
  actionTaken: boolean
  data?: any
}

export interface UpdateData {
  updatedAt: Date
  title?: string
  description?: string
  dueDate?: Date
  priority?: string
  [key: string]: any
}

export interface TaskData {
  title: any
  description: any
  columnId: any
  boardId: any
  priority: any
  members: any
  createdAt: Date
  updatedAt: Date
  dueDate?: Date
  [key: string]: any
}
