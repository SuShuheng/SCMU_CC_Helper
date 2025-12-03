# 📘 JavaScript语言特性说明 (V1.0.4)

> 🔍 **抢课助手 V1.0.4 使用的JavaScript技术详解**

## 📋 目录

1. [语言版本概述](#语言版本概述)
2. [ES6+ 特性使用](#es6-特性使用)
3. [浏览器API使用](#浏览器api使用)
4. [V1.0.4 新增特性](#v104-新增特性)
5. [事件驱动架构](#事件驱动架构)
6. [数据持久化技术](#数据持久化技术)
7. [代码架构模式](#代码架构模式)
8. [最佳实践](#最佳实践)

---

## 🌟 语言版本概述

### 主要语言
- **JavaScript ES6+** (ECMAScript 2015+)
- **运行环境**: 现代浏览器 (Chrome 60+, Firefox 55+, Safari 10+, Edge 79+)
- **模块系统**: ES6 Modules
- **编码规范**: ES6+ 语法规范

### V1.0.4 版本技术升级
- **新增**: CustomEvent 事件系统
- **新增**: GM_setValue/GM_getValue 存储API
- **增强**: 错误处理和重试机制
- **优化**: 内存管理和性能

---

## 🚀 ES6+ 特性使用

### 1. 变量声明 (const/let)

#### 使用说明
使用 `const` 和 `let` 替代 `var`，提供块级作用域。

```javascript
// 配置对象 - 使用const声明常量
const CONFIG = {
    API: {
        BASE_URL: 'https://xk.webvpn.scuec.edu.cn/xsxk',
        ENDPOINTS: {
            GET_EXPERIMENTAL_CLASS: '/loadData.xk?method=getGljxb&jxbid=',
            COURSE_REGISTRATION: '/xkOper.xk?method=handleKzyxk&jxbid='
        }
    },
    Z_INDEX: {  // V1.0.4 新增
        BASE_LAYER: 9999,
        NOTIFICATION: 10000,
        MODAL: 10001
    }
};

// 课程数组 - 使用let声明可变数组
let courses = [];

// V1.0.4 新增：存储相关变量
const STORAGE_KEYS = {
    COURSES: 'scmu_courses',
    EXPERIMENTAL_CLASSES: 'scmu_experimental_classes',
    METADATA: 'scmu_metadata'
};
```

### 2. 箭头函数 (Arrow Functions)

#### 使用说明
使用箭头函数简化函数语法，保持this指向。

```javascript
// V1.0.4 事件监听器增强
class LocalDataManager {
    constructor() {
        // 箭头函数保持this指向
        document.addEventListener('storage:dataLoaded', (event) => {
            this.handleDataLoaded(event.detail);
        });
    }
}

// UI控制器中的事件处理
const handleDeleteCourse = (div, inputId) => {
    const courseId = inputId.dataset.currentCourseId || inputId.value.trim();

    if (!courseId) {
        if (div.parentNode) {
            div.parentNode.removeChild(div);
        }
        this.updateScrollableContainer();
        return;
    }

    // 确认对话框逻辑
    this.showDeleteConfirmation(courseId, () => {
        this.executeDeleteCourse(div, courseId);
    });
};

// Promise链式调用 - V1.0.4 增强
fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: CONFIG.HTTP.HEADERS
})
.then(response => {
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
})
.then(data => {
    if (!Array.isArray(data)) {
        console.warn(`实验班数据返回异常:`, data);
        return [];
    }
    return data.map(item => item.jxbid).filter(Boolean);
})
.catch(error => {
    console.error('获取实验班失败:', error);
    return [];
});
```

### 3. 模板字面量 (Template Literals)

#### V1.0.4 使用示例

```javascript
// 动态URL构建
const courseId = '2024010101';
const experimentalId = 'EXP001';
const url = `${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.COURSE_REGISTRATION}${courseId}&glJxbid=${experimentalId}`;

// V1.0.4 日志消息增强
const logMessage = `✅ [成功] ${courseId} 实验班: ${experimentalId} 选课成功！时间: ${new Date().toLocaleTimeString()}`;
console.log(logMessage);

// 动态样式生成
const notificationStyle = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    font-weight: bold;
    z-index: ${CONFIG.Z_INDEX.NOTIFICATION};
    background-color: ${colors[type] || colors.info};
    opacity: 0;
    transition: opacity 0.3s ease;
`;

// 多行状态消息
const statusMessage = `
📊 选课状态报告
总课程数: ${status.totalCourses}
成功数量: ${status.successCount}
运行时间: ${this.formatRunTime(this.calculateRunTime())}
成功率: ${status.totalCourses > 0 ? Math.round(status.successCount / status.totalCourses * 100) : 0}%
`;
```

### 4. 解构赋值 (Destructuring)

#### V1.0.4 高级解构应用

```javascript
// 配置解构 - V1.0.4 新增
const {
    API: { BASE_URL, ENDPOINTS },
    UI: { SCROLLABLE_CONTAINER, Z_INDEX },
    LOG: { LOG_PREFIX }
} = CONFIG;

// 事件数据解构
const handleDataLoaded = ({ courses, courseDetails, statusMap }) => {
    console.log(`${LOG_PREFIX} 数据加载完成:`, { courses, courseDetails, statusMap });

    // 数组解构
    const [firstCourse, ...otherCourses] = courses;

    // UI恢复
    this.restoreUIFromStorage(courses, courseDetails, statusMap);
};

// API响应解构
const { success, xksj, message } = await response.json();

// 函数参数解构 - V1.0.4 增强
const createConfirmationDialog = ({
    title,
    message,
    onConfirm,
    onCancel,
    warningLevel = 'medium'
}) => {
    const colorSchemes = {
        low: { bg: '#f8f9fa', border: '#6c757d' },
        medium: { bg: '#fff3cd', border: '#ffc107' },
        high: { bg: '#f8d7da', border: '#dc3545' }
    };

    const { bg, border } = colorSchemes[warningLevel];
    // 对话框创建逻辑...
};
```

### 5. Promise 和 async/await

#### V1.0.4 异步处理增强

```javascript
// 并行处理实验班信息 - V1.0.4 优化
async function initialize() {
    console.log(`${CONFIG.LOG.LOG_PREFIX} 开始加载课程实验班信息...`);

    const tasks = this.courses.map(jxbid =>
        this.fetchExperimentalClasses(jxbid).then(glList => {
            this.glJxbidMap[jxbid] = glList;
            this.statusMap[jxbid].glReady = true;
            console.log(`${CONFIG.LOG.LOG_PREFIX} 课程 ${jxbid} 实验班信息加载完成，共 ${glList.length} 个实验班`);
        })
    );

    try {
        await Promise.all(tasks);
        console.log(`${CONFIG.LOG.LOG_PREFIX} ✅ 实验班加载完毕，开始选课！`);
        this.startLoop();
    } catch (error) {
        console.error(`${CONFIG.LOG.LOG_PREFIX} 初始化失败:`, error);
    }
}

// 运行时课程添加 - V1.0.4 新增
async function addCourseRuntime(jxbid) {
    if (!jxbid || jxbid.trim() === '') return false;

    const trimmedId = jxbid.trim();
    if (this.courses.includes(trimmedId)) return false;

    // 添加课程到列表
    this.courses.push(trimmedId);
    this.initCourseState(trimmedId);

    // 如果选课正在进行，立即加载实验班信息
    if (this.intervalId) {
        try {
            const glList = await this.fetchExperimentalClasses(trimmedId);
            this.glJxbidMap[trimmedId] = glList;
            this.statusMap[trimmedId].glReady = true;
            console.log(`${CONFIG.LOG.LOG_PREFIX} 运行时添加课程: ${trimmedId}`);
            return true;
        } catch (error) {
            console.error(`${CONFIG.LOG.LOG_PREFIX} 运行时加载实验班失败:`, error);
            return true; // 即使实验班加载失败，课程仍然添加成功
        }
    }

    return true;
}

// 带重试机制的API调用 - V1.0.4 增强
async function safeFetch(url, options = {}, retries = CONFIG.GRAB.MAX_RETRY_COUNT) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                ...options,
                signal: AbortSignal.timeout(CONFIG.GRAB.REQUEST_TIMEOUT)  // 超时控制
            });

            if (response.ok) {
                return response;
            }

            // 检查是否是课程满员
            if (this.checkCourseFull(await response.text())) {
                console.log(`⚠️ [${jxbid}] 课程已满，但继续尝试`);
                continue;
            }

        } catch (error) {
            if (i === retries - 1) throw error;
            console.log(`请求失败，第 ${i + 1} 次重试...:`, error);
        }
    }
}
```

### 6. 模块系统 (ES6 Modules)

#### V1.0.4 模块结构更新

```javascript
// config.js - V1.0.4 增强配置
export const API_CONFIG = { /* ... */ };
export const GRAB_CONFIG = { /* ... */ };
export const UI_CONFIG = {
    SCROLLABLE_CONTAINER: {  // V1.0.4 新增
        MAX_COURSES_BEFORE_SCROLL: 4,
        CONTAINER_HEIGHT: '250px',
        SCROLLBAR_WIDTH: '8px'
    }
};
export const Z_INDEX_CONFIG = { /* V1.0.4 新增 */ };

// local-data-manager.js - V1.0.4 新增模块
export class LocalDataManager {
    constructor() {
        this.STORAGE_KEYS = {
            COURSES: 'scmu_courses',
            EXPERIMENTAL_CLASSES: 'scmu_experimental_classes',
            METADATA: 'scmu_metadata'
        };
    }

    saveCoursesData(courses, experimentalClasses, statusMap) { /* ... */ }
    loadCoursesData() { /* ... */ }
    updateCourseName(courseId, courseName) { /* ... */ }
    removeCourse(courseId) { /* ... */ }
}

// course-registration.js - V1.0.4 增强
import { CONFIG } from './config.js';
import { LocalDataManager } from './local-data-manager.js';

export class CourseRegistrationManager {
    constructor() {
        this.localDataManager = new LocalDataManager();  // V1.0.4 新增
        this.initEventListeners();  // V1.0.4 新增
        this.loadSavedData();  // V1.0.4 新增
    }
}

// ui-controller.js - V1.0.4 重构
import { CONFIG } from './config.js';
import { UI_STATES } from './ui-states.js';  // V1.0.4 新增常量

export class UIController {
    constructor(courseManager) {
        this.courseManager = courseManager;
        this.currentState = UI_STATES.FLOATING_BUTTON;  // V1.0.4 新增
        this.initStorageEventListeners();  // V1.0.4 新增
    }
}
```

---

## 🌐 浏览器API使用

### 1. Fetch API - V1.0.4 增强

```javascript
// 带完整错误处理的请求
async function trySelectCourse(jxbid) {
    const state = this.statusMap[jxbid];
    if (state.success || !state.glReady) return;

    const glList = this.glJxbidMap[jxbid];
    let url = "";
    let glInfo = "";

    // V1.0.4: 智能URL构建
    if (glList.length > 0) {
        if (state.glAttemptIndex >= glList.length) {
            console.log(`❌ [${jxbid}] 所有实验班尝试失败`);
            state.glAttemptIndex = 0;
        }

        const glJxbid = glList[state.glAttemptIndex];
        url = `${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.COURSE_REGISTRATION}${encodeURIComponent(jxbid)}&glJxbid=${encodeURIComponent(glJxbid)}`;
        glInfo = ` 实验班: ${glJxbid}`;
    } else {
        url = `${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.COURSE_REGISTRATION}${encodeURIComponent(jxbid)}`;
    }

    try {
        const response = await fetch(url, {
            method: 'GET',
            credentials: CONFIG.HTTP.CREDENTIALS,
            headers: CONFIG.HTTP.HEADERS
        });

        if (!response.ok) {
            const html = await response.text();
            if (this.checkCourseFull(html)) {
                console.log(`⚠️ [${jxbid}] 课程已满，但继续尝试`);
            } else {
                console.error(`🚫 [${jxbid}] 返回非 JSON 数据：`, html);
            }
            throw new Error(`请求失败：HTTP ${response.status}`);
        }

        const data = await response.json();

        // V1.0.4: 成功处理和事件发布
        if (data.success) {
            console.log(`✅ [成功] ${jxbid}${glInfo} 选课成功！时间: ${data.xksj || new Date().toLocaleTimeString()}`);
            state.success = true;

            // 自动保存选课成功状态 - V1.0.4 新增
            this.saveCurrentData();

            // 触发成功事件 - V1.0.4 新增
            const event = new CustomEvent('course:success', {
                detail: { courseId: jxbid, timestamp: Date.now() }
            });
            document.dispatchEvent(event);
        } else {
            console.log(`⚠️ [${jxbid}] 选课失败${glInfo ? `，继续尝试下一个实验班` : ""}：`, data);
            if (glList.length > 0) {
                state.glAttemptIndex++;
            }
        }
    } catch (error) {
        console.error(`🚫 [${jxbid}] 请求错误:`, error);
        if (glList.length > 0) {
            state.glAttemptIndex++;
        }
    }
}
```

### 2. CustomEvent API - V1.0.4 新增

```javascript
// 事件发布系统 - V1.0.4 核心特性
class EventEmitter {
    static emit(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    static on(eventName, callback) {
        document.addEventListener(eventName, callback);
    }

    static off(eventName, callback) {
        document.removeEventListener(eventName, callback);
    }
}

// 在课程注册管理器中使用
class CourseRegistrationManager {
    initEventListeners() {
        // 监听选课成功事件
        document.addEventListener('course:success', (event) => {
            const { courseId } = event.detail;
            console.log(`🎉 选课成功! 课程: ${courseId}`);
            this.showNotification(`成功抢到课程: ${courseId}`, 'success');
        });
    }

    async trySelectCourse(jxbid) {
        // ... 选课逻辑 ...

        if (data.success) {
            // 发布选课成功事件
            EventEmitter.emit('course:success', {
                courseId: jxbid,
                timestamp: Date.now(),
                experimentalClass: glInfo
            });
        }
    }

    startLoop() {
        this.intervalId = setInterval(() => {
            this.courses.forEach(jxbid => {
                this.trySelectCourse(jxbid);
            });
        }, CONFIG.GRAB.POLLING_INTERVAL);

        // 发布选课开始事件
        EventEmitter.emit('courses:started', {
            courseCount: this.courses.length,
            timestamp: Date.now()
        });
    }

    stopLoop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log(`${CONFIG.LOG.LOG_PREFIX} 定时器已停止！`);

            // 发布选课停止事件
            EventEmitter.emit('courses:stopped', {
                timestamp: Date.now(),
                finalStatus: this.getStatus()
            });
        }
    }
}
```

### 3. GM_setValue/GM_getValue API - V1.0.4 新增

```javascript
// 本地数据管理器 - 油猴脚本存储API
class LocalDataManager {
    checkStorageAvailability() {
        try {
            return typeof GM_setValue !== 'undefined' && typeof GM_getValue !== 'undefined';
        } catch (e) {
            console.error(`${CONFIG.LOG.LOG_PREFIX} 存储功能检测失败:`, e);
            return false;
        }
    }

    saveCoursesData(courses, experimentalClasses, statusMap) {
        if (!this.storageAvailable) {
            console.warn(`${CONFIG.LOG.LOG_PREFIX} 存储功能不可用，数据无法保存`);
            return false;
        }

        try {
            const storageData = {
                courses: courses.map(courseId => ({
                    id: courseId,
                    name: this.DEFAULT_COURSE_NAME,
                    addedTime: Date.now(),
                    status: {
                        success: statusMap[courseId]?.success || false
                    }
                })),
                experimentalClasses,
                metadata: {
                    lastSaved: Date.now(),
                    version: this.DATA_VERSION,
                    sessionCount: this.getSessionCount() + 1
                }
            };

            // 使用油猴存储API
            GM_setValue(this.STORAGE_KEYS.COURSES, JSON.stringify(storageData.courses));
            GM_setValue(this.STORAGE_KEYS.EXPERIMENTAL_CLASSES, JSON.stringify(storageData.experimentalClasses));
            GM_setValue(this.STORAGE_KEYS.METADATA, JSON.stringify(storageData.metadata));

            console.log(`${CONFIG.LOG.LOG_PREFIX} 数据保存成功，共${storageData.courses.length}门课程`);
            return true;
        } catch (error) {
            console.error(`${CONFIG.LOG.LOG_PREFIX} 保存数据失败:`, error);
            return false;
        }
    }

    loadCoursesData() {
        if (!this.storageAvailable) {
            console.warn(`${CONFIG.LOG.LOG_PREFIX} 存储功能不可用，无法加载保存的数据`);
            return null;
        }

        try {
            // 使用油猴存储API
            const coursesStr = GM_getValue(this.STORAGE_KEYS.COURSES, '[]');
            const experimentalClassesStr = GM_getValue(this.STORAGE_KEYS.EXPERIMENTAL_CLASSES, '{}');
            const metadataStr = GM_getValue(this.STORAGE_KEYS.METADATA, '{}');

            const courses = JSON.parse(coursesStr);
            const experimentalClasses = JSON.parse(experimentalClassesStr);
            const metadata = JSON.parse(metadataStr);

            if (courses.length === 0) {
                return null;
            }

            return {
                courses: courses.map(course => course.id),
                courseDetails: courses,
                experimentalClasses,
                metadata
            };
        } catch (error) {
            console.error(`${CONFIG.LOG.LOG_PREFIX} 加载本地存储数据失败:`, error);
            return null;
        }
    }

    clearAllData() {
        if (!this.storageAvailable) return false;

        try {
            Object.values(this.STORAGE_KEYS).forEach(key => {
                GM_deleteValue(key);
            });
            console.log(`${CONFIG.LOG.LOG_PREFIX} 所有本地存储数据已清空`);
            return true;
        } catch (error) {
            console.error(`${CONFIG.LOG.LOG_PREFIX} 清空数据失败:`, error);
            return false;
        }
    }
}
```

---

## 🆕 V1.0.4 新增特性

### 1. 事件驱动架构

#### CustomEvent 系统设计

```javascript
// 事件常量定义
const EVENT_TYPES = {
    DATA_LOADED: 'storage:dataLoaded',
    COURSE_SUCCESS: 'course:success',
    COURSES_STARTED: 'courses:started',
    COURSES_STOPPED: 'courses:stopped',
    AUTO_STOPPED: 'selection:auto-stopped'
};

// 事件管理器
class EventManager {
    static listeners = new Map();

    static register(eventType, callback, id = null) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Map());
        }

        const listenerId = id || Symbol('listener');
        this.listeners.get(eventType).set(listenerId, callback);

        // 添加到DOM
        document.addEventListener(eventType, callback);

        return listenerId;
    }

    static unregister(eventType, listenerId) {
        if (this.listeners.has(eventType)) {
            const callback = this.listeners.get(eventType).get(listenerId);
            if (callback) {
                document.removeEventListener(eventType, callback);
                this.listeners.get(eventType).delete(listenerId);
            }
        }
    }

    static emit(eventType, detail = {}) {
        const event = new CustomEvent(eventType, { detail });
        document.dispatchEvent(event);

        // 调试日志
        if (CONFIG.DEV.DEBUG_MODE) {
            console.log(`📡 事件发射: ${eventType}`, detail);
        }
    }
}

// 使用示例
class UIController {
    initStorageEventListeners() {
        // 注册数据加载事件监听器
        EventManager.register(EVENT_TYPES.DATA_LOADED, (event) => {
            const { courses, courseDetails, statusMap } = event.detail;
            this.restoreUIFromStorage(courses, courseDetails, statusMap);
        }, 'ui-data-loaded');
    }

    initCourseEventListeners() {
        // 注册选课成功事件监听器
        EventManager.register(EVENT_TYPES.COURSE_SUCCESS, (event) => {
            const { courseId } = event.detail;
            this.showNotification(`成功抢到课程: ${courseId}`, 'success');
        }, 'ui-course-success');
    }
}
```

### 2. 数据持久化技术

#### 存储数据结构设计

```javascript
// 存储数据结构
const STORAGE_SCHEMA = {
    courses: [
        {
            id: "12345678901",                    // 课程ID
            name: "高等数学",                      // 课程名称
            addedTime: 1701234567890,             // 添加时间戳
            nameUpdatedTime: 1701234567890,       // 名称更新时间
            status: {
                success: false,                   // 选课成功状态
                lastAttempt: 1701234567890        // 最后尝试时间
            }
        }
    ],
    experimentalClasses: {
        "12345678901": ["EXP001", "EXP002"],   // 实验班映射
        "98765432109": ["EXP003"]
    },
    metadata: {
        lastSaved: 1701234567890,              // 最后保存时间
        version: "1.0.0",                      // 数据版本
        sessionCount: 5,                        // 使用会话数
        firstInstall: 1701000000000            // 首次安装时间
    }
};

// 数据迁移和兼容性处理
class DataMigration {
    static migrateToV1_0_0(oldData) {
        // V1.0.4 迁移逻辑
        if (oldData.version === '0.9.0') {
            return {
                ...oldData,
                courses: oldData.courses.map(course => ({
                    ...course,
                    status: course.status || { success: false }
                })),
                metadata: {
                    ...oldData.metadata,
                    version: '1.0.0'
                }
            };
        }
        return oldData;
    }

    static validateData(data) {
        // 数据完整性验证
        const required = ['courses', 'experimentalClasses', 'metadata'];
        return required.every(key => data.hasOwnProperty(key));
    }
}
```

### 3. 三态UI系统

#### UI状态管理

```javascript
// UI状态常量
const UI_STATES = {
    FLOATING_BUTTON: 'floating_button',
    FULL_PANEL: 'full_panel',
    MINIMIZED_STATUS: 'minimized_status'
};

// UI状态机
class UIStateMachine {
    constructor(initialState = UI_STATES.FLOATING_BUTTON) {
        this.currentState = initialState;
        this.stateHistory = [];
    }

    transition(newState, context = {}) {
        if (!this.isValidTransition(this.currentState, newState)) {
            console.warn(`无效的状态转换: ${this.currentState} -> ${newState}`);
            return false;
        }

        // 记录状态历史
        this.stateHistory.push({
            from: this.currentState,
            to: newState,
            timestamp: Date.now(),
            context
        });

        this.currentState = newState;
        return true;
    }

    isValidTransition(from, to) {
        const validTransitions = {
            [UI_STATES.FLOATING_BUTTON]: [UI_STATES.FULL_PANEL],
            [UI_STATES.FULL_PANEL]: [UI_STATES.FLOATING_BUTTON, UI_STATES.MINIMIZED_STATUS],
            [UI_STATES.MINIMIZED_STATUS]: [UI_STATES.FULL_PANEL, UI_STATES.FLOATING_BUTTON]
        };

        return validTransitions[from]?.includes(to) || false;
    }

    cycle(isSelecting) {
        if (isSelecting) {
            switch (this.currentState) {
                case UI_STATES.FULL_PANEL:
                    this.transition(UI_STATES.MINIMIZED_STATUS);
                    break;
                case UI_STATES.MINIMIZED_STATUS:
                    this.transition(UI_STATES.FLOATING_BUTTON);
                    break;
                default:
                    this.transition(UI_STATES.FULL_PANEL);
            }
        } else {
            this.transition(
                this.currentState === UI_STATES.FLOATING_BUTTON ?
                    UI_STATES.FULL_PANEL :
                    UI_STATES.FLOATING_BUTTON
            );
        }
    }
}
```

---

## 🏗️ 事件驱动架构

### 事件系统设计模式

```javascript
// 事件发布订阅模式
class EventBus {
    constructor() {
        this.events = new Map();
        this.middlewares = [];
    }

    // 添加中间件
    use(middleware) {
        this.middlewares.push(middleware);
    }

    // 订阅事件
    on(eventName, callback, options = {}) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, new Set());
        }

        const listener = {
            callback,
            once: options.once || false,
            context: options.context || null
        };

        this.events.get(eventName).add(listener);
        return () => this.off(eventName, callback);
    }

    // 取消订阅
    off(eventName, callback) {
        if (this.events.has(eventName)) {
            const listeners = this.events.get(eventName);
            listeners.forEach(listener => {
                if (listener.callback === callback) {
                    listeners.delete(listener);
                }
            });
        }
    }

    // 发布事件
    async emit(eventName, data = {}) {
        // 执行中间件
        let eventData = data;
        for (const middleware of this.middlewares) {
            eventData = await middleware(eventName, eventData);
        }

        if (this.events.has(eventName)) {
            const listeners = Array.from(this.events.get(eventName));

            for (const listener of listeners) {
                try {
                    await listener.callback.call(
                        listener.context,
                        { type: eventName, data: eventData }
                    );

                    // 一次性监听器
                    if (listener.once) {
                        this.events.get(eventName).delete(listener);
                    }
                } catch (error) {
                    console.error(`事件处理器错误 [${eventName}]:`, error);
                }
            }
        }
    }
}

// 事件中间件示例
const loggingMiddleware = async (eventName, data) => {
    console.log(`📡 事件: ${eventName}`, data);
    return data;
};

const errorHandlingMiddleware = async (eventName, data) => {
    if (eventName.includes('error')) {
        console.error('🚫 错误事件:', data);
    }
    return data;
};

// 使用事件总线
const eventBus = new EventBus();
eventBus.use(loggingMiddleware);
eventBus.use(errorHandlingMiddleware);

// 事件定义
const EVENTS = {
    // 数据事件
    DATA_LOADED: 'data:loaded',
    DATA_SAVED: 'data:saved',
    DATA_ERROR: 'data:error',

    // 课程事件
    COURSE_ADDED: 'course:added',
    COURSE_REMOVED: 'course:removed',
    COURSE_UPDATED: 'course:updated',
    COURSE_SUCCESS: 'course:success',
    COURSE_FAILED: 'course:failed',

    // 系统事件
    SYSTEM_STARTED: 'system:started',
    SYSTEM_STOPPED: 'system:stopped',
    SYSTEM_ERROR: 'system:error',
    SYSTEM_RESET: 'system:reset'
};
```

---

## 💾 数据持久化技术

### 存储抽象层

```javascript
// 存储接口定义
class IStorageProvider {
    async get(key) {
        throw new Error('Method must be implemented');
    }

    async set(key, value) {
        throw new Error('Method must be implemented');
    }

    async remove(key) {
        throw new Error('Method must be implemented');
    }

    async clear() {
        throw new Error('Method must be implemented');
    }

    async keys() {
        throw new Error('Method must be implemented');
    }
}

// GM存储提供者（油猴环境）
class GMStorageProvider extends IStorageProvider {
    async get(key, defaultValue = null) {
        try {
            const value = GM_getValue(key, defaultValue);
            return typeof value === 'string' ? JSON.parse(value) : value;
        } catch (error) {
            console.error(`GM存储读取失败 [${key}]:`, error);
            return defaultValue;
        }
    }

    async set(key, value) {
        try {
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            GM_setValue(key, serialized);
            return true;
        } catch (error) {
            console.error(`GM存储写入失败 [${key}]:`, error);
            return false;
        }
    }

    async remove(key) {
        try {
            GM_deleteValue(key);
            return true;
        } catch (error) {
            console.error(`GM存储删除失败 [${key}]:`, error);
            return false;
        }
    }

    async clear() {
        try {
            const keys = GM_listValues();
            keys.forEach(key => GM_deleteValue(key));
            return true;
        } catch (error) {
            console.error('GM存储清空失败:', error);
            return false;
        }
    }

    async keys() {
        try {
            return GM_listValues();
        } catch (error) {
            console.error('GM存储获取键列表失败:', error);
            return [];
        }
    }
}

// LocalStorage提供者（浏览器环境）
class LocalStorageProvider extends IStorageProvider {
    async get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            if (value === null) return defaultValue;
            return JSON.parse(value);
        } catch (error) {
            console.error(`LocalStorage读取失败 [${key}]:`, error);
            return defaultValue;
        }
    }

    async set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error(`LocalStorage写入失败 [${key}]:`, error);
            return false;
        }
    }

    async remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`LocalStorage删除失败 [${key}]:`, error);
            return false;
        }
    }

    async clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('LocalStorage清空失败:', error);
            return false;
        }
    }

    async keys() {
        try {
            return Object.keys(localStorage);
        } catch (error) {
            console.error('LocalStorage获取键列表失败:', error);
            return [];
        }
    }
}

// 存储工厂
class StorageFactory {
    static create() {
        if (typeof GM_setValue !== 'undefined' && typeof GM_getValue !== 'undefined') {
            console.log('使用GM存储提供者');
            return new GMStorageProvider();
        } else {
            console.log('使用LocalStorage提供者');
            return new LocalStorageProvider();
        }
    }
}

// 数据仓库模式
class DataRepository {
    constructor() {
        this.storage = StorageFactory.create();
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    }

    async getData(key) {
        // 检查缓存
        if (this.cache.has(key)) {
            const cached = this.cache.get(key);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        // 从存储获取
        const data = await this.storage.get(key);

        // 更新缓存
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });

        return data;
    }

    async setData(key, data) {
        const success = await this.storage.set(key, data);

        if (success) {
            // 更新缓存
            this.cache.set(key, {
                data,
                timestamp: Date.now()
            });
        }

        return success;
    }

    async invalidateCache(key = null) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }
}
```

---

## 📊 V1.0.4 语言特性统计

### 抢课助手项目使用的ES6+特性:

| 特性类别 | 具体特性 | V1.0.4 使用频率 | 代码示例 |
|---------|---------|------------------|----------|
| **变量声明** | const/let | ⭐⭐⭐⭐⭐ | `const CONFIG = {}` |
| **函数** | 箭头函数 | ⭐⭐⭐⭐⭐ | `() => console.log('')` |
| **字符串** | 模板字面量 | ⭐⭐⭐⭐⭐ | `` `${courseId}` `` |
| **对象** | 解构赋值 | ⭐⭐⭐⭐⭐ | `const { id, name } = course` |
| **数组** | map/filter/forEach | ⭐⭐⭐⭐⭐ | `courses.map(c => c.id)` |
| **异步** | Promise/async-await | ⭐⭐⭐⭐⭐ | `await fetch(url)` |
| **模块** | import/export | ⭐⭐⭐⭐⭐ | `import { CONFIG } from './config'` |
| **类** | class/extends | ⭐⭐⭐⭐ | `class LocalDataManager {}` |
| **事件** | CustomEvent | ⭐⭐⭐⭐ (新增) | `new CustomEvent('event', {detail})` |
| **存储** | GM_setValue/GM_getValue | ⭐⭐⭐ (新增) | `GM_setValue('key', value)` |

### V1.0.4 浏览器API使用统计:

| API类别 | 具体API | V1.0.4 使用场景 | 代码示例 |
|---------|---------|-----------------|----------|
| **网络请求** | fetch API | 课程注册请求 | `fetch(url, options)` |
| **事件处理** | CustomEvent API | 事件驱动通信 | `new CustomEvent('name', {detail})` |
| **数据存储** | GM_setValue/GM_getValue | 本地数据持久化 | `GM_setValue('key', JSON.stringify(data))` |
| **DOM操作** | createElement | 创建UI元素 | `document.createElement('div')` |
| **事件监听** | addEventListener | 用户交互 | `button.addEventListener('click')` |
| **定时器** | setInterval/setTimeout | 抢课轮询 | `setInterval(() => {}, 500)` |
| **控制台** | console.log | 调试输出 | `console.log('抢课开始')` |

---

## 🔮 V1.0.4 未来技术展望

### 计划采用的现代特性:

1. **Optional Chaining** (ES2020)
   ```javascript
   const result = response?.data?.courses?.[0];
   const courseName = courseDetails?.find(c => c.id === courseId)?.name;
   ```

2. **Nullish Coalescing** (ES2020)
   ```javascript
   const timeout = options.timeout ?? 5000;
   const courseName = course.name ?? '未命名课程';
   ```

3. **Private Class Fields** (ES2022)
   ```javascript
   class CourseManager {
       #courses = [];  // 私有字段
       #storage = null;

       #validateCourseId(courseId) {
           return /^\d{8,12}$/.test(courseId);
       }
   }
   ```

4. **Dynamic Import** (ES2020)
   ```javascript
   // 动态加载模块
   const module = await import('./advanced-features.js');
   ```

5. **WeakRef and FinalizationRegistry** (ES2021)
   ```javascript
   // 弱引用管理
   const courseCache = new WeakRef(courseManager);
   ```

---

*文档持续更新中...*
*最后更新时间: 2025年12月3日 (V1.0.4)*