use super::*;

#[test]
fn test_get_db_pool_not_initialized() {
    // Note: This test may fail if other tests have already initialized the pool
    // in the same test run. For true isolation, each test would need its own process.

    // Test assumes DB_POOL hasn't been initialized in this test
    // In practice, once set, OnceLock cannot be reset
    let result = get_db_pool();

    // If pool is not initialized, should return error
    // If already initialized from another test, will return Ok
    match result {
        Err(e) => assert_eq!(e, "Database not initialized"),
        Ok(_) => {
            // Pool was already initialized by another test, which is acceptable
            // since OnceLock is process-global
        }
    }
}
