# SCMU_CC_Helper

---

# 中南民族大学自动选课助手

🚀 一个专为中南民族大学（SCMU）学生设计的自动化课程注册助手，帮助学生快速抢到心仪的课程。

## ✨ 功能特性

- **🎯 自动选课**: 智能检测课程空位并自动注册
- **🔄 实时监控**: 500ms轮询间隔，不错过任何选课机会
- **📚 多课程支持**: 同时抢多个课程，提高成功率
- **🧪 实验班支持**: 自动尝试不同实验班，增加选课成功概率
- **💾 数据持久化**: 本地存储课程数据，页面刷新后自动恢复 (V1.0.4 新增)
- **🎨 友好界面**: 可拖拽的控制面板，支持悬浮按钮、完整面板、迷你状态三种状态
- **📊 状态监控**: 实时查看选课状态和进度，支持状态弹窗详情查看
- **⚡ 高性能**: 使用ES6+现代JavaScript技术，运行流畅
- **🔄 课程管理**: 支持课程添加、删除、更新，运行时动态管理
- **🎯 智能滚动**: 课程数量过多时自动启用滚动容器，保持界面整洁

## 🚀 使用方法

### 方法一：单文件版本 (推荐新手)

使用 `dist/course-helper.js` 单文件版本，适合初学者快速上手：

1. **登录选课系统**

   - 打开浏览器，访问：[https://xk.webvpn.scuec.edu.cn/xsxk/](https://xk.webvpn.scuec.edu.cn/xsxk/)
   - 使用你的学号和密码登录
2. **打开开发者工具**

   - 按下 `F12` 键打开浏览器开发者工具
   - 切换到 "Console" (控制台) 标签页
3. **复制粘贴代码**

   - 复制 `dist/course-helper.js` 的完整内容
   - 粘贴到控制台中，按回车执行
4. **开始选课**

   - 页面右上角会出现选课助手控制面板
   - 输入课程ID，点击"开始选课"即可

**优点**：一键运行，无需配置，适合新手用户

### 方法二：模块化版本 (适合开发者)

使用 `src/` 目录下的模块化脚本，适合有一定JavaScript基础的用户：

1. **下载项目文件**

   ```bash
   git clone https://github.com/sushuheng/scmu_cc_helper.git
   cd scmu_cc_helper
   ```
2. **在浏览器中依次导入模块**

   ```javascript
   // 在控制台中依次执行
   import { CONFIG } from './src/config.js';
   import { courseManager } from './src/course-registration.js';
   import { uiController } from './src/ui-controller.js';
   ```
3. **初始化界面**

   ```javascript
   uiController.initialize();
   ```
4. **手动控制选课过程**

   ```javascript
   // 添加课程
   courseManager.addCourse('你的课程ID');

   // 开始选课
   await courseManager.initialize();

   // 查看状态
   console.log(courseManager.getStatus());

   // 停止选课
   courseManager.stopLoop();
   ```

**优点**：模块化设计，可自定义功能，适合二次开发

### 方法三：油猴版本 (推荐自动运行)

使用 `dist/tampermonkey-course-helper.js` 油猴脚本版本，实现自动化加载运行：

1. **安装油猴扩展**

   - Chrome浏览器：访问 [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) 安装Tampermonkey
   - Firefox浏览器：访问 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/tampermonkey/) 安装Tampermonkey
   - Edge浏览器：访问 [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) 安装Tampermonkey
2. **创建新脚本**

   - 点击浏览器工具栏中的油猴图标
   - 选择"管理面板"，进入脚本管理页面
   - 点击"➕"创建新脚本按钮
3. **复制粘贴代码**

   - 清除编辑器中的默认模板代码
   - 复制 `dist/tampermonkey-course-helper.js` 的完整内容
   - 粘贴到油猴编辑器中
4. **保存并启用**

   - 按 `Ctrl+S` 保存脚本
   - 确保脚本开关处于启用状态
   - 脚本将自动在选课系统页面运行
5. **访问选课系统**

   - 打开浏览器访问：[https://xk.webvpn.scuec.edu.cn/xsxk/](https://xk.webvpn.scuec.edu.cn/xsxk/)
   - 登录你的学号和密码
   - 页面右上角会自动出现选课助手控制面板
   - 直接开始使用，无需手动执行任何代码

**优点**：自动运行，无需手动操作，一次安装永久使用，最适合日常使用

### 三种版本对比

| 特性       | 单文件版本  | 模块化版本    | 油猴版本    |
| ---------- | ----------- | ------------- | ----------- |
| 使用难度   | ⭐ 简单     | ⭐⭐⭐ 中等   | ⭐⭐ 简单   |
| 功能完整性 | ✅ 完整     | ✅ 完整       | ✅ 完整     |
| 可定制性   | ❌ 不可定制 | ✅ 高度可定制 | ⭐⭐ 有限   |
| 自动运行   | ❌ 手动执行 | ❌ 手动执行   | ✅ 自动运行 |
| 安装复杂度 | ⭐⭐ 简单   | ⭐⭐⭐ 中等   | ⭐ 简单     |
| 适合人群   | 新手用户    | 开发者用户    | 所有用户    |
| 二次开发   | ❌ 不支持   | ✅ 完全支持   | ⭐ 有限支持 |

## 📋 系统要求

- **浏览器**: Chrome 60+, Firefox 55+, Safari 10+, Edge 79+
- **JavaScript**: 支持ES6+ (ECMAScript 2015+)
- **网络**: 稳定的互联网连接
- **权限**: 已登录中南民族大学选课系统
- **扩展**: 使用油猴版本需安装Tampermonkey扩展程序

### 🎮 基本操作说明

1. **添加课程**

   - 在"输入课程ID"框中输入要抢的课程ID
   - 可选填入课程名称便于识别
   - 点击"添加更多课程"可继续添加其他课程
2. **开始选课**

   - 确认已输入所有要抢的课程ID
   - 点击"开始选课"按钮
   - 系统会自动开始监控并选课
3. **监控进度**

   - 控制台会显示实时的选课日志
   - 点击"查看状态"查看选课进度
   - 成功抢到的课程会在日志中显示✅

### 🔧 高级功能

- **💾 本地数据持久化**: 课程信息、名称、选课状态自动保存，刷新页面后自动恢复
- **🎨 三态UI系统**: 悬浮按钮、完整面板、迷你状态面板智能切换
- **🔄 运行时课程管理**: 选课进行中可动态添加/删除/更新课程
- **🎯 课程名称管理**: 支持为课程添加自定义名称，便于识别管理
- **⚠️ 智能确认机制**: 删除课程、重置系统、关闭程序时的安全确认
- **🛑 自动停止功能**: 课程列表为空时自动停止选课，避免无效请求
- **📊 状态详情弹窗**: 可拖拽的状态面板，显示详细选课进度和运行时间
- **🎯 竞态条件修复**: 解决UI初始化时序问题，确保数据正确加载
- **🎮 智能滚动容器**: 超过4个课程时自动启用滚动，保持界面整洁
- **🔄 一键关闭程序**: 安全关闭功能，自动清理所有定时器和UI元素
- **📈 运行时间统计**: 实时显示选课运行时间，精确到秒

## 🔧 配置选项

在 `src/config.js` 中可以自定义以下配置：

```javascript
// API配置
API: {
    BASE_URL: 'https://xk.webvpn.scuec.edu.cn/xsxk',
    ENDPOINTS: {
        GET_EXPERIMENTAL_CLASS: '/loadData.xk?method=getGljxb&jxbid=',
        COURSE_REGISTRATION: '/xkOper.xk?method=handleKzyxk&jxbid='
    }
}

// 选课配置
GRAB: {
    POLLING_INTERVAL: 500,                    // 轮询间隔（毫秒）
    REQUEST_TIMEOUT: 10000,                   // 请求超时时间（毫秒）
    MAX_RETRY_COUNT: 3,                       // 最大重试次数
    COURSE_FULL_KEYWORDS: ['课程已满', '已选满'] // 课程满员检测关键词
}

// UI配置
UI: {
    SCROLLABLE_CONTAINER: {
        MAX_COURSES_BEFORE_SCROLL: 4,         // 超过多少课程启用滚动
        CONTAINER_HEIGHT: '250px',            // 滚动容器高度
        SCROLLBAR_WIDTH: '8px'               // 滚动条宽度
    }
}

// Z-Index层级管理
Z_INDEX: {
    BASE_LAYER: 9999,        // 基础UI组件
    NOTIFICATION: 10000,     // 通知消息
    MODAL: 10001,           // 普通弹窗
    DIALOG: 10002,          // 确认对话框
    OVERLAY: 10003,         // 全屏遮罩
    TOPMOST: 10004          // 最高层级
}
```

## 📁 项目结构

```
scmu_cc_helper/
├── src/                          # 源代码目录
│   ├── config.js                 # 配置文件 (V1.0.4 更新)
│   ├── course-registration.js    # 核心选课逻辑 (V1.0.4 更新)
│   ├── local-data-manager.js     # 本地数据管理器 (V1.0.4 新增)
│   └── ui-controller.js          # 用户界面控制 (V1.0.4 更新)
├── docs/                         # 文档目录
│   ├── installation-guide.md     # 详细安装教程
│   ├── api-reference.md          # API参考文档
│   └── troubleshooting.md        # 故障排除
├── examples/                     # 示例代码
│   └── usage-examples.js         # 使用示例
├── dist/                         # 发布文件 (V1.0.4)
│   ├── course-helper.js          # 单文件版本 (V1.0.4)
│   └── tampermonkey-course-helper.js  # 油猴脚本版本 (V1.0.4)
└── README.md                     # 项目说明文档
```

## 🛠️ 技术栈

- **语言**: JavaScript ES6+
- **核心特性**:
  - Arrow Functions (箭头函数)
  - Template Literals (模板字面量)
  - const/let 变量声明
  - Promise 异步处理
  - Fetch API 网络请求
  - DOM Manipulation (DOM操作)
  - CustomEvent 事件系统 (V1.0.4 新增)
  - GM_setValue/GM_getValue 本地存储 (V1.0.4 新增)
- **架构**: 模块化设计，分离关注点，事件驱动架构
- **框架**: 纯原生JavaScript，无外部依赖
- **设计模式**: 观察者模式、单例模式、工厂模式

## 📚 详细文档

- [📖 详细安装教程](docs/installation-guide.md) - 新手必读的完整教程
- [🔧 API参考文档](docs/api-reference.md) - 开发者API说明
- [❓ 故障排除](docs/troubleshooting.md) - 常见问题解决方案
- [💡 使用示例](examples/usage-examples.js) - 代码示例和最佳实践

## ⚠️ 重要提醒

### 安全须知

- 本工具仅用于合法的课程注册目的
- 请遵守学校选课系统的相关规定
- 不要过度频繁地请求，以免给服务器造成压力

### 使用建议

- 提前测试，熟悉工具操作
- 准备好多门备选课程
- 选课成功后及时停止程序
- 定期备份重要的选课信息

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

### 开发环境设置

1. 克隆本项目
2. 在浏览器中测试修改后的代码
3. 确保所有功能正常工作
4. 提交Pull Request

### 代码规范

- 使用ES6+语法
- 添加详细的中文注释
- 遵循模块化设计原则
- 保持代码简洁易读

## 👨‍💻 作者信息

- **作者**: SuShuHeng
- **个人主页**: [https://github.com/sushuheng](https://github.com/sushuheng)
- **许可证**: APACHE 2.0

## 📄 许可证与免责声明

本项目采用 [APACHE 2.0](LICENSE) 许可证。

### ⚠️ 商业使用限制

- 商业用途需要联系作者获得授权
- 禁止以盈利目的使用本软件
- 如需商业合作，请通过GitHub联系作者

### 🛡️ 免责声明

- **本项目仅用于学习目的**
- 使用者需要自行承担使用风险
- 请遵守中南民族大学选课系统的相关规定
- 作者不承担因使用本软件产生的任何后果

## 🙏 致谢

感谢中南民族大学提供的选课系统，以及所有为此项目做出贡献的开发者和用户。

## 🆕 版本更新日志

### V1.0.4 (2025-12-03) - 数据持久化版本

#### 🎉 重大新增功能

- **💾 本地数据持久化系统**
  - 新增 `LocalDataManager` 类，支持课程数据自动保存
  - 课程ID、名称、选课状态实时保存到本地存储
  - 页面刷新后自动恢复所有课程信息和选课状态
  - 支持油猴脚本的 GM_setValue/GM_getValue 存储

- **🎨 三态UI系统重构**
  - 悬浮按钮：初始状态，点击展开控制面板
  - 完整面板：包含所有课程管理和控制功能
  - 迷你状态面板：选课进行中的实时状态显示

#### 🔧 核心功能增强

- **🎯 智能滚动容器**
  - 超过4个课程时自动启用滚动功能
  - 自定义滚动条样式，保持界面美观
  - 动态高度调整，适应不同屏幕尺寸

- **📊 状态详情弹窗**
  - 可拖拽的详细信息面板
  - 实时显示选课进度、成功数量、运行时间
  - 支持ESC键快速关闭

- **⚠️ 智能确认机制**
  - 删除课程时的安全确认对话框
  - 重置系统前的详细风险提示
  - 关闭程序时的分级警告系统

#### 🐛 重要问题修复

- **🏁 竞态条件修复**
  - 解决UI容器初始化时序问题
  - 修复数据恢复时的竞态条件
  - 添加重试机制和错误处理

- **🔧 代码架构优化**
  - 新增 Z-Index 层级管理系统
  - 重构事件驱动架构
  - 优化内存管理和定时器清理

#### 📁 文件结构更新

```
src/
├── local-data-manager.js     # 新增：本地数据管理器
├── config.js                 # 更新：新增滚动容器和Z-Index配置
├── course-registration.js    # 更新：集成存储功能和事件系统
└── ui-controller.js          # 更新：三态UI和数据恢复功能
```

#### 💡 使用体验提升

- 课程支持自定义名称，便于识别管理
- 运行时动态添加/删除课程，无需重启
- 一键安全关闭功能，自动清理所有资源
- 更友好的错误提示和用户引导

---

## 🎯 未来计划

### V1.0.5 计划功能
- [ ] 课程冲突检测和提醒
- [ ] 多账户支持和快速切换
- [ ] 选课历史记录和统计分析
- [ ] 更丰富的自定义主题和样式
- [ ] 导出选课结果到CSV/Excel

---

**⭐ 如果这个项目对你有帮助，请给个星标支持一下！**

**📧 有问题或建议？欢迎提交Issue或联系开发者。**

---

*最后更新时间: 2025年12月3日 (V1.0.4)*# SCMU_CC_Helper
