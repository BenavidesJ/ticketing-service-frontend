import { useDroppable } from "@dnd-kit/core"

interface Props {
  id: string
  children: React.ReactNode
}

export function DroppableColumn({ id, children }: Props) {
  const { setNodeRef } = useDroppable({ id })
  return (
    <div ref={setNodeRef} data-column-id={id} className="flex flex-col gap-3 min-h-[150px]">
      {children}
    </div>
  )
}
