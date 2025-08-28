# 📸 图片素材使用指南

## 🎯 如何添加PNG格式的图片素材

### 📁 文件放置位置
将您的PNG图片文件放置在以下目录中：

```
public/images/
├── nature/          # 自然风光类图片
├── animals/         # 动物类图片  
├── buildings/       # 建筑类图片
├── anime/          # 动漫类图片
└── custom/         # 自定义类图片
```

### 📝 文件命名建议
- 使用英文名称，避免中文字符
- 使用小写字母和下划线
- 例如：`mountain_sunset.png`、`cute_cat.png`、`modern_building.png`

### 🔧 添加到素材库

在 `src/components/game/AssetLibrary.tsx` 文件中的 `builtinAssets` 数组里添加新的素材配置：

```typescript
{
  id: 'your_image_id',              // 唯一标识符
  name: '图片显示名称',               // 显示给用户的名称
  category: '自然风光',              // 分类：自然风光、动物、建筑、动漫、自定义
  tags: ['标签1', '标签2'],          // 搜索标签
  filePath: '/images/nature/your_image.png',  // 图片路径
  thumbnail: '/images/nature/your_image.png', // 缩略图路径（通常与图片路径相同）
  width: 800,                       // 图片宽度
  height: 600,                      // 图片高度
  fileSize: 150000,                 // 文件大小（字节）
  createdAt: new Date('2024-01-01'), // 创建日期
}
```

### 📐 图片要求

#### 尺寸建议
- **推荐尺寸**：400×400像素到1024×1024像素
- **最小尺寸**：不低于300×300像素
- **比例要求**：建议使用正方形图片，系统会自动裁剪为正方形

#### 文件格式
- **支持格式**：PNG、JPG、JPEG、SVG
- **推荐格式**：PNG（支持透明背景）
- **文件大小**：建议小于2MB，确保加载速度

#### 图片质量
- **清晰度**：确保图片清晰，避免模糊
- **对比度**：保证足够的对比度，便于拼图识别
- **复杂度**：适中的复杂度，太简单或太复杂都不利于拼图游戏

### 🎨 分类说明

#### 自然风光 (nature/)
- 山景、海景、森林、草原等自然景观
- 日出日落、星空、彩虹等自然现象
- 花卉、植物等

#### 动物 (animals/)
- 宠物：猫、狗、兔子等
- 野生动物：狮子、大象、鸟类等
- 海洋生物：鱼类、海豚等

#### 建筑 (buildings/)
- 现代建筑：摩天大楼、桥梁等
- 古典建筑：城堡、寺庙、古镇等
- 地标建筑：著名景点、纪念碑等

#### 动漫 (anime/)
- 动漫角色
- 卡通形象
- 二次元风格插画

#### 自定义 (custom/)
- 用户上传的图片
- 个性化内容
- 其他类型图片

### 💡 使用示例

假设您要添加一张名为 `cherry_blossom.png` 的樱花图片：

1. **放置文件**：将图片保存到 `public/images/nature/cherry_blossom.png`

2. **添加配置**：在 `AssetLibrary.tsx` 中添加：
```typescript
{
  id: 'cherry_blossom',
  name: '樱花盛开',
  category: '自然风光',
  tags: ['樱花', '春天', '粉色', '自然'],
  filePath: '/images/nature/cherry_blossom.png',
  thumbnail: '/images/nature/cherry_blossom.png',
  width: 800,
  height: 800,
  fileSize: 245000,
  createdAt: new Date('2024-01-01'),
}
```

### 🔄 动态加载（高级）

如果您需要动态加载图片而不修改代码，可以：

1. **使用上传功能**：在游戏主菜单点击"上传素材"按钮
2. **批量导入**：将图片放在 `public/images/` 目录下，系统会自动扫描（需要额外开发）

### ⚠️ 注意事项

1. **路径格式**：使用 `/images/` 开头的绝对路径
2. **文件权限**：确保图片文件可读
3. **浏览器缓存**：如果更新了图片，可能需要清除浏览器缓存
4. **跨域问题**：如果图片来源于外部链接，可能存在跨域限制

### 🚀 性能优化建议

1. **图片压缩**：使用工具压缩图片以减小文件大小
2. **懒加载**：大量图片时考虑懒加载
3. **缓存策略**：合理设置图片缓存
4. **CDN加速**：生产环境可考虑使用CDN

---

## 🔧 开发者相关

### 修改素材库代码位置
- **主文件**：`src/components/game/AssetLibrary.tsx`
- **类型定义**：`src/types/index.ts` (Asset接口)
- **样式文件**：`src/components/game/AssetLibrary.css`

### 自动化脚本（可选）
可以编写脚本自动扫描 `public/images/` 目录并生成素材配置，减少手动添加的工作量。

---

**提示**：第一次添加图片后，记得重启开发服务器以确保图片能正确加载！
