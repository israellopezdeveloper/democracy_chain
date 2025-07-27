// src/extensions/ResizableImage.tsx
import { Node, mergeAttributes } from '@tiptap/core'
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewRendererProps,
} from '@tiptap/react'
import React, { useRef } from 'react'

const ResizableImageComponent: React.FC<NodeViewRendererProps> = (props) => {
  const wrapperRef = useRef<HTMLDivElement>(null)

  const { src, width, height, 'data-fileid': fileid } = props.node.attrs

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      style={{
        resize: 'both',
        overflow: 'hidden',
        display: 'inline-block',
        width,
        height,
        border: '1px dashed #ccc',
        padding: '4px',
      }}
      data-type="resizable-image-wrapper"
    >
      <img
        src={src}
        data-fileid={fileid}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </NodeViewWrapper>
  )
}

type ResizableImageAttrs = {
  src: string
  width?: string
  height?: string
  'data-fileid'?: string
}

export const ResizableImage = Node.create({
  name: 'resizableImageWrapper',

  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: '300px' },
      height: { default: '200px' },
      'data-fileid': { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="resizable-image-wrapper"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'resizable-image-wrapper' }),
      ['img', { src: HTMLAttributes.src }],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent)
  },


  addCommands() {
    return {
      setResizableImage:
        (options: ResizableImageAttrs) =>
          ({ commands }: any) => {
            return commands.insertContent({
              type: 'resizableImageWrapper',
              attrs: options,
            })
          },
    } as Partial<Record<string, any>>
  }
})

