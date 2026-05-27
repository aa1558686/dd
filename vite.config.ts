import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import postcss from 'postcss'

/**
 * 移除 @layer 包裹层，兼容不支持 CSS Cascade Layers 的旧版浏览器
 * （安卓系统浏览器 / Chrome 99 以下）
 */
function cssCompatPlugin(): Plugin {
  const removeLayer = (root: postcss.Root) => {
    root.walkAtRules('layer', (node) => {
      if (node.nodes && node.nodes.length > 0) {
        node.replaceWith(node.nodes)
      } else {
        node.remove()
      }
    })
  }

  return {
    name: 'css-compat-layer',
    async generateBundle(_, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'asset' && typeof chunk.fileName === 'string' && chunk.fileName.endsWith('.css')) {
          const result = await postcss([removeLayer]).process(chunk.source as string, {
            from: undefined,
          })
          chunk.source = result.css
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    cssCompatPlugin(),
  ],
})
