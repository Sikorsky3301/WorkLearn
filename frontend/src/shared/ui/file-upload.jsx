// Aceternity UI — File Upload, ported to plain JSX. Native HTML5 drag-and-drop
// replaces react-dropzone, and an inline SVG replaces @tabler/icons-react —
// this codebase uses hand-written SVGs everywhere rather than an icon library,
// so the port avoids adding either dependency.
// Source: https://ui.aceternity.com/components/file-upload
import React, { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '../utils/cn'

const mainVariant = {
  initial: { x: 0, y: 0 },
  animate: { x: 20, y: -20, opacity: 0.9 },
}

const secondaryVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
}

function UploadIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

export const FileUpload = ({ onChange }) => {
  const [files, setFiles] = useState([])
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (newFiles) => {
    setFiles((prev) => [...prev, ...newFiles])
    onChange?.(newFiles)
  }

  const handleClick = () => fileInputRef.current?.click()

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragActive(false)
    handleFileChange(Array.from(e.dataTransfer.files || []))
  }

  return (
    <div
      className="w-full"
      onDragOver={(e) => { e.preventDefault(); setIsDragActive(true) }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={handleDrop}
    >
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className="group/file relative block w-full cursor-pointer overflow-hidden rounded-lg p-10"
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
          <GridPattern />
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="relative z-20 font-sans text-base font-bold text-on-surface">Upload your resume or JD</p>
          <p className="relative z-20 mt-2 font-sans text-sm font-normal text-on-surface-variant">
            Drag and drop, or click to upload — MIRA will personalize your questions
          </p>
          <div className="relative mx-auto mt-10 w-full max-w-xl">
            {files.length > 0 &&
              files.map((file, idx) => (
                <motion.div
                  key={'file' + idx}
                  layoutId={idx === 0 ? 'file-upload' : 'file-upload-' + idx}
                  className={cn(
                    'relative z-40 mx-auto mt-4 flex w-full flex-col items-start justify-start overflow-hidden rounded-lg bg-white border border-border p-4 md:h-24',
                    'shadow-sm'
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-4">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="max-w-xs truncate text-sm font-semibold text-on-surface"
                    >
                      {file.name}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="chip shrink-0"
                    >
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </motion.p>
                  </div>

                  <div className="mt-2 flex w-full flex-col items-start justify-between text-xs text-on-surface-variant md:flex-row md:items-center">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="rounded-md bg-surface-low px-1.5 py-0.5"
                    >
                      {file.type || 'unknown type'}
                    </motion.p>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout>
                      modified {new Date(file.lastModified).toLocaleDateString()}
                    </motion.p>
                  </div>
                </motion.div>
              ))}
            {!files.length && (
              <motion.div
                layoutId="file-upload"
                variants={mainVariant}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={cn(
                  'relative z-40 mx-auto mt-4 flex h-32 w-full max-w-[8rem] items-center justify-center rounded-lg bg-white group-hover/file:shadow-2xl',
                  'shadow-[0px_10px_50px_rgba(0,0,0,0.1)]'
                )}
              >
                {isDragActive ? (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-1 text-on-surface-variant">
                    Drop it
                    <UploadIcon className="text-on-surface-variant" />
                  </motion.p>
                ) : (
                  <UploadIcon className="text-on-surface-variant" />
                )}
              </motion.div>
            )}

            {!files.length && (
              <motion.div
                variants={secondaryVariant}
                className="absolute inset-0 z-30 mx-auto mt-4 flex h-32 w-full max-w-[8rem] items-center justify-center rounded-lg border border-dashed border-primary/40 bg-transparent opacity-0"
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export function GridPattern() {
  const columns = 41
  const rows = 11
  return (
    <div className="flex shrink-0 scale-105 flex-wrap items-center justify-center gap-x-px gap-y-px bg-surface-low">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col
          return (
            <div
              key={`${col}-${row}`}
              className={`flex h-10 w-10 shrink-0 rounded-[2px] ${
                index % 2 === 0 ? 'bg-surface' : 'bg-surface shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset]'
              }`}
            />
          )
        })
      )}
    </div>
  )
}
