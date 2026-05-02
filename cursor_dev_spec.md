# Meal Plan Optimizer — Cursor 开发文档

## 项目概述

为期6个月增肌健身计划配套的餐单替换工具。教练给定了固定的 Training Day 和 Non-Training Day 默认餐单，每天的 Protein(P)、Carbs(C)、Fat(F) 和总卡路里有严格目标值。由于长期吃相同食物难以坚持，用户需要偶尔替换某些食材，替换后需要重新平衡当天的 P/C/F 总量。

---

## 技术栈建议

- **前端框架**：React + TypeScript
- **样式**：Tailwind CSS
- **状态管理**：Zustand 或 React Context
- **数据持久化**：localStorage（用户自定义的餐单和食材库）
- **部署**：Vercel

---

## 核心数据结构

### 营养计算规则
- 1g Protein = 4 kcal
- 1g Carbs = 4 kcal
- 1g Fat = 9 kcal

### 默认餐单目标值
```
Training Day:     P=133g, C=178g, F=49g,  总计 1685 kcal
Non-Training Day: P=130g, C=132g, F=59g,  总计 1579 kcal
```

### 食物分三类
```
第一类（称重类）：以 0.5oz 为单位增减
  特例：Safe Catch Tuna 以 1.5oz 为单位增减
  
第二类（计件类）：只能整数倍，最少1份，可以增加到2份、3份
  例如：鸡蛋只能 1个、2个、3个，不能 0.5个

第三类（固定类）：份量完全固定，不可调整
  包括：Liquid collagen、Avo oil
```

### 食物的 mealType 标签
每个食材库中的食物有一个或多个适用餐次标签：
`Bfast`（早餐）、`Lunch`（午餐）、`Dinner`（晚餐）、`Snack`（点心/下午茶/夜宵）

---

## 默认餐单数据

### Training Day（目标：P=133, C=178, F=49, 1685kcal）

| 餐次 | mealType | 份量 | 食物 | P | C | F |
|------|----------|------|------|---|---|---|
| Oil | oil | 2 tsp | Avo oil | 0 | 0 | 9 | ← 固定
| 早餐 | Bfast | 1 scoop | Liquid collagen | 9 | 1 | 0 | ← 固定
| 早餐 | Bfast | 1 whole | Eggs | 6 | 0 | 5 | 第二类
| 早餐 | Bfast | 4oz | Eggwhite | 12 | 0 | 0 | 第一类
| 早餐 | Bfast | 1 slice | Dave's Killer bread | 6 | 22 | 1 | 第二类
| 早餐 | Bfast | 3oz | Blueberries | 1 | 12 | 0 | 第一类
| 早餐 | Bfast | 10g | Almond butter | 2 | 2 | 5 | 第一类
| 午餐 | Lunch | 5oz | Chicken tenderloin | 32 | 0 | 1 | 第一类
| 午餐 | Lunch | 5oz | Sweet potatoes | 3 | 29 | 0 | 第一类
| 下午茶 | Snack | 5oz | 2% Lactaid | 5 | 8 | 3 | 第一类
| 下午茶 | Snack | 1 fruit | Banana | 1 | 27 | 0 | 第二类
| 下午茶 | Snack | 15g | Honey | 0 | 12 | 0 | 第一类
| 晚餐 | Dinner | 5oz | Salmon | 30 | 0 | 20 | 第一类
| 晚餐 | Dinner | 6oz | Black/white rice | 5 | 45 | 2 | 第一类
| 夜宵 | Snack | 0.5 scoop | Evogen protein | 13 | 2 | 0 | 第二类
| 夜宵 | Snack | 1 cake | Chocolate rice cakes | 1 | 12 | 1 | 第二类
| 夜宵 | Snack | 2oz | Greek yogurt | 7 | 2 | 2 | 第一类
| 夜宵 | Snack | 5g | Freeze dry strawberries | 0 | 4 | 0 | 第一类

### Non-Training Day（目标：P=130, C=132, F=59, 1579kcal）

| 餐次 | mealType | 份量 | 食物 | P | C | F |
|------|----------|------|------|---|---|---|
| Oil | oil | 2 tsp | Avo oil | 0 | 0 | 9 | ← 固定
| 早餐 | Bfast | 1 scoop | Liquid collagen | 9 | 1 | 0 | ← 固定
| 早餐 | Bfast | 1oz | Quaker Oats | 4 | 19 | 2 | 第一类
| 早餐 | Bfast | 2 whole | Eggs | 12 | 0 | 10 | 第二类
| 早餐 | Bfast | 3oz | Blueberries | 1 | 12 | 0 | 第一类
| 早餐 | Bfast | 10g | Almond butter | 2 | 2 | 5 | 第一类
| 午餐 | Lunch | 8oz | Argentina shrimp | 32 | 0 | 3 | 第一类
| 午餐 | Lunch | 5oz | Sweet potatoes | 3 | 29 | 0 | 第一类
| 下午茶 | Snack | 5oz | 2% Lactaid | 5 | 8 | 3 | 第一类
| 下午茶 | Snack | 1 wedge | Laughing cow light cheese | 2 | 2 | 1 | 第二类
| 下午茶 | Snack | 1 cake | Lightly salted rice cakes | 1 | 7 | 0 | 第二类
| 下午茶 | Snack | 1 stick | Chicken snack sticks | 6 | 3 | 3 | 第二类
| 晚餐 | Dinner | 5oz | 90% ground bison | 29 | 0 | 14 | 第一类
| 晚餐 | Dinner | 4oz | Black/white rice | 3 | 30 | 1 | 第一类
| 夜宵 | Snack | 10g | Granola | 1 | 7 | 2 | 第一类
| 夜宵 | Snack | 6oz | Greek yogurt | 20 | 8 | 6 | 第一类
| 夜宵 | Snack | 5g | Freeze dry strawberries | 0 | 4 | 0 | 第一类

---

## 食材库数据

### 第一类（称重类，0.5oz 步进，特例 Safe Catch Tuna 用 1.5oz 步进）

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
| Safe Catch Tuna | 1.5oz | 13 | 0 | 0 | Bfast, Lunch, Dinner |
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

### 第三类（固定，不可调整）

| 食物 | 份量 | P | C | F | 适用餐次 |
|------|------|---|---|---|----------|
| Liquid collagen | 1 scoop | 9 | 1 | 0 | Bfast |
| Avo oil | 2 tsp | 0 | 0 | 9 | oil |

---

## 四步核心流程

### Step 1 — 移除食物
- 用户从默认餐单中勾选想要替换的食物（可多选）
- 固定类（第三类）食物不可勾选
- 选中后显示划线红色高亮

### Step 2 — 选择替换食物
- 食材库**只显示与被替换食物同餐次类型**的食材
  - 例：替换晚餐的 Salmon → 只显示 mealType 包含 `Dinner` 的食材
  - 如果同时替换了早餐和晚餐的食物 → 显示同时包含 `Bfast` 或 `Dinner` 的食材（取并集）
- 被替换的食物本身从食材库中排除（不能用同一种食物替换自己）
- 用户选择后可用 +/− 按钮调整份量（第一类 0.5oz 步进，第二类整数步进）
- 实时显示当前 P/C/F 缺口

### Step 3 — 补足方案（自动搜索）
- 系统计算用户替换后的 P/C/F 缺口
- 从**整个食材库**（不限餐次类型）自动搜索能补足缺口的食物组合
- 每个补足食物旁标注适合哪一餐（Bfast/Lunch/Dinner/Snack 标签）
- **误差策略（自动放宽）**：
  - 先以 ±1g 搜索，找到则展示
  - 找不到则自动放宽到 ±2g，并提示用户"当前误差±2g"
  - 再找不到放宽到 ±3g，并提示"当前误差±3g"
- **合并提示**：如果补足食物在默认餐单中已存在（且未被移除），显示合并提示
  - 例：补足食物是 Almond butter 0.5oz，默认餐单里早餐已有 Almond butter 10g
  - 显示：`Almond butter — 合并后 10g+0.5oz`（标注默认份量 + 新增份量）
- 搜索组合上限：最多3种食物的组合，展示最多6个方案
- 排除已被移除的食物和用户已选择的替换食物

### Step 4 — 确认完整餐单
- 展示当天完整餐单（保留食物 + 用户选择的替换食物 + 系统补足食物）
- 颜色区分：
  - 灰色 = 保留的原有食物
  - 蓝色 = 用户手动选择的替换食物（新食物）
  - 绿色 = 系统自动补足的食物（新食物）
  - 橙色 = 与原有食物合并（份量增加）
- 合并食物显示：总份量 + 标注"默认Xoz，多+Xoz"
- 顶部宏量栏显示：今日 P/C/F/kcal + 与默认方案的差值（+/-）
- 右侧对比摘要：
  - 营养数值对比表（默认 vs 今日 vs 变化）
  - 移除的食物列表
  - 新增的食物列表
  - 份量调整（合并）列表

---

## 编辑功能需求

### 默认餐单编辑
- 两套默认餐单（Training Day / Non-Training Day）均可编辑
- 可以修改每个食物的份量、P/C/F 值
- 可以新增/删除餐单中的食物
- 编辑后保存到 localStorage 持久化

### 食材库编辑
- 可以新增食材（需填写：食物名、类型1/2/3、基础份量、P/C/F、适用餐次）
- 可以编辑现有食材的所有字段
- 可以删除食材
- 编辑后保存到 localStorage 持久化

---

## 待优化 / 已知问题

1. **Step 3 找不到方案的概率较高**
   - 当前 ±1g 限制过严，食材库选项有限
   - 解决方案：实现自动放宽误差（±1g → ±2g → ±3g）

2. **搜索算法性能**
   - 当前暴力枚举1/2/3种食物组合
   - 食材库增大后需要优化（可以加剪枝或限制候选池大小）

3. **份量展示单位统一**
   - 食材库中有 oz、g、scoop、fruit、slice 等混合单位
   - 第一类统一用 oz 步进，但 10g Almond butter 等需要考虑单位换算显示

4. **多餐次替换时的 Step 2 逻辑**
   - 如果同时替换了早餐和晚餐的食物
   - 食材库显示两种餐次类型的食材（并集）
   - 未来可考虑分组显示（早餐食材一组，晚餐食材一组）

---

## UI/UX 规范

### 颜色系统
```
主色（绿）：#2d6a4f — 强调、Primary 按钮、✓ 标记
蓝色：#1a5fa8 — 用户手动选择的替换食物
红色：#9b2226 — 移除的食物、超标警告
橙色/琥珀：#92560a — Fat 数值、缺口警告
背景：#f7f6f2
卡片：#ffffff
边框：#e8e5de
```

### 餐次类型标签颜色
```
早餐 Bfast：黄色背景 #fff3cd，文字 #856404
午餐 Lunch：绿色背景 #e8f4ee，文字 #2d6a4f
晚餐 Dinner：蓝色背景 #e8f0fb，文字 #1a5fa8
点心 Snack：紫色背景 #f0e8fb，文字 #6a3b9b
```

### 步骤条
- 4个步骤，已完成步骤显示 ✓，点击可跳回
- 当前步骤高亮绿色

### 布局
- 两栏布局（左右各50%）
- 左栏：操作区（选择食物、食材库、方案列表、完整餐单）
- 右栏：信息区（说明、缺口显示、替换摘要、对比摘要）
- 响应式：小屏幕改为单栏

---

## 参考 Demo

当前 Demo 已验证核心交互逻辑，HTML 单文件版本可作为 Cursor 开发的参考：
- 数据结构参考 Demo 中的 `PLANS` 和 `FOOD_LIB` 对象
- 搜索算法参考 `findAutofill()` 函数
- 合并逻辑参考 `withMergeHint()` 函数
- Step 4 渲染逻辑参考 `renderS4()` 函数
