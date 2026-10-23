import type { CategoryId, NftCategory, NftDetail } from '@/features/catalog/contracts'

type CategoryDefinition = {
  id: CategoryId
  label: string
}

type NftSeed = {
  name: string
  category: CategoryId
  creatorIndex: number
  priceEth: string
  editionSize: number
  editionSold: number
  availability?: NftDetail['availability']
  featured?: boolean
}

export const categoryDefinitions: CategoryDefinition[] = [
  { id: 'art', label: 'Arte' },
  { id: 'music', label: 'Música' },
  { id: 'photography', label: 'Fotografia' },
  { id: 'collectibles', label: 'Colecionáveis' },
  { id: 'metaverse', label: 'Metaverso' },
  { id: 'sports', label: 'Esportes' },
]

const creators: NftDetail['creator'][] = [
  {
    id: 'creator-lia-prado',
    name: 'Lia Prado',
    avatarUrl: '/mock-assets/creator-01.svg',
    verified: true,
  },
  {
    id: 'creator-nova-beat',
    name: 'Nova Beat',
    avatarUrl: '/mock-assets/creator-02.svg',
    verified: true,
  },
  {
    id: 'creator-caio-reis',
    name: 'Caio Reis',
    avatarUrl: '/mock-assets/creator-03.svg',
    verified: false,
  },
  {
    id: 'creator-studio-kite',
    name: 'Studio Kite',
    avatarUrl: '/mock-assets/creator-04.svg',
    verified: true,
  },
  {
    id: 'creator-mara-vox',
    name: 'Mara Vox',
    avatarUrl: '/mock-assets/creator-05.svg',
    verified: false,
  },
  {
    id: 'creator-atlas-fc',
    name: 'Atlas FC',
    avatarUrl: '/mock-assets/creator-06.svg',
    verified: true,
  },
]

const collections: Record<CategoryId, NftDetail['collection']> = {
  art: { id: 'collection-luz-materia', name: 'Luz & Matéria' },
  music: { id: 'collection-frequencias', name: 'Frequências' },
  photography: { id: 'collection-arquivo-urbano', name: 'Arquivo Urbano' },
  collectibles: { id: 'collection-objetos-futuro', name: 'Objetos do Futuro' },
  metaverse: { id: 'collection-portais', name: 'Portais Digitais' },
  sports: { id: 'collection-jogadas-eternas', name: 'Jogadas Eternas' },
}

const nftSeeds: NftSeed[] = [
  {
    name: 'Fragmentos de Luz',
    category: 'art',
    creatorIndex: 0,
    priceEth: '2.45',
    editionSize: 1,
    editionSold: 0,
    featured: true,
  },
  {
    name: 'Ritmo Circular',
    category: 'music',
    creatorIndex: 1,
    priceEth: '0.85',
    editionSize: 25,
    editionSold: 10,
  },
  {
    name: 'Silêncio Urbano',
    category: 'photography',
    creatorIndex: 2,
    priceEth: '1.2',
    editionSize: 10,
    editionSold: 5,
    featured: true,
  },
  {
    name: 'Neon Kitsune',
    category: 'collectibles',
    creatorIndex: 3,
    priceEth: '0.42',
    editionSize: 50,
    editionSold: 25,
  },
  {
    name: 'Jardim Orbital',
    category: 'metaverse',
    creatorIndex: 4,
    priceEth: '3.1',
    editionSize: 8,
    editionSold: 3,
    featured: true,
  },
  {
    name: 'Último Lance',
    category: 'sports',
    creatorIndex: 5,
    priceEth: '5.8',
    editionSize: 1,
    editionSold: 0,
  },
  {
    name: 'Geometria Viva',
    category: 'art',
    creatorIndex: 0,
    priceEth: '0.68',
    editionSize: 20,
    editionSold: 12,
  },
  {
    name: 'Eco do Amanhã',
    category: 'music',
    creatorIndex: 1,
    priceEth: '0.2',
    editionSize: 100,
    editionSold: 100,
    availability: 'sold_out',
  },
  {
    name: 'Concreto e Céu',
    category: 'photography',
    creatorIndex: 2,
    priceEth: '0.95',
    editionSize: 15,
    editionSold: 7,
    featured: true,
  },
  {
    name: 'Cápsula 2077',
    category: 'metaverse',
    creatorIndex: 3,
    priceEth: '0.55',
    editionSize: 60,
    editionSold: 40,
  },
  {
    name: 'Herói de Bairro',
    category: 'sports',
    creatorIndex: 5,
    priceEth: '1.75',
    editionSize: 5,
    editionSold: 2,
  },
  {
    name: 'Máscara Digital',
    category: 'collectibles',
    creatorIndex: 4,
    priceEth: '0.33',
    editionSize: 30,
    editionSold: 9,
  },
  {
    name: 'Pincelada Infinita',
    category: 'art',
    creatorIndex: 0,
    priceEth: '7.2',
    editionSize: 1,
    editionSold: 0,
    featured: true,
  },
  {
    name: 'Frequência Azul',
    category: 'music',
    creatorIndex: 1,
    priceEth: '0.72',
    editionSize: 20,
    editionSold: 14,
  },
  {
    name: 'Chuva de Prata',
    category: 'photography',
    creatorIndex: 2,
    priceEth: '2.05',
    editionSize: 5,
    editionSold: 3,
  },
  {
    name: 'Cidade Flutuante',
    category: 'metaverse',
    creatorIndex: 3,
    priceEth: '1.15',
    editionSize: 25,
    editionSold: 18,
    featured: true,
  },
  {
    name: 'Dunk Celestial',
    category: 'sports',
    creatorIndex: 5,
    priceEth: '0.9',
    editionSize: 10,
    editionSold: 6,
  },
  {
    name: 'Relíquia Lunar',
    category: 'collectibles',
    creatorIndex: 4,
    priceEth: '4.5',
    editionSize: 1,
    editionSold: 0,
  },
  {
    name: 'Traço Ancestral',
    category: 'art',
    creatorIndex: 0,
    priceEth: '0.48',
    editionSize: 40,
    editionSold: 20,
  },
  {
    name: 'Batida Cromática',
    category: 'music',
    creatorIndex: 1,
    priceEth: '0.27',
    editionSize: 50,
    editionSold: 30,
  },
  {
    name: 'Retrato de Máquina',
    category: 'photography',
    creatorIndex: 2,
    priceEth: '3.65',
    editionSize: 1,
    editionSold: 0,
  },
  {
    name: 'Portal 13',
    category: 'metaverse',
    creatorIndex: 3,
    priceEth: '0.18',
    editionSize: 100,
    editionSold: 100,
    availability: 'sold_out',
  },
  {
    name: 'Camisa 10',
    category: 'sports',
    creatorIndex: 5,
    priceEth: '0.75',
    editionSize: 10,
    editionSold: 10,
    availability: 'sold_out',
  },
  {
    name: 'Diamante Bruto',
    category: 'collectibles',
    creatorIndex: 4,
    priceEth: '1.4',
    editionSize: 12,
    editionSold: 5,
  },
  {
    name: 'Horizonte Líquido',
    category: 'art',
    creatorIndex: 0,
    priceEth: '0.63',
    editionSize: 16,
    editionSold: 8,
    featured: true,
  },
  {
    name: 'Loop Noturno',
    category: 'music',
    creatorIndex: 1,
    priceEth: '1.95',
    editionSize: 4,
    editionSold: 2,
  },
  {
    name: 'Luz de Inverno',
    category: 'photography',
    creatorIndex: 2,
    priceEth: '0.88',
    editionSize: 8,
    editionSold: 4,
  },
  {
    name: 'Arena Infinita',
    category: 'sports',
    creatorIndex: 5,
    priceEth: '1.25',
    editionSize: 7,
    editionSold: 3,
  },
  {
    name: 'Cofre Quântico',
    category: 'metaverse',
    creatorIndex: 3,
    priceEth: '6.4',
    editionSize: 1,
    editionSold: 0,
  },
  {
    name: 'Selo do Colecionador',
    category: 'collectibles',
    creatorIndex: 4,
    priceEth: '0.36',
    editionSize: 25,
    editionSold: 15,
  },
  {
    name: 'Onda Estática',
    category: 'art',
    creatorIndex: 0,
    priceEth: '0.58',
    editionSize: 1,
    editionSold: 0,
    availability: 'unavailable',
  },
  {
    name: 'Última Frequência',
    category: 'music',
    creatorIndex: 1,
    priceEth: '1.1',
    editionSize: 12,
    editionSold: 12,
    availability: 'sold_out',
  },
]

const networks: NftDetail['network'][] = ['ethereum', 'polygon', 'solana']
const baseTimestamp = Date.parse('2026-09-30T12:00:00.000Z')
const dayInMilliseconds = 86_400_000

export const seedNfts: NftDetail[] = nftSeeds.map((seed, index) => {
  const category = categoryDefinitions.find((item) => item.id === seed.category)
  const apeNumber = String((index % 4) + 1).padStart(2, '0')
  const secondaryApeNumber = String(((index + 2) % 4) + 1).padStart(2, '0')
  const imageUrl = `/design/nft-ape-${apeNumber}.jpg`
  const secondaryImageUrl = `/design/nft-ape-${secondaryApeNumber}.jpg`
  const network = networks[index % networks.length]
  const editionSold = seed.availability === 'sold_out' ? seed.editionSize : seed.editionSold
  const availableQuantity =
    seed.availability === 'available' || seed.availability === undefined
      ? Math.max(0, seed.editionSize - editionSold)
      : 0
  const createdAt = new Date(baseTimestamp - index * dayInMilliseconds).toISOString()

  return {
    id: `nft-${String(index + 1).padStart(3, '0')}`,
    name: seed.name,
    imageUrl,
    category: seed.category,
    collection: collections[seed.category],
    creator: creators[seed.creatorIndex] ?? creators[0],
    priceEth: seed.priceEth,
    currency: 'ETH',
    network,
    availability: seed.availability ?? 'available',
    availableQuantity,
    editionSize: seed.editionSize,
    editionSold,
    likes: 18 + ((index * 37) % 240),
    featured: seed.featured ?? false,
    version: 1,
    createdAt,
    updatedAt: createdAt,
    description: `${seed.name} integra a coleção ${collections[seed.category].name}, uma edição digital de ${category?.label ?? 'arte'} criada para o marketplace.`,
    gallery: [imageUrl, secondaryImageUrl, imageUrl],
    attributes: [
      { traitType: 'Categoria', value: category?.label ?? seed.category },
      { traitType: 'Edição', value: `${seed.editionSize} unidades` },
      {
        traitType: 'Raridade',
        value: seed.editionSize <= 5 ? 'Lendária' : seed.editionSize <= 25 ? 'Rara' : 'Comum',
      },
    ],
  }
})

export const seedCategories: NftCategory[] = categoryDefinitions.map((category) => ({
  ...category,
  count: seedNfts.filter((nft) => nft.category === category.id).length,
}))
