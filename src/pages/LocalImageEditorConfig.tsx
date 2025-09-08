import React, { useEffect, useState } from 'react';
import './LocalImageEditorConfig.css';

interface Archive {
	id: number;
	name: string;
	difficulty: string;
	pieceShape: string;
	aspectRatio: string;
	image: string;
	savedAt: string;
}

const difficultyMap: Record<string, string> = {
	easy: '简单 (3×3)',
	medium: '中等 (4×4)',
	hard: '困难 (5×5)',
	expert: '专家 (6×6)',
};

const pieceShapeMap: Record<string, string> = {
	square: '⬜ 方形',
	triangle: '🔺 三角形',
	irregular: '🧩 异形',
};


interface LocalImageEditorConfigProps {
	onBack?: () => void;
}

const LocalImageEditorConfig: React.FC<LocalImageEditorConfigProps> = ({ onBack }) => {
	const [archives, setArchives] = useState<Archive[]>([]);

	useEffect(() => {
		const data = localStorage.getItem('puzzle_editor_archives');
		if (data) {
			setArchives(JSON.parse(data));
		}
	}, []);

	// 删除存档
	const handleDelete = (id: number) => {
		const newArchives = archives.filter(a => a.id !== id);
		setArchives(newArchives);
		localStorage.setItem('puzzle_editor_archives', JSON.stringify(newArchives));
	};

	return (
		<div className="local-image-editor-config-page" style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>
			<div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
				{onBack && (
					<button onClick={onBack} style={{ marginRight: 12, fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' }}>← 返回</button>
				)}
				<h1 style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: 24 }}>🗂️ 本地图片编辑器配置方案</h1>
			</div>
			{archives.length === 0 ? (
				<div style={{ textAlign: 'center', color: '#888' }}>暂无存档</div>
			) : (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
					{archives.map(arc => (
						<div key={arc.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', background: '#fafbfc', position: 'relative' }}>
							<img src={arc.image} alt={arc.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, marginRight: 16, border: '1px solid #ddd' }} />
							<div style={{ flex: 1 }}>
								<div style={{ fontWeight: 600, fontSize: 18 }}>{arc.name}</div>
								<div style={{ color: '#666', fontSize: 14, margin: '4px 0' }}>难度：{difficultyMap[arc.difficulty] || arc.difficulty}，块形：{pieceShapeMap[arc.pieceShape] || arc.pieceShape}</div>
								<div style={{ color: '#888', fontSize: 13 }}>保存时间：{arc.savedAt}</div>
							</div>
							<button onClick={() => handleDelete(arc.id)} style={{ position: 'absolute', right: 12, top: 12, background: '#ffeded', color: '#d00', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 14 }}>删除</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default LocalImageEditorConfig;
