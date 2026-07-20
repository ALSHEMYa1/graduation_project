'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { ZoomIn, ZoomOut, Maximize, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface MindMapNode {
  id: string
  label: string
  parent_id: string | null
  level: number
  description: string
}

interface MindMapData {
  central_topic: string
  nodes: MindMapNode[]
}

interface TreeNode extends MindMapNode {
  children: TreeNode[]
  x: number
  y: number
}

const NODE_W = 170
const LEVEL_GAP = 110
const SIBLING_GAP = 10

function buildTree(nodes: MindMapNode[]): TreeNode | null {
  if (!nodes || nodes.length === 0) return null
  const map = new Map<string, TreeNode>()
  for (const n of nodes) {
    map.set(n.id, { ...n, children: [], x: 0, y: 0 })
  }
  let root: TreeNode | null = null
  for (const n of nodes) {
    const node = map.get(n.id)!
    if (n.parent_id && map.has(n.parent_id)) {
      map.get(n.parent_id)!.children.push(node)
    } else if (!n.parent_id) {
      root = node
    }
  }
  if (!root && nodes.length > 0) {
    root = map.get(nodes[0].id)!
  }
  return root
}

function layoutTree(node: TreeNode, levelY: number[]): void {
  const level = node.level
  node.y = level * LEVEL_GAP + 50
  if (node.children.length === 0) {
    node.x = levelY[level] || 0
    levelY[level] = node.x + NODE_W + SIBLING_GAP
    return
  }
  for (const child of node.children) {
    layoutTree(child, levelY)
  }
  const first = node.children[0]
  const last = node.children[node.children.length - 1]
  const mid = (first.x + last.x) / 2
  node.x = Math.max(mid, levelY[level] || 0)
  levelY[level] = node.x + NODE_W + SIBLING_GAP
}

const levelStyles = [
  { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', border: 'border-blue-400', shadow: 'shadow-blue-500/20' },
  { bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', border: 'border-emerald-400', shadow: 'shadow-emerald-500/20' },
  { bg: 'bg-gradient-to-br from-amber-500 to-amber-600', border: 'border-amber-400', shadow: 'shadow-amber-500/20' },
  { bg: 'bg-gradient-to-br from-violet-500 to-violet-600', border: 'border-violet-400', shadow: 'shadow-violet-500/20' },
]

export default function MindMapView({ data }: { data: MindMapData }) {
  const [scale, setScale] = useState(0.65)
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  if (!data?.nodes?.length) {
    return <p className="text-muted-foreground text-sm">No data available</p>
  }

  const root = buildTree(data.nodes)
  if (!root) {
    return <p className="text-muted-foreground text-sm">Could not build tree</p>
  }

  const levelY: number[] = []
  layoutTree(root, levelY)
  const totalW = Math.max(...levelY, 400) + NODE_W + 120
  const totalH = (Math.max(...data.nodes.map(n => n.level)) + 1) * LEVEL_GAP + 100

  const colors = (level: number) => levelStyles[Math.min(level, levelStyles.length - 1)]

  const renderNode = (node: TreeNode) => {
    const s = colors(node.level)
    const sel = selectedNode?.id === node.id
    return (
      <g key={node.id}>
        {node.children.map(child => {
          const x1 = node.x + NODE_W / 2
          const y1 = node.y + (node.level === 0 ? 40 : 36)
          const x2 = child.x + NODE_W / 2
          const y2 = child.y
          const cy = (y1 + y2) / 2
          return (
            <path
              key={`e-${node.id}-${child.id}`}
              d={`M${x1},${y1} C${x1},${cy} ${x2},${cy} ${x2},${y2}`}
              fill="none"
              stroke={sel ? s.bg.replace('bg-gradient-to-br from-', '#')?.split(' ')[0] || '#94a3b8' : '#94a3b8'}
              strokeWidth={sel ? 2.5 : 1.5}
              strokeOpacity={0.5}
              className="transition-all duration-300"
            />
          )
        })}
        <foreignObject x={node.x} y={node.y} width={NODE_W} height={node.level === 0 ? 44 : 36}>
          <div
            onClick={() => setSelectedNode(sel ? null : node)}
            className={cn(
              'h-full rounded-xl flex items-center justify-center px-3 text-xs font-semibold cursor-pointer transition-all duration-200 border-2 shadow-md hover:shadow-lg',
              s.bg, s.text || 'text-white', s.border,
              sel && 'ring-2 ring-offset-2 ring-offset-background ring-blue-400 scale-[1.03]',
              node.level === 0 ? 'text-sm' : ''
            )}
            style={{ width: NODE_W, height: node.level === 0 ? 44 : 36 }}
          >
            <span className="truncate text-center leading-tight px-1">{node.label}</span>
          </div>
        </foreignObject>
        {node.children.map(child => renderNode(child))}
      </g>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground">
          {data.central_topic}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground tabular-nums min-w-[3ch] text-right">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setScale(s => Math.min(s + 0.1, 2))} className="w-7 h-7 p-0">
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setScale(s => Math.max(s - 0.1, 0.25))} className="w-7 h-7 p-0">
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setScale(0.65)} className="w-7 h-7 p-0">
            <Maximize className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="border rounded-2xl overflow-auto bg-card max-h-[520px] min-h-[300px]">
        <div style={{ minWidth: totalW, minHeight: totalH, padding: '20px 0' }}>
          <svg width={totalW} height={totalH} style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
            {renderNode(root)}
          </svg>
        </div>
      </div>

      {selectedNode && (
        <div className="p-4 border rounded-2xl bg-gradient-to-br from-muted/80 to-muted shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 mb-1.5">
            <Info className="w-4 h-4 text-primary" />
            <p className="font-semibold text-sm">{selectedNode.label}</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{selectedNode.description}</p>
        </div>
      )}
    </div>
  )
}
