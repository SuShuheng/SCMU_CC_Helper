# SCMU_CC_Helper

-----
# 中南民族大学自动选课助手

🚀 一个专为中南民族大学（SCMU）学生设计的自动化课程注册助手，帮助学生快速抢到心仪的课程。

## ✨ 功能特性

- **🎯 自动选课**: 智能检测课程空位并自动注册
- **🔄 实时监控**: 500ms轮询间隔，不错过任何选课机会
- **📚 多课程支持**: 同时抢多个课程，提高成功率
- **🧪 实验班支持**: 自动尝试不同实验班，增加选课成功概率
- **🎨 友好界面**: 可拖拽的控制面板，操作简单直观
- **📊 状态监控**: 实时查看选课状态和进度
- **⚡ 高性能**: 使用ES6+现代JavaScript技术，运行流畅

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

### 两种版本对比

| 特性 | 单文件版本 | 模块化版本 |
|------|------------|------------|
| 使用难度 | ⭐ 简单 | ⭐⭐⭐ 中等 |
| 功能完整性 | ✅ 完整 | ✅ 完整 |
| 可定制性 | ❌ 不可定制 | ✅ 高度可定制 |
| 文件大小 | 单一文件 | 多个模块 |
| 适合人群 | 新手用户 | 开发者用户 |
| 二次开发 | ❌ 不支持 | ✅ 完全支持 |

## 📋 系统要求

- **浏览器**: Chrome 60+, Firefox 55+, Safari 10+, Edge 79+
- **JavaScript**: 支持ES6+ (ECMAScript 2015+)
- **网络**: 稳定的互联网连接
- **权限**: 已登录中南民族大学选课系统

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

- **运行时课程管理**: 选课进行中可动态添加/删除课程
- **删除确认机制**: 删除正在选课的课程时会显示确认对话框
- **自动停止功能**: 课程列表为空时自动停止选课
- **停止选课**: 点击"停止选课"暂停选课过程
- **重置系统**: 点击"重置"清空所有状态重新开始
- **拖拽面板**: 可以拖动控制面板到任意位置
- **滚动容器**: 超过8个课程时自动启用滚动条

## 🔧 配置选项

在 `src/config.js` 中可以自定义以下配置：

```javascript
// 轮询间隔（毫秒）
POLLING_INTERVAL: 500

// 最大重试次数
MAX_RETRY_COUNT: 3

// 课程满员检测关键词
COURSE_FULL_KEYWORDS: ['课程已满', '已选满']
```

## 📁 项目结构

```
scmu_cc_helper/
├── src/                          # 源代码目录
│   ├── config.js                 # 配置文件
│   ├── course-registration.js    # 核心选课逻辑
│   └── ui-controller.js          # 用户界面控制
├── docs/                         # 文档目录
│   ├── installation-guide.md     # 详细安装教程
│   ├── api-reference.md          # API参考文档
│   └── troubleshooting.md        # 故障排除
├── examples/                     # 示例代码
│   └── usage-examples.js         # 使用示例
├── dist/                         # 发布文件
│   └── course-helper.min.js      # 压缩版（可选）
└── README.md                     # 项目说明文档
```

## 🛠️ 技术栈

- **语言**: JavaScript ES6+
- **特性**:
  - Arrow Functions (箭头函数)
  - Template Literals (模板字面量)
  - const/let 变量声明
  - Promise 异步处理
  - Fetch API 网络请求
  - DOM Manipulation (DOM操作)
- **架构**: 模块化设计，分离关注点
- **框架**: 纯原生JavaScript，无外部依赖

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

---

**⭐ 如果这个项目对你有帮助，请给个星标支持一下！**

**📧 有问题或建议？欢迎提交Issue或联系开发者。**

---

*最后更新时间: 2025年11月*# SCMU_CC_Helper
