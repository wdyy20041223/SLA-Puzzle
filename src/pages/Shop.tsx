import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import './Shop.css';

interface ShopPageProps {
  onBackToMenu: () => void;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  category: 'avatar' | 'puzzle' | 'decoration';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  image?: string;
  imageUrl?: string; // 用于拼图素材的图片路径
  owned: boolean;
}

const mockShopItems: ShopItem[] = [
  // 头像类
  {
    id: 'avatar_cat',
    name: '可爱小猫',
    description: '萌萌的橘猫头像',
    price: 100,
    icon: '🐱',
    category: 'avatar',
    rarity: 'common',
    owned: false
  },
  {
    id: 'avatar_robot',
    name: '机器人',
    description: '酷炫的机器人头像',
    price: 200,
    icon: '🤖',
    category: 'avatar',
    rarity: 'rare',
    owned: false
  },
  {
    id: 'avatar_unicorn',
    name: '独角兽',
    description: '梦幻的独角兽头像',
    price: 500,
    icon: '🦄',
    category: 'avatar',
    rarity: 'epic',
    owned: false
  },
  {
    id: 'avatar_crown',
    name: '皇冠头像',
    description: '尊贵的皇冠头像',
    price: 1000,
    icon: '👑',
    category: 'avatar',
    rarity: 'legendary',
    owned: false
  },

  // 拼图素材类
  {
    id: 'puzzle_image_1',
    name: '森林花园',
    description: '美丽的绿色森林花园拼图',
    price: 100,
    icon: '🌿',
    category: 'puzzle',
    rarity: 'common',
    owned: false,
    imageUrl: '/images/test1.svg'
  },
  {
    id: 'puzzle_image_2',
    name: '黄昏日落',
    description: '壮丽的黄昏日落景色拼图',
    price: 150,
    icon: '🌅',
    category: 'puzzle',
    rarity: 'rare',
    owned: false,
    imageUrl: '/images/test2.svg'
  },
  {
    id: 'puzzle_image_3',
    name: '玫瑰花园',
    description: '浪漫的红色玫瑰花园拼图',
    price: 200,
    icon: '🌹',
    category: 'puzzle',
    rarity: 'epic',
    owned: false,
    imageUrl: '/images/test3.svg'
  },

  // 装饰类
  {
    id: 'decoration_frame',
    name: '金色边框',
    description: '华丽的金色头像边框',
    price: 200,
    icon: '🖼️',
    category: 'decoration',
    rarity: 'rare',
    owned: false
  },
  {
    id: 'decoration_glow',
    name: '光环特效',
    description: '闪耀的光环特效',
    price: 400,
    icon: '✨',
    category: 'decoration',
    rarity: 'epic',
    owned: false
  }
];

export const Shop: React.FC<ShopPageProps> = ({ onBackToMenu }) => {
  const { authState } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const user = authState.user;
  const userCoins = user?.coins || 0;
  const userOwnedItems = user?.ownedItems || [];

  // 根据用户拥有的物品设置商店物品状态
  const initializeShopItems = () => {
    return mockShopItems.map(item => ({
      ...item,
      owned: userOwnedItems.includes(item.id)
    }));
  };

  const [shopItems, setShopItems] = useState<ShopItem[]>(initializeShopItems());

  const categories = [
    { id: 'all', label: '全部', icon: '🛍️' },
    { id: 'avatar', label: '头像', icon: '👤' },
    { id: 'puzzle', label: '拼图素材', icon: '🧩' },
    { id: 'decoration', label: '装饰', icon: '✨' }
  ];

  const filteredItems = selectedCategory === 'all' 
    ? shopItems 
    : shopItems.filter(item => item.category === selectedCategory);

  const getRarityColor = (rarity: ShopItem['rarity']) => {
    const colors = {
      common: '#6b7280',
      rare: '#3b82f6',
      epic: '#8b5cf6',
      legendary: '#f59e0b'
    };
    return colors[rarity];
  };

  const getRarityLabel = (rarity: ShopItem['rarity']) => {
    const labels = {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传奇'
    };
    return labels[rarity];
  };

  const handlePurchase = (item: ShopItem) => {
    if (item.owned) {
      alert('您已经拥有这个物品了！');
      return;
    }

    if (userCoins < item.price) {
      alert('金币不足！请通过游戏获取更多金币。');
      return;
    }

    // 更新商店物品状态
    const updatedItems = shopItems.map(shopItem => 
      shopItem.id === item.id ? { ...shopItem, owned: true } : shopItem
    );
    setShopItems(updatedItems);

    // 更新用户数据
    const currentUser = JSON.parse(localStorage.getItem('puzzle_current_user') || '{}');
    const updatedUser = {
      ...currentUser,
      coins: currentUser.coins - item.price,
      ownedItems: [...(currentUser.ownedItems || []), item.id]
    };
    localStorage.setItem('puzzle_current_user', JSON.stringify(updatedUser));

    alert(`成功购买 ${item.name}！消耗 ${item.price} 金币`);
    
    // 刷新页面以更新UI
    window.location.reload();
  };

  return (
    <div className="shop-page">
      <div className="shop-header">
        <div className="header-left">
          <Button onClick={onBackToMenu} variant="secondary" size="medium">
            ← 返回菜单
          </Button>
          <h1>🛒 游戏商店</h1>
        </div>
        
        <div className="user-coins">
          <div className="coins-display">
            <span className="coins-icon">💰</span>
            <span className="coins-amount">{userCoins.toLocaleString()}</span>
            <span className="coins-label">金币</span>
          </div>
        </div>
      </div>

      <div className="shop-content">
        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-label">{category.label}</span>
              <span className="category-count">
                {category.id === 'all' 
                  ? shopItems.length 
                  : shopItems.filter(item => item.category === category.id).length
                }
              </span>
            </button>
          ))}
        </div>

        <div className="shop-grid">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className={`shop-item-card ${item.owned ? 'owned' : ''}`}
              style={{ 
                '--rarity-color': getRarityColor(item.rarity) 
              } as React.CSSProperties}
            >
              <div className="item-header">
                <div className="item-icon">
                  {item.category === 'puzzle' && item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      className="puzzle-preview-image"
                      onError={(e) => {
                        // 如果图片加载失败，显示默认图标
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <span className={item.category === 'puzzle' && item.imageUrl ? 'fallback-icon' : ''}>
                    {item.icon}
                  </span>
                </div>
                <div 
                  className="rarity-badge"
                  style={{ backgroundColor: getRarityColor(item.rarity) }}
                >
                  {getRarityLabel(item.rarity)}
                </div>
              </div>
              
              <div className="item-content">
                <h3 className="item-title">{item.name}</h3>
                <p className="item-description">{item.description}</p>
                
                <div className="item-footer">
                  <div className="price-section">
                    <span className="price-icon">💰</span>
                    <span className="price-amount">{item.price.toLocaleString()}</span>
                  </div>
                  
                  <button
                    className={`purchase-btn ${item.owned ? 'owned' : userCoins >= item.price ? 'affordable' : 'expensive'}`}
                    onClick={() => handlePurchase(item)}
                    disabled={item.owned}
                  >
                    {item.owned ? '已拥有' : userCoins >= item.price ? '购买' : '金币不足'}
                  </button>
                </div>
              </div>

              {item.owned && (
                <div className="owned-overlay">
                  <div className="owned-badge">
                    <span>✓ 已拥有</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="no-items">
            <div className="empty-state">
              <div className="empty-icon">🛍️</div>
              <h3>暂无商品</h3>
              <p>该分类下暂时没有商品，敬请期待更多精彩内容！</p>
            </div>
          </div>
        )}
      </div>

      <div className="shop-tips">
        <h4>💡 购物提示</h4>
        <div className="tips-grid">
          <div className="tip-item">
            <span className="tip-icon">🎮</span>
            <span className="tip-text">完成拼图游戏可获得金币奖励</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">🏆</span>
            <span className="tip-text">解锁成就可获得额外金币</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">📅</span>
            <span className="tip-text">每日挑战提供丰厚奖励</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">✨</span>
            <span className="tip-text">稀有度越高的物品越珍贵</span>
          </div>
        </div>
      </div>
    </div>
  );
};
