import { MatchingEngineService } from './matching-engine.service';
import { PrismaService } from '../database/prisma.service';

describe('MatchingEngineService', () => {
  let service: MatchingEngineService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      shelter: { findUnique: jest.fn() },
      warehouse: { findUnique: jest.fn() },
      inventoryItem: { findMany: jest.fn() },
      hazard: { count: jest.fn() },
    } as any;

    service = new MatchingEngineService(prisma);
  });

  it('should generate explainable recommendations with match scores and impact previews', async () => {
    (prisma.shelter.findUnique as jest.Mock).mockResolvedValue({
      id: 'shelter-12',
      latitude: 37.8200,
      longitude: -122.2500,
    });

    (prisma.inventoryItem.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'item-1',
        name: 'Insulin',
        availableQuantity: 4000,
        quantity: 5000,
        unit: 'vials',
        criticality: 'CRITICAL',
        warehouse: {
          id: 'wh-alpha',
          name: 'Hub Alpha',
          latitude: 37.7749,
          longitude: -122.4194,
        },
      },
    ]);

    (prisma.hazard.count as jest.Mock).mockResolvedValue(0);

    const recs = await service.findRecommendations('Insulin', 500, 'shelter-12');

    expect(recs.length).toBe(1);
    expect(recs[0].sourceWarehouseId).toBe('wh-alpha');
    expect(recs[0].matchScore).toBeGreaterThan(60);
    expect(recs[0].reasons.length).toBeGreaterThan(0);
    expect(recs[0].impactPreview.sourceStockBefore).toBe(4000);
    expect(recs[0].impactPreview.sourceStockAfter).toBe(3500);
  });
});
