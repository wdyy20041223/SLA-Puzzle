use crate::models::*;
use tauri::State;
use std::sync::Mutex;

// 应用状态
pub struct AppState {
    pub puzzles: Vec<PuzzleConfig>,
    pub leaderboard: Vec<LeaderboardEntry>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            puzzles: Vec::new(),
            leaderboard: Vec::new(),
        }
    }
}

// 创建拼图
#[tauri::command]
pub async fn create_puzzle(
    params: CreatePuzzleParams,
    state: State<'_, Mutex<AppState>>,
) -> Result<ApiResponse<PuzzleConfig>, String> {
    // 参数验证
    if params.name.trim().is_empty() {
        return Ok(ApiResponse::error("拼图名称不能为空"));
    }
    
    if params.image_path.trim().is_empty() {
        return Ok(ApiResponse::error("图片路径不能为空"));
    }
    
    if params.grid_size.rows == 0 || params.grid_size.cols == 0 {
        return Ok(ApiResponse::error("网格大小必须大于0"));
    }

    // 在实际应用中，这里会处理图片并生成拼图块
    // 现在返回一个示例配置
    let puzzle_config = PuzzleConfig {
        id: format!("puzzle_{}", std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()),
        name: params.name,
        original_image: params.image_path,
        difficulty: calculate_difficulty(&params.grid_size, &params.piece_shape),
        grid_size: params.grid_size,
        piece_shape: params.piece_shape,
        pieces: Vec::new(), // 实际应用中需要生成拼图块
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
    };

    let mut app_state = state.lock().unwrap();
    app_state.puzzles.push(puzzle_config.clone());

    Ok(ApiResponse::success(puzzle_config))
}

// 保存游戏进度
#[tauri::command]
pub async fn save_game(
    params: SaveGameParams,
    state: State<'_, Mutex<AppState>>,
) -> Result<ApiResponse<String>, String> {
    // 在实际应用中，这里会保存游戏状态到文件或数据库
    println!("保存游戏: {} 步数, 用时: {} 秒", 
             params.game_state.moves, 
             params.game_state.elapsed_time);

    // 如果游戏完成，添加到排行榜
    if params.game_state.is_completed {
        let entry = LeaderboardEntry {
            id: format!("leaderboard_{}", std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs()),
            puzzle_id: params.game_state.config.id,
            player_name: "玩家".to_string(), // 实际应用中应该让玩家输入名字
            completion_time: params.game_state.elapsed_time,
            moves: params.game_state.moves,
            difficulty: params.game_state.config.difficulty.clone(),
            completed_at: chrono::Utc::now().to_rfc3339(),
        };

        let mut app_state = state.lock().unwrap();
        app_state.leaderboard.push(entry);
    }

    Ok(ApiResponse::success("游戏已保存".to_string()))
}

// 加载游戏
#[tauri::command]
pub async fn load_game(
    params: LoadGameParams,
    state: State<'_, Mutex<AppState>>,
) -> Result<ApiResponse<GameState>, String> {
    // 在实际应用中，这里会从文件或数据库加载游戏状态
    let app_state = state.lock().unwrap();
    
    // 查找对应的拼图配置
    let puzzle_config = app_state.puzzles.iter()
        .find(|p| p.id == params.game_id);

    match puzzle_config {
        Some(config) => {
            // 创建一个新的游戏状态
            let game_state = GameState {
                config: config.clone(),
                start_time: chrono::Utc::now().to_rfc3339(),
                end_time: None,
                moves: 0,
                is_completed: false,
                elapsed_time: 0,
                history: Vec::new(),
            };

            Ok(ApiResponse::success(game_state))
        }
        None => Ok(ApiResponse::error("未找到拼图配置"))
    }
}

// 获取排行榜
#[tauri::command]
pub async fn get_leaderboard(
    state: State<'_, Mutex<AppState>>,
) -> Result<ApiResponse<Vec<LeaderboardEntry>>, String> {
    let app_state = state.lock().unwrap();
    let mut sorted_leaderboard = app_state.leaderboard.clone();
    
    // 按完成时间排序
    sorted_leaderboard.sort_by(|a, b| a.completion_time.cmp(&b.completion_time));
    
    Ok(ApiResponse::success(sorted_leaderboard))
}

// 获取所有拼图配置
#[tauri::command]
pub async fn get_puzzles(
    state: State<'_, Mutex<AppState>>,
) -> Result<ApiResponse<Vec<PuzzleConfig>>, String> {
    let app_state = state.lock().unwrap();
    Ok(ApiResponse::success(app_state.puzzles.clone()))
}

// 提交每日挑战完成记录
#[tauri::command]
pub async fn submit_daily_challenge(
    challenge_data: serde_json::Value,
    state: State<'_, Mutex<AppState>>,
) -> Result<ApiResponse<serde_json::Value>, String> {
    // 解析挑战数据
    let date = challenge_data["date"].as_str().unwrap_or("");
    let challenge_id = challenge_data["challengeId"].as_str().unwrap_or("");
    let puzzle_name = challenge_data["puzzleName"].as_str().unwrap_or("");
    let difficulty = challenge_data["difficulty"].as_str().unwrap_or("medium");
    let piece_shape = challenge_data["pieceShape"].as_str().unwrap_or("square");
    let grid_size = challenge_data["gridSize"].as_str().unwrap_or("4x4");
    let total_pieces = challenge_data["totalPieces"].as_u64().unwrap_or(16);
    let completion_time = challenge_data["completionTime"].as_f64().unwrap_or(0.0);
    let moves = challenge_data["moves"].as_u64().unwrap_or(0);
    let score = challenge_data["score"].as_f64().unwrap_or(0.0);
    let is_perfect = challenge_data["isPerfect"].as_bool().unwrap_or(false);
    let total_stars = challenge_data["totalStars"].as_u64().unwrap_or(0);
    let consecutive_days = challenge_data["consecutiveDays"].as_u64().unwrap_or(1);
    let player_name = challenge_data["playerName"].as_str().unwrap_or("玩家");

    println!("每日挑战完成: {} 在 {} 完成了 {}, 用时: {} 秒, 步数: {}, 分数: {}", 
             player_name, date, puzzle_name, completion_time, moves, score);

    // 在实际应用中，这里会调用后端API或保存到数据库
    // 现在返回模拟结果
    let result = serde_json::json!({
        "gameId": format!("daily_{}", std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()),
        "score": score,
        "rewards": {
            "coins": if is_perfect { 100 } else { 50 },
            "experience": if is_perfect { 50 } else { 25 }
        },
        "isNewRecord": true,
        "rank": 1 // 实际应用中需要计算真实排名
    });

    Ok(ApiResponse::success(result))
}

// 获取每日挑战排行榜
#[tauri::command]
pub async fn get_daily_challenge_leaderboard(
    date: String,
    limit: u64,
    state: State<'_, Mutex<AppState>>,
) -> Result<ApiResponse<serde_json::Value>, String> {
    // 在实际应用中，这里会从数据库查询排行榜数据
    // 现在返回模拟数据
    let leaderboard = vec![
        serde_json::json!({
            "id": "daily_1",
            "date": date,
            "playerName": "玩家1",
            "score": 950,
            "completionTime": 120,
            "moves": 25,
            "difficulty": "medium",
            "isPerfect": true,
            "consecutiveDays": 5,
            "totalChallengesCompleted": 10,
            "averageScore": 850,
            "totalStars": 3,
            "completedAt": chrono::Utc::now().to_rfc3339()
        }),
        serde_json::json!({
            "id": "daily_2",
            "date": date,
            "playerName": "玩家2",
            "score": 880,
            "completionTime": 150,
            "moves": 30,
            "difficulty": "medium",
            "isPerfect": false,
            "consecutiveDays": 3,
            "totalChallengesCompleted": 8,
            "averageScore": 800,
            "totalStars": 2,
            "completedAt": chrono::Utc::now().to_rfc3339()
        })
    ];

    let result = serde_json::json!({
        "leaderboard": leaderboard,
        "userRank": 1,
        "pagination": {
            "page": 1,
            "limit": limit,
            "total": leaderboard.len(),
            "totalPages": 1
        }
    });

    Ok(ApiResponse::success(result))
}

// 获取每日挑战统计
#[tauri::command]
pub async fn get_daily_challenge_stats(
    state: State<'_, Mutex<AppState>>,
) -> Result<ApiResponse<serde_json::Value>, String> {
    // 在实际应用中，这里会从数据库查询用户统计
    // 现在返回模拟数据
    let stats = serde_json::json!({
        "totalChallenges": 15,
        "averageScore": 850,
        "consecutiveDays": 7,
        "bestScore": 1000,
        "completionRate": 100,
        "avgCompletionTime": 135,
        "bestTime": 90,
        "avgMoves": 28,
        "bestMoves": 20
    });

    Ok(ApiResponse::success(stats))
}

// 计算难度
fn calculate_difficulty(grid_size: &GridSize, piece_shape: &PieceShape) -> DifficultyLevel {
    let total_pieces = grid_size.rows * grid_size.cols;
    
    if total_pieces <= 9 {
        match piece_shape {
            PieceShape::Square => DifficultyLevel::Easy,
            _ => DifficultyLevel::Medium,
        }
    } else if total_pieces <= 16 {
        match piece_shape {
            PieceShape::Square => DifficultyLevel::Medium,
            _ => DifficultyLevel::Hard,
        }
    } else if total_pieces <= 25 {
        match piece_shape {
            PieceShape::Square => DifficultyLevel::Hard,
            _ => DifficultyLevel::Expert,
        }
    } else {
        DifficultyLevel::Expert
    }
}