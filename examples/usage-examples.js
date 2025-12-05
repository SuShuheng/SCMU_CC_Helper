/**
 * 中南民族大学自动选课助手 - 使用示例
 * 包含各种使用场景和最佳实践
 *
 * @author SuShuHeng <https://github.com/sushuheng>
 * @license APACHE 2.0
 * @version 1.0.5
 * @description 专为中南民族大学学生设计的自动化课程注册助手使用示例模块
 *
 * Copyright (c) 2025 SuShuHeng
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * 商业使用限制：
 * - 商业用途需联系作者获得授权
 * - 禁止以盈利目的使用本软件
 *
 * 免责声明：
 * - 本项目仅用于学习目的
 * - 使用者需自行承担使用风险
 * - 请遵守学校相关规定
 */

// ==========================================
// 基本使用示例
// ==========================================

// 示例1: 最简单的抢课流程
async function basicGrabExample() {
    console.log('=== 基本抢课示例 ===');

    // 1. 添加要抢的课程
    courseManager.addCourse('MATH101');     // 高等数学A
    courseManager.addCourse('ENG202');      // 大学英语B

    // 2. 开始抢课
    await courseManager.initialize();

    console.log('抢课已开始，请查看控制台日志');
}

// 示例2: 带错误处理的抢课
async function safeGrabExample() {
    console.log('=== 安全抢课示例 ===');

    try {
        // 添加课程
        const courseIds = ['MATH101', 'ENG202', 'CS301'];

        courseIds.forEach(id => {
            courseManager.addCourse(id);
            console.log(`已添加课程: ${id}`);
        });

        // 检查状态
        const status = courseManager.getStatus();
        console.log(`准备抢课，共 ${status.totalCourses} 门课程`);

        // 开始抢课
        await courseManager.initialize();

    } catch (error) {
        console.error('抢课初始化失败:', error);
        uiController.showNotification('抢课失败，请检查网络连接', 'error');
    }
}

// ==========================================
// 高级使用示例
// ==========================================

// 示例3: 自定义配置的抢课
async function customConfigExample() {
    console.log('=== 自定义配置示例 ===');

    // 修改配置
    CONFIG.GRAB.POLLING_INTERVAL = 1000;        // 1秒轮询一次
    CONFIG.GRAB.MAX_RETRY_COUNT = 5;            // 最多重试5次
    CONFIG.LOG.ENABLE_VERBOSE_LOGGING = true;   // 启用详细日志

    // 添加自定义满员检测关键词
    CONFIG.GRAB.COURSE_FULL_KEYWORDS.push('名额已满', '选课人数已满');

    // 使用新配置开始抢课
    courseManager.addCourse('MATH101');
    await courseManager.initialize();

    console.log('使用自定义配置开始抢课');
}

// 示例4: 监听抢课事件
function eventListenerExample() {
    console.log('=== 事件监听示例 ===');

    // 监听抢课成功事件
    document.addEventListener('course:success', (event) => {
        const { courseId, timestamp } = event.detail;
        console.log(`🎉 抢课成功! 课程: ${courseId}, 时间: ${new Date(timestamp).toLocaleString()}`);

        // 可以添加成功后的操作，如发送通知、保存记录等
        uiController.showNotification(`成功抢到课程: ${courseId}`, 'success');
        saveGrabRecord(courseId, true);
    });

    // 监听抢课失败事件
    document.addEventListener('course:failed', (event) => {
        const { courseId, error } = event.detail;
        console.log(`❌ 抢课失败: 课程 ${courseId}, 原因: ${error}`);

        // 记录失败信息
        saveGrabRecord(courseId, false, error);
    });

    // 监听抢课开始事件
    document.addEventListener('grab:started', () => {
        console.log('🚀 抢课已开始');
        uiController.showNotification('抢课已开始', 'info');
    });

    // 监听抢课停止事件
    document.addEventListener('grab:stopped', () => {
        console.log('⏹️ 抢课已停止');
        uiController.showNotification('抢课已停止', 'info');
    });
}

// 示例5: 批量抢课
async function batchGrabExample() {
    console.log('=== 批量抢课示例 ===');

    // 定义要抢的课程列表
    const courses = [
        { id: 'MATH101', name: '高等数学A', priority: 1 },
        { id: 'ENG202', name: '大学英语B', priority: 2 },
        { id: 'CS301', name: '计算机基础', priority: 3 },
        { id: 'PE404', name: '体育课', priority: 4 },
        { id: 'POL505', name: '思想政治', priority: 5 }
    ];

    // 按优先级排序
    courses.sort((a, b) => a.priority - b.priority);

    // 添加课程
    courses.forEach(course => {
        courseManager.addCourse(course.id);
        console.log(`已添加课程: ${course.name} (ID: ${course.id}, 优先级: ${course.priority})`);
    });

    // 显示抢课计划
    console.log(`准备抢 ${courses.length} 门课程，按优先级顺序`);

    // 开始抢课
    await courseManager.initialize();
}

// ==========================================
// 工具函数示例
// ==========================================

// 示例6: 保存抢课记录
function saveGrabRecord(courseId, success, error = null) {
    const record = {
        courseId,
        success,
        error,
        timestamp: Date.now(),
        date: new Date().toLocaleString()
    };

    // 从localStorage获取现有记录
    const records = JSON.parse(localStorage.getItem('grabRecords') || '[]');
    records.push(record);

    // 保存记录
    localStorage.setItem('grabRecords', JSON.stringify(records));

    console.log(`保存抢课记录: ${courseId} - ${success ? '成功' : '失败'}`);
}

// 示例7: 查看抢课历史
function viewGrabHistory() {
    const records = JSON.parse(localStorage.getItem('grabRecords') || '[]');

    console.log('=== 抢课历史记录 ===');
    records.forEach((record, index) => {
        console.log(`${index + 1}. ${record.date} - ${record.courseId} - ${record.success ? '✅成功' : '❌失败'}`);
        if (record.error) {
            console.log(`   错误: ${record.error}`);
        }
    });

    // 统计信息
    const total = records.length;
    const success = records.filter(r => r.success).length;
    const fail = total - success;

    console.log(`\n统计: 总计 ${total} 次, 成功 ${success} 次, 失败 ${fail} 次, 成功率 ${((success/total)*100).toFixed(1)}%`);
}

// 示例8: 清理历史记录
function clearGrabHistory() {
    if (confirm('确定要清理所有抢课历史记录吗？')) {
        localStorage.removeItem('grabRecords');
        console.log('抢课历史记录已清理');
    }
}

// ==========================================
// 进阶功能示例
// ==========================================

// 示例9: 定时抢课
function scheduledGrabExample(targetTime) {
    console.log('=== 定时抢课示例 ===');
    console.log(`计划在 ${targetTime} 开始抢课`);

    const now = new Date();
    const target = new Date(targetTime);
    const delay = target - now;

    if (delay <= 0) {
        console.log('目标时间已过，立即开始抢课');
        basicGrabExample();
        return;
    }

    console.log(`等待 ${Math.floor(delay/1000)} 秒后开始抢课`);

    setTimeout(() => {
        console.log('定时抢课开始!');
        basicGrabExample();
    }, delay);
}

// 示例10: 智能重试机制
async function smartRetryExample() {
    console.log('=== 智能重试示例 ===');

    const maxRetries = 3;
    const retryDelay = 5000; // 5秒

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`第 ${attempt} 次尝试抢课`);

            courseManager.addCourse('MATH101');
            await courseManager.initialize();

            // 抢课成功，退出循环
            console.log('抢课成功!');
            break;

        } catch (error) {
            console.error(`第 ${attempt} 次尝试失败:`, error);

            if (attempt < maxRetries) {
                console.log(`${retryDelay/1000} 秒后重试...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            } else {
                console.error('所有尝试都失败了');
                uiController.showNotification('抢课失败，请稍后再试', 'error');
            }
        }
    }
}

// 示例11: 条件抢课
async function conditionalGrabExample() {
    console.log('=== 条件抢课示例 ===');

    // 检查当前时间是否在抢课时间范围内
    const now = new Date();
    const hour = now.getHours();

    if (hour < 8 || hour > 22) {
        console.log('当前不在抢课时间范围内 (8:00-22:00)');
        return;
    }

    // 检查网络连接
    if (!navigator.onLine) {
        console.log('网络连接不可用');
        return;
    }

    // 检查是否已经抢到足够的课程
    const status = courseManager.getStatus();
    if (status.successCount >= 5) {
        console.log('已抢到足够的课程，停止抢课');
        return;
    }

    // 满足所有条件，开始抢课
    console.log('条件检查通过，开始抢课');
    courseManager.addCourse('MATH101');
    await courseManager.initialize();
}

// ==========================================
// 实际使用场景示例
// ==========================================

// 场景1: 选课系统开放当天抢课
function openingDayGrabScenario() {
    console.log('=== 开放日抢课场景 ===');

    // 设置更频繁的轮询
    CONFIG.GRAB.POLLING_INTERVAL = 200;  // 200毫秒

    // 准备抢课列表
    const priorityCourses = [
        'MATH101',    // 最想上的课
        'ENG202',     // 备选1
        'CS301'       // 备选2
    ];

    priorityCourses.forEach(id => courseManager.addCourse(id));

    // 监听成功事件
    document.addEventListener('course:success', (event) => {
        console.log('🎉 抢课成功! 建议立即停止抢课避免占用资源');
        // 可选择自动停止: courseManager.stopLoop();
    });

    courseManager.initialize();
}

// 场景2: 补选阶段抢课
function makeUpGrabScenario() {
    console.log('=== 补选阶段抢课场景 ===');

    // 补选阶段通常竞争较小，可以使用较慢的轮询
    CONFIG.GRAB.POLLING_INTERVAL = 2000;  // 2秒

    // 添加想要的课程
    courseManager.addCourse('HOT150');  // 少量名额的热门课程

    courseManager.initialize();
}

// 场景3: 实验班抢课
function experimentalClassGrabScenario() {
    console.log('=== 实验班抢课场景 ===');

    // 优先抢实验班
    const coursesWithExperimental = [
        { id: 'MATH101', preferExperimental: true },
        { id: 'ENG202', preferExperimental: false }
    ];

    coursesWithExperimental.forEach(course => {
        courseManager.addCourse(course.id);
        if (course.preferExperimental) {
            console.log(`课程 ${course.id} 优先选择实验班`);
        }
    });

    courseManager.initialize();
}

// ==========================================
// 调试和测试示例
// ==========================================

// 示例12: 测试抢课逻辑
async function testGrabLogic() {
    console.log('=== 测试抢课逻辑 ===');

    // 启用调试模式
    CONFIG.DEV.DEBUG_MODE = true;
    CONFIG.LOG.ENABLE_VERBOSE_LOGGING = true;

    // 使用测试课程ID（不会实际抢课）
    const testCourseId = 'TEST101';

    console.log('测试开始...');
    courseManager.addCourse(testCourseId);

    // 测试获取实验班信息
    const experimentalClasses = await courseManager.fetchExperimentalClasses(testCourseId);
    console.log('实验班信息:', experimentalClasses);

    // 测试状态检查
    const status = courseManager.getStatus();
    console.log('抢课状态:', status);

    console.log('测试完成');
}

// ==========================================
// 使用说明
// ==========================================

console.log(`
抢课助手使用示例
=================

基本使用:
1. basicGrabExample()      - 基本抢课流程
2. safeGrabExample()       - 带错误处理的抢课

高级功能:
3. customConfigExample()   - 自定义配置
4. eventListenerExample()  - 事件监听
5. batchGrabExample()      - 批量抢课

工具函数:
6. saveGrabRecord()        - 保存抢课记录
7. viewGrabHistory()       - 查看抢课历史
8. clearGrabHistory()      - 清理历史记录

进阶功能:
9. scheduledGrabExample()  - 定时抢课
10. smartRetryExample()    - 智能重试
11. conditionalGrabExample() - 条件抢课

实际场景:
- openingDayGrabScenario()    - 开放日抢课
- makeUpGrabScenario()        - 补选阶段
- experimentalClassGrabScenario() - 实验班抢课

调试测试:
12. testGrabLogic()        - 测试抢课逻辑

使用方法:
1. 在控制台中调用相应的函数
2. 例如: basicGrabExample()
3. 查看控制台输出了解执行过程
`);

// 导出主要函数供外部调用
if (typeof window !== 'undefined') {
    window.grabExamples = {
        basicGrabExample,
        safeGrabExample,
        customConfigExample,
        eventListenerExample,
        batchGrabExample,
        saveGrabRecord,
        viewGrabHistory,
        clearGrabHistory,
        scheduledGrabExample,
        smartRetryExample,
        conditionalGrabExample,
        openingDayGrabScenario,
        makeUpGrabScenario,
        experimentalClassGrabScenario,
        testGrabLogic
    };
}