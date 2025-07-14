'use server';

import { logSecurityEvent } from './security';

/**
 * Security event severity levels
 */
export type SecurityEventSeverity = 'info' | 'warn' | 'error' | 'critical';

/**
 * Security event types
 */
export type SecurityEventType = 
  | 'AUTH' 
  | 'ACCESS' 
  | 'VALIDATION' 
  | 'RATE_LIMIT' 
  | 'ATTACK' 
  | 'CONFIG'
  | 'SYSTEM';

/**
 * Security event information
 */
export type SecurityEvent = {
  id: string;
  type: SecurityEventType;
  message: string;
  timestamp: string;
  severity: SecurityEventSeverity;
  source: string;
  data?: any;
  userId?: string;
  ip?: string;
  userAgent?: string;
  url?: string;
};

// In-memory store for security events (in production, use a persistent store)
const securityEvents: SecurityEvent[] = [];

// Set the maximum number of events to keep in memory
const MAX_EVENTS = 1000;

// Pattern detection thresholds
const RATE_LIMIT_THRESHOLD = 10; // Number of rate limit events from same IP to trigger alert
const ATTACK_THRESHOLD = 3; // Number of attack events from same IP to trigger alert
const AUTH_FAILURE_THRESHOLD = 5; // Number of auth failure events from same IP to trigger alert
const TIME_WINDOW_MS = 10 * 60 * 1000; // 10 minute window for pattern detection

// Flag to track if security monitoring has been initialized
let securityMonitoringInitialized = false;

/**
 * Add a security event to the monitoring system
 * @param event Security event to record
 */
export async function recordSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
  const timestamp = new Date().toISOString();
  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  const fullEvent: SecurityEvent = {
    ...event,
    id,
    timestamp,
  };
  
  // Add to in-memory store
  securityEvents.unshift(fullEvent);
  
  // Trim the events array if it exceeds the maximum size
  if (securityEvents.length > MAX_EVENTS) {
    securityEvents.length = MAX_EVENTS;
  }
  
  // Only log to console for non-system events or critical/error events
  // This reduces logging noise for routine system events
  if (event.type !== 'SYSTEM' || event.severity === 'critical' || event.severity === 'error') {
    await logSecurityEvent(
      event.type,
      event.message, 
      { 
        severity: event.severity, 
        source: event.source,
        userId: event.userId,
        ip: event.ip,
        url: event.url
      }, 
      event.severity === 'critical' ? 'error' : event.severity as any
    );
  }
  
  // Check for patterns that might indicate an attack
  await detectSecurityThreats(fullEvent);
}

/**
 * Get recent security events filtered by criteria
 * @param options Filter options
 * @returns Filtered security events
 */
export async function getSecurityEvents(options: {
  limit?: number;
  since?: Date;
  type?: SecurityEventType | SecurityEventType[];
  minSeverity?: SecurityEventSeverity;
  ip?: string;
  userId?: string;
} = {}): Promise<SecurityEvent[]> {
  const {
    limit = 100,
    since,
    type,
    minSeverity,
    ip,
    userId,
  } = options;
  
  let filtered = [...securityEvents];
  
  // Filter by timestamp
  if (since) {
    const sinceTime = since.getTime();
    filtered = filtered.filter(event => new Date(event.timestamp).getTime() >= sinceTime);
  }
  
  // Filter by type
  if (type) {
    if (Array.isArray(type)) {
      filtered = filtered.filter(event => type.includes(event.type));
    } else {
      filtered = filtered.filter(event => event.type === type);
    }
  }
  
  // Filter by minimum severity
  if (minSeverity) {
    const severityOrder: Record<SecurityEventSeverity, number> = {
      'info': 0,
      'warn': 1,
      'error': 2,
      'critical': 3
    };
    
    const minSeverityLevel = severityOrder[minSeverity];
    filtered = filtered.filter(
      event => severityOrder[event.severity] >= minSeverityLevel
    );
  }
  
  // Filter by IP
  if (ip) {
    filtered = filtered.filter(event => event.ip === ip);
  }
  
  // Filter by user ID
  if (userId) {
    filtered = filtered.filter(event => event.userId === userId);
  }
  
  // Apply limit
  return filtered.slice(0, limit);
}

/**
 * Check if the given event and previous events indicate a security threat
 * @param event The latest security event
 */
async function detectSecurityThreats(event: SecurityEvent): Promise<void> {
  const now = new Date().getTime();
  const windowStart = now - TIME_WINDOW_MS;
  
  // Only check for patterns if we have IP information
  if (!event.ip) return;
  
  // Get events from the same IP in the time window
  const eventsFromSameIp = securityEvents.filter(e => 
    e.ip === event.ip && 
    new Date(e.timestamp).getTime() >= windowStart
  );
  
  // Check for rate limit abuse
  const rateLimitEvents = eventsFromSameIp.filter(e => e.type === 'RATE_LIMIT');
  if (rateLimitEvents.length >= RATE_LIMIT_THRESHOLD) {
    // Potential DoS attack detected
    await recordSecurityEvent({
      type: 'ATTACK',
      message: `Potential DoS attack: ${rateLimitEvents.length} rate limit events from IP ${event.ip}`,
      severity: 'critical',
      source: 'securityMonitor',
      ip: event.ip,
      data: {
        events: rateLimitEvents.map(e => ({ id: e.id, timestamp: e.timestamp, url: e.url }))
      }
    });
  }
  
  // Check for repeated attack attempts
  const attackEvents = eventsFromSameIp.filter(e => e.type === 'ATTACK');
  if (attackEvents.length >= ATTACK_THRESHOLD) {
    // Persistent attack detected
    await recordSecurityEvent({
      type: 'ATTACK',
      message: `Persistent attack detected: ${attackEvents.length} attack events from IP ${event.ip}`,
      severity: 'critical',
      source: 'securityMonitor',
      ip: event.ip,
      data: {
        events: attackEvents.map(e => ({ id: e.id, timestamp: e.timestamp, message: e.message }))
      }
    });
  }
  
  // Check for authentication failures
  const authFailureEvents = eventsFromSameIp.filter(
    e => e.type === 'AUTH' && e.message.includes('failed')
  );
  
  if (authFailureEvents.length >= AUTH_FAILURE_THRESHOLD) {
    // Potential brute force attack
    await recordSecurityEvent({
      type: 'ATTACK',
      message: `Potential brute force attack: ${authFailureEvents.length} auth failures from IP ${event.ip}`,
      severity: 'critical',
      source: 'securityMonitor',
      ip: event.ip,
      data: {
        events: authFailureEvents.map(e => ({ id: e.id, timestamp: e.timestamp, userId: e.userId }))
      }
    });
  }
}

/**
 * Get security summary statistics
 * @param timeWindow Time window in milliseconds (default: 24 hours)
 * @returns Summary statistics
 */
export async function getSecuritySummary(timeWindow: number = 24 * 60 * 60 * 1000): Promise<{
  total: number;
  bySeverity: Record<SecurityEventSeverity, number>;
  byType: Record<SecurityEventType, number>;
  topIps: Array<{ ip: string; count: number }>;
  topAttackTypes: Array<{ message: string; count: number }>;
}> {
  const now = new Date().getTime();
  const windowStart = now - timeWindow;
  
  // Filter events within the time window
  const recentEvents = securityEvents.filter(
    event => new Date(event.timestamp).getTime() >= windowStart
  );
  
  // Count by severity
  const bySeverity: Record<SecurityEventSeverity, number> = {
    'info': 0,
    'warn': 0,
    'error': 0,
    'critical': 0
  };
  
  recentEvents.forEach(event => {
    bySeverity[event.severity]++;
  });
  
  // Count by type
  const byType: Partial<Record<SecurityEventType, number>> = {};
  
  recentEvents.forEach(event => {
    byType[event.type] = (byType[event.type] || 0) + 1;
  });
  
  // Count by IP
  const ipCounts: Record<string, number> = {};
  
  recentEvents.forEach(event => {
    if (event.ip) {
      ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
    }
  });
  
  // Get top IPs
  const topIps = Object.entries(ipCounts)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Count attack types
  const attackMessages: Record<string, number> = {};
  
  recentEvents
    .filter(event => event.type === 'ATTACK')
    .forEach(event => {
      // Extract the main part of the message (before the colon)
      const messageType = event.message.split(':')[0];
      attackMessages[messageType] = (attackMessages[messageType] || 0) + 1;
    });
  
  // Get top attack types
  const topAttackTypes = Object.entries(attackMessages)
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return {
    total: recentEvents.length,
    bySeverity,
    byType: byType as Record<SecurityEventType, number>,
    topIps,
    topAttackTypes
  };
}

/**
 * Clear all recorded security events (for testing or cleanup)
 */
export async function clearSecurityEvents(): Promise<void> {
  securityEvents.length = 0;
  
  // Log the clearing action
  await logSecurityEvent(
    'SYSTEM',
    'Security events cleared',
    {},
    'info'
  );
}

/**
 * Initialize security monitoring on application startup
 */
export async function initSecurityMonitoring(): Promise<void> {
  // Only initialize once to prevent duplicate initialization messages
  if (securityMonitoringInitialized) {
    return;
  }
  
  securityMonitoringInitialized = true;
  
  // Record initialization event but don't log to console
  await recordSecurityEvent({
    type: 'SYSTEM',
    message: 'Security monitoring initialized',
    severity: 'info',
    source: 'securityMonitor',
  });
  
  // In a real app, you might set up recurring tasks here
  // such as exporting events to long-term storage or sending reports
} 
