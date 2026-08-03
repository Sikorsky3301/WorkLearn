import { Toaster as Sonner } from 'sonner'

function Toaster(props) {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'rounded-lg border border-border bg-white shadow-lg text-on-surface text-sm',
          title: 'font-semibold',
          description: 'text-on-surface-variant',
          actionButton: 'bg-primary text-white',
          cancelButton: 'bg-surface-container text-on-surface-variant',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
