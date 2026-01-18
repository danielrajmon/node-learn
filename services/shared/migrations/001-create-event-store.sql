/**
 * Event Store Schema Migration
 * Creates table to persist all domain events for event sourcing
 */

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event metadata
  event_type VARCHAR(100) NOT NULL,
  aggregate_id VARCHAR(255) NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL,
  
  -- Event payload (JSONB for flexible schema)
  payload JSONB NOT NULL,
  
  -- Tracing & correlation
  correlation_id UUID NOT NULL,
  causation_id UUID,
  service_id VARCHAR(100),
  
  -- Versioning
  version INT NOT NULL DEFAULT 1,
  
  -- Audit trail
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255),
  
  -- Indexes for common queries
  CONSTRAINT events_valid_timestamp CHECK (created_at <= NOW())
);

-- Indexes for performance
CREATE INDEX idx_events_aggregate_id ON events(aggregate_id);
CREATE INDEX idx_events_aggregate_type ON events(aggregate_type);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_correlation_id ON events(correlation_id);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_service_id ON events(service_id);

-- Composite indexes for common queries
CREATE INDEX idx_events_aggregate ON events(aggregate_id, created_at DESC);
CREATE INDEX idx_events_type_created ON events(event_type, created_at DESC);

-- View for recent events (useful for debugging)
CREATE OR REPLACE VIEW v_recent_events AS
SELECT 
  id,
  event_type,
  aggregate_id,
  aggregate_type,
  correlation_id,
  service_id,
  created_at,
  payload
FROM events
ORDER BY created_at DESC
LIMIT 1000;

-- View for events by aggregate
CREATE OR REPLACE VIEW v_aggregate_events AS
SELECT 
  aggregate_id,
  aggregate_type,
  event_type,
  COUNT(*) as event_count,
  MAX(created_at) as latest_event,
  MIN(created_at) as oldest_event
FROM events
GROUP BY aggregate_id, aggregate_type, event_type;

-- Grant permissions (optional)
-- GRANT SELECT ON events TO service_user;
-- GRANT INSERT ON events TO service_user;
