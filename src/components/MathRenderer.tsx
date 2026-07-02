import { renderToString } from 'katex'

const INLINE_MATH = /\$([^$]+)\$/g
const DISPLAY_MATH = /\$\$([^$]+)\$\$/g

function renderSegment(text: string, display: boolean): string {
  try {
    return renderToString(text, { displayMode: display, throwOnError: false })
  } catch {
    return text
  }
}

function renderMath(html: string): string {
  return html
    .replace(DISPLAY_MATH, (_, expr) => renderSegment(expr.trim(), true))
    .replace(INLINE_MATH, (_, expr) => renderSegment(expr.trim(), false))
}

interface Props {
  text: string
  className?: string
}

export default function MathRenderer({ text, className }: Props) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: renderMath(text) }}
    />
  )
}
