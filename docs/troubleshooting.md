# 🔧 故障排除指南 (V1.1.0)

> 🛠️ **问题解决方案**
> 这份文档专门解决抢课助手 V1.1.0 版本的常见问题和故障，帮助用户快速解决问题。
>
> 🎓 **V1.1.0 新增**：7种课程类型相关问题、版本功能对等问题。

## 📋 目录

1. [V1.1.0 特有问题](#v110-特有问题)
2. [V1.0.4 遗留问题](#v104-遗留问题)
3. [安装和运行问题](#安装和运行问题)
4. [数据持久化问题](#数据持久化问题)
5. [UI界面问题](#ui界面问题)
6. [选课功能问题](#选课功能问题)
7. [网络和API问题](#网络和api问题)
8. [浏览器兼容性问题](#浏览器兼容性问题)
9. [性能问题](#性能问题)
10. [调试技巧](#调试技巧)

---

## 🆕 V1.1.0 特有问题

### 🎓 课程类型相关问题

#### 问题1：课程类型选择框不显示
**症状**：
- 看不到课程类型下拉选择框
- 界面与V1.0.4版本相同
- 无法选择课程类型

**解决方案**：
```javascript
// 1. 确认使用的是V1.1.0版本
console.log('版本检查:', courseManager.localDataManager.DATA_VERSION);

// 2. 检查课程类型配置
console.log('可用课程类型:', CONFIG.COURSE_TYPES);

// 3. 重新初始化UI
uiController.container?.remove();
uiController.initialize();

// 4. 清除浏览器缓存后重试
```

**预防措施**：
- 确保下载了V1.1.0版本的代码
- 清除浏览器缓存
- 检查文件修改时间

#### 问题2：选课失败率突然增高
**症状**：
- V1.1.0版本选课成功率明显下降
- 控制台显示"未获取到教学班，非法操作"
- 所有课程都无法选课成功

**解决方案**：
```javascript
// 1. 检查课程类型选择是否正确
courseManager.courses.forEach(courseId => {
    const type = courseManager.courseTypeMap[courseId];
    const typeInfo = CONFIG.COURSE_TYPES[type];
    console.log(`课程 ${courseId} 类型: ${type} (${typeInfo?.name})`);
});

// 2. 尝试使用推荐选课类型
courseManager.courseTypeMap[courseId] = 'TJXK'; // 推荐选课
courseManager.saveCurrentData();

// 3. 重新初始化选课
await courseManager.initialize();
```

**最佳实践**：
- 新手推荐使用"方案外选课" (KZYXK)
- 专业必修课尝试"推荐选课" (TJXK)
- 体育课程使用"体育选择课" (TYKXK)

#### 问题3：课程类型迁移问题
**症状**：
- 从V1.0.4升级后课程类型显示不正确
- 所有课程都被设置为同一种类型
- 课程类型下拉框显示异常

**解决方案**：
```javascript
// 1. 检查数据版本
const metadata = JSON.parse(GM_getValue('scmu_metadata', '{}'));
console.log('当前数据版本:', metadata.version);

// 2. 手动设置课程类型（如果需要）
courseManager.courses.forEach(courseId => {
    // 根据课程ID特征推断类型
    if (courseId.startsWith('PE')) {
        courseManager.courseTypeMap[courseId] = 'TYKXK';
    } else if (courseId.includes('GEN')) {
        courseManager.courseTypeMap[courseId] = 'QXGXK';
    } else {
        courseManager.courseTypeMap[courseId] = 'KZYXK'; // 默认类型
    }
});

// 3. 保存更新后的数据
courseManager.saveCurrentData();

// 4. 刷新页面验证
location.reload();
```

### 🔄 版本功能对等问题

#### 问题4：单文件版本功能缺失
**症状**：
- 单文件版本缺少课程类型选择
- 功能与油猴版本不一致
- 界面显示有差异

**解决方案**：
```javascript
// 1. 确认使用了正确的单文件版本
// 检查文件中是否包含以下内容：
// - 7种课程类型配置
// - CourseTypeManager类
// - 作者信息显示功能

// 2. 验证课程类型功能
console.log('课程类型数量:', Object.keys(CONFIG.COURSE_TYPES).length); // 应该是7

// 3. 检查作者信息
console.log('作者信息:', window.SCMU_AUTHOR_INFO); // V1.1.0新增
```

#### 问题5：作者信息显示异常
**症状**：
- 看不到版权信息
- 界面底部没有作者链接
- 控制台没有启动版权信息

**解决方案**：
```javascript
// 1. 检查控制台版权信息
// 应该显示：
// 🎓 中南民族大学自动选课助手 V1.1.0
// 👨‍💻 作者: SuShuHeng (https://github.com/SuShuHeng)
// 🔗 项目地址: https://github.com/SuShuHeng/SCMU_CC_Helper

// 2. 检查作者信息元素
const authorFooter = document.querySelector('.scmu-author-footer');
console.log('作者信息元素:', authorFooter);

// 3. 手动创建作者信息（如果缺失）
if (!authorFooter) {
    uiController.createAuthorFooter();
}
```

### 💾 数据版本升级问题

#### 问题6：数据版本不兼容
**症状**：
- V1.1.0无法读取V1.0.4的数据
- 控制台显示数据解析错误
- 课程信息无法恢复

**解决方案**：
```javascript
// 1. 检查数据版本
try {
    const metadata = JSON.parse(GM_getValue('scmu_metadata', '{}'));
    console.log('数据版本:', metadata.version);

    if (metadata.version === '1.0.0') {
        console.log('检测到旧版本数据，正在自动迁移...');
        // V1.1.0会自动处理迁移
    }
} catch (error) {
    console.error('数据版本检查失败:', error);
}

// 2. 手动迁移（如果自动迁移失败）
const oldCourses = GM_getValue('scmu_courses', '[]');
const coursesData = JSON.parse(oldCourses);

// 转换为V2.0.0格式
const v2Data = {
    courses: coursesData.map(course => ({
        ...course,
        courseType: course.courseType || 'KZYXK' // 设置默认类型
    })),
    experimentalClasses: JSON.parse(GM_getValue('scmu_experimental_classes', '{}')),
    metadata: {
        version: '2.0.0',
        lastSaved: Date.now(),
        sessionCount: 1
    }
};

// 保存新格式数据
GM_setValue('scmu_courses', JSON.stringify(v2Data.courses));
GM_setValue('scmu_metadata', JSON.stringify(v2Data.metadata));
```

---

## 🔧 V1.0.4 遗留问题

### 💾 数据持久化相关问题

#### 问题1：页面刷新后课程信息丢失
**症状**：
- 添加课程后刷新页面，课程信息消失
- 需要重新输入所有课程ID
- 选课状态无法保存

**解决方案**：
```javascript
// 1. 检查存储功能是否可用
console.log('存储功能状态:', courseManager.localDataManager.storageAvailable);

// 2. 手动检查存储数据
const savedData = courseManager.localDataManager.loadCoursesData();
console.log('保存的数据:', savedData);

// 3. 强制保存当前数据
courseManager.saveCurrentData();

// 4. 重新加载数据
location.reload();
```

**预防措施**：
- 确保使用 V1.0.4 最新版本
- 检查浏览器是否支持本地存储
- 避免使用隐私/无痕模式

#### 问题2：油猴脚本存储失败
**症状**：
- 油猴脚本无法保存课程数据
- 刷新页面后数据丢失
- 控制台显示存储相关错误

**解决方案**：
```javascript
// 1. 检查油猴扩展设置
// - 确保脚本有存储权限
// - 检查脚本作用域是否正确

// 2. 在油猴脚本中添加调试代码
console.log('GM_setValue 可用:', typeof GM_setValue !== 'undefined');
console.log('GM_getValue 可用:', typeof GM_getValue !== 'undefined');

// 3. 手动测试存储功能
GM_setValue('test_key', 'test_value');
console.log('测试存储:', GM_getValue('test_key'));
```

### 🎨 UI界面相关问题

#### 问题3：竞态条件导致的UI问题
**症状**：
- 控制面板显示为空
- 课程数据加载后UI不更新
- 控制台显示"容器为null"警告

**解决方案**：
```javascript
// V1.0.4 已修复此问题，但如仍有问题可尝试：

// 1. 强制重新初始化UI
if (!uiController.container) {
    uiController.createControlPanel();
    uiController.restoreUIFromStorage(
        courseManager.courses,
        courseManager.localDataManager.loadCoursesData()?.courseDetails || [],
        courseManager.statusMap
    );
}

// 2. 手动触发数据恢复
const savedData = courseManager.localDataManager.loadCoursesData();
if (savedData) {
    uiController.restoreUIFromStorage(
        savedData.courses,
        savedData.courseDetails,
        courseManager.statusMap
    );
}
```

#### 问题4：三态UI切换问题
**症状**：
- UI状态切换不正常
- 悬浮按钮无法展开
- 迷你状态面板不显示

**解决方案**：
```javascript
// 1. 手动切换UI状态
uiController.transitionToState('full_panel');  // 完整面板
uiController.transitionToState('floating_button');  // 悬浮按钮
uiController.transitionToState('minimized_status');  // 迷你状态

// 2. 检查当前状态
console.log('当前UI状态:', uiController.currentState);

// 3. 重新初始化UI
uiController.destroy();
uiController.initialize();
```

---

## 🚀 安装和运行问题

### 问题5：模块导入错误
**症状**：
```
Uncaught SyntaxError: Cannot use import statement outside a module
```

**解决方案**：
```javascript
// 使用单文件版本而不是模块化版本
// 1. 使用 dist/course-helper.js
// 2. 或者使用 dist/tampermonkey-course-helper.js

// 错误示例：
import { CONFIG } from './config.js';  // ❌ 在控制台中不支持

// 正确示例：
// 复制 dist/course-helper.js 的完整内容，包含所有代码
```

### 问题6：代码执行后无反应
**症状**：
- 粘贴代码后没有任何反应
- 控制台没有显示启动信息
- 页面上没有出现控制面板

**解决方案**：
```javascript
// 1. 检查代码是否完整复制
console.log('代码长度检查:', code.length);  // 应该超过10000字符

// 2. 检查语法错误
try {
    eval(code);  // 测试代码语法
} catch (error) {
    console.error('语法错误:', error);
}

// 3. 重新复制代码
// 确保从 dist/course-helper.js 复制，而不是 src/ 目录的文件
```

### 问题7：油猴脚本不自动运行
**症状**：
- 油猴脚本已启用但不会自动运行
- 需要手动执行才能工作

**解决方案**：
```javascript
// 1. 检查 @match 规则
// @match        https://xk.webvpn.scuec.edu.cn/xsxk/*
// @match        https://xk.webvpn.scuec.edu.cn/xsxk

// 2. 检查脚本元数据
// ==UserScript==
// @name         中南民族大学自动选课助手
// @namespace    http://tampermonkey.net/
// @version      1.0.4
// @description  专为中南民族大学学生设计的自动化课程注册助手
// @author       SuShuHeng
// @match        https://xk.webvpn.scuec.edu.cn/xsxk*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// ==/UserScript==

// 3. 检查脚本权限
// 确保 @grant 包含需要的权限
```

---

## 💾 数据持久化问题

### 问题8：本地存储空间不足
**症状**：
- 数据保存失败
- 控制台显示存储配额错误
- 旧数据被自动清除

**解决方案**：
```javascript
// 1. 检查存储使用情况
const estimate = navigator.storage.estimate;
if (estimate) {
    estimate().then(usage => {
        console.log('存储使用情况:', usage);
        console.log('已使用:', usage.usage, '字节');
        console.log('配额:', usage.quota, '字节');
    });
}

// 2. 清理不必要的存储
// 在油猴脚本中：
GM_listValues().forEach(key => {
    if (key.startsWith('scmu_')) {
        console.log('保存的键:', key, GM_getValue(key));
    }
});

// 3. 清理所有数据
if (confirm('确定要清理所有存储数据吗？')) {
    courseManager.localDataManager.clearAllData();
    console.log('所有数据已清理');
}
```

### 问题9：数据版本兼容性问题
**症状**：
- 旧版本数据无法加载
- 数据格式不兼容错误
- 部分功能异常

**解决方案**：
```javascript
// 1. 检查数据版本
const metadata = JSON.parse(localStorage.getItem('scmu_metadata') || '{}');
console.log('数据版本:', metadata.version);

// 2. 清理旧版本数据
if (metadata.version !== '1.0.0') {
    console.warn('检测到旧版本数据，建议清理');
    courseManager.localDataManager.clearAllData();
}

// 3. 重新添加课程
courseManager.addCourse('12345678');  // 重新添加你的课程
```

---

## 🎨 UI界面问题

### 问题10：控制面板显示异常
**症状**：
- 控制面板样式错误
- 按钮无法点击
- 面板位置异常

**解决方案**：
```javascript
// 1. 检查CSS冲突
// 检查页面是否有全局CSS影响

// 2. 重置UI状态
uiController.destroy();
uiController.initialize();

// 3. 手动调整面板位置
const panel = document.getElementById('course-registration-panel');
if (panel) {
    panel.style.top = '20px';
    panel.style.left = '20px';
    panel.style.zIndex = '9999';
}
```

### 问题11：滚动容器问题
**症状**：
- 课程列表不滚动
- 滚动条显示异常
- 容器高度不正确

**解决方案**：
```javascript
// 1. 手动更新滚动容器
uiController.updateScrollableContainer();

// 2. 检查滚动配置
console.log('滚动配置:', CONFIG.UI.SCROLLABLE_CONTAINER);

// 3. 强制启用滚动
const container = document.getElementById('course-container');
if (container) {
    container.style.maxHeight = '250px';
    container.style.overflowY = 'auto';
}
```

---

## 🎯 选课功能问题

### 问题12：选课不成功
**症状**：
- 长时间选课但无成功记录
- 所有课程显示失败
- 控制台显示请求错误

**解决方案**：
```javascript
// 1. 检查网络连接
fetch('https://xk.webvpn.scuec.edu.cn/xsxk/')
    .then(response => console.log('网络连接正常:', response.status))
    .catch(error => console.error('网络连接失败:', error));

// 2. 检查登录状态
// 确保已正确登录选课系统

// 3. 检查课程ID格式
courseManager.courses.forEach(courseId => {
    console.log('课程ID:', courseId, '格式正确:', /^[A-Za-z0-9_-]+$/.test(courseId));
});

// 4. 手动测试API
const testUrl = `${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.COURSE_REGISTRATION}12345678`;
console.log('测试API URL:', testUrl);
```

### 问题13：实验班获取失败
**症状**：
- 实验班信息加载失败
- 课程状态一直显示"加载实验班中"
- 控制台显示实验班API错误

**解决方案**：
```javascript
// 1. 手动获取实验班
courseManager.courses.forEach(async (courseId) => {
    try {
        const expClasses = await courseManager.fetchExperimentalClasses(courseId);
        console.log(`课程 ${courseId} 实验班:`, expClasses);
    } catch (error) {
        console.error(`获取课程 ${courseId} 实验班失败:`, error);
    }
});

// 2. 检查实验班API
const apiTestUrl = `${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.GET_EXPERIMENTAL_CLASS}12345678`;
console.log('实验班API测试:', apiTestUrl);
```

---

## 🌐 网络和API问题

### 问题14：API请求失败
**症状**：
- 所有API请求都失败
- 控制台显示网络错误
- 无法获取课程信息

**解决方案**：
```javascript
// 1. 检查API基础URL
console.log('API基础URL:', CONFIG.API.BASE_URL);

// 2. 测试网络连接
fetch(CONFIG.API.BASE_URL, {
    method: 'HEAD',
    credentials: 'include'
})
.then(response => console.log('API服务可达:', response.ok))
.catch(error => console.error('API服务不可达:', error));

// 3. 检查认证状态
// 确保在选课系统中已登录

// 4. 尝试直接访问选课系统
window.open(CONFIG.API.BASE_URL, '_blank');
```

### 问题15：CORS跨域问题
**症状**：
- 控制台显示CORS错误
- API请求被浏览器阻止

**解决方案**：
```javascript
// 1. 确保在选课系统页面运行脚本
// 不要在其他网站运行

// 2. 检查请求头配置
console.log('HTTP请求头:', CONFIG.HTTP.HEADERS);

// 3. 确保credentials设置正确
fetch(url, {
    credentials: 'include',  // 必须包含
    headers: CONFIG.HTTP.HEADERS
});
```

---

## 🌍 浏览器兼容性问题

### 问题16：Chrome浏览器问题
**症状**：
- Chrome特定功能不工作
- 版本兼容性问题

**解决方案**：
```javascript
// 1. 检查Chrome版本
console.log('Chrome版本:', navigator.userAgent);

// 2. 检查功能支持
console.log('Fetch API支持:', typeof fetch !== 'undefined');
console.log('Promise支持:', typeof Promise !== 'undefined');
console.log('CustomEvent支持:', typeof CustomEvent !== 'undefined');

// 3. 更新Chrome版本到最新
```

### 问题17：Firefox浏览器问题
**症状**：
- Firefox下样式异常
- 某些功能不工作

**解决方案**：
```javascript
// 1. 添加Firefox特定样式
const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
if (isFirefox) {
    // Firefox特定样式调整
    document.documentElement.style.setProperty('--firefox-fix', '1');
}

// 2. 检查Firefox版本
console.log('Firefox版本:', navigator.userAgent);
```

---

## ⚡ 性能问题

### 问题18：内存泄漏
**症状**：
- 长时间运行后页面变慢
- 内存使用持续增长

**解决方案**：
```javascript
// 1. 检查定时器清理
console.log('活动定时器数量:',
    document.querySelectorAll('*').length +
    (uiController.statusUpdateInterval ? 1 : 0)
);

// 2. 手动清理资源
uiController.destroy();
courseManager.stopLoop();

// 3. 重新初始化
uiController.initialize();
```

### 问题19：CPU占用过高
**症状**：
- 电脑风扇转速增加
- 页面响应缓慢

**解决方案**：
```javascript
// 1. 降低轮询频率
CONFIG.GRAB.POLLING_INTERVAL = 1000;  // 改为1秒

// 2. 检查课程数量
console.log('课程数量:', courseManager.courses.length);
if (courseManager.courses.length > 10) {
    console.warn('课程数量过多，建议减少');
}

// 3. 暂停不必要的功能
uiController.stopMinimizedStatusUpdates();
```

---

## 🔍 调试技巧

### 通用调试方法

#### 1. 启用详细日志
```javascript
// 启用所有日志
CONFIG.LOG.ENABLE_VERBOSE_LOGGING = true;
CONFIG.DEV.DEBUG_MODE = true;
CONFIG.DEV.SHOW_DEBUG_INFO = true;
```

#### 2. 监控所有事件
```javascript
// 监控所有自定义事件
const eventTypes = [
    'storage:dataLoaded',
    'course:success',
    'courses:started',
    'courses:stopped',
    'selection:auto-stopped'
];

eventTypes.forEach(eventType => {
    document.addEventListener(eventType, (event) => {
        console.log(`📡 事件触发: ${eventType}`, event.detail);
    });
});
```

#### 3. 状态监控
```javascript
// 定期输出系统状态
setInterval(() => {
    const status = courseManager.getStatus();
    const storageInfo = courseManager.localDataManager.getStorageInfo();

    console.log('📊 系统状态:', {
        courses: status.totalCourses,
        success: status.successCount,
        running: status.isRunning,
        storage: storageInfo.available,
        uiState: uiController.currentState
    });
}, 5000);
```

#### 4. 错误监控
```javascript
// 全局错误监控
window.addEventListener('error', (event) => {
    console.error('🚫 全局错误:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🚫 未处理的Promise拒绝:', event.reason);
});
```

### 问题诊断清单

#### ✅ 基础检查
- [ ] 使用的是 V1.0.4 版本
- [ ] 在正确的选课系统页面运行
- [ ] 已正确登录选课系统
- [ ] 网络连接正常

#### ✅ 代码检查
- [ ] 代码复制完整，没有截断
- [ ] 没有语法错误
- [ ] 浏览器控制台没有错误

#### ✅ 功能检查
- [ ] 课程ID格式正确（字母、数字、下划线、连字符组合）
- [ ] 课程存在且可选
- [ ] 存储功能可用

#### ✅ 环境检查
- [ ] 浏览器版本符合要求
- [ ] 没有广告拦截器干扰
- [ ] JavaScript已启用

---

## 🆘 获取帮助

### 自助解决步骤

1. **查看控制台错误信息**
   ```javascript
   // 打开控制台查看详细错误
   console.log('当前状态检查:');
   console.log('课程管理器:', !!courseManager);
   console.log('UI控制器:', !!uiController);
   console.log('存储功能:', courseManager?.localDataManager?.storageAvailable);
   ```

2. **重置到初始状态**
   ```javascript
   // 完全重置
   courseManager.reset();
   uiController.destroy();
   localStorage.clear();
   location.reload();
   ```

3. **使用最小版本测试**
   ```javascript
   // 只使用核心功能
   const simpleManager = new CourseRegistrationManager();
   simpleManager.addCourse('12345678');
   console.log('简化测试状态:', simpleManager.getStatus());
   ```

### 联系支持

如果问题仍未解决：

1. **收集信息**：
   - 浏览器版本和类型
   - 错误截图
   - 控制台错误信息
   - 操作步骤描述

2. **提交Issue**：
   - 访问项目 GitHub 页面
   - 创建新的 Issue
   - 提供详细信息

3. **寻求社区帮助**：
   - 查看已有 Issues
   - 参与讨论
   - 分享解决方案

---

## 📞 紧急故障处理

### 选课过程中脚本崩溃

```javascript
// 紧急恢复代码
console.log('🚨 紧急恢复模式启动');

// 1. 尝试恢复数据
try {
    const savedData = courseManager.localDataManager.loadCoursesData();
    if (savedData && savedData.courses.length > 0) {
        console.log('📋 恢复课程:', savedData.courses);
        savedData.courses.forEach(courseId => {
            courseManager.addCourse(courseId);
        });
    }
} catch (error) {
    console.error('恢复失败:', error);
}

// 2. 重新初始化UI
try {
    uiController.destroy();
    uiController.initialize();
    console.log('🎨 UI已重新初始化');
} catch (error) {
    console.error('UI重初始化失败:', error);
}

// 3. 检查系统状态
console.log('📊 系统状态报告:');
console.log('- 课程数量:', courseManager.courses.length);
console.log('- 是否运行:', !!courseManager.intervalId);
console.log('- UI状态:', uiController.currentState);
console.log('- 存储可用:', courseManager.localDataManager.storageAvailable);
```

---

## 📚 更多资源

- [🎓 课程类型使用指南](course-types-guide.md) - 详细的7种课程类型说明
- [📋 V1.1.0发布说明](v1.1.0-release-notes.md) - 完整的新功能介绍
- [🔄 版本迁移指南](migration-guide.md) - 从V1.0.4升级的详细步骤
- [📖 安装指南](installation-guide.md) - V1.1.0安装说明
- [🔧 API参考文档](api-reference.md) - 开发者API说明

---

## 🆕 获取帮助

如果遇到V1.1.0特有问题：

1. **优先查看**：[课程类型使用指南](course-types-guide.md)
2. **检查版本**：确保使用的是V1.1.0版本代码
3. **查看日志**：控制台会显示详细的错误信息
4. **尝试重置**：清除缓存后重新安装
5. **提交Issue**：在GitHub上提供详细的问题描述和错误日志

---

*最后更新时间: 2025年12月9日 (V1.1.0)*
*如有新的问题或解决方案，欢迎贡献更新*