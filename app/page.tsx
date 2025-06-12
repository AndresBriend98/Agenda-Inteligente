"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChatInterface } from "@/components/chat-interface"
import { BoardList } from "@/components/board-list"
import type { Board } from "@/lib/types"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function Home() {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [activeBoard, setActiveBoard] = useState<Board | null>(null)
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")
  const [creatingBoard, setCreatingBoard] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const response = await fetch("/api/boards")
        const data = await response.json()
        setBoards(data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching boards:", error)
        setLoading(false)
      }
    }

    fetchBoards()
  }, [])

  const handleBoardClick = (board: Board) => {
    setActiveBoard(board)
  }

  const handleBackToHome = () => {
    setActiveBoard(null)
  }

  const refreshBoards = async () => {
    try {
      const response = await fetch("/api/boards")
      const data = await response.json()
      setBoards(data)

      // Si el tablero activo fue eliminado, volver a la página principal
      if (activeBoard) {
        const boardStillExists = data.find((board: Board) => board._id === activeBoard._id)
        if (!boardStillExists) {
          setActiveBoard(null)
        } else {
          // Si el tablero existe pero cambió de nombre, actualizar la referencia
          const updatedBoard = data.find((board: Board) => board._id === activeBoard._id)
          if (updatedBoard && updatedBoard.name !== activeBoard.name) {
            setActiveBoard(updatedBoard)
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing boards:", error)
    }
  }

  const handleQuickCreateBoard = async () => {
    if (!newBoardName.trim()) return

    setCreatingBoard(true)

    try {
      const response = await fetch("/api/boards/quick-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newBoardName }),
      })

      if (!response.ok) {
        throw new Error("Error al crear el tablero")
      }

      await refreshBoards()
      setNewBoardName("")
      setShowQuickCreate(false)
    } catch (error) {
      console.error("Error creating board:", error)
    } finally {
      setCreatingBoard(false)
    }
  }

  if (!isClient || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto flex flex-1 gap-4 p-4">
        <div className="flex flex-1 flex-col">
          {activeBoard ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-4">
                <Button variant="outline" onClick={handleBackToHome} className="mr-2">
                  Volver
                </Button>
                <h1 className="text-2xl font-bold">{activeBoard.name}</h1>
              </div>
              <BoardView board={activeBoard} refreshBoard={() => refreshBoards()} />
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Mis Tableros</h1>
                <Button onClick={() => setShowQuickCreate(!showQuickCreate)}>
                  <Plus className="mr-2 h-4 w-4" /> Crear Tablero
                </Button>
              </div>

              {showQuickCreate && (
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>Crear Nuevo Tablero</CardTitle>
                    <CardDescription>Ingresa un nombre para tu nuevo tablero</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nombre del tablero"
                        value={newBoardName}
                        onChange={(e) => setNewBoardName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleQuickCreateBoard()}
                      />
                      <Button onClick={handleQuickCreateBoard} disabled={creatingBoard || !newBoardName.trim()}>
                        {creatingBoard ? (
                          <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
                        ) : (
                          "Crear"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <BoardList boards={boards} onBoardClick={handleBoardClick} />
            </div>
          )}
        </div>
        <div className="w-96">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Asistente Inteligente</CardTitle>
              <CardDescription>
                {activeBoard ? `Estás en el tablero "${activeBoard.name}"` : "Estás en la página principal"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-5rem)]">
              <ChatInterface boardContext={activeBoard} onBoardsUpdated={refreshBoards} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

interface BoardViewProps {
  board: Board
  refreshBoard: () => void
}

function BoardView({ board, refreshBoard }: BoardViewProps) {
  const [columns, setColumns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Función para refrescar las columnas
  const refreshColumns = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  useEffect(() => {
    const fetchColumns = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/boards/${board._id}/columns`)
        const data = await response.json()
        setColumns(data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching columns:", error)
        setLoading(false)
      }
    }

    fetchColumns()
  }, [board._id, refreshTrigger])

  // Modificar la función refreshBoard para que también actualice las columnas
  useEffect(() => {
    const originalRefreshBoard = refreshBoard
    refreshBoard = () => {
      originalRefreshBoard()
      refreshColumns()
    }
  }, [refreshBoard])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-auto">
      {columns.map((column) => (
        <ColumnView key={column._id} column={column} boardId={board._id} />
      ))}
    </div>
  )
}

interface ColumnViewProps {
  column: any
  boardId: string
}

function ColumnView({ column, boardId }: ColumnViewProps) {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`/api/boards/${boardId}/columns/${column._id}/tasks`)
        const data = await response.json()
        setTasks(data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching tasks:", error)
        setLoading(false)
      }
    }

    fetchTasks()
  }, [boardId, column._id])

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{column.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex h-20 items-center justify-center">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay tareas en esta columna</p>
            ) : (
              tasks.map((task) => <TaskCard key={task._id} task={task} />)
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface TaskCardProps {
  task: any
}

function TaskCard({ task }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "alta":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "media":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "baja":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-ES")
    } catch (error) {
      console.error("Error al formatear fecha:", error)
      return dateString
    }
  }

  return (
    <Card className="p-3">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <h3 className="font-medium">{task.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>{task.priority}</span>
        </div>
        {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
        {task.dueDate && <div className="text-xs text-muted-foreground">Fecha límite: {formatDate(task.dueDate)}</div>}
        {task.members && task.members.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {task.members.map((member: string, index: number) => (
              <span key={index} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                {member}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
