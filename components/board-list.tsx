"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Board } from "@/lib/types"
import { CalendarDays, ListChecks } from "lucide-react"

interface BoardListProps {
  boards: Board[]
  onBoardClick: (board: Board) => void
}

export function BoardList({ boards, onBoardClick }: BoardListProps) {
  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No hay tableros</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Usa el chat para crear tu primer tablero.
          <br />
          Ejemplo: "Crea un tablero llamado Mi Proyecto"
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {boards.map((board) => (
        <Card
          key={board._id}
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => onBoardClick(board)}
        >
          <CardHeader className="pb-2">
            <CardTitle>{board.name}</CardTitle>
            {board.description && <CardDescription>{board.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarDays className="mr-2 h-4 w-4" />
              {new Date(board.createdAt).toLocaleDateString("es-ES")}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
