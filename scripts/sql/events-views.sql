/**
 * Event Store Views
 * Adds read-friendly views on top of the events table
 */

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'events'
  ) THEN
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
  END IF;
END $$;
