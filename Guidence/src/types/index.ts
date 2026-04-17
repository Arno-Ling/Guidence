/**
 * 智游伴侣 - 核心类型定义
 * 基于OpenClaw架构设计
 */

// ==================== 基础类型 ====================

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  province?: string;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  durationMinutes?: number;
  isFlexible?: boolean;
}

// ==================== POI类型 ====================

export type POICategory = 
  | 'scenic'
  | 'restaurant'
  | 'hotel'
  | 'gas_station'
  | 'charging_station'
  | 'shopping'
  | 'entertainment'
  | 'hospital'
  | 'pharmacy'
  | 'parking';

export interface POI {
  id: string;
  name: string;
  category: POICategory;
  location: Location;
  rating: number;
  ratingCount: number;
  priceLevel?: 1 | 2 | 3 | 4;
  phone?: string;
  website?: string;
  tags: string[];
  images: string[];
  businessHours?: Record<string, string>;
  isOpenNow?: boolean;
}

// ==================== 行程类型 ====================

export type NodeType = 'scenic' | 'restaurant' | 'hotel' | 'transport' | 'activity' | 'rest';

export interface ItineraryNode {
  id: string;
  title: string;
  nodeType: NodeType;
  timeSlot: TimeSlot;
  poi?: POI;
  location?: Location;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
  order: number;
  isConfirmed: boolean;
  isCompleted: boolean;
}

export interface Itinerary {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  nodes: ItineraryNode[];
  totalDistanceKm: number;
  totalDurationHours: number;
  totalCost: number;
  status: 'draft' | 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// ==================== 用户类型 ====================

export interface UserPreferences {
  preferredCategories: POICategory[];
  dislikedCategories: POICategory[];
  minRating: number;
  maxPriceLevel: 1 | 2 | 3 | 4;
  preferredStartTime?: string;
  preferredEndTime?: string;
  maxWalkingDistanceKm: number;
  energyLevel: 'low' | 'medium' | 'high';
  dietaryRestrictions?: string[];
  specialRequirements?: string;
}

export interface UserProfile {
  id: string;
  nickname: string;
  preferences: UserPreferences;
  subscriptionPlan: 'free' | 'l1' | 'l2' | 'l3';
  tokensRemaining: number;
  createdAt: Date;
  lastActiveAt: Date;
}

// ==================== 智能体类型 ====================

export type AgentState = 'idle' | 'busy' | 'error' | 'stopped';

export interface AgentMessage {
  id: string;
  conversationId: string;
  timestamp: Date;
  sender: string;
  receiver: string;
  content: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AgentCapability {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  maxRetries?: number;
  timeout?: number;
}

// ==================== 工具类型 ====================

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: unknown;
}

export interface ToolConfig {
  name: string;
  description: string;
  parameters: ToolParameter[];
  returns?: string;
}

// ==================== 会话类型 ====================

export interface Session {
  id: string;
  userId?: string;
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt?: Date;
  context: Record<string, unknown>;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
}

// ==================== 任务类型 ====================

export type TaskStatus = 'pending' | 'processing' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Task {
  id: string;
  conversationId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  assignedAgents: string[];
  requiresApproval: boolean;
  approvalType?: 'payment' | 'navigation_change' | 'booking' | 'sensitive_operation';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

// ==================== 配置类型 ====================

export interface TravelCompanionConfig {
  appName: string;
  version: string;
  debug: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  // API Keys
  amapApiKey?: string;
  amapSecurityCode?: string;
  qweatherApiKey?: string;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  openaiModel?: string;
  
  // Database
  databaseUrl?: string;
  
  // Cache
  redisUrl?: string;
  enableCache: boolean;
  
  // Browser
  browserHeadless: boolean;
  browserTimeout: number;
  enableBrowserAutomation: boolean;
  
  // Features
  enableRealTimeMonitoring: boolean;
  enableLlm: boolean;
}

// ==================== 事件类型 ====================

export interface Event<T = unknown> {
  type: string;
  timestamp: Date;
  data: T;
  source?: string;
}

export type EventHandler<T = unknown> = (event: Event<T>) => void | Promise<void>;

// ==================== 结果类型 ====================

export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

// ==================== 对话管理类型 ====================

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface ConversationContext {
  userPreferences: {
    budget?: string;
    travelStyle?: string;
    [key: string]: unknown;
  };
  currentTrip: string | null;
  mentionedPlaces: string[];
  mentionedDates: string[];
}

export interface ConversationSession {
  id: string;
  messages: Message[];
  context: ConversationContext;
  createdAt: number;
  lastActiveAt: number;
}
