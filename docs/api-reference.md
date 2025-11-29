# 📚 API参考文档

> 🔍 **开发者指南** - 抢课助手API详细说明

## 目录

1. [核心类API](#核心类api)
2. [配置API](#配置api)
3. [工具函数API](#工具函数api)
4. [事件系统](#事件系统)
5. [错误处理](#错误处理)
6. [扩展开发](#扩展开发)

---

## 🏗️ 核心类API

### CourseRegistrationManager

课程注册管理器，负责核心抢课逻辑。

#### 构造函数

```javascript
const manager = new CourseRegistrationManager();
```

#### 方法列表

##### `addCourse(jxbid)`

添加课程到抢课列表。

**参数:**
- `jxbid` (string): 课程ID

**示例:**
```javascript
manager.addCourse('2024010101');
```

##### `removeCourse(jxbid)`

从抢课列表中移除课程。

**参数:**
- `jxbid` (string): 要移除的课程ID

**示例:**
```javascript
manager.removeCourse('2024010101');
```

##### `initialize()`

初始化系统，加载实验班信息并开始抢课。

**返回值:** `Promise<void>`

**示例:**
```javascript
await manager.initialize();
```

##### `startLoop()`

启动抢课定时器。

**示例:**
```javascript
manager.startLoop();
```

##### `stopLoop()`

停止抢课定时器。

**示例:**
```javascript
manager.stopLoop();
```

##### `getStatus()`

获取抢课状态信息。

**返回值:** `Object`

```javascript
const status = manager.getStatus();
console.log(status);
// 输出:
// {
//   totalCourses: 3,
//   successCount: 1,
//   isRunning: true,
//   courses: [
//     {
//       id: '2024010101',
//       success: true,
//       glReady: true,
//       experimentalClassCount: 2
//     }
//   ]
// }
```

##### `reset()`

重置所有状态。

**示例:**
```javascript
manager.reset();
```

##### `fetchExperimentalClasses(jxbid)`

获取课程的实验班信息。

**参数:**
- `jxbid` (string): 课程ID

**返回值:** `Promise<string[]>` - 实验班ID列表

**示例:**
```javascript
const classes = await manager.fetchExperimentalClasses('2024010101');
console.log(`实验班数量: ${classes.length}`);
```

##### `trySelectCourse(jxbid)`

尝试选择指定课程。

**参数:**
- `jxbid` (string): 课程ID

**返回值:** `Promise<void>`

**示例:**
```javascript
await manager.trySelectCourse('2024010101');
```

### UIController

用户界面控制器，管理图形界面。

#### 构造函数

```javascript
const ui = new UIController();
```

#### 方法列表

##### `initialize()`

初始化用户界面。

**示例:**
```javascript
ui.initialize();
```

##### `destroy()`

销毁用户界面。

**示例:**
```javascript
ui.destroy();
```

##### `showNotification(message, type)`

显示通知消息。

**参数:**
- `message` (string): 消息内容
- `type` (string): 消息类型 ('success', 'error', 'info', 'warning')

**示例:**
```javascript
ui.showNotification('抢课成功！', 'success');
ui.showNotification('网络错误，请重试', 'error');
```

##### `updateButtonStates(isRunning)`

更新按钮状态。

**参数:**
- `isRunning` (boolean): 是否正在运行

**示例:**
```javascript
ui.updateButtonStates(true);  // 设置为运行状态
ui.updateButtonStates(false); // 设置为停止状态
```

##### `makeDraggable(element)`

使元素可拖拽。

**参数:**
- `element` (HTMLElement): 要拖拽的DOM元素

**示例:**
```javascript
const panel = document.getElementById('control-panel');
ui.makeDraggable(panel);
```

---

## ⚙️ 配置API

### CONFIG 对象

全局配置对象，包含所有可配置参数。

#### 结构

```javascript
const CONFIG = {
    API: {
        BASE_URL: 'https://xk.webvpn.scuec.edu.cn/xsxk',
        ENDPOINTS: {
            GET_EXPERIMENTAL_CLASS: '/loadData.xk?method=getGljxb&jxbid=',
            COURSE_REGISTRATION: '/xkOper.xk?method=handleKzyxk&jxbid='
        }
    },
    GRAB: {
        POLLING_INTERVAL: 500,
        REQUEST_TIMEOUT: 10000,
        MAX_RETRY_COUNT: 3,
        COURSE_FULL_KEYWORDS: ['课程已满', '已选满']
    },
    UI: {
        PANEL_STYLE: { /* 面板样式 */ },
        BUTTON_STYLE: { /* 按钮样式 */ },
        INPUT_STYLE: { /* 输入框样式 */ }
    },
    HTTP: {
        HEADERS: {
            'accept': '*/*',
            'x-requested-with': 'XMLHttpRequest'
        },
        CREDENTIALS: 'include'
    },
    LOG: {
        ENABLE_VERBOSE_LOGGING: true,
        LOG_PREFIX: '[抢课助手]',
        LOG_LEVELS: {
            INFO: 'info',
            WARN: 'warn',
            ERROR: 'error',
            SUCCESS: 'success'
        }
    },
    DEV: {
        DEBUG_MODE: false,
        SHOW_DEBUG_INFO: false
    }
};
```

#### 修改配置

```javascript
// 修改轮询间隔
CONFIG.GRAB.POLLING_INTERVAL = 1000;  // 改为1秒

// 添加新的满员检测关键词
CONFIG.GRAB.COURSE_FULL_KEYWORDS.push('名额已满');

// 修改API基础URL
CONFIG.API.BASE_URL = 'https://new-xk.scuec.edu.cn';
```

---

## 🛠️ 工具函数API

### 检查函数

##### `checkCourseFull(html)`

检查课程是否已满。

**参数:**
- `html` (string): HTML内容

**返回值:** `boolean`

**示例:**
```javascript
if (checkCourseFull(responseText)) {
    console.log('课程已满，继续等待');
}
```

##### `initCourseState(jxbid)`

初始化课程状态。

**参数:**
- `jxbid` (string): 课程ID

**示例:**
```javascript
initCourseState('2024010101');
```

### HTTP工具

##### `createRequestConfig(options)`

创建HTTP请求配置。

**参数:**
- `options` (Object): 请求选项

**返回值:** `Object` - 请求配置对象

**示例:**
```javascript
const config = createRequestConfig({
    method: 'GET',
    timeout: 5000
});
```

---

## 📡 事件系统

### 自定义事件

抢课助手支持以下自定义事件：

#### `course:added`

课程添加时触发。

```javascript
document.addEventListener('course:added', (event) => {
    const { courseId } = event.detail;
    console.log(`课程 ${courseId} 已添加`);
});
```

#### `course:success`

抢课成功时触发。

```javascript
document.addEventListener('course:success', (event) => {
    const { courseId, timestamp } = event.detail;
    console.log(`课程 ${courseId} 抢课成功于 ${timestamp}`);
});
```

#### `course:failed`

抢课失败时触发。

```javascript
document.addEventListener('course:failed', (event) => {
    const { courseId, error } = event.detail;
    console.log(`课程 ${courseId} 抢课失败: ${error}`);
});
```

#### `grab:started`

抢课开始时触发。

```javascript
document.addEventListener('grab:started', () => {
    console.log('抢课已开始');
});
```

#### `grab:stopped`

抢课停止时触发。

```javascript
document.addEventListener('grab:stopped', () => {
    console.log('抢课已停止');
});
```

### 触发事件

```javascript
// 触发自定义事件
const event = new CustomEvent('course:success', {
    detail: { courseId: '2024010101', timestamp: Date.now() }
});
document.dispatchEvent(event);
```

---

## ❌ 错误处理

### 错误类型

#### `NetworkError`

网络请求错误。

```javascript
try {
    await manager.trySelectCourse('2024010101');
} catch (error) {
    if (error instanceof NetworkError) {
        console.error('网络错误:', error.message);
    }
}
```

#### `CourseFullError`

课程已满错误。

```javascript
try {
    await manager.trySelectCourse('2024010101');
} catch (error) {
    if (error instanceof CourseFullError) {
        console.log('课程已满，继续尝试');
    }
}
```

#### `AuthenticationError`

认证错误。

```javascript
try {
    await manager.initialize();
} catch (error) {
    if (error instanceof AuthenticationError) {
        console.error('登录已过期，请重新登录');
    }
}
```

### 错误处理最佳实践

```javascript
// 全局错误处理
window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise拒绝:', event.reason);
    // 可以在这里添加错误上报逻辑
});

// 抢课过程中的错误处理
async function safeGrabCourse(courseId) {
    try {
        await manager.trySelectCourse(courseId);
    } catch (error) {
        console.error(`抢课失败 [${courseId}]:`, error);

        // 根据错误类型采取不同措施
        if (error instanceof NetworkError) {
            // 网络错误，稍后重试
            setTimeout(() => safeGrabCourse(courseId), 2000);
        } else if (error instanceof AuthenticationError) {
            // 认证错误，提醒用户重新登录
            ui.showNotification('登录已过期，请重新登录', 'error');
        }
    }
}
```

---

## 🔧 扩展开发

### 创建自定义插件

```javascript
class CustomPlugin {
    constructor(manager, ui) {
        this.manager = manager;
        this.ui = ui;
        this.init();
    }

    init() {
        // 插件初始化逻辑
        this.addCustomButton();
        this.setupEventListeners();
    }

    addCustomButton() {
        const button = document.createElement('button');
        button.textContent = '自定义功能';
        button.onclick = () => this.customFunction();

        // 添加到控制面板
        const panel = document.getElementById('course-registration-panel');
        panel.appendChild(button);
    }

    customFunction() {
        // 自定义功能实现
        console.log('执行自定义功能');
    }

    setupEventListeners() {
        // 监听抢课事件
        document.addEventListener('course:success', (event) => {
            this.onCourseSuccess(event.detail);
        });
    }

    onCourseSuccess(courseInfo) {
        // 抢课成功后的自定义处理
        this.ui.showNotification(`恭喜抢到课程: ${courseInfo.courseId}`, 'success');

        // 可以添加自定义逻辑，如发送通知、保存数据等
        this.saveSuccessRecord(courseInfo);
    }

    saveSuccessRecord(courseInfo) {
        // 保存抢课成功记录
        const records = JSON.parse(localStorage.getItem('grabRecords') || '[]');
        records.push({
            ...courseInfo,
            timestamp: Date.now()
        });
        localStorage.setItem('grabRecords', JSON.stringify(records));
    }
}

// 使用插件
const plugin = new CustomPlugin(courseManager, uiController);
```

### 修改默认行为

```javascript
// 重写抢课逻辑
class CustomCourseManager extends CourseRegistrationManager {
    async trySelectCourse(jxbid) {
        // 添加自定义逻辑
        console.log(`开始抢课: ${jxbid}`);

        // 调用父类方法
        await super.trySelectCourse(jxbid);

        // 抢课后的自定义处理
        this.logGrabAttempt(jxbid);
    }

    logGrabAttempt(courseId) {
        const attempts = parseInt(localStorage.getItem(`attempts_${courseId}`) || '0');
        localStorage.setItem(`attempts_${courseId}`, attempts + 1);
    }
}

// 使用自定义管理器
const customManager = new CustomCourseManager();
```

### 添加新的配置选项

```javascript
// 扩展配置
CONFIG.CUSTOM = {
    ENABLE_NOTIFICATION: true,
    AUTO_RETRY_DELAY: 1000,
    MAX_ATTEMPTS_PER_COURSE: 100,
    SUCCESS_SOUND: 'notification.mp3'
};

// 使用新配置
if (CONFIG.CUSTOM.ENABLE_NOTIFICATION) {
    // 启用通知功能
}
```

---

## 📝 开发最佳实践

1. **错误处理**: 始终使用try-catch处理异步操作
2. **日志记录**: 使用统一的日志格式和前缀
3. **事件驱动**: 使用事件系统进行模块间通信
4. **配置管理**: 通过CONFIG对象管理所有配置
5. **模块化**: 保持代码的模块化和可维护性
6. **性能优化**: 避免不必要的网络请求和DOM操作

---

## 🔍 调试技巧

### 启用调试模式

```javascript
CONFIG.DEV.DEBUG_MODE = true;
CONFIG.LOG.ENABLE_VERBOSE_LOGGING = true;
```

### 查看详细日志

```javascript
// 在控制台中查看所有状态
console.log('抢课状态:', courseManager.getStatus());
console.log('配置信息:', CONFIG);
```

### 网络请求监控

```javascript
// 拦截fetch请求进行监控
const originalFetch = window.fetch;
window.fetch = function(...args) {
    console.log('网络请求:', args[0]);
    return originalFetch.apply(this, args);
};
```

---

*API文档持续更新中...如有疑问请提交Issue*