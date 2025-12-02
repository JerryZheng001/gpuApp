# 分享功能开关实现

## 功能概述
在 Chat 页面的头部导航添加了一个分享功能的开关按钮，只有在选择了模型之后才会显示。

## 实现细节

### 1. 状态管理 (UIStore.ts)
- 添加了 `shareEnabled: boolean` 状态来控制分享功能的开关
- 添加了 `setShareEnabled()` 和 `toggleShareEnabled()` 方法来管理状态
- 将 `shareEnabled` 添加到持久化存储中，确保用户设置在应用重启后保持

### 2. UI 组件 (HeaderRight.tsx)
- 在头部右侧区域添加了分享开关组件
- 分享开关包含：
  - ShareIcon 图标（根据开关状态改变颜色）
  - Switch 组件用于切换分享功能
- 只有在 `modelStore.activeModel` 存在时才显示分享开关

### 3. 样式 (HeaderRight/styles.ts)
- 添加了 `shareToggleContainer` 样式用于容器布局
- 添加了 `shareSwitch` 样式用于 Switch 组件的间距

## 使用方法
1. 启动应用并进入 Chat 页面
2. 选择一个模型（这是分享开关显示的前提条件）
3. 在头部导航右侧会看到分享图标和开关
4. 点击开关可以切换分享功能的开启/关闭状态
5. 设置会自动保存，应用重启后会保持之前的状态

## 技术特点
- 使用 MobX 进行状态管理，支持响应式更新
- 使用 React Native Paper 的 Switch 组件，提供原生体验
- 支持主题色彩，开关状态会根据当前主题颜色显示
- 条件渲染，只在选择了模型时显示，避免界面混乱
- 持久化存储，用户设置不会丢失

## 文件修改列表
1. `/src/store/UIStore.ts` - 添加分享功能状态管理
2. `/src/components/HeaderRight/HeaderRight.tsx` - 添加分享开关 UI
3. `/src/components/HeaderRight/styles.ts` - 添加分享开关样式

## 测试验证
- ✅ TypeScript 编译通过
- ✅ 应用成功构建和安装
- ✅ 分享开关在选择了模型后正确显示
- ✅ 开关状态可以正确切换
- ✅ 设置持久化保存
