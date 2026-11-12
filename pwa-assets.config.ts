import {
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config'

const starchYellow = '#F6E3A1'

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      resizeOptions: { background: starchYellow },
    },
    apple: {
      ...minimal2023Preset.apple,
      resizeOptions: { background: starchYellow },
    },
  },
  images: ['assets/icon/icon-1024.png'],
})
