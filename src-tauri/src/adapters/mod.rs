// Adapter layer: Integrates with external services and APIs
// This layer acts as a bridge between our services and external providers
// Each adapter translates service-layer requests to provider-specific formats

pub mod arxiv_api;
pub mod db;
pub mod marker_api;
pub mod os;
pub mod sidecars;
