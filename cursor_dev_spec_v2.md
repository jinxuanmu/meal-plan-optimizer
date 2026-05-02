# Meal Plan Optimizer — Cursor 开发文档 v2

## 项目概述

为期6个月增肌健身计划配套的餐单替换工具。教练给定了固定的 Training Day 和 Non-Training Day 默认餐单，每天的 Protein(P)、Carbs(C)、Fat(F) 和总卡路里有严格目标值。由于长期吃相同食物难以坚持，用户需要偶尔替换某些食材，替换后需要重新平衡当天的 P/C/F 总量。

---

## ⚠️ v2 核心逻辑变更（与 v1 的主要区别）

v1 流程要求用户手动选择替换食物并调整份量，操作复杂且经常找不到方案。

**v2 新流程：用户只需选择不想吃的食物，系统自动搜索所有可行方案。**

用户不需要手动选替换食物，不需要手动调份量，系统把所有数学都算好，直接呈现可选方案。

---

## 技术栈

- **前端框架**：React + TypeScript
- **样式**：Tailwind CSS
- **状态管理**：Zustand
- **数据持久化**：localStorage（用户自定义的餐单和食材库）
- **部署**：Vercel

---

## 核心数据结构

### 营养计算规则
```
1g Protein = 4 kcal
1g Carbs   = 4 kcal
1g Fat     = 9 kcal
```

### 默认餐单目标值
```
Training Day:     P=133g, C=178g, F=49g,  总计 1685 kcal
Non-Training Day: P=130g, C=132g, F=59g,  总计 1579 kcal
```

### 食物分三类（影响份量调整逻辑）
```
第一类（称重类）：以 0.5oz 为单位增减，最小份量 = 1步进值
  特例：Safe Catch Tuna 以 1.5oz 为单位增减

第二类（计件类）：只能整数倍，最少1份，可增加到2份、3份
  例如：鸡蛋只能 1个、2个、3个，不能 0.5个

第三类（固定类）：份量完全固定，不可调整，不可替换
  包括：Liquid collagen、Avo oil
```

### 食物的 mealType 标签
每个食材有一个或多个适用餐次标签：
`Bfast`（早餐）、`Lunch`（午餐）、`Dinner`（晚餐）、`Snack`（点心/下午茶/夜宵）

---

## 默认餐单数据

### Training Day（目标：P=133, C=178, F=49, 1685kcal）

| 餐次 | mealType | 份量 | 食物 | P | C | F | 类别 |
|------|----------|------|------|---|---|---|------|
| Oil | oil | 2 tsp | Avo oil | 0 | 0 | 9 | 固定 |
| 早餐 | Bfast | 1 scoop | Liquid collagen | 9 | 1 | 0 | 固定 |
| 早餐 | Bfast | 1 whole | Eggs | 6 | 0 | 5 | 第二类 |
| 早餐 | Bfast | 4oz | Eggwhite | 12 | 0 | 0 | 第一类 |
| 早餐 | Bfast | 1 slice | Dave's Killer bread | 6 | 22 | 1 | 第二类 |
| 早餐 | Bfast | 3oz | Blueberries | 1 | 12 | 0 | 第一类 |
| 早餐 | Bfast | 10g | Almond butter | 2 | 2 | 5 | 第一类 |
| 午餐 | Lunch | 5oz | Chicken tenderloin | 32 | 0 | 1 | 第一类 |
| 午餐 | Lunch | 5oz | Sweet potatoes | 3 | 29 | 0 | 第一类 |
| 下午茶 | Snack | 5oz | 2% Lactaid | 5 | 8 | 3 | 第一类 |
| 下午茶 | Snack | 1 fruit | Banana | 1 | 27 | 0 | 第二类 |
| 下午茶 | Snack | 15g | Honey | 0 | 12 | 0 | 第一类 |
| 晚餐 | Dinner | 5oz | Salmon | 30 | 0 | 20 | 第一类 |
| 晚餐 | Dinner | 6oz | Black/white rice | 5 | 45 | 2 | 第一类 |
| 夜宵 | Snack | 0.5 scoop | Evogen protein | 13 | 2 | 0 | 第二类 |
| 夜宵 | Snack | 1 cake | Chocolate rice cakes | 1 | 12 | 1 | 第二类 |
| 夜宵 | Snack | 2oz | Greek yogurt | 7 | 2 | 2 | 第一类 |
| 夜宵 | Snack | 5g | Freeze dry strawberries | 0 | 4 | 0 | 第一类 |

### Non-Training Day（目标：P=130, C=132, F=59, 1579kcal）

| 餐次 | mealType | 份量 | 食物 | P | C | F | 类别 |
|------|----------|------|------|---|---|---|------|
| Oil | oil | 2 tsp | Avo oil | 0 | 0 | 9 | 固定 |
| 早餐 | Bfast | 1 scoop | Liquid collagen | 9 | 1 | 0 | 固定 |
| 早餐 | Bfast | 1oz | Quaker Oats | 4 | 19 | 2 | 第一类 |
| 早餐 | Bfast | 2 whole | Eggs | 12 | 0 | 10 | 第二类 |
| 早餐 | Bfast | 3oz | Blueberries | 1 | 12 | 0 | 第一类 |
| 早餐 | Bfast | 10g | Almond butter | 2 | 2 | 5 | 第一类 |
| 午餐 | Lunch | 8oz | Argentina shrimp | 32 | 0 | 3 | 第一类 |
| 午餐 | Lunch | 5oz | Sweet potatoes | 3 | 29 | 0 | 第一类 |
| 下午茶 | Snack | 5oz | 2% Lactaid | 5 | 8 | 3 | 第一类 |
| 下午茶 | Snack | 1 wedge | Laughing cow light cheese | 2 | 2 | 1 | 第二类 |
| 下午茶 | Snack | 1 cake | Lightly salted rice cakes | 1 | 7 | 0 | 第二类 |
| 下午茶 | Snack | 1 stick | Chicken snack sticks | 6 | 3 | 3 | 第二类 |
| 晚餐 | Dinner | 5oz | 90% ground bison | 29 | 0 | 14 | 第一类 |
| 晚餐 | Dinner | 4oz | Black/white rice | 3 | 30 | 1 | 第一类 |
| 夜宵 | Snack | 10g | Granola | 1 | 7 | 2 | 第一类 |
| 夜宵 | Snack | 6oz | Greek yogurt | 20 | 8 | 6 | 第一类 |
| 夜宵 | Snack | 5g | Freeze dry strawberries | 0 | 4 | 0 | 第一类 |

---

## 食材库数据

### 第一类（称重类，0.5oz 步进）

| 食物 | 基础份量 | P | C | F | 适用餐次 |
|------|----------|---|---|---|----------|
| Chicken tenderloin | 5oz | 32 | 0 | 1 | Lunch, Dinner |
| Chicken drumstick | 6oz | 32 | 0 | 8 | Lunch, Dinner |
| Slice chicken breast | 5oz | 30 | 0 | 3 | Lunch, Dinner |
| Argentina shrimp | 8oz | 32 | 0 | 3 | Lunch, Dinner |
| Eggwhite | 4oz | 12 | 0 | 0 | Bfast, Lunch, Dinner |
| 93% ground beef | 5oz | 30 | 0 | 10 | Lunch, Dinner |
| 90% ground bison | 5oz | 29 | 0 | 14 | Lunch, Dinner |
| Sliced beef sirloin | 5oz | 32 | 2 | 8 | Lunch, Dinner |
| Beef shank | 4oz | 34 | 0 | 5 | Lunch, Dinner |
| Salmon | 5oz | 30 | 0 | 20 | Lunch, Dinner |
| Tilapia | 6oz | 32 | 0 | 5 | Lunch, Dinner |
| Safe Catch Tuna（步进1.5oz）| 1.5oz | 13 | 0 | 0 | Bfast, Lunch, Dinner |
| Greek yogurt | 6oz | 20 | 8 | 6 | Bfast, Lunch, Dinner, Snack |
| Quaker Oats | 1oz | 4 | 19 | 2 | Bfast |
| Brown rice | 4oz | 3 | 30 | 1 | Lunch, Dinner |
| Black/white rice | 4oz | 3 | 30 | 1 | Lunch, Dinner |
| Sweet potatoes | 5oz | 3 | 29 | 0 | Lunch, Dinner |
| Blueberries | 3oz | 1 | 12 | 0 | Bfast, Snack |
| Freeze dry strawberries | 5g | 0 | 4 | 0 | Snack |
| Granola | 10g | 1 | 7 | 2 | Snack |
| Honey | 15g | 0 | 12 | 0 | Snack |
| 2% Lactaid | 5oz | 5 | 8 | 3 | Bfast, Snack |
| OJ | 4oz | 1 | 13 | 0 | Bfast, Snack |
| Almond butter | 10g | 2 | 2 | 5 | Bfast, Snack |
| Avocado | 1/2 fruit | 2 | 9 | 15 | Bfast, Snack |

### 第二类（计件类，整数倍，最少1份）

| 食物 | 基础份量 | P | C | F | 适用餐次 |
|------|----------|---|---|---|----------|
| Eggs | 1 whole | 6 | 0 | 5 | Bfast, Lunch, Dinner |
| Chicken snack sticks | 1 stick | 6 | 3 | 3 | Snack |
| Evogen protein | 1 scoop | 25 | 4 | 1 | Snack |
| Laughing cow light cheese | 1 wedge | 2 | 2 | 1 | Bfast, Snack |
| Dave's Killer bread | 1 slice | 6 | 22 | 1 | Bfast, Snack |
| Mandarins | 1 fruit | 1 | 9 | 0 | Bfast, Snack |
| Lightly salted rice cakes | 1 cake | 1 | 7 | 0 | Bfast, Snack |
| Chocolate rice cakes | 1 cake | 1 | 12 | 1 | Bfast, Snack |
| Banana | 1 fruit | 1 | 27 | 0 | Bfast, Snack |

### 第三类（固定，不可调整，不可替换）

| 食物 | 份量 | P | C | F |
|------|------|---|---|---|
| Liquid collagen | 1 scoop | 9 | 1 | 0 |
| Avo oil | 2 tsp | 0 | 0 | 9 |

---

## 三步核心流程（v2）

### Step 1 — 选择要移除的食物
- 用户从默认餐单中勾选想要替换的食物（可多选）
- 固定类食物（Liquid collagen、Avo oil）不可勾选
- 选中后显示划线红色高亮
- 点击「搜索替换方案」进入 Step 2

### Step 2 — 选择替换方案（核心）

**系统自动搜索所有可行方案，用户直接选一个。**

#### 搜索算法逻辑

**输入：** 被移除食物的 P/C/F 总量、被移除食物所在的 mealType

**第一步：生成主替换食物候选池**
- 从食材库中筛选 mealType 与被移除食物相同的食材
- 排除被移除的食物本身
- 对每种候选食材，遍历所有合法份量：
  - 第一类：从最小步进值开始，以 0.5oz 递增（Safe Catch Tuna 以 1.5oz 递增），上限为基础份量的 2.5 倍
  - 第二类：1份、2份、3份

**第二步：对每个"主替换食物+份量"组合，计算剩余缺口**
```
缺口 = 目标值 - 固定食物合计 - 主替换食物营养值
固定食物合计 = 默认餐单中所有未被移除的食物的 P/C/F 总和
```

**第三步：从整个食材库搜索辅助补足食物**
- 对剩余缺口，从整个食材库（不限 mealType）搜索能补足的辅助食物组合
- 同一方案内同种食物只出现一次（去重）
- 辅助食物最多 2 种（主替换 + 最多2种辅助 = 最多3种食物）
- 排除已被移除的食物

**第四步：误差自动放宽策略**
```
先以 ±1g 搜索 → 有结果则展示
找不到 → 自动放宽到 ±2g，提示"当前误差 ±2g"
找不到 → 自动放宽到 ±3g，提示"当前误差 ±3g"
找不到 → 提示无方案，建议扩充食材库
```

**第五步：合并提示**
- 如果辅助补足食物在默认餐单中已存在（且未被移除），显示合并提示
- 例：辅助食物是 Almond butter 1.5oz，默认早餐已有 Almond butter 10g
- 显示：`Almond butter 1.5oz（合并后共 10g + 1.5oz，适合早餐/点心）`

#### 方案展示格式
每个方案卡片显示：
```
方案 X
──────────────────────────────────────────
主替换：[食物名] [份量]  [mealType标签]
辅助：  [食物名] [份量]  [mealType标签]  （如有合并则标注）
辅助：  [食物名] [份量]  [mealType标签]  （如有）
──────────────────────────────────────────
P [总值]g [±差值]  C [总值]g [±差值]  F [总值]g [±差值]  [总kcal] [±差值]
```

- 最多展示 **6个方案**
- 方案按误差绝对值从小到大排序（最接近目标的排前面）
- 主替换食物用蓝色高亮，辅助食物用绿色

### Step 3 — 确认完整餐单

用户选择一个方案后，展示完整当天餐单：

**左侧：完整餐单**
- 按餐次分组展示所有食物
- 颜色区分：
  - 灰色 = 保留的原有食物（正常显示）
  - 红色划线 = 被移除的食物（不显示，或灰色划线标注"已移除"）
  - 蓝色 = 主替换食物（新增）
  - 绿色 = 辅助补足食物（新增）
  - 橙色 = 与原有食物合并（份量增加，显示合并后总量 + "默认Xoz，+Xoz"）
- 顶部宏量栏：今日 P/C/F/kcal + 与默认方案的差值（+/-）

**右侧：对比摘要**
- 营养数值对比表（默认 vs 今日 vs 变化）
- 移除的食物列表
- 新增/调整的食物列表

---

## 编辑功能

### 默认餐单编辑（「编辑餐单 / 食材库」入口）
- 两套默认餐单均可编辑
- 可修改每个食物的份量、P/C/F 值
- 可新增/删除餐单中的食物
- 数据保存到 localStorage

### 食材库编辑
- 可新增食材（食物名、类别1/2/3、基础份量、P/C/F、适用餐次）
- 可编辑现有食材
- 可删除食材
- 数据保存到 localStorage

---

## UI 规范

### 颜色
```
主色（绿）：#2d6a4f
蓝色：#1a5fa8（主替换食物）
绿色：#2d6a4f（辅助补足食物）
橙色：#92560a（合并食物、Fat数值）
红色：#9b2226（移除食物、超标）
背景：#f7f6f2
卡片：#ffffff
边框：#e8e5de
```

### 餐次标签颜色
```
早餐 Bfast：#fff3cd 背景，#856404 文字
午餐 Lunch：#e8f4ee 背景，#2d6a4f 文字
晚餐 Dinner：#e8f0fb 背景，#1a5fa8 文字
点心 Snack：#f0e8fb 背景，#6a3b9b 文字
```

### 步骤条
- 3个步骤（v2 简化为3步）
- 已完成步骤显示 ✓，可点击返回
- 当前步骤高亮绿色

### 布局
- 两栏（左右各50%）
- 响应式：小屏单栏

---

## 已知待优化问题

1. **多个食物同时被移除时的搜索策略**
   - 当用户同时移除多个食物（如午餐的蛋白质 + 晚餐的主食），需合并计算总缺口
   - 主替换候选池需分别按各自 mealType 筛选，再组合搜索

2. **搜索性能**
   - 候选池较大时（多种食材 × 多种份量）暴力枚举可能较慢
   - 建议加入剪枝：若某维度已超出目标+误差则跳过

3. **方案排序优化**
   - 当前按误差绝对值排序
   - 未来可加入"主替换食物与被移除食物的相似度"作为排序权重

---

## 参考文件
- `meal_plan_v4.html`：上一版 Demo，包含数据结构、搜索算法、UI 交互的完整参考实现
- 本文档（v2）描述的是重构后的简化流程，与 v4 Demo 的主要区别是**去掉了用户手动选择替换食物和调整份量的步骤**
