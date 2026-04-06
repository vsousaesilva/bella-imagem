'use client'

import NextImage from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface ThemeLogoProps {
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

// Client component — usa useTheme para troca instantânea
export function ThemeLogo({ width = 160, height = 48, className = 'object-contain', priority = false }: ThemeLogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const src = mounted && resolvedTheme === 'light' ? '/logo_preta.png' : '/logo.png'

  return (
    <NextImage
      src={src}
      alt="Bella Imagem"
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  )
}

// Server-safe — usa CSS para mostrar/esconder conforme o tema (html.light)
export function ThemeLogoStatic({ width = 160, height = 48, priority = false }: Omit<ThemeLogoProps, 'className'>) {
  return (
    <span className="inline-block" style={{ width, height: 'auto' }}>
      {/* Logo clara — visível no modo escuro */}
      <NextImage
        src="/logo.png"
        alt="Bella Imagem"
        width={width}
        height={height}
        className="object-contain block dark-logo"
        priority={priority}
      />
      {/* Logo preta — visível no modo claro */}
      <NextImage
        src="/logo_preta.png"
        alt="Bella Imagem"
        width={width}
        height={height}
        className="object-contain hidden light-logo"
        priority={priority}
      />
    </span>
  )
}
