# 🔧 API 参考文档 (V1.0.4)

> 📚 **开发者指南**
> 这份文档详细介绍了抢课助手 V1.0.4 版本的 API、类和方法，适合进行二次开发和定制。

## 📋 目录

1. [核心架构概览](#核心架构概览)
2. [LocalDataManager 类](#localdatamanager-类)
3. [CourseRegistrationManager 类](#courseregistrationmanager-类)
4. [UIController 类](#uicontroller-类)
5. [配置系统](#配置系统)
6. [事件系统](#事件系统)
7. [使用示例](#使用示例)
8. [扩展开发指南](#扩展开发指南)

---

## 🏗️ 核心架构概览

### V1.0.4 架构变化

```
┌─────────────────────────────────────────────────────────────┐
│                    V1.0.4 架构图                              │
├─────────────────────────────────────────────────────────────┤
│  UIController (UI控制层)                                    │
│  ├── 三态UI系统 (悬浮按钮/完整面板/迷你状态)                  │
│  ├── 事件监听和处理                                           │
│  └── 数据恢复和同步                                           │
├─────────────────────────────────────────────────────────────┤
│  CourseRegistrationManager (业务逻辑层)                      │
│  ├── 课程管理 (增删改查)                                       │
│  ├── 选课自动化                                               │
│  ├── 状态跟踪                                                 │
│  └── 事件发布                                                 │
├─────────────────────────────────────────────────────────────┤
│  LocalDataManager (数据持久化层) - V1.0.4 新增                │
│  ├── 本地存储管理                                             │
│  ├── 数据序列化/反序列化                                       │
│  └── 存储兼容性处理                                           │
├─────────────────────────────────────────────────────────────┤
│  CONFIG (配置层)                                            │
│  ├── API配置                                                 │
│  ├── UI配置                                                  │
│  ├── 存储配置                                                 │
│  └── Z-Index层级管理                                          │
└─────────────────────────────────────────────────────────────┘
```

### 模块依赖关系

```javascript
// 依赖关系图
LocalDataManager (新增)
    ↑
CourseRegistrationManager
    ↑
UIController
    ↑
初始化调用
```

---

## 💾 LocalDataManager 类 (V1.0.4 新增)

负责本地数据的持久化存储和管理，支持 GM_setValue/GM_getValue API。

### 构造函数

```javascript
new LocalDataManager()
```

### 属性

```javascript
// 存储键名配置
this.STORAGE_KEYS = {
    COURSES: 'scmu_courses',
    EXPERIMENTAL_CLASSES: 'scmu_experimental_classes',
    METADATA: 'scmu_metadata'
};

// 数据版本
this.DATA_VERSION = '1.0.0';

// 存储可用性检查
this.storageAvailable = boolean;

// 默认课程名称
this.DEFAULT_COURSE_NAME = '请输入名称(可选)';
```

### 方法

#### checkStorageAvailability()
检查本地存储功能是否可用。

```javascript
checkStorageAvailability(): boolean
```

**返回值**:
- `true`: 存储功能可用
- `false`: 存储功能不可用

#### saveCoursesData(courses, experimentalClasses, statusMap)
保存课程数据到本地存储。

```javascript
saveCoursesData(
    courses: string[],           // 课程ID数组
    experimentalClasses: Object,   // 实验班数据映射
    statusMap: Object            // 课程状态映射
): boolean
```

**参数**:
- `courses`: 课程ID数组
- `experimentalClasses`: 实验班数据映射 `{courseId: [expClassIds]}`
- `statusMap`: 课程状态映射 `{courseId: {success: boolean, ...}}`

**返回值**:
- `true`: 保存成功
- `false`: 保存失败

#### loadCoursesData()
从本地存储加载课程数据。

```javascript
loadCoursesData(): Object | null
```

**返回值**:
```javascript
{
    courses: string[],              // 课程ID数组
    courseDetails: Object[],        // 课程详细信息
    experimentalClasses: Object,     // 实验班数据
    metadata: Object               // 元数据
} | null
```

#### updateCourseName(courseId, courseName)
更新课程名称。

```javascript
updateCourseName(
    courseId: string,    // 课程ID
    courseName: string   // 新的课程名称
): boolean
```

#### removeCourse(courseId)
从本地存储中删除指定课程。

```javascript
removeCourse(courseId: string): boolean
```

#### clearAllData()
清空所有本地存储数据。

```javascript
clearAllData(): boolean
```

#### getStorageInfo()
获取存储状态信息。

```javascript
getStorageInfo(): Object
```

#### getSavedCoursesSummary()
获取已保存课程的详细摘要。

```javascript
getSavedCoursesSummary(): Object
```

---

## 🎯 CourseRegistrationManager 类

负责课程注册的核心业务逻辑和自动化选课功能。

### V1.0.4 更新内容

- 集成 LocalDataManager
- 新增事件系统
- 增强状态管理
- 改进错误处理

### 构造函数

```javascript
new CourseRegistrationManager()
```

### 属性

```javascript
this.courses = [];                    // 课程ID数组
this.statusMap = {};                  // 课程状态映射
this.glJxbidMap = {};                 // 实验班信息映射
this.intervalId = null;               // 选课定时器ID
this.localDataManager = LocalDataManager;  // 本地数据管理器实例
```

### 核心方法 (V1.0.4 更新)

#### initEventListeners()
初始化事件监听器。

```javascript
initEventListeners(): void
```

#### loadSavedData()
加载保存的课程数据。

```javascript
loadSavedData(): void
```

#### saveCurrentData()
保存当前数据到本地存储。

```javascript
saveCurrentData(): boolean
```

#### addCourse(jxbid)
添加课程到选课列表。

```javascript
addCourse(jxbid: string): boolean
```

#### removeCourse(jxbid)
移除课程。

```javascript
removeCourse(jxbid: string): boolean
```

#### updateCourse(oldCourseId, newCourseId)
更新/替换课程ID。

```javascript
updateCourse(
    oldCourseId: string,
    newCourseId: string
): boolean
```

#### addCourseRuntime(jxbid)
运行时动态添加课程。

```javascript
addCourseRuntime(jxbid: string): Promise<boolean>
```

#### getStatus()
获取选课状态信息。

```javascript
getStatus(): Object
```

**返回值**:
```javascript
{
    totalCourses: number,
    successCount: number,
    isRunning: boolean,
    courses: Array<{
        id: string,
        success: boolean,
        glReady: boolean,
        experimentalClassCount: number
    }>
}
```

#### getStatusForCourse(jxbid)
获取指定课程的状态描述。

```javascript
getStatusForCourse(jxbid: string): string
```

#### reset()
重置所有状态。

```javascript
reset(): void
```

#### showNotification(message, type)
显示通知消息。

```javascript
showNotification(
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
): void
```

### 选课核心方法

#### initialize()
初始化系统，加载实验班信息并开始选课。

```javascript
initialize(): Promise<void>
```

#### startLoop()
启动选课定时器。

```javascript
startLoop(): void
```

#### stopLoop()
停止选课。

```javascript
stopLoop(): void
```

#### trySelectCourse(jxbid)
尝试选择课程。

```javascript
trySelectCourse(jxbid: string): Promise<void>
```

#### fetchExperimentalClasses(jxbid)
获取课程的实验班信息。

```javascript
fetchExperimentalClasses(jxbid: string): Promise<string[]>
```

---

## 🎨 UIController 类

负责用户界面的管理和控制，V1.0.4 版本进行了重大重构。

### V1.0.4 重大更新

- 三态UI系统
- 数据持久化集成
- 事件驱动架构
- 竞态条件修复

### 构造函数

```javascript
new UIController(courseManager: CourseRegistrationManager)
```

### UI状态常量

```javascript
const UI_STATES = {
    FLOATING_BUTTON: 'floating_button',    // 悬浮按钮状态
    FULL_PANEL: 'full_panel',              // 完整面板状态
    MINIMIZED_STATUS: 'minimized_status'   // 迷你状态面板
};
```

### 核心方法 (V1.0.4 更新)

#### initStorageEventListeners()
初始化存储事件监听器。

```javascript
initStorageEventListeners(): void
```

#### restoreUIFromStorage(courses, courseDetails, statusMap, retryCount)
从存储数据恢复UI界面。

```javascript
restoreUIFromStorage(
    courses: string[],
    courseDetails: Object[],
    statusMap: Object,
    retryCount: number = 0
): void
```

#### bindCourseInputEvents(courseInput, inputId, inputName)
为课程输入框绑定事件监听器。

```javascript
bindCourseInputEvents(
    courseInput: HTMLElement,
    inputId: HTMLInputElement,
    inputName: HTMLInputElement
): void
```

#### hideAllStates()
隐藏所有UI状态。

```javascript
hideAllStates(): void
```

#### transitionToState(newState)
转换到指定UI状态。

```javascript
transitionToState(newState: string): void
```

#### cycleUIState()
循环UI状态。

```javascript
cycleUIState(): void
```

#### updateScrollableContainer()
更新滚动容器配置。

```javascript
updateScrollableContainer(): void
```

#### showStatusModal()
显示状态详情弹窗。

```javascript
showStatusModal(): void
```

#### showResetConfirmation()
显示重置确认对话框。

```javascript
showResetConfirmation(): void
```

#### showCloseConfirmation()
显示关闭确认对话框。

```javascript
showCloseConfirmation(): void
```

#### executeClose()
执行关闭程序操作。

```javascript
executeClose(): void
```

#### handleDeleteCourse(div, inputId)
处理删除课程操作。

```javascript
handleDeleteCourse(
    div: HTMLElement,
    inputId: HTMLInputElement
): void
```

#### makeDraggable(element)
使元素可拖拽。

```javascript
makeDraggable(element: HTMLElement): void
```

#### isValidCourseId(courseId)
验证课程ID格式。

```javascript
isValidCourseId(courseId: string): boolean
```

---

## ⚙️ 配置系统

V1.0.4 版本大幅扩展了配置系统。

### 完整配置结构

```javascript
const CONFIG = {
    // API配置
    API: {
        BASE_URL: 'https://xk.webvpn.scuec.edu.cn/xsxk',
        ENDPOINTS: {
            GET_EXPERIMENTAL_CLASS: '/loadData.xk?method=getGljxb&jxbid=',
            COURSE_REGISTRATION: '/xkOper.xk?method=handleKzyxk&jxbid='
        }
    },

    // 选课配置
    GRAB: {
        POLLING_INTERVAL: 500,                    // 轮询间隔（毫秒）
        REQUEST_TIMEOUT: 10000,                   // 请求超时时间
        MAX_RETRY_COUNT: 3,                       // 最大重试次数
        COURSE_FULL_KEYWORDS: ['课程已满', '已选满'] // 课程满员检测关键词
    },

    // UI配置
    UI: {
        PANEL_STYLE: { /* 面板样式 */ },
        FLOATING_BUTTON: { /* 悬浮按钮样式 */ },
        MINIMIZED_PANEL: { /* 迷你面板样式 */ },
        SCROLLABLE_CONTAINER: {                    // V1.0.4 新增
            MAX_COURSES_BEFORE_SCROLL: 4,         // 超过多少课程启用滚动
            CONTAINER_HEIGHT: '250px',            // 滚动容器高度
            SCROLLBAR_WIDTH: '8px'               // 滚动条宽度
        },
        BUTTON_STYLE: { /* 按钮样式 */ },
        INPUT_STYLE: { /* 输入框样式 */ }
    },

    // HTTP配置
    HTTP: {
        HEADERS: {
            'accept': '*/*',
            'x-requested-with': 'XMLHttpRequest'
        },
        CREDENTIALS: 'include'
    },

    // 日志配置
    LOG: {
        ENABLE_VERBOSE_LOGGING: true,
        LOG_PREFIX: '[选课助手]',
        LOG_LEVELS: {
            INFO: 'info',
            WARN: 'warn',
            ERROR: 'error',
            SUCCESS: 'success'
        }
    },

    // Z-Index层级管理 - V1.0.4 新增
    Z_INDEX: {
        BASE_LAYER: 9999,        // 基础UI组件
        NOTIFICATION: 10000,     // 通知消息
        MODAL: 10001,           // 普通弹窗
        DIALOG: 10002,          // 确认对话框
        OVERLAY: 10003,         // 全屏遮罩
        TOPMOST: 10004          // 最高层级
    },

    // 开发者配置
    DEV: {
        DEBUG_MODE: false,
        SHOW_DEBUG_INFO: false
    }
};
```

### 自定义配置

```javascript
// 修改轮询间隔
CONFIG.GRAB.POLLING_INTERVAL = 1000;  // 改为1秒

// 修改UI样式
CONFIG.UI.PANEL_STYLE.top = '50px';  // 调整面板位置

// 修改日志级别
CONFIG.LOG.ENABLE_VERBOSE_LOGGING = false;  // 关闭详细日志
```

---

## 📡 事件系统

V1.0.4 引入了完整的事件驱动架构。

### 事件类型

#### storage:dataLoaded
数据加载完成事件。

```javascript
document.addEventListener('storage:dataLoaded', (event) => {
    const { courses, courseDetails, statusMap } = event.detail;
    console.log('数据已加载:', courses);
});
```

#### course:success
选课成功事件。

```javascript
document.addEventListener('course:success', (event) => {
    const { courseId, timestamp } = event.detail;
    console.log('选课成功:', courseId);
});
```

#### courses:started
选课开始事件。

```javascript
document.addEventListener('courses:started', () => {
    console.log('选课已开始');
});
```

#### courses:stopped
选课停止事件。

```javascript
document.addEventListener('courses:stopped', () => {
    console.log('选课已停止');
});
```

#### selection:auto-stopped
自动停止事件。

```javascript
document.addEventListener('selection:auto-stopped', (event) => {
    const { reason, timestamp } = event.detail;
    console.log('自动停止原因:', reason);
});
```

### 自定义事件发布

```javascript
// 发布自定义事件
const event = new CustomEvent('custom:event', {
    detail: { message: 'Hello World' }
});
document.dispatchEvent(event);
```

---

## 💡 使用示例

### 基础使用示例

```javascript
// 1. 创建课程管理器实例
const courseManager = new CourseRegistrationManager();

// 2. 添加课程
courseManager.addCourse('12345678');
courseManager.addCourse('87654321');

// 3. 设置课程名称（V1.0.4 新增）
courseManager.localDataManager.updateCourseName('12345678', '高等数学');

// 4. 开始选课
await courseManager.initialize();

// 5. 查看状态
console.log(courseManager.getStatus());

// 6. 停止选课
courseManager.stopLoop();
```

### UI控制器使用示例

```javascript
// 1. 创建UI控制器
const uiController = new UIController(courseManager);

// 2. 初始化界面
uiController.initialize();

// 3. 切换UI状态
uiController.transitionToState('full_panel');

// 4. 显示通知
uiController.showNotification('操作成功', 'success');

// 5. 显示状态弹窗
uiController.showStatusModal();
```

### 本地数据管理示例

```javascript
// 1. 创建数据管理器
const dataManager = new LocalDataManager();

// 2. 保存数据
dataManager.saveCoursesData(
    ['12345678', '87654321'],
    { '12345678': ['exp1', 'exp2'] },
    { '12345678': { success: true } }
);

// 3. 加载数据
const savedData = dataManager.loadCoursesData();

// 4. 更新课程名称
dataManager.updateCourseName('12345678', '数据结构');

// 5. 获取存储信息
const storageInfo = dataManager.getStorageInfo();
```

### 事件监听示例

```javascript
// 1. 监听选课成功事件
document.addEventListener('course:success', (event) => {
    const { courseId } = event.detail;

    // 显示成功通知
    uiController.showNotification(`抢到课程: ${courseId}`, 'success');

    // 播放成功音效（如果需要）
    playSuccessSound();
});

// 2. 监听数据加载事件
document.addEventListener('storage:dataLoaded', (event) => {
    const { courses } = event.detail;

    // 恢复UI状态
    uiController.restoreUIFromStorage(
        event.detail.courses,
        event.detail.courseDetails,
        event.detail.statusMap
    );

    console.log(`已恢复 ${courses.length} 门课程`);
});

// 3. 监听选课停止事件
document.addEventListener('courses:stopped', () => {
    // 切换UI到悬浮按钮状态
    uiController.transitionToState('floating_button');

    // 显示停止通知
    uiController.showNotification('选课已停止', 'info');
});
```

### 高级自定义示例

```javascript
// 1. 自定义配置
const customConfig = {
    ...CONFIG,
    GRAB: {
        ...CONFIG.GRAB,
        POLLING_INTERVAL: 300,  // 更快的轮询间隔
        COURSE_FULL_KEYWORDS: ['课程已满', '已选满', '名额已满']
    },
    UI: {
        ...CONFIG.UI,
        PANEL_STYLE: {
            ...CONFIG.UI.PANEL_STYLE,
            backgroundColor: '#2c3e50',  // 深色主题
            color: 'white'
        }
    }
};

// 2. 创建增强版课程管理器
class EnhancedCourseManager extends CourseRegistrationManager {
    constructor() {
        super();
        this.enhancedFeatures = true;
    }

    // 重写选课成功处理
    async trySelectCourse(jxbid) {
        // 添加预处理逻辑
        if (this.enhancedFeatures) {
            console.log(`[增强功能] 开始处理课程: ${jxbid}`);
        }

        // 调用父类方法
        return super.trySelectCourse(jxbid);
    }

    // 添加批量操作功能
    addMultipleCourses(courseIds) {
        courseIds.forEach(id => this.addCourse(id));
        return this.courses.length;
    }
}

// 3. 使用增强版管理器
const enhancedManager = new EnhancedCourseManager();

// 4. 批量添加课程
enhancedManager.addMultipleCourses(['12345678', '87654321', '11111111']);
```

---

## 🔧 扩展开发指南

### 添加新功能模块

```javascript
// 1. 创建新功能模块
class NotificationManager {
    constructor() {
        this.notifications = [];
    }

    sendDesktopNotification(title, message) {
        if ('Notification' in window) {
            new Notification(title, { body: message });
        }
    }

    sendEmailNotification(courseId, status) {
        // 邮件通知实现
        console.log(`邮件通知: 课程 ${courseId} 状态: ${status}`);
    }
}

// 2. 集成到主系统
const notificationManager = new NotificationManager();

// 3. 在选课成功时调用
document.addEventListener('course:success', (event) => {
    const { courseId } = event.detail;

    // 发送桌面通知
    notificationManager.sendDesktopNotification(
        '选课成功',
        `成功抢到课程: ${courseId}`
    );

    // 发送邮件通知
    notificationManager.sendEmailNotification(courseId, 'success');
});
```

### 创建自定义UI组件

```javascript
// 1. 创建自定义组件
class StatisticsPanel {
    constructor(courseManager) {
        this.courseManager = courseManager;
        this.panel = null;
        this.updateInterval = null;
    }

    create() {
        this.panel = document.createElement('div');
        this.panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 1px solid #ccc;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10001;
        `;

        this.update();
        document.body.appendChild(this.panel);

        this.startAutoUpdate();
    }

    update() {
        const status = this.courseManager.getStatus();

        this.panel.innerHTML = `
            <h4>📊 实时统计</h4>
            <div>总课程: ${status.totalCourses}</div>
            <div>已成功: ${status.successCount}</div>
            <div>成功率: ${status.totalCourses > 0 ?
                Math.round(status.successCount / status.totalCourses * 100) : 0}%</div>
            <div>运行中: ${status.isRunning ? '是' : '否'}</div>
        `;
    }

    startAutoUpdate() {
        this.updateInterval = setInterval(() => {
            this.update();
        }, 1000);
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.panel && this.panel.parentNode) {
            this.panel.parentNode.removeChild(this.panel);
        }
    }
}

// 2. 集成到UI控制器
class EnhancedUIController extends UIController {
    constructor(courseManager) {
        super(courseManager);
        this.statisticsPanel = new StatisticsPanel(courseManager);
    }

    initialize() {
        super.initialize();

        // 添加统计面板
        document.addEventListener('courses:started', () => {
            this.statisticsPanel.create();
        });

        document.addEventListener('courses:stopped', () => {
            this.statisticsPanel.destroy();
        });
    }
}

// 3. 使用增强版UI控制器
const enhancedUIController = new EnhancedUIController(courseManager);
enhancedUIController.initialize();
```

### 插件系统示例

```javascript
// 1. 定义插件接口
class Plugin {
    constructor(name, version) {
        this.name = name;
        this.version = version;
        this.enabled = false;
    }

    initialize(courseManager, uiController) {
        throw new Error('initialize method must be implemented');
    }

    destroy() {
        throw new Error('destroy method must be implemented');
    }
}

// 2. 创建具体插件
class LoggingPlugin extends Plugin {
    constructor() {
        super('Logging Plugin', '1.0.0');
        this.logFile = [];
    }

    initialize(courseManager, uiController) {
        this.enabled = true;

        // 监听所有事件
        document.addEventListener('course:success', (event) => {
            this.log(`选课成功: ${event.detail.courseId}`);
        });

        document.addEventListener('courses:started', () => {
            this.log('选课开始');
        });

        document.addEventListener('courses:stopped', () => {
            this.log('选课停止');
        });
    }

    log(message) {
        const timestamp = new Date().toLocaleString();
        this.logFile.push(`${timestamp}: ${message}`);
        console.log(`[Plugin] ${message}`);
    }

    getLog() {
        return this.logFile.join('\n');
    }

    destroy() {
        this.enabled = false;
        // 清理事件监听器等
    }
}

// 3. 插件管理器
class PluginManager {
    constructor() {
        this.plugins = new Map();
    }

    registerPlugin(plugin) {
        this.plugins.set(plugin.name, plugin);
    }

    initializePlugin(name, courseManager, uiController) {
        const plugin = this.plugins.get(name);
        if (plugin) {
            plugin.initialize(courseManager, uiController);
        }
    }

    destroyPlugin(name) {
        const plugin = this.plugins.get(name);
        if (plugin) {
            plugin.destroy();
        }
    }

    listPlugins() {
        return Array.from(this.plugins.keys());
    }
}

// 4. 使用插件系统
const pluginManager = new PluginManager();

// 注册插件
const loggingPlugin = new LoggingPlugin();
pluginManager.registerPlugin(loggingPlugin);

// 初始化插件
pluginManager.initializePlugin('Logging Plugin', courseManager, uiController);
```

---

## 📚 开发最佳实践

### 1. 错误处理

```javascript
// 统一错误处理
class ErrorHandler {
    static handle(error, context) {
        console.error(`[${context}] 错误:`, error);

        // 发送错误报告（可选）
        if (CONFIG.DEV.DEBUG_MODE) {
            this.reportError(error, context);
        }
    }

    static reportError(error, context) {
        // 错误上报逻辑
        console.log('错误已上报:', { error, context });
    }
}

// 使用示例
try {
    await courseManager.initialize();
} catch (error) {
    ErrorHandler.handle(error, '选课初始化');
}
```

### 2. 性能优化

```javascript
// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 使用防抖优化UI更新
const debouncedUpdateUI = debounce(() => {
    uiController.updateStatus();
}, 100);
```

### 3. 内存管理

```javascript
// 组件销毁时清理资源
class ComponentBase {
    constructor() {
        this.timers = [];
        this.eventListeners = [];
    }

    addTimer(callback, interval) {
        const timerId = setInterval(callback, interval);
        this.timers.push(timerId);
        return timerId;
    }

    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.eventListeners.push({ element, event, handler });
    }

    destroy() {
        // 清理定时器
        this.timers.forEach(timerId => clearInterval(timerId));
        this.timers = [];

        // 清理事件监听器
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
    }
}
```

---

## 🔗 相关资源

- [项目主页](https://github.com/sushuheng/scmu_cc_helper)
- [安装指南](installation-guide-v1.0.4.md)
- [JavaScript特性文档](javascript-features.md)
- [故障排除指南](troubleshooting.md)

---

*最后更新时间: 2025年12月3日 (V1.0.4)*
*如有问题或建议，欢迎提交Issue或Pull Request*