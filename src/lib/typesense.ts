import Typesense from 'typesense';

// Initialize Typesense client
// In production, use environment variables for credentials
export const typesenseClient = new Typesense.Client({
  nodes: [{
    host: import.meta.env.PUBLIC_TYPESENSE_HOST || 'localhost',
    port: import.meta.env.PUBLIC_TYPESENSE_PORT || 8108,
    protocol: import.meta.env.PUBLIC_TYPESENSE_PROTOCOL || 'http'
  }],
  apiKey: import.meta.env.TYPESENSE_API_KEY || 'xyz',
  connectionTimeoutSeconds: 2
});

// Schema for indexing WRLD sites and their content
export const wrldSearchSchema = {
  name: 'wrld_sites',
  fields: [
    { name: 'id', type: 'string', facet: false },
    { name: 'name', type: 'string', facet: false },
    { name: 'domain', type: 'string', facet: true },
    { name: 'description', type: 'string', facet: false },
    { name: 'category', type: 'string', facet: true },
    { name: 'status', type: 'string', facet: true },
    { name: 'tags', type: 'string[]', facet: true },
    { name: 'features', type: 'string[]', facet: false },
    { name: 'content', type: 'string', facet: false }, // Scraped content from site
    { name: 'url', type: 'string', facet: false },
    { name: 'updated_at', type: 'int64', facet: false }
  ],
  default_sorting_field: 'updated_at'
};

// Function to search across all WRLD sites
export async function searchWRLDSites(query: string, filters?: {
  category?: string[];
  status?: string[];
  tags?: string[];
}) {
  try {
    let filterBy = '';
    
    if (filters) {
      const filterParts: string[] = [];
      if (filters.category?.length) {
        filterParts.push(`category: [${filters.category.map(c => `'${c}'`).join(', ')}]`);
      }
      if (filters.status?.length) {
        filterParts.push(`status: [${filters.status.map(s => `'${s}'`).join(', ')}]`);
      }
      if (filters.tags?.length) {
        filterParts.push(`tags: [${filters.tags.map(t => `'${t}'`).join(', ')}]`);
      }
      filterBy = filterParts.join(' && ');
    }
    
    const searchParameters = {
      q: query,
      query_by: 'name,description,content,features,tags',
      filter_by: filterBy,
      per_page: 20,
      sort_by: '_text_match:desc,updated_at:desc'
    };
    
    return await typesenseClient
      .collections('wrld_sites')
      .documents()
      .search(searchParameters);
  } catch (error) {
    console.error('Typesense search error:', error);
    return null;
  }
}

// Function to index a site's content
export async function indexSiteContent(site: {
  id: string;
  name: string;
  domain: string;
  description: string;
  category: string;
  status: string;
  tags: string[];
  features: string[];
  url: string;
  content: string;
}) {
  try {
    await typesenseClient
      .collections('wrld_sites')
      .documents()
      .upsert({
        ...site,
        updated_at: Date.now()
      });
    return true;
  } catch (error) {
    console.error('Typesense indexing error:', error);
    return false;
  }
}

// Initialize collection (run once during setup)
export async function initializeTypesenseCollection() {
  try {
    // Try to get the collection
    await typesenseClient.collections('wrld_sites').retrieve();
    console.log('Collection already exists');
  } catch (error) {
    // Collection doesn't exist, create it
    try {
      await typesenseClient.collections().create(wrldSearchSchema);
      console.log('Collection created successfully');
    } catch (createError) {
      console.error('Error creating collection:', createError);
      throw createError;
    }
  }
}
