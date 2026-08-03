import { cn } from '../../../../lib/cn'

/** Thin draggable divider between two resizable columns — pair with
 * useResizableWidth's `startResize` as the onMouseDown handler. */
export default function ResizeHandle({ onMouseDown, className }) {
  return (
    <div className={cn('h-full flex items-center justify-center', className)}>
      <div
        onMouseDown={onMouseDown}
        title="Drag to resize"
        className="w-1 h-full min-h-[200px] cursor-col-resize rounded-full bg-transparent hover:bg-primary/30 active:bg-primary/50 transition-colors"
      />
    </div>
  )
}
