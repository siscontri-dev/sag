/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para asegurar que las fechas se manejen correctamente
  env: {
    TZ: 'America/Bogota',
  },
  // Otras configuraciones existentes
  experimental: {
    serverActions: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
