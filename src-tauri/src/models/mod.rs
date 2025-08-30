use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PuzzlePiece {
    pub id: String,
    pub original_index: usize,
    pub current_position: Position,
    pub correct_position: Position,
    pub rotation: f64,
    pub is_flipped: bool,
    pub image_data: String,
    pub width: u32,
    pub height: u32,
    pub shape: PieceShape,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PieceShape {
    Square,
    Triangle,
    Irregular,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PuzzleConfig {
    pub id: String,
    pub name: String,
    pub original_image: String,
    pub grid_size: GridSize,
    pub piece_shape: PieceShape,
    pub difficulty: DifficultyLevel,
    pub pieces: Vec<PuzzlePiece>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GridSize {
    pub rows: u32,
    pub cols: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DifficultyLevel {
    Easy,
    Medium,
    Hard,
    Expert,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameState {
    pub config: PuzzleConfig,
    pub start_time: String,
    pub end_time: Option<String>,
    pub moves: u32,
    pub is_completed: bool,
    pub elapsed_time: u64,
    pub history: Vec<GameMove>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameMove {
    pub id: String,
    pub piece_id: String,
    pub action: MoveAction,
    pub from_position: Option<Position>,
    pub to_position: Option<Position>,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MoveAction {
    Move,
    Rotate,
    Flip,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Asset {
    pub id: String,
    pub name: String,
    pub category: String,
    pub tags: Vec<String>,
    pub file_path: String,
    pub thumbnail: String,
    pub width: u32,
    pub height: u32,
    pub file_size: u64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeaderboardEntry {
    pub id: String,
    pub puzzle_id: String,
    pub player_name: String,
    pub completion_time: u64,
    pub moves: u32,
    pub difficulty: DifficultyLevel,
    pub completed_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePuzzleParams {
    pub image_path: String,
    pub grid_size: GridSize,
    pub piece_shape: PieceShape,
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct SaveGameParams {
    pub game_state: GameState,
}

#[derive(Debug, Deserialize)]
pub struct LoadGameParams {
    pub game_id: String,
}

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(message: &str) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message.to_string()),
        }
    }
}