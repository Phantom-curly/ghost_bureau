import type { ReactNode } from 'react'
import worklogRaw from '../../WORKLOG.md?raw'

type Block =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'p'; text: string }

function parseWorklog(markdown: string): Block[] {
  const blocks: Block[] = []
  let mode: 'none' | 'p' | 'ul' = 'none'
  let paragraphText = ''
  let listItems: string[] = []

  function flush() {
    if (mode === 'p' && paragraphText) {
      blocks.push({ type: 'p', text: paragraphText })
    } else if (mode === 'ul' && listItems.length > 0) {
      blocks.push({ type: 'ul', items: listItems })
    }
    mode = 'none'
    paragraphText = ''
    listItems = []
  }

  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.trim()

    if (line === '') {
      flush()
      continue
    }
    if (line.startsWith('## ')) {
      flush()
      blocks.push({ type: 'h2', text: line.slice(3) })
      continue
    }
    if (line.startsWith('# ')) {
      flush()
      blocks.push({ type: 'h1', text: line.slice(2) })
      continue
    }
    if (line.startsWith('- ')) {
      if (mode !== 'ul') {
        flush()
        mode = 'ul'
      }
      listItems.push(line.slice(2))
      continue
    }

    if (mode === 'ul' && listItems.length > 0) {
      listItems[listItems.length - 1] += ` ${line}`
    } else {
      mode = 'p'
      paragraphText = paragraphText ? `${paragraphText} ${line}` : line
    }
  }
  flush()
  return blocks
}

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

function renderBlocks(blocks: Block[]): ReactNode[] {
  return blocks.map((block, index) => {
    if (block.type === 'h1') {
      return <h1 key={index}>{renderInline(block.text)}</h1>
    }
    if (block.type === 'h2') {
      return <h2 key={index}>{renderInline(block.text)}</h2>
    }
    if (block.type === 'ul') {
      return (
        <ul key={index}>
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ul>
      )
    }
    return <p key={index}>{renderInline(block.text)}</p>
  })
}

export function WorklogTab() {
  return <div className="worklog">{renderBlocks(parseWorklog(worklogRaw))}</div>
}
