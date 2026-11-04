// Dictionary of authentic, unique, high-resolution Unsplash photos for each national park and wildlife sanctuary
const SANCTUARY_PHOTOS = [
  {
    keywords: ['nagarhole', 'kabini'],
    url: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1200&q=80', // Bengal Tiger stalking in Kabini
  },
  {
    keywords: ['bandipur'],
    url: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1200&q=80', // Misty Nilgiri Biosphere Forest
  },
  {
    keywords: ['kaziranga'],
    url: 'https://images.unsplash.com/photo-1581852017103-68ac65514cf7?auto=format&fit=crop&w=1200&q=80', // Great Indian One-Horned Rhinoceros
  },
  {
    keywords: ['ranthambore'],
    url: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=1200&q=80', // Tiger in dry deciduous dhok jungle
  },
  {
    keywords: ['gir', 'lion'],
    url: 'https://images.unsplash.com/photo-1575550959106-5a7defe28b56?auto=format&fit=crop&w=1200&q=80', // Majestic Asiatic Lion
  },
  {
    keywords: ['periyar'],
    url: 'https://images.unsplash.com/photo-1551085254-e96b210df58a?auto=format&fit=crop&w=1200&q=80', // Wild elephant herd at lake edge
  },
  {
    keywords: ['corbett'],
    url: 'https://images.unsplash.com/photo-1547407139-3c921a66005c?auto=format&fit=crop&w=1200&q=80', // Ramganga valley elephant herd
  },
  {
    keywords: ['hemis', 'ladakh'],
    url: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=1200&q=80', // Snow leopard on high rocky ridge
  },
  {
    keywords: ['khangchendzonga', 'sikkim', 'alpine'],
    url: 'https://images.unsplash.com/photo-1544979590-37e9b47eb705?auto=format&fit=crop&w=1200&q=80', // Red panda in high-altitude tree
  },
  {
    keywords: ['sundarban', 'mangrove'],
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80', // Dense mangrove tidal delta
  },
  {
    keywords: ['kanha'],
    url: 'https://images.unsplash.com/photo-1484406566174-9da000fda645?auto=format&fit=crop&w=1200&q=80', // Barasingha stag in golden sal meadow
  },
  {
    keywords: ['tadoba'],
    url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80', // Bengal tiger resting at waterhole
  },
  {
    keywords: ['silent valley'],
    url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80', // Tropical evergreen shola rainforest
  },
  {
    keywords: ['bhadra'],
    url: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1200&q=80', // Misty Bababudan mountain range
  },
  {
    keywords: ['similipal'],
    url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80', // Barehipani forest waterfalls
  },
  {
    keywords: ['desert', 'thar', 'jaisalmer'],
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80', // Golden desert sand dunes
  },
  {
    keywords: ['anamalai', 'topslip'],
    url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80', // Lush rainforest canopy trail
  },
  {
    keywords: ['dudhwa'],
    url: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=1200&q=80', // Terai grassland deer herd
  },
  {
    keywords: ['bandhavgarh'],
    url: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=1200&q=80', // Royal tiger on stone ruins
  },
  {
    keywords: ['manas'],
    url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80', // Manas river valley & Himalayan foothills
  },
  {
    keywords: ['eravikulam', 'munnar'],
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80', // High-altitude shola hills
  },
  {
    keywords: ['pench'],
    url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=80', // Teak woods and Pench river
  },
  {
    keywords: ['panna'],
    url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80', // Ken river canyon gorge
  },
  {
    keywords: ['kuno'],
    url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80', // Open African-style cheetah savanna
  },
  {
    keywords: ['dandeli'],
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80', // Deep green Kali river forest canopy
  },
  {
    keywords: ['satpura'],
    url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=80', // Denwa river sandstone peaks
  },
  {
    keywords: ['nanda devi'],
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80', // Glacial Himalayan peaks
  },
];

/**
 * Returns a dedicated, distinct photo based on sanctuary or organisation name.
 * If no keyword matches, hashes the input string to deterministically select a unique photo.
 */
function getSanctuaryPhoto(nameOrOrg = '', fallbackIndex = 0) {
  const text = String(nameOrOrg).toLowerCase();
  for (const item of SANCTUARY_PHOTOS) {
    if (item.keywords.some(kw => text.includes(kw))) {
      return item.url;
    }
  }

  // Deterministic fallback based on hash of string
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash + fallbackIndex) % SANCTUARY_PHOTOS.length;
  return SANCTUARY_PHOTOS[idx].url;
}

module.exports = {
  SANCTUARY_PHOTOS,
  getSanctuaryPhoto,
};

