/**
 * 智游伴侣 - 行程规划智能体
 * 负责行程生成、优化和重规划
 */

import { BaseAgent } from '../core/gateway.js';
import type {
  AgentMessage,
  AgentConfig,
  POI,
  Itinerary,
  ItineraryNode,
  TimeSlot,
  UserPreferences,
  Location,
  Result
} from '../types/index.js';
import { ok, err } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

// ==================== 配置 ====================

interface PlanningAgentConfig extends AgentConfig {
  optimizationAlgorithm: 'greedy' | 'simulated_annealing' | 'genetic';
  maxPoisPerDay: number;
  minRestHours: number;
  maxDrivingHoursPerDay: number;
  enableCache: boolean;
}

// ==================== 优化算法 ====================

class ItineraryOptimizer {
  private config: PlanningAgentConfig;

  constructor(config: PlanningAgentConfig) {
    this.config = config;
  }

  async generateItinerary(
    pois: POI[],
    startDate: Date,
    endDate: Date,
    preferences?: UserPreferences,
    startLocation?: Location
  ): Promise<Itinerary> {
    console.log(`[Optimizer] Generating itinerary with ${pois.length} POIs`);

    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Filter and rank POIs
    const rankedPois = this.rankPOIs(pois, preferences);

    // Generate nodes using greedy algorithm
    const nodes = await this.greedyAlgorithm(
      rankedPois,
      startDate,
      durationDays,
      preferences,
      startLocation
    );

    // Calculate statistics
    const totalDistance = this.calculateTotalDistance(nodes);
    const totalDuration = this.calculateTotalDuration(nodes);
    const totalCost = this.calculateTotalCost(nodes);

    const itinerary: Itinerary = {
      id: uuidv4(),
      title: `行程 (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
      startDate,
      endDate,
      durationDays,
      nodes,
      totalDistanceKm: totalDistance,
      totalDurationHours: totalDuration,
      totalCost,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return itinerary;
  }

  private rankPOIs(pois: POI[], preferences?: UserPreferences): POI[] {
    // Filter by preferences
    let filtered = pois;

    if (preferences) {
      filtered = pois.filter(poi => {
        // Check rating
        if (poi.rating < preferences.minRating) {
          return false;
        }

        // Check price level
        if (poi.priceLevel && poi.priceLevel > preferences.maxPriceLevel) {
          return false;
        }

        // Check disliked categories
        if (preferences.dislikedCategories.includes(poi.category)) {
          return false;
        }

        return true;
      });
    }

    // Calculate scores
    const scored = filtered.map(poi => {
      let score = poi.rating / 5;

      if (preferences) {
        // Bonus for preferred categories
        if (preferences.preferredCategories.includes(poi.category)) {
          score += 0.2;
        }
      }

      return { poi, score };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    return scored.map(s => s.poi);
  }

  private async greedyAlgorithm(
    pois: POI[],
    startDate: Date,
    durationDays: number,
    preferences?: UserPreferences,
    startLocation?: Location
  ): Promise<ItineraryNode[]> {
    const nodes: ItineraryNode[] = [];
    const remainingPois = [...pois];
    const maxPerDay = this.config.maxPoisPerDay;

    for (let day = 0; day < durationDays; day++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(dayStart.getDate() + day);
      dayStart.setHours(9, 0, 0, 0); // Start at 9 AM

      let currentTime = new Date(dayStart);
      let poisToday = 0;

      while (remainingPois.length > 0 && poisToday < maxPerDay) {
        // Find next POI
        const nextPoi = this.findNextPOI(remainingPois, nodes, currentTime, preferences);
        if (!nextPoi) {
          break;
        }

        // Calculate time slot
        const duration = this.getDurationForCategory(nextPoi.category);
        const timeSlot: TimeSlot = {
          startTime: new Date(currentTime),
          endTime: new Date(currentTime.getTime() + duration * 60 * 1000),
          durationMinutes: duration,
          isFlexible: true
        };

        // Create node
        const node: ItineraryNode = {
          id: uuidv4(),
          title: nextPoi.name,
          nodeType: this.mapCategoryToNodeType(nextPoi.category),
          timeSlot,
          poi: nextPoi,
          location: nextPoi.location,
          estimatedCost: nextPoi.priceLevel ? nextPoi.priceLevel * 50 : 0,
          order: nodes.length,
          isConfirmed: false,
          isCompleted: false
        };

        nodes.push(node);
        remainingPois.splice(remainingPois.indexOf(nextPoi), 1);
        poisToday++;

        // Update current time (add duration + break)
        currentTime = new Date(timeSlot.endTime.getTime() + 30 * 60 * 1000); // 30 min break
      }
    }

    return nodes;
  }

  private findNextPOI(
    remainingPois: POI[],
    existingNodes: ItineraryNode[],
    currentTime: Date,
    preferences?: UserPreferences
  ): POI | undefined {
    if (remainingPois.length === 0) {
      return undefined;
    }

    // Get last location
    const lastNode = existingNodes[existingNodes.length - 1];
    const lastLocation = lastNode?.location || preferences?.maxWalkingDistanceKm
      ? { latitude: 30.2592, longitude: 120.1494 } // Default to West Lake
      : undefined;

    // Calculate scores
    const scored = remainingPois.map(poi => {
      let score = poi.rating / 5;

      // Distance penalty
      if (lastLocation) {
        const distance = this.calculateDistance(lastLocation, poi.location);
        score -= distance / 10000; // Penalty per km
      }

      return { poi, score };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    return scored[0]?.poi;
  }

  private getDurationForCategory(category: string): number {
    const durations: Record<string, number> = {
      scenic: 120,
      restaurant: 90,
      hotel: 60,
      shopping: 90,
      entertainment: 120
    };

    return durations[category] || 60;
  }

  private mapCategoryToNodeType(category: string): ItineraryNode['nodeType'] {
    const mapping: Record<string, ItineraryNode['nodeType']> = {
      scenic: 'scenic',
      restaurant: 'restaurant',
      hotel: 'hotel',
      shopping: 'activity',
      entertainment: 'activity'
    };

    return mapping[category] || 'activity';
  }

  private calculateDistance(loc1: Location, loc2: Location): number {
    // Haversine formula
    const R = 6371000; // Earth's radius in meters
    const lat1 = loc1.latitude * Math.PI / 180;
    const lat2 = loc2.latitude * Math.PI / 180;
    const deltaLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const deltaLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) ** 2 +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private calculateTotalDistance(nodes: ItineraryNode[]): number {
    let total = 0;
    for (let i = 1; i < nodes.length; i++) {
      if (nodes[i].location && nodes[i - 1].location) {
        total += this.calculateDistance(nodes[i - 1].location!, nodes[i].location!);
      }
    }
    return total / 1000; // Convert to km
  }

  private calculateTotalDuration(nodes: ItineraryNode[]): number {
    return nodes.reduce((total, node) => {
      return total + (node.timeSlot.durationMinutes || 0);
    }, 0) / 60; // Convert to hours
  }

  private calculateTotalCost(nodes: ItineraryNode[]): number {
    return nodes.reduce((total, node) => {
      return total + (node.estimatedCost || 0);
    }, 0);
  }
}

// ==================== 智能体实现 ====================

export class PlanningAgent extends BaseAgent {
  private optimizer: ItineraryOptimizer;
  protected config: PlanningAgentConfig;

  constructor(config: PlanningAgentConfig) {
    super({
      id: config.id,
      name: config.name || '策略规划',
      description: config.description || '负责行程规划和优化',
      capabilities: [
        {
          name: 'create_itinerary',
          description: '创建行程',
          parameters: {
            pois: 'POI列表',
            startDate: '开始日期',
            endDate: '结束日期',
            preferences: '用户偏好'
          }
        },
        {
          name: 'optimize_itinerary',
          description: '优化行程',
          parameters: { itinerary: '现有行程' }
        }
      ]
    });

    this.config = config;
    this.optimizer = new ItineraryOptimizer(config);
  }

  async process(message: AgentMessage): Promise<Result<AgentMessage>> {
    try {
      this.setState('busy');

      const action = message.content.action as string;
      let responseContent: Record<string, unknown> = {};

      switch (action) {
        case 'create_itinerary':
          responseContent = await this.handleCreateItinerary(message.content);
          break;

        case 'optimize_itinerary':
          responseContent = await this.handleOptimizeItinerary(message.content);
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      this.setState('idle');

      return ok({
        id: message.id,
        conversationId: message.conversationId,
        timestamp: new Date(),
        sender: this.id,
        receiver: message.sender,
        content: responseContent
      });

    } catch (error) {
      this.setState('error');
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async handleCreateItinerary(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const pois = params.pois as POI[];
    const startDate = new Date(params.startDate as string);
    const endDate = new Date(params.endDate as string);
    const preferences = params.preferences as UserPreferences | undefined;
    const startLocation = params.startLocation as Location | undefined;

    if (!pois || pois.length === 0) {
      return {
        success: false,
        error: 'No POIs provided'
      };
    }

    const itinerary = await this.optimizer.generateItinerary(
      pois,
      startDate,
      endDate,
      preferences,
      startLocation
    );

    return {
      success: true,
      data: itinerary,
      message: `Generated itinerary with ${itinerary.nodes.length} stops`
    };
  }

  private async handleOptimizeItinerary(params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const itinerary = params.itinerary as Itinerary;

    // TODO: Implement optimization logic
    console.log(`[PlanningAgent] Optimizing itinerary: ${itinerary.id}`);

    return {
      success: true,
      data: itinerary,
      message: 'Itinerary optimized'
    };
  }
}
