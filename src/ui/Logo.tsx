export function Logo({ large = false }: { large?: boolean }) {
  const file = large ? 'pwa-192x192.png' : 'pwa-64x64.png'
  return <img className={large ? undefined : 'logo'} src={`${import.meta.env.BASE_URL}${file}`} alt="" />
}
