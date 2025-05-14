/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@vercel/postgres"],
    serverActions: true,
  },
  // Configuración para asegurar que las fechas se manejen correctamente
  env: {
    TZ: 'America/Bogota',
  },
  // Asegurarse de que las rutas dinámicas funcionen correctamente
  trailingSlash: false,
  // Configuración para manejar correctamente las rutas dinámicas en producción
  async rewrites() {
    return [
      // Asegurarse de que las rutas dinámicas como /guias/editar/[id] funcionen
      {
        source: '/guias/editar/:id',
        destination: '/guias/editar/[id]',
      },
      {
        source: '/guias/ver/:id',
        destination: '/guias/ver/[id]',
      },
      {
        source: '/sacrificios/editar/:id',
        destination: '/sacrificios/editar/[id]',
      },
      {
        source: '/sacrificios/ver/:id',
        destination: '/sacrificios/ver/[id]',
      },
      {
        source: '/contactos/editar/:id',
        destination: '/contactos/editar/[id]',
      },
      {
        source: '/contactos/ver/:id',
        destination: '/contactos/ver/[id]',
      },
      {
        source: '/contactos/ubicaciones/:id',
        destination: '/contactos/ubicaciones/[id]',
      },
      {
        source: '/api/guias/:id',
        destination: '/api/guias/[id]',
      },
      {
        source: '/api/verificar-guia/:id',
        destination: '/api/verificar-guia/[id]',
      },
      {
        source: '/api/activar-guia/:id',
        destination: '/api/activar-guia/[id]',
      }
    ]
  },
  // Configuración para manejar correctamente las imágenes externas
  images: {
    domains: ['v0.blob.com', 'localhost', 'sag-cauca.vercel.app'],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configuración experimental para forzar la zona horaria

}

export default nextConfig
