// Aceternity UI — 3D Card Effect, ported to plain JSX.
// Source: https://ui.aceternity.com/components/3d-card-effect
import React, { createContext, useState, useContext, useRef, useEffect } from 'react'
import { cn } from '../utils/cn'

const MouseEnterContext = createContext(undefined)

// `defaultActive`: skip the "wait for a hover to prove it's interactive"
// dance — the card starts already in its tilted/popped-out state, and real
// mouse movement still steers the tilt further from there.
const IDLE_TILT = 'rotateY(-8deg) rotateX(5deg)'

export const CardContainer = ({ children, className, containerClassName, defaultActive = false }) => {
  const containerRef = useRef(null)
  const [isMouseEntered, setIsMouseEntered] = useState(defaultActive)

  const handleMouseMove = (e) => {
    if (!containerRef.current) return
    const { left, top, width, height } = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - left - width / 2) / 25
    const y = (e.clientY - top - height / 2) / 25
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`
  }

  const handleMouseEnter = () => {
    setIsMouseEntered(true)
  }

  const handleMouseLeave = () => {
    if (!containerRef.current) return
    if (!defaultActive) setIsMouseEntered(false)
    containerRef.current.style.transform = defaultActive ? IDLE_TILT : `rotateY(0deg) rotateX(0deg)`
  }

  return (
    <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
      <div
        className={cn('py-4 flex items-center justify-center', containerClassName)}
        style={{ perspective: '1000px' }}
      >
        <div
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={cn('flex items-center justify-center relative transition-all duration-200 ease-linear', className)}
          style={{ transformStyle: 'preserve-3d', transform: defaultActive ? IDLE_TILT : undefined }}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  )
}

export const CardBody = ({ children, className }) => {
  return (
    <div className={cn('[transform-style:preserve-3d] [&>*]:[transform-style:preserve-3d]', className)}>
      {children}
    </div>
  )
}

export const CardItem = ({
  as: Tag = 'div',
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  ...rest
}) => {
  const ref = useRef(null)
  const [isMouseEntered] = useMouseEnter()

  useEffect(() => {
    if (!ref.current) return
    if (isMouseEntered) {
      ref.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`
    } else {
      ref.current.style.transform = `translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`
    }
  }, [isMouseEntered]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Tag ref={ref} className={cn('w-fit transition duration-200 ease-linear', className)} {...rest}>
      {children}
    </Tag>
  )
}

export const useMouseEnter = () => {
  const context = useContext(MouseEnterContext)
  if (context === undefined) {
    throw new Error('useMouseEnter must be used within a MouseEnterProvider')
  }
  return context
}
