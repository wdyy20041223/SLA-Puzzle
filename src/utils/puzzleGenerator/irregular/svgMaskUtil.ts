
/**
 * 将图片canvas与SVG蒙版合成，返回合成后的dataURL
 * @param imageCanvas 已裁剪的图片canvas
 * @param svgMaskPath SVG蒙版路径（public下的相对路径）
 * @param width 输出宽度
 * @param height 输出高度
 */
export async function applySvgMaskToImage(
	imageCanvas: HTMLCanvasElement,
	svgMaskPath: string,
	width: number,
	height: number,
	drawBorder: boolean = false
): Promise<string> {
	// 加载SVG蒙版
	const svgUrl = svgMaskPath.startsWith('/') ? svgMaskPath : '/' + svgMaskPath;
	const svgText = await fetch(svgUrl).then(r => r.text());
		// 创建SVG图片
		const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
		const svgImg = new Image();
		const svgUrlObj = URL.createObjectURL(svgBlob);
		svgImg.src = svgUrlObj;
		await new Promise((resolve, reject) => {
			svgImg.onload = resolve;
			svgImg.onerror = reject;
		});
		// 创建输出canvas
		const outCanvas = document.createElement('canvas');
		outCanvas.width = width;
		outCanvas.height = height;
		const outCtx = outCanvas.getContext('2d');
		if (!outCtx) throw new Error('无法获取canvas上下文');
		// 先绘制图片
		outCtx.drawImage(imageCanvas, 0, 0, width, height);
		// 设置mask
		outCtx.globalCompositeOperation = 'destination-in';
		outCtx.drawImage(svgImg, 0, 0, width, height);
		outCtx.globalCompositeOperation = 'source-over';

		// 可选：描黑边
		if (drawBorder) {
			// 解析SVG路径，绘制到canvas上
			try {
				   // 提取 <path d="..." /> 或 <ns0:path d="..." />
				   const pathMatch = svgText.match(/<([\w:]+)?path[^>]*d=["']([^"']+)["'][^>]*>/);
				   // 提取 viewBox="minX minY width height"
				   const viewBoxMatch = svgText.match(/viewBox=["']([\d.\-]+) ([\d.\-]+) ([\d.\-]+) ([\d.\-]+)["']/);
				   if (pathMatch && pathMatch[2]) {
					   const pathData = pathMatch[2];
					   const path = new Path2D(pathData);
					   outCtx.save();
					   // 适配viewBox到canvas
					   if (viewBoxMatch) {
						   const [ , minX, minY, vbW, vbH ] = viewBoxMatch;
						   const sx = width / parseFloat(vbW);
						   const sy = height / parseFloat(vbH);
						   outCtx.setTransform(sx, 0, 0, sy, -parseFloat(minX) * sx, -parseFloat(minY) * sy);
					   }
					   outCtx.strokeStyle = '#000000';
					   outCtx.lineWidth = 4;
					   outCtx.shadowColor = '#000000';
					   outCtx.shadowBlur = 0;
					   outCtx.stroke(path);
					   outCtx.restore();
					   // 恢复默认变换
					   outCtx.setTransform(1, 0, 0, 1, 0, 0);
				   }
			} catch (e) {
				// 忽略描边异常
			}
		}
		URL.revokeObjectURL(svgUrlObj);
		return outCanvas.toDataURL('image/png');
}
