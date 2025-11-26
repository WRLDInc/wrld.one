export interface WRLDSite {
  id: string;
  name: string;
  domain: string;
  url: string;
  description: string;
  category: 'core' | 'infrastructure' | 'services' | 'support' | 'labs' | 'partners';
  status: 'operational' | 'degraded' | 'maintenance' | 'offline';
  icon: string;
  color: string;
  features: string[];
  tags: string[];
  statusUrl?: string; // Link to status page
  parent?: string; // Parent service ID for sub-services
}

export const sites: WRLDSite[] = [
  {
    id: 'wrld-tech',
    name: 'WRLD Tech',
    domain: 'wrld.tech',
    url: 'https://wrld.tech',
    description: 'Primary technology portal and brand hub for WRLD Inc. Access documentation, APIs, and development resources.',
    category: 'core',
    status: 'operational',
    icon: '◆',
    color: '#00ffaa',
    features: ['Documentation', 'API Reference', 'Brand Assets', 'Developer Tools'],
    tags: ['tech', 'documentation', 'api', 'brand', 'development']
  },
  {
    id: 'wrld-host',
    name: 'WRLD Host',
    domain: 'wrld.host',
    url: 'https://wrld.host',
    description: 'Enterprise-grade hosting and infrastructure services. Domain management, cloud computing, and managed solutions.',
    category: 'infrastructure',
    status: 'operational',
    icon: '◇',
    color: '#00ddff',
    features: ['Web Hosting', 'Domain Registration', 'Cloud VPS', 'Managed Services'],
    tags: ['hosting', 'domains', 'cloud', 'infrastructure', 'vps']
  },
  {
    id: 'wrld-ai',
    name: 'WRLD AI',
    domain: 'wrld.ai',
    url: 'https://wrld.ai',
    description: 'Artificial intelligence and machine learning platform. AI tools, models, and integration services.',
    category: 'services',
    status: 'operational',
    icon: '◈',
    color: '#7700ff',
    features: ['AI Models', 'ML APIs', 'Custom Training', 'AI Assistants'],
    tags: ['ai', 'machine-learning', 'models', 'automation', 'neural']
  },
  {
    id: 'wrld-help',
    name: 'WRLD Help',
    domain: 'help.wrld.tech',
    url: 'https://help.wrld.tech',
    description: 'Comprehensive help center and knowledge base. Tutorials, guides, and troubleshooting resources.',
    category: 'support',
    status: 'operational',
    icon: '○',
    color: '#ffaa00',
    features: ['Knowledge Base', 'Tutorials', 'FAQs', 'Video Guides'],
    tags: ['help', 'support', 'documentation', 'tutorials', 'guides']
  },
  {
    id: 'wrld-support',
    name: 'WRLD Support',
    domain: 'wrld.support',
    url: 'https://wrld.support',
    description: 'Direct support portal for WRLD services. Submit tickets, live chat, and priority assistance.',
    category: 'support',
    status: 'operational',
    icon: '●',
    color: '#ff6b6b',
    features: ['Ticket System', 'Live Chat', 'Phone Support', 'Priority Queue'],
    tags: ['support', 'tickets', 'chat', 'assistance', 'help']
  },
  {
    id: 'wrld-status',
    name: 'WRLD Status',
    domain: 'status.wrld.host',
    url: 'https://status.wrld.host',
    description: 'Real-time service status and incident reports. Monitor uptime, performance, and scheduled maintenance.',
    category: 'infrastructure',
    status: 'operational',
    icon: '◉',
    color: '#00ff88',
    features: ['Uptime Monitoring', 'Incident Reports', 'Status History', 'Subscriptions'],
    tags: ['status', 'uptime', 'monitoring', 'incidents', 'health']
  },
  {
    id: 'ipfs-wrld',
    name: 'WRLD IPFS',
    domain: 'ipfs.wrld.tech',
    url: 'https://ipfs.wrld.tech',
    description: 'Decentralized IPFS gateway powered by Cloudflare. Access distributed web content with low latency.',
    category: 'infrastructure',
    status: 'operational',
    icon: '⬡',
    color: '#00ffaa',
    features: ['IPFS Gateway', 'IPNS Resolution', 'Content Pinning', 'Global CDN'],
    tags: ['ipfs', 'decentralized', 'web3', 'gateway', 'distributed']
  },
  {
    id: 'wrld-domains',
    name: 'WRLD Domains',
    domain: 'wrld.domains',
    url: 'https://wrld.domains',
    description: 'Premium domain registration and management. Search, register, and configure domain names.',
    category: 'services',
    status: 'operational',
    icon: '◎',
    color: '#00ddff',
    features: ['Domain Search', 'Registration', 'DNS Management', 'WHOIS Privacy'],
    tags: ['domains', 'registration', 'dns', 'whois', 'tld']
  },
  {
    id: 'wrld-labs',
    name: 'WRLD Labs',
    domain: 'labs.wrld.tech',
    url: 'https://labs.wrld.tech',
    description: 'Experimental projects and beta features. Test new technologies and provide feedback.',
    category: 'labs',
    status: 'operational',
    icon: '⚗',
    color: '#ff00ff',
    features: ['Beta Features', 'Experiments', 'Early Access', 'Feedback Portal'],
    tags: ['labs', 'beta', 'experimental', 'preview', 'testing']
  },
  {
    id: 'wrld-docs',
    name: 'WRLD Docs',
    domain: 'docs.wrld.tech',
    url: 'https://docs.wrld.tech',
    description: 'Technical documentation and API references. Comprehensive guides for all WRLD services.',
    category: 'core',
    status: 'operational',
    icon: '▤',
    color: '#00ffaa',
    features: ['API Docs', 'Code Examples', 'SDKs', 'Integration Guides'],
    tags: ['documentation', 'api', 'reference', 'guides', 'sdk']
  },
  {
    id: 'wrld-cloud',
    name: 'WRLD Cloud',
    domain: 'cloud.wrld.host',
    url: 'https://cloud.wrld.host',
    description: 'Cloud computing and infrastructure platform. Deploy, scale, and manage applications globally.',
    category: 'infrastructure',
    status: 'operational',
    icon: '☁',
    color: '#00ddff',
    features: ['Compute', 'Storage', 'Networking', 'Kubernetes'],
    tags: ['cloud', 'compute', 'storage', 'kubernetes', 'infrastructure']
  },
  {
    id: 'wrld-mail',
    name: 'WRLD Mail',
    domain: 'mail.wrld.host',
    url: 'https://mail.wrld.host',
    description: 'Professional email hosting and collaboration. Secure email with custom domains and advanced features.',
    category: 'services',
    status: 'operational',
    icon: '✉',
    color: '#ffaa00',
    features: ['Custom Domains', 'Spam Protection', 'Encryption', 'Collaboration'],
    tags: ['email', 'mail', 'collaboration', 'communication', 'business']
  },
  // WRLD Press - Ad Management
  {
    id: 'wrld-press',
    name: 'WRLD Press',
    domain: 'manage.wrld.press',
    url: 'https://manage.wrld.press',
    description: 'Ad management and publishing platform. Manage advertising campaigns across WRLD properties.',
    category: 'services',
    status: 'operational',
    icon: '📰',
    color: '#f97316',
    features: ['Ad Management', 'Campaign Analytics', 'Publisher Tools', 'Revenue Reports'],
    tags: ['advertising', 'press', 'publishing', 'ads', 'media']
  },
  // Cloud Sub-services
  {
    id: 'wrld-cpanel',
    name: 'cPanel Access',
    domain: 'cpanel.wrld.host',
    url: 'https://wrld.host:2083',
    description: 'Web hosting control panel. Manage websites, databases, email, and server settings.',
    category: 'infrastructure',
    status: 'operational',
    icon: '⚙',
    color: '#ff6c2c',
    features: ['File Manager', 'Database Admin', 'Email Setup', 'SSL Management'],
    tags: ['cpanel', 'hosting', 'control-panel', 'management'],
    parent: 'wrld-cloud'
  },
  {
    id: 'wrld-plesk',
    name: 'Plesk Access',
    domain: 'plesk.wrld.host',
    url: 'https://wrld.host:8443',
    description: 'Plesk server management panel. Advanced hosting control with WordPress toolkit and security.',
    category: 'infrastructure',
    status: 'operational',
    icon: '🔧',
    color: '#52bbe7',
    features: ['WordPress Toolkit', 'Security Advisor', 'Docker Support', 'Git Integration'],
    tags: ['plesk', 'hosting', 'control-panel', 'wordpress'],
    parent: 'wrld-cloud'
  },
  {
    id: 'wrld-coolify',
    name: 'Coolify',
    domain: 'coolify.wrld.host',
    url: 'https://coolify.wrld.host',
    description: 'Self-hosted PaaS for deploying applications. Heroku/Netlify alternative with full control.',
    category: 'infrastructure',
    status: 'operational',
    icon: '🚀',
    color: '#6b5ce7',
    features: ['Auto Deploy', 'Docker Support', 'Database Management', 'SSL Certificates'],
    tags: ['coolify', 'paas', 'deployment', 'docker', 'heroku-alternative'],
    parent: 'wrld-cloud'
  },
  // Partner Services
  {
    id: 'partner-microsoft',
    name: 'Microsoft 365 / Azure',
    domain: 'microsoft.com',
    url: 'https://admin.microsoft.com',
    description: 'Microsoft cloud services partner. Microsoft 365, Azure cloud computing, and enterprise solutions.',
    category: 'partners',
    status: 'operational',
    icon: '⊞',
    color: '#00a4ef',
    features: ['Microsoft 365', 'Azure Cloud', 'Teams', 'Active Directory'],
    tags: ['microsoft', 'azure', 'office365', 'm365', 'cloud'],
    statusUrl: 'https://status.office365.com'
  },
  {
    id: 'partner-google',
    name: 'Google Cloud (GCP)',
    domain: 'cloud.google.com',
    url: 'https://console.cloud.google.com',
    description: 'Google Cloud Platform partner. Compute, storage, AI/ML services, and Google Workspace.',
    category: 'partners',
    status: 'operational',
    icon: '◐',
    color: '#4285f4',
    features: ['Compute Engine', 'Cloud Storage', 'BigQuery', 'Workspace'],
    tags: ['google', 'gcp', 'cloud', 'workspace', 'compute'],
    statusUrl: 'https://status.cloud.google.com'
  },
  {
    id: 'partner-cloudflare',
    name: 'Cloudflare',
    domain: 'cloudflare.com',
    url: 'https://dash.cloudflare.com',
    description: 'Cloudflare partner for CDN, security, and edge computing. DNS, DDoS protection, and Workers.',
    category: 'partners',
    status: 'operational',
    icon: '☁',
    color: '#f38020',
    features: ['CDN', 'DDoS Protection', 'Workers', 'DNS'],
    tags: ['cloudflare', 'cdn', 'security', 'edge', 'dns'],
    statusUrl: 'https://www.cloudflarestatus.com'
  }
];

export const categories = [
  { id: 'core', name: 'Core', description: 'Essential WRLD platforms', color: '#3b82f6' },
  { id: 'infrastructure', name: 'Infrastructure', description: 'Hosting and cloud services', color: '#60a5fa' },
  { id: 'services', name: 'Services', description: 'Business tools and utilities', color: '#8b5cf6' },
  { id: 'support', name: 'Support', description: 'Help and assistance', color: '#f97316' },
  { id: 'labs', name: 'Labs', description: 'Experimental projects', color: '#ec4899' },
  { id: 'partners', name: 'Partners', description: 'Cloud and technology partners', color: '#10b981' }
];

export function getSitesByCategory(category: string): WRLDSite[] {
  return sites.filter(site => site.category === category);
}

export function searchSites(query: string): WRLDSite[] {
  const q = query.toLowerCase();
  return sites.filter(site => 
    site.name.toLowerCase().includes(q) ||
    site.domain.toLowerCase().includes(q) ||
    site.description.toLowerCase().includes(q) ||
    site.tags.some(tag => tag.includes(q))
  );
}
