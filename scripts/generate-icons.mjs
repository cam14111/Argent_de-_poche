import sharp from 'sharp'
import { mkdir } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outputDir = join(__dirname, '..', 'public', 'icons')

// Couleur de fond de l'app
const bgColor = '#6366f1'

// SVG du cochon tirelire avec fond coloré et icône blanche
function createIconSvg(size, padding = 0.15) {
  const iconSize = size * (1 - padding * 2)
  const offset = size * padding

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="${bgColor}"/>
  <g transform="translate(${offset}, ${offset})">
    <svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/>
      <path d="M2 9v1c0 1.1.9 2 2 2h1"/>
      <path d="M16 11h.01"/>
    </svg>
  </g>
</svg>`
}

// SVG maskable avec plus de padding (40% safe zone)
function createMaskableSvg(size) {
  const iconSize = size * 0.5
  const offset = size * 0.25

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bgColor}"/>
  <g transform="translate(${offset}, ${offset})">
    <svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/>
      <path d="M2 9v1c0 1.1.9 2 2 2h1"/>
      <path d="M16 11h.01"/>
    </svg>
  </g>
</svg>`
}

async function generateIcons() {
  await mkdir(outputDir, { recursive: true })

  const icons = [
    { name: 'icon-192.png', size: 192, maskable: false },
    { name: 'icon-512.png', size: 512, maskable: false },
    { name: 'icon-180.png', size: 180, maskable: false },
    { name: 'maskable-192.png', size: 192, maskable: true },
    { name: 'maskable-512.png', size: 512, maskable: true },
  ]

  for (const icon of icons) {
    const svg = icon.maskable ? createMaskableSvg(icon.size) : createIconSvg(icon.size)
    const outputPath = join(outputDir, icon.name)

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath)

    console.log(`Generated: ${icon.name}`)
  }

  console.log('All icons generated!')
}

generateIcons().catch(console.error)
