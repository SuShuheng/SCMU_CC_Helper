# 📘 JavaScript语言特性说明

> 🔍 **抢课助手使用的JavaScript技术详解**

## 📋 目录

1. [语言版本概述](#语言版本概述)
2. [ES6+ 特性使用](#es6-特性使用)
3. [浏览器API使用](#浏览器api使用)
4. [代码架构模式](#代码架构模式)
5. [最佳实践](#最佳实践)

---

## 🌟 语言版本概述

### 主要语言
- **JavaScript ES6+** (ECMAScript 2015+)
- **运行环境**: 现代浏览器 (Chrome 60+, Firefox 55+, Safari 10+, Edge 79+)
- **模块系统**: ES6 Modules
- **编码规范**: ES6+ 语法规范

### 为什么选择ES6+？
1. **现代语法**: 更简洁、更易读
2. **强大功能**: 模块化、Promise、解构赋值等
3. **浏览器支持**: 主流浏览器全面支持
4. **开发效率**: 减少样板代码，提高开发效率

---

## 🚀 ES6+ 特性使用

### 1. 变量声明 (const/let)

#### 使用说明
使用 `const` 和 `let` 替代 `var`，提供块级作用域。

```javascript
// 配置对象 - 使用const声明常量
const CONFIG = {
    BASE_URL: 'https://xk.webvpn.scuec.edu.cn/xsxk',
    POLLING_INTERVAL: 500
};

// 课程数组 - 使用let声明可变数组
let courses = [];

// 循环变量 - 使用let避免变量提升
for (let i = 0; i < courses.length; i++) {
    console.log(courses[i]);
}
```

#### 优势
- **块级作用域**: 避免变量污染
- **常量保护**: const声明的变量不能重新赋值
- **暂时性死区**: 避免在声明前使用变量

### 2. 箭头函数 (Arrow Functions)

#### 使用说明
使用箭头函数简化函数语法，保持this指向。

```javascript
// 传统函数
const manager = new CourseRegistrationManager();

// 箭头函数 - 保持this指向
const startGrab = () => {
    this.courses.forEach(courseId => {
        this.trySelectCourse(courseId);
    });
};

// 事件监听器
document.addEventListener('click', (event) => {
    console.log('点击事件:', event.target);
});

// Promise链式调用
fetch(url)
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error(error));
```

#### 优势
- **简洁语法**: 减少function关键字和大括号
- **this绑定**: 自动绑定外层this
- **隐式返回**: 单行表达式自动返回

### 3. 模板字面量 (Template Literals)

#### 使用说明
使用反引号创建字符串，支持插值和多行。

```javascript
// 字符串插值
const courseId = '2024010101';
const url = `https://xk.webvpn.scuec.edu.cn/xsxk/loadData.xk?method=getGljxb&jxbid=${courseId}`;

// 多行字符串
const helpText = `
使用说明：
1. 在输入框中输入课程ID
2. 点击"开始抢课"按钮
3. 查看控制台日志了解进度
`;

// 动态消息
const logMessage = `⚠️ [${courseId}] 课程已满，但继续尝试`;
console.log(logMessage);
```

#### 优势
- **字符串插值**: ${} 语法嵌入变量
- **多行支持**: 自由换行不需要连接符
- **表达式支持**: 可以在${}中使用任何JavaScript表达式

### 4. 解构赋值 (Destructuring)

#### 使用说明
从数组或对象中提取值的简洁语法。

```javascript
// 对象解构
const { BASE_URL, ENDPOINTS } = API_CONFIG;
const { success, data } = await fetchApi();

// 数组解构
const [course1, course2, ...restCourses] = courses;

// 函数参数解构
function createButton({ text, color = 'blue', size = 'medium' }) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.color = color;
    button.style.fontSize = size;
    return button;
}
```

#### 优势
- **代码简洁**: 一次提取多个值
- **可读性强**: 清楚表明提取的属性
- **默认值**: 支持解构时的默认值

### 5. Promise 和 async/await

#### 使用说明
处理异步操作的现代方式。

```javascript
// Promise链式调用
function fetchExperimentalClasses(courseId) {
    return fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.GET_EXPERIMENTAL_CLASS}${courseId}`)
        .then(response => response.json())
        .then(data => {
            if (!Array.isArray(data)) {
                console.warn('实验班数据格式异常');
                return [];
            }
            return data.map(item => item.jxbid).filter(Boolean);
        })
        .catch(error => {
            console.error('获取实验班失败:', error);
            return [];
        });
}

// async/await 语法
async function initialize() {
    console.log('开始加载课程实验班信息...');

    const tasks = this.courses.map(jxbid =>
        this.fetchExperimentalClasses(jxbid).then(glList => {
            this.glJxbidMap[jxbid] = glList;
            this.statusMap[jxbid].glReady = true;
        })
    );

    try {
        await Promise.all(tasks);
        console.log('✅ 实验班加载完毕，开始抢课！');
        this.startLoop();
    } catch (error) {
        console.error('初始化失败:', error);
    }
}

// 错误处理
async function safeGrabCourse(courseId) {
    try {
        const result = await this.trySelectCourse(courseId);
        return result;
    } catch (error) {
        console.error(`抢课失败 [${courseId}]:`, error);
        throw error;
    }
}
```

#### 优势
- **异步友好**: 更直观的异步代码写法
- **错误处理**: 统一的try/catch错误处理
- **链式调用**: Promise支持链式操作

### 6. 模块系统 (ES6 Modules)

#### 使用说明
使用import/export实现模块化。

```javascript
// config.js - 配置模块
export const API_CONFIG = {
    BASE_URL: 'https://xk.webvpn.scuec.edu.cn/xsxk',
    ENDPOINTS: {
        GET_EXPERIMENTAL_CLASS: '/loadData.xk?method=getGljxb&jxbid=',
        COURSE_REGISTRATION: '/xkOper.xk?method=handleKzyxk&jxbid='
    }
};

export default CONFIG;

// course-registration.js - 核心模块
import { CONFIG } from './config.js';

export class CourseRegistrationManager {
    // 类实现
}

export const courseManager = new CourseRegistrationManager();
export default courseManager;

// 主文件 - 导入使用
import courseManager from './course-registration.js';
import uiController from './ui-controller.js';
import { CONFIG } from './config.js';
```

#### 优势
- **模块化**: 代码分离，职责清晰
- **依赖管理**: 明确的导入导出关系
- **tree-shaking**: 打包工具可移除未使用代码

### 7. 数组方法增强

#### 使用说明
使用现代数组方法简化操作。

```javascript
// map - 转换数组
const courseNames = courses.map(course => course.name);
const experimentalIds = experimentalClasses.map(item => item.jxbid);

// filter - 过滤数组
const validCourses = courses.filter(course => course.id && course.name);
const availableClasses = experimentalClasses.filter(cls => cls.available);

// forEach - 遍历数组
courses.forEach(courseId => {
    this.trySelectCourse(courseId);
});

// some - 检查是否有满足条件的元素
const isFull = CONFIG.GRAB.COURSE_FULL_KEYWORDS.some(keyword => html.includes(keyword));

// includes - 检查包含关系
if (courses.includes(targetCourseId)) {
    console.log('课程已在抢课列表中');
}
```

#### 优势
- **函数式编程**: 链式调用，代码简洁
- **可读性强**: 方法名称直观表达意图
- **性能优化**: 原生方法，执行效率高

### 8. 对象方法增强

#### 使用说明
使用现代对象语法简化操作。

```javascript
// 对象属性简写
const id = '2024010101';
const name = '高等数学';
const course = { id, name };  // 等同于 { id: id, name: name }

// 对象方法简写
const courseManager = {
    courses: [],

    addCourse(courseId) {
        this.courses.push(courseId);
    },

    startLoop() {
        console.log('开始抢课');
    }
};

// 对象解构和默认值
function displayCourseInfo({ id, name = '未知课程', credits = 0 }) {
    console.log(`课程: ${name} (ID: ${id}, 学分: ${credits})`);
}

// 扩展运算符
const defaultConfig = { timeout: 5000, retries: 3 };
const customConfig = { timeout: 10000 };
const finalConfig = { ...defaultConfig, ...customConfig };
```

---

## 🌐 浏览器API使用

### 1. Fetch API

#### 使用说明
现代的网络请求API，替代XMLHttpRequest。

```javascript
// 基本GET请求
async function fetchExperimentalClasses(courseId) {
    const url = `${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.GET_EXPERIMENTAL_CLASS}${courseId}`;

    const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'accept': '*/*',
            'x-requested-with': 'XMLHttpRequest'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
}

// 错误处理和重试
async function safeFetch(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            console.log(`请求失败，第 ${i + 1} 次重试...`);
        }
    }
}
```

### 2. DOM 操作 API

#### 使用说明
操作网页元素的现代API。

```javascript
// 创建元素
function createControlPanel() {
    const panel = document.createElement('div');
    panel.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        padding: 20px;
        background-color: #f1f1f1;
        border-radius: 10px;
    `;

    return panel;
}

// 事件监听
function setupEventListeners() {
    // 按钮点击事件
    startButton.addEventListener('click', async () => {
        await courseManager.initialize();
        startButton.disabled = true;
    });

    // 输入框输入事件
    courseInput.addEventListener('input', (event) => {
        const value = event.target.value.trim();
        if (value) {
            courseManager.addCourse(value);
        }
    });

    // 拖拽事件
    panel.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        offsetX = e.clientX - panel.offsetLeft;
        offsetY = e.clientY - panel.offsetTop;
    });
}

// 查询元素
const courseContainer = document.getElementById('course-container');
const allButtons = document.querySelectorAll('button');
const firstInput = document.querySelector('input[type="text"]');
```

### 3. 定时器 API

#### 使用说明
设置定时任务的API。

```javascript
// setInterval - 定时重复执行
function startLoop() {
    if (this.intervalId) {
        console.warn("定时器已启动！");
        return;
    }

    this.intervalId = setInterval(() => {
        this.courses.forEach(jxbid => {
            this.trySelectCourse(jxbid);
        });
    }, CONFIG.GRAB.POLLING_INTERVAL);  // 500ms间隔
}

// clearInterval - 停止定时器
function stopLoop() {
    if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
        console.log("定时器已停止！");
    }
}

// setTimeout - 延时执行
function showNotification(message, type = 'info') {
    const notification = createNotificationElement(message, type);
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
```

### 4. Console API

#### 使用说明
调试和日志输出API。

```javascript
// 不同级别的日志
console.log('普通日志信息');
console.warn('警告信息');
console.error('错误信息');
console.info('信息提示');

// 格式化输出
const courseId = '2024010101';
console.log(`正在抢课: ${courseId}`);

// 对象输出
const status = courseManager.getStatus();
console.log('抢课状态:', status);
console.table(status.courses);  // 表格形式输出

// 分组输出
console.group('课程抢课详情');
courses.forEach(course => {
    console.log(`- ${course.id}: ${course.success ? '成功' : '进行中'}`);
});
console.groupEnd();
```

---

## 🏗️ 代码架构模式

### 1. 模块模式 (Module Pattern)

#### 使用说明
使用IIFE和ES6模块实现封装。

```javascript
// 传统IIFE模块模式
(function() {
    'use strict';

    const privateVariable = '私有变量';

    function privateFunction() {
        console.log('私有函数');
    }

    // 暴露公共接口
    window.CourseHelper = {
        publicMethod: function() {
            privateFunction();
            return privateVariable;
        }
    };
})();

// ES6模块模式
export class CourseRegistrationManager {
    #privateField = '私有字段';  // 私有字段（ES2022+）

    #privateMethod() {
        console.log('私有方法');
    }

    publicMethod() {
        this.#privateMethod();
        return this.#privateField;
    }
}
```

### 2. 观察者模式 (Observer Pattern)

#### 使用说明
使用事件系统实现松耦合。

```javascript
// 事件发布者
class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }

    emit(eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => callback(data));
        }
    }
}

// 使用示例
const eventBus = new EventEmitter();

// 监听抢课成功事件
eventBus.on('course:success', (courseData) => {
    console.log('抢课成功:', courseData);
    saveToHistory(courseData);
});

// 触发抢课成功事件
eventBus.emit('course:success', { courseId: '2024010101', timestamp: Date.now() });
```

### 3. 策略模式 (Strategy Pattern)

#### 使用说明
根据不同情况使用不同的处理策略。

```javascript
// 抢课策略
const grabStrategies = {
    // 普通课程抢课策略
    normal: {
        buildUrl: (courseId) => `${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.COURSE_REGISTRATION}${courseId}`,
        handleResponse: (data) => data.success
    },

    // 实验班抢课策略
    experimental: {
        buildUrl: (courseId, experimentalId) =>
            `${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.COURSE_REGISTRATION}${courseId}&glJxbid=${experimentalId}`,
        handleResponse: (data) => data.success
    }
};

// 使用策略
function trySelectCourse(courseId, strategy = 'normal') {
    const strategyConfig = grabStrategies[strategy];
    const url = strategyConfig.buildUrl(courseId);

    return fetch(url).then(response => response.json())
        .then(data => strategyConfig.handleResponse(data));
}
```

---

## ✨ 最佳实践

### 1. 代码质量

#### 变量命名
```javascript
// ✅ 好的命名 - 清晰表达意图
const coursesWaitingForGrab = [];
const experimentalClassIds = [];
const registrationStatusMap = {};

// ❌ 避免的命名 - 含义模糊
const arr = [];
const temp = [];
const map = {};
```

#### 函数设计
```javascript
// ✅ 单一职责函数
function validateCourseId(courseId) {
    return /^\d{10}$/.test(courseId);
}

function addCourseToGrabList(courseId) {
    if (!validateCourseId(courseId)) {
        throw new Error('无效的课程ID格式');
    }
    this.courses.push(courseId);
}

// ❌ 职责混合的函数
function addCourse(courseId) {
    if (!/^\d{10}$/.test(courseId)) {  // 验证逻辑
        throw new Error('无效ID');
    }
    this.courses.push(courseId);       // 添加逻辑
    console.log('已添加课程');         // 日志逻辑
    this.updateUI();                   // UI更新逻辑
}
```

### 2. 错误处理

#### 统一错误处理
```javascript
class CourseGrabError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'CourseGrabError';
        this.code = code;
        this.details = details;
    }
}

// 使用自定义错误
async function trySelectCourse(courseId) {
    try {
        const response = await fetch(buildUrl(courseId));

        if (!response.ok) {
            throw new CourseGrabError(
                '网络请求失败',
                'NETWORK_ERROR',
                { status: response.status, courseId }
            );
        }

        const data = await response.json();
        return data;

    } catch (error) {
        if (error instanceof CourseGrabError) {
            // 处理自定义错误
            console.error(`抢课错误 [${error.code}]: ${error.message}`);
        } else {
            // 处理其他错误
            console.error('未知错误:', error);
        }
        throw error;
    }
}
```

### 3. 性能优化

#### 防抖和节流
```javascript
// 防抖函数 - 避免频繁操作
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

// 节流函数 - 限制执行频率
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 使用示例
const searchCourses = debounce((keyword) => {
    // 搜索课程逻辑
}, 300);

const updateStatus = throttle(() => {
    // 更新状态显示
}, 1000);
```

### 4. 代码注释

#### JSDoc 注释规范
```javascript
/**
 * 获取课程的实验班信息
 * @param {string} courseId - 课程ID
 * @param {Object} [options] - 可选参数
 * @param {number} [options.timeout=5000] - 请求超时时间(毫秒)
 * @returns {Promise<string[]>} 实验班ID列表
 * @throws {CourseGrabError} 当网络请求失败时抛出错误
 * @example
 * // 基本使用
 * const classes = await fetchExperimentalClasses('2024010101');
 *
 * // 带超时设置
 * const classes = await fetchExperimentalClasses('2024010101', { timeout: 10000 });
 */
async function fetchExperimentalClasses(courseId, options = {}) {
    // 实现代码...
}
```

---

## 📊 语言特性统计

### 抢课助手项目使用的ES6+特性:

| 特性类别 | 具体特性 | 使用频率 | 代码示例 |
|---------|---------|---------|----------|
| **变量声明** | const/let | ⭐⭐⭐⭐⭐ | `const CONFIG = {}` |
| **函数** | 箭头函数 | ⭐⭐⭐⭐⭐ | `() => console.log('')` |
| **字符串** | 模板字面量 | ⭐⭐⭐⭐⭐ | `` `${courseId}` `` |
| **对象** | 解构赋值 | ⭐⭐⭐⭐ | `const { id, name } = course` |
| **数组** | map/filter/forEach | ⭐⭐⭐⭐ | `courses.map(c => c.id)` |
| **异步** | Promise/async-await | ⭐⭐⭐⭐⭐ | `await fetch(url)` |
| **模块** | import/export | ⭐⭐⭐⭐ | `import { CONFIG } from './config'` |
| **类** | class/extends | ⭐⭐⭐ | `class CourseManager {}` |
| **对象** | 属性简写 | ⭐⭐⭐ | `const course = { id, name }` |
| **扩展运算符** | ... | ⭐⭐ | `const newConfig = { ...default, ...custom }` |

### 浏览器API使用统计:

| API类别 | 具体API | 使用场景 | 代码示例 |
|---------|---------|----------|----------|
| **网络请求** | fetch API | 课程注册请求 | `fetch(url, options)` |
| **DOM操作** | createElement | 创建UI元素 | `document.createElement('div')` |
| **事件处理** | addEventListener | 用户交互 | `button.addEventListener('click')` |
| **定时器** | setInterval/setTimeout | 抢课轮询 | `setInterval(() => {}, 500)` |
| **控制台** | console.log | 调试输出 | `console.log('抢课开始')` |
| **本地存储** | localStorage | 保存历史记录 | `localStorage.setItem('key', 'value')` |

---

## 🔮 未来技术展望

### 可能采用的现代特性:

1. **Private Class Fields** (ES2022)
   ```javascript
   class CourseManager {
       #courses = [];  // 私有字段
   }
   ```

2. **Optional Chaining** (ES2020)
   ```javascript
   const result = response?.data?.courses?.[0];
   ```

3. **Nullish Coalescing** (ES2020)
   ```javascript
   const timeout = options.timeout ?? 5000;
   ```

4. **Dynamic Import** (ES2020)
   ```javascript
   const module = await import('./module.js');
   ```

---

*文档持续更新中...*