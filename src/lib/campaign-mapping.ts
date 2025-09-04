import { prisma } from '@/lib/prisma'

export interface CampaignMapping {
  id: string
  campaignId: string
  metaPixelId: string
  metaAccessToken: string
  campaignName: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * キャンペーンIDからマッピング情報を取得
 */
export async function getCampaignMapping(campaignId: string): Promise<CampaignMapping | null> {
  try {
    const mapping = await prisma.campaignMapping.findUnique({
      where: {
        campaignId: campaignId,
        isActive: true
      }
    })

    return mapping
  } catch (error) {
    console.error('Failed to get campaign mapping:', error)
    return null
  }
}

/**
 * すべてのアクティブなキャンペーンマッピングを取得
 */
export async function getAllActiveCampaignMappings(): Promise<CampaignMapping[]> {
  try {
    const mappings = await prisma.campaignMapping.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return mappings
  } catch (error) {
    console.error('Failed to get campaign mappings:', error)
    return []
  }
}

/**
 * キャンペーンマッピングを作成
 */
export async function createCampaignMapping(data: {
  campaignId: string
  metaPixelId: string
  metaAccessToken: string
  campaignName?: string
}): Promise<CampaignMapping | null> {
  try {
    const mapping = await prisma.campaignMapping.create({
      data: {
        campaignId: data.campaignId,
        metaPixelId: data.metaPixelId,
        metaAccessToken: data.metaAccessToken,
        campaignName: data.campaignName,
        isActive: true
      }
    })

    return mapping
  } catch (error) {
    console.error('Failed to create campaign mapping:', error)
    return null
  }
}

/**
 * キャンペーンマッピングを更新
 */
export async function updateCampaignMapping(
  campaignId: string,
  data: {
    metaPixelId?: string
    metaAccessToken?: string
    campaignName?: string
    isActive?: boolean
  }
): Promise<CampaignMapping | null> {
  try {
    const mapping = await prisma.campaignMapping.update({
      where: {
        campaignId: campaignId
      },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })

    return mapping
  } catch (error) {
    console.error('Failed to update campaign mapping:', error)
    return null
  }
}

/**
 * キャンペーンマッピングを削除（無効化）
 */
export async function deleteCampaignMapping(campaignId: string): Promise<boolean> {
  try {
    await prisma.campaignMapping.update({
      where: {
        campaignId: campaignId
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    return true
  } catch (error) {
    console.error('Failed to delete campaign mapping:', error)
    return false
  }
}

/**
 * デフォルトのキャンペーンマッピングを取得（環境変数から）
 */
export function getDefaultCampaignMapping(): { metaPixelId: string; metaAccessToken: string } | null {
  const metaPixelId = process.env.META_PIXEL_ID
  const metaAccessToken = process.env.META_ACCESS_TOKEN

  if (!metaPixelId || !metaAccessToken) {
    return null
  }

  return {
    metaPixelId,
    metaAccessToken
  }
}
