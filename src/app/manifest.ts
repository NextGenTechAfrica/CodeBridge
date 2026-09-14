import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CodeBridge — Ideas to Impact',
    short_name: 'CodeBridge',
    description:
      'High-performance digital products and custom business software engineering platform with milestone escrow protection.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#070F26',
    theme_color: '#0B1B3D',
    categories: ['business', 'productivity', 'utilities'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'Request Project',
        short_name: 'New Project',
        url: '/request-project',
        description: 'Request a scoped architectural proposal and fixed-price quote',
      },
      {
        name: 'Platform Dashboard',
        short_name: 'Dashboard',
        url: '/dashboard',
        description: 'Access projects, milestones, and commercial agreements',
      },
      {
        name: 'Client Portal',
        short_name: 'My Projects',
        url: '/dashboard/client',
        description: 'View sprint progress and approve milestones',
      },
      {
        name: 'Representative CRM',
        short_name: 'Rep Portal',
        url: '/dashboard/representative',
        description: 'Manage regional client leads and commissions',
      },
    ],
  };
}
