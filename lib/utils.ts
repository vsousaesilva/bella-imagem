import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Converte File em base64 string (sem o prefixo data:...) */
export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve({ base64, mimeType: file.type })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Comprime imagem no client-side antes de enviar */
export async function compressImage(
  file: File,
  maxWidth = 1024,
  quality = 0.85
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new globalThis.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const ratio = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' })
    }
    img.onerror = reject
    img.src = url
  })
}

// #23 — Taxa de conversão USD → BRL configurável via variável de ambiente
function getUsdToBrl(): number {
  const envRate = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_USD_TO_BRL : undefined
  if (envRate) {
    const parsed = parseFloat(envRate)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return 5.75 // fallback
}

/** Converte USD para BRL */
export function usdToBrl(usd: number): number {
  return usd * getUsdToBrl()
}

/** Formata valor em BRL */
export function formatCostBrl(usd: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(usdToBrl(usd))
}

/** @deprecated use formatCostBrl */
export function formatCostUsd(usd: number): string {
  return formatCostBrl(usd)
}

/** Formata duração em ms para segundos legíveis */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

/** Formata data para exibição em pt-BR */
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

/** Calcula porcentagem de uso da cota */
export function quotaPercent(used: number, limit: number): number {
  if (limit === 0) return 100
  return Math.min(100, Math.round((used / limit) * 100))
}

/** Gera slug a partir de texto */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
