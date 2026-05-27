use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptBlock {
    #[serde(rename = "type")]
    pub block_type: String,
    pub content: Option<String>,
    #[serde(rename = "fileId")]
    pub file_id: Option<String>,
    #[serde(rename = "fileName")]
    pub file_name: Option<String>,
}

pub fn validate_blocks_json(blocks_json: &str) -> Result<Vec<PromptBlock>, String> {
    serde_json::from_str::<Vec<PromptBlock>>(blocks_json)
        .map_err(|e| format!("Invalid blocks JSON: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_empty_array() {
        let result = validate_blocks_json("[]");
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[test]
    fn test_validate_text_block() {
        let json = r#"[{"type":"text","content":"hello"}]"#;
        let result = validate_blocks_json(json).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].block_type, "text");
        assert_eq!(result[0].content.as_deref(), Some("hello"));
    }

    #[test]
    fn test_validate_file_block() {
        let json = r#"[{"type":"file","fileId":"abc","fileName":"test.pdf"}]"#;
        let result = validate_blocks_json(json).unwrap();
        assert_eq!(result[0].block_type, "file");
        assert_eq!(result[0].file_id.as_deref(), Some("abc"));
    }

    #[test]
    fn test_validate_invalid_json() {
        let result = validate_blocks_json("not json");
        assert!(result.is_err());
    }
}
