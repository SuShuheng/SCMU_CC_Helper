/**
 * 中南民族大学自动选课助手 - 用户界面控制模块
 * 负责创建和管理选课助手的用户界面
 *
 * @author SuShuHeng <https://github.com/sushuheng>
 * @license APACHE 2.0
 * @version V1.1.1
 * @description 专为中南民族大学学生设计的自动化课程注册助手UI控制模块
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

import { CONFIG } from './config.js';
import { courseManager } from './course-registration.js';

// UI状态常量
const UI_STATES = {
    FLOATING_BUTTON: 'floating_button',
    FULL_PANEL: 'full_panel',
    MINIMIZED_STATUS: 'minimized_status'
};

/**
 * 用户界面控制器类
 */
class UIController {
    constructor(courseManager) {
        this.courseManager = courseManager;
        // 现有属性
        this.panel = null;
        this.container = null;
        this.startButton = null;
        this.stopButton = null;
        this.addButton = null;

        // 新增状态管理属性
        this.currentState = UI_STATES.FLOATING_BUTTON;
        this.isSelectingCourses = false;
        this.floatingButton = null;
        this.minimizedPanel = null;
        this.startTime = null;
        this.stopTime = null; // 新增：停止时间记录
        this.statusUpdateInterval = null;
        this.statusModal = null; // 新增：状态面板单例引用
        this.statusModalUpdateInterval = null; // 新增：状态面板更新定时器

        // 初始化存储事件监听
        this.initStorageEventListeners();

        // V1.1.1: 添加课程名保存防抖定时器映射
        this.courseNameSaveTimers = new Map();
    }

    /**
     * 初始化存储事件监听
     */
    initStorageEventListeners() {
        console.log(`${CONFIG.LOG.LOG_PREFIX} 初始化存储事件监听器...`);

        // 监听数据加载完成事件
        document.addEventListener('storage:dataLoaded', (event) => {
            console.log(`${CONFIG.LOG.LOG_PREFIX} ===== storage:dataLoaded 事件触发 =====`);
            console.log(`${CONFIG.LOG.LOG_PREFIX} 事件详情:`, event);
            console.log(`${CONFIG.LOG.LOG_PREFIX} 事件数据:`, event.detail);

            const { courses, courseDetails, statusMap } = event.detail;
            console.log(`${CONFIG.LOG.LOG_PREFIX} 解构事件数据:`, {
                courses: courses,
                coursesCount: courses?.length || 0,
                courseDetails: courseDetails,
                courseDetailsCount: courseDetails?.length || 0,
                statusMap: statusMap,
                statusMapKeys: Object.keys(statusMap || {})
            });

            // 修复竞态条件：确保UI容器存在后再进行数据恢复
            if (!this.container) {
                console.log(`${CONFIG.LOG.LOG_PREFIX} UI容器不存在，强制创建容器...`);
                this.createControlPanel();
                if (this.panel) {
                    this.panel.style.display = 'none'; // 初始隐藏，防止意外显示
                    this.panel.id = 'course-registration-panel';
                    // 获取标题栏作为拖拽手柄
                    const titleBar = this.panel.querySelector('.main-title-bar');
                    // 使面板可拖拽，只允许通过标题栏拖拽
                    this.makeDraggable(this.panel, titleBar);
                    document.body.appendChild(this.panel);
                    console.log(`${CONFIG.LOG.LOG_PREFIX} UI容器创建成功`);
                } else {
                    console.error(`${CONFIG.LOG.LOG_PREFIX} UI容器创建失败`);
                }
            }

            console.log(`${CONFIG.LOG.LOG_PREFIX} 开始调用restoreUIFromStorage...`);
            this.restoreUIFromStorage(courses, courseDetails, statusMap);
        });

        console.log(`${CONFIG.LOG.LOG_PREFIX} 存储事件监听器初始化完成`);
    }

    /**
     * 从存储数据恢复UI界面
     */
    restoreUIFromStorage(courses, courseDetails, statusMap, retryCount = 0) {
        console.log(`${CONFIG.LOG.LOG_PREFIX} ===== 开始UI数据恢复 =====`);
        console.log(`${CONFIG.LOG.LOG_PREFIX} 恢复参数详情:`, {
            courses: courses,
            coursesCount: courses?.length || 0,
            courseDetails: courseDetails,
            courseDetailsCount: courseDetails?.length || 0,
            statusMap: statusMap,
            statusMapKeys: Object.keys(statusMap || {}),
            retryCount: retryCount
        });

        if (!courses || courses.length === 0) {
            console.log(`${CONFIG.LOG.LOG_PREFIX} 没有课程数据需要恢复，退出恢复流程`);
            return;
        }

        console.log(`${CONFIG.LOG.LOG_PREFIX} 开始恢复UI界面，共${courses.length}门课程:`, courses);

        try {
            // 等待UI完全初始化后再恢复数据
            setTimeout(() => {
                console.log(`${CONFIG.LOG.LOG_PREFIX} 检查UI容器状态...`);

                // 检查重试次数限制，防止无限重试
                const MAX_RETRY_COUNT = 2;
                if (!this.container) {
                    if (retryCount >= MAX_RETRY_COUNT) {
                        console.error(`${CONFIG.LOG.LOG_PREFIX} 达到最大重试次数(${MAX_RETRY_COUNT})，强制创建容器`);
                        // 强制创建容器
                        this.createControlPanel();
                        if (this.panel) {
                            this.panel.style.display = 'none'; // 初始隐藏，防止意外显示
                            this.panel.id = 'course-registration-panel';
                            // 获取标题栏作为拖拽手柄
                            const titleBar = this.panel.querySelector('.main-title-bar');
                            // 使面板可拖拽，只允许通过标题栏拖拽
                            this.makeDraggable(this.panel, titleBar);
                            document.body.appendChild(this.panel);
                            console.log(`${CONFIG.LOG.LOG_PREFIX} 强制创建UI容器成功`);
                        } else {
                            console.error(`${CONFIG.LOG.LOG_PREFIX} 强制创建UI容器失败，终止恢复流程`);
                            return;
                        }
                    } else {
                        console.warn(`${CONFIG.LOG.LOG_PREFIX} UI容器未初始化，延迟500ms后重试 (${retryCount + 1}/${MAX_RETRY_COUNT})`);
                        setTimeout(() => this.restoreUIFromStorage(courses, courseDetails, statusMap, retryCount + 1), 500);
                        return;
                    }
                }

                console.log(`${CONFIG.LOG.LOG_PREFIX} UI容器已就绪，清空现有内容`);
                console.log(`${CONFIG.LOG.LOG_PREFIX} 清空前容器内容:`, this.container.innerHTML);

                // 清空现有输入框
                this.container.innerHTML = '';

                console.log(`${CONFIG.LOG.LOG_PREFIX} 开始为${courses.length}门课程创建输入框`);

                // 为每个保存的课程创建输入框
                courses.forEach((courseId, index) => {
                    console.log(`${CONFIG.LOG.LOG_PREFIX} 处理课程 ${index + 1}/${courses.length}: ${courseId}`);

                    // 获取课程的类型信息
                    const courseType = this.courseManager.courseTypeMap[courseId] || CONFIG.GRAB.DEFAULT_COURSE_TYPE;
                    console.log(`${CONFIG.LOG.LOG_PREFIX} 课程${courseId}类型: ${courseType}`);

                    const courseInput = this.createCourseInput(index, courseType);
                    console.log(`${CONFIG.LOG.LOG_PREFIX} 课程输入框HTML结构:`, courseInput.outerHTML);

                    const inputs = courseInput.querySelectorAll('input[type="text"]');
                    console.log(`${CONFIG.LOG.LOG_PREFIX} 找到${inputs.length}个输入框:`, Array.from(inputs).map(input => ({
                        placeholder: input.placeholder,
                        type: input.type,
                        value: input.value
                    })));

                    const inputId = inputs[0]; // 课程ID输入框
                    const inputName = inputs[1]; // 课程名称输入框
                    const statusDisplay = courseInput.querySelector('.status-display');

                    console.log(`${CONFIG.LOG.LOG_PREFIX} 输入框选择结果:`, {
                        inputId: !!inputId,
                        inputName: !!inputName,
                        statusDisplay: !!statusDisplay,
                        inputIdPlaceholder: inputId?.placeholder,
                        inputNamePlaceholder: inputName?.placeholder
                    });

                    // 设置课程ID
                    inputId.value = courseId;
                    inputId.dataset.currentCourseId = courseId;
                    console.log(`${CONFIG.LOG.LOG_PREFIX} 设置课程ID: ${courseId}`);

                    // 设置课程类型选择器
                    const courseTypeSelector = courseInput.querySelector('select');
                    if (courseTypeSelector) {
                        courseTypeSelector.value = courseType;
                        console.log(`${CONFIG.LOG.LOG_PREFIX} 设置课程类型选择器: ${courseType}`);
                    } else {
                        console.warn(`${CONFIG.LOG.LOG_PREFIX} 未找到课程类型选择器`);
                    }

                    // 设置课程名称（如果有的话）- V1.1.1 修复课程名恢复逻辑
                    let courseDetail = null;

                    // V1.1.1: 增强课程名查找逻辑，支持多种数据格式
                    if (Array.isArray(courseDetails)) {
                        // 尝试通过ID查找
                        courseDetail = courseDetails.find(detail => detail && detail.id === courseId);

                        // 如果没找到，尝试索引匹配（兼容旧数据格式）
                        if (!courseDetail && courseDetails[index]) {
                            courseDetail = courseDetails[index];
                            console.log(`${CONFIG.LOG.LOG_PREFIX} 通过索引${index}找到课程详情:`, courseDetail);
                        }
                    }

                    console.log(`${CONFIG.LOG.LOG_PREFIX} 课程${courseId}详细信息:`, courseDetail);

                    if (courseDetail && courseDetail.name && courseDetail.name !== this.courseManager.localDataManager.DEFAULT_COURSE_NAME) {
                        inputName.value = courseDetail.name;
                        inputId.title = courseDetail.name; // 保留tooltip功能
                        console.log(`${CONFIG.LOG.LOG_PREFIX} 设置课程名称: "${courseDetail.name}"`);
                    } else {
                        console.log(`${CONFIG.LOG.LOG_PREFIX} 课程${courseId}无有效名称，使用默认值`);
                    }

                    // 设置状态显示
                    if (statusDisplay && statusMap[courseId]) {
                        const courseStatus = statusMap[courseId];
                        console.log(`${CONFIG.LOG.LOG_PREFIX} 课程${courseId}状态:`, courseStatus);

                        if (courseStatus.success) {
                            statusDisplay.textContent = '✅ 已选上';
                            statusDisplay.style.color = '#28a745';
                        } else {
                            statusDisplay.textContent = '等待中...';
                            statusDisplay.style.color = '#6c757d';
                        }
                        console.log(`${CONFIG.LOG.LOG_PREFIX} 设置状态显示: "${statusDisplay.textContent}"`);
                    } else {
                        console.log(`${CONFIG.LOG.LOG_PREFIX} 课程${courseId}无状态信息或状态显示元素不存在`);
                    }

                    // 为恢复的课程输入框绑定事件监听器
                    console.log(`${CONFIG.LOG.LOG_PREFIX} 绑定课程${courseId}的事件监听器`);
                    this.bindCourseInputEvents(courseInput, inputId, inputName);

                    // 添加到容器
                    this.container.appendChild(courseInput);
                    console.log(`${CONFIG.LOG.LOG_PREFIX} 课程${courseId}输入框已添加到容器`);
                });

                console.log(`${CONFIG.LOG.LOG_PREFIX} 所有课程输入框创建完成，容器中有${this.container.children.length}个子元素`);
                console.log(`${CONFIG.LOG.LOG_PREFIX} 容器最终内容:`, this.container.innerHTML);

                // 更新UI状态
                console.log(`${CONFIG.LOG.LOG_PREFIX} 更新UI状态...`);
                this.updateScrollableContainer();
                this.updateButtonStates(false);

                console.log(`${CONFIG.LOG.LOG_PREFIX} UI界面恢复完成`);
                console.log(`${CONFIG.LOG.LOG_PREFIX} 最终统计:`, {
                    课程数量: courses.length,
                    输入框数量: this.container.children.length,
                    状态映射: Object.keys(statusMap).length,
                    课程详情: courseDetails.length
                });

                // 显示恢复提示
                this.showNotification(`已恢复${courses.length}门课程`, 'info');

                // V1.1.1: 数据恢复后更新面板高度
                this.updatePanelHeight();

            }, 100); // 短暂延迟确保UI完全初始化

        } catch (error) {
            console.error(`${CONFIG.LOG.LOG_PREFIX} UI恢复失败:`, error);
            console.error(`${CONFIG.LOG.LOG_PREFIX} 错误详情:`, {
                message: error.message,
                stack: error.stack,
                courses: courses,
                container: this.container,
                containerExists: !!this.container,
                containerChildren: this.container?.children?.length || 0
            });
            this.showNotification('UI恢复失败，请刷新页面重试', 'error');
        }
    }

    /**
     * 为课程输入框绑定事件监听器（用于数据恢复时）
     */
    bindCourseInputEvents(courseInput, inputId, inputName) {
        const div = courseInput;

        // 绑定课程ID输入框的blur事件
        inputId.addEventListener('blur', async () => {
            const newJxbid = inputId.value.trim();
            const oldJxbid = inputId.dataset.currentCourseId || '';
            const isRunning = this.courseManager.intervalId !== null;

            if (newJxbid && this.isValidCourseId(newJxbid)) {
                if (oldJxbid && oldJxbid !== newJxbid) {
                    // 替换课程情况
                    const updated = this.courseManager.updateCourse(oldJxbid, newJxbid);
                    if (updated) {
                        inputId.dataset.currentCourseId = newJxbid;
                        this.showNotification(`课程已更新: ${oldJxbid} → ${newJxbid}`, 'success');
                    } else {
                        // 更新失败，恢复原值
                        inputId.value = oldJxbid;
                        this.showNotification(`课程更新失败: ${newJxbid}`, 'error');
                    }
                } else if (!newJxbid && oldJxbid) {
                    // 删除课程情况
                    this.courseManager.removeCourse(oldJxbid);
                    inputId.dataset.currentCourseId = '';
                    inputName.value = '';
                }
            }
        });

        // V1.1.1: 改进的课程名称保存机制 - 支持防抖和即时保存
        const saveCourseName = (courseId, courseName, showNotification = true) => {
            if (courseId && this.isValidCourseId(courseId) && courseName) {
                // 清除之前的防抖定时器
                if (this.courseNameSaveTimers.has(courseId)) {
                    clearTimeout(this.courseNameSaveTimers.get(courseId));
                    this.courseNameSaveTimers.delete(courseId);
                }

                // 立即保存课程名称
                const success = this.courseManager.localDataManager.updateCourseName(courseId, courseName);
                if (success) {
                    console.log(`${CONFIG.LOG.LOG_PREFIX} 课程名称已保存: ${courseId} - ${courseName}`);
                    if (showNotification) {
                        this.showNotification(`课程名称已更新: ${courseName}`, 'success');
                    }
                }
            }
        };

        // 绑定课程名称输入框的blur事件 - 立即保存
        inputName.addEventListener('blur', async () => {
            const courseId = inputId.value.trim();
            const courseName = inputName.value.trim();

            if (courseId && courseName) {
                saveCourseName(courseId, courseName, true);
            }
        });

        // V1.1.1: 添加input事件监听，支持防抖保存
        inputName.addEventListener('input', () => {
            const courseId = inputId.value.trim();
            const courseName = inputName.value.trim();

            if (courseId && courseName) {
                // 清除之前的防抖定时器
                if (this.courseNameSaveTimers.has(courseId)) {
                    clearTimeout(this.courseNameSaveTimers.get(courseId));
                }

                // 设置新的防抖定时器（500ms后保存）
                const timer = setTimeout(() => {
                    saveCourseName(courseId, courseName, false); // 不显示通知，避免频繁提示
                }, 500);

                this.courseNameSaveTimers.set(courseId, timer);
            }
        });

        // 绑定课程名称输入框的Enter键支持
        inputName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                inputName.blur();
            }
        });

        // 获取删除按钮并绑定点击事件
        const deleteButton = div.querySelector('button');
        if (deleteButton) {
            deleteButton.onclick = () => this.handleDeleteCourse(div, inputId);
        }
    }

    /**
     * V1.1.1: 处理删除课程
     * @param {HTMLElement} courseElement - 要删除的课程元素
     * @param {HTMLElement} inputElement - 课程ID输入框
     */
    handleDeleteCourse(courseElement, inputElement) {
        try {
            const courseId = inputElement.value.trim();

            if (courseId && this.courseManager.courses.includes(courseId)) {
                // 从courseManager中移除课程
                const index = this.courseManager.courses.indexOf(courseId);
                if (index > -1) {
                    this.courseManager.courses.splice(index, 1);
                }

                // 从本地存储中删除课程
                if (this.courseManager.localDataManager) {
                    this.courseManager.localDataManager.removeCourse(courseId);
                }
            }

            // 从UI中移除课程元素
            if (courseElement && courseElement.parentNode) {
                courseElement.parentNode.removeChild(courseElement);
            }

            // V1.1.1: 删除课程后更新面板高度
            this.updatePanelHeight();

            console.log(`${CONFIG.LOG.LOG_PREFIX} 课程 ${courseId || ''} 已删除`);
        } catch (error) {
            console.error(`${CONFIG.LOG.LOG_PREFIX} 删除课程失败:`, error);
            this.showNotification('删除课程失败，请重试', 'error');
        }
    }

    /**
     * 隐藏所有UI状态
     */
    hideAllStates() {
        if (this.panel) this.panel.style.display = 'none';
        if (this.floatingButton) this.floatingButton.style.display = 'none';
        if (this.minimizedPanel) this.minimizedPanel.style.display = 'none';
    }

    /**
     * 转换到指定状态
     * @param {string} newState - 新状态
     */
    transitionToState(newState) {
        this.hideAllStates();

        switch (newState) {
            case UI_STATES.FLOATING_BUTTON:
                this.showFloatingButton();
                break;
            case UI_STATES.FULL_PANEL:
                this.showFullPanel();
                break;
            case UI_STATES.MINIMIZED_STATUS:
                this.showMinimizedStatus();
                break;
        }

        this.currentState = newState;
    console.log(`${CONFIG.LOG.LOG_PREFIX} UI状态转换: ${newState}`);
    }

    /**
     * 循环UI状态
     */
    cycleUIState() {
        if (this.isSelectingCourses) {
            // 3状态循环: 主面板 → 迷你面板 → 悬浮按钮 → 主面板
            switch (this.currentState) {
                case UI_STATES.FULL_PANEL:
                    this.transitionToState(UI_STATES.MINIMIZED_STATUS);
                    break;
                case UI_STATES.MINIMIZED_STATUS:
                    this.transitionToState(UI_STATES.FLOATING_BUTTON);
                    break;
                default:
                    this.transitionToState(UI_STATES.FULL_PANEL);
            }
        } else {
            // 2状态切换: 悬浮按钮 ↔ 主面板
            this.transitionToState(
                this.currentState === UI_STATES.FLOATING_BUTTON ?
                    UI_STATES.FULL_PANEL :
                    UI_STATES.FLOATING_BUTTON
            );
        }
    }

    /**
     * 创建悬浮按钮
     */
    createFloatingButton() {
        if (this.floatingButton) return;

        this.floatingButton = document.createElement('div');
        Object.assign(this.floatingButton.style, CONFIG.UI.FLOATING_BUTTON);
        this.floatingButton.textContent = '抢课';
        this.floatingButton.id = 'floating-button';

        this.floatingButton.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`${CONFIG.LOG.LOG_PREFIX} 悬浮按钮被点击，当前状态: ${this.currentState}`);
            this.cycleUIState();
        });

        document.body.appendChild(this.floatingButton);
    }

    /**
     * 显示悬浮按钮
     */
    showFloatingButton() {
        if (!this.floatingButton) {
            this.createFloatingButton();
        }
        this.floatingButton.style.display = 'flex';
    }

    /**
     * 显示完整面板
     */
    showFullPanel() {
        if (!this.panel) {
            this.createControlPanel();
            // 设置面板ID
            this.panel.id = 'course-registration-panel';
            // 获取标题栏作为拖拽手柄
            const titleBar = this.panel.querySelector('.main-title-bar');
            // 使面板可拖拽，只允许通过标题栏拖拽
            this.makeDraggable(this.panel, titleBar);
            // CRITICAL: Add panel to DOM
            document.body.appendChild(this.panel);
        }
        this.panel.style.display = 'block';
    }

    /**
     * 创建迷你状态面板
     */
    createMinimizedStatusPanel() {
        if (this.minimizedPanel) return;

        this.minimizedPanel = document.createElement('div');
        Object.assign(this.minimizedPanel.style, CONFIG.UI.MINIMIZED_PANEL);
        this.minimizedPanel.id = 'minimized-status-panel';

        // 标题
        const title = document.createElement('div');
        title.textContent = '抢课进行中';
        title.style.cssText = 'font-weight: bold; margin-bottom: 10px; color: #28a745;';

        // 状态容器
        const statusContainer = document.createElement('div');
        statusContainer.id = 'minimized-status-content';

        // 停止按钮
        const stopButton = document.createElement('button');
        stopButton.textContent = '停止抢课';
        stopButton.style.cssText = `
            background-color: #dc3545;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        `;
        stopButton.onclick = (e) => {
            e.stopPropagation();
            courseManager.stopLoop();
        };

        this.minimizedPanel.appendChild(title);
        this.minimizedPanel.appendChild(statusContainer);
        this.minimizedPanel.appendChild(stopButton);

        this.minimizedPanel.addEventListener('click', () => {
            this.cycleUIState();
        });

        document.body.appendChild(this.minimizedPanel);

        // 开始状态更新定时器
        this.startMinimizedStatusUpdates();
    }

    /**
     * 显示迷你状态面板
     */
    showMinimizedStatus() {
        if (!this.minimizedPanel) {
            this.createMinimizedStatusPanel();
        }
        this.minimizedPanel.style.display = 'block';
    }

    /**
     * 开始迷你面板状态更新
     */
    startMinimizedStatusUpdates() {
        this.stopMinimizedStatusUpdates(); // 清除现有定时器
        this.statusUpdateInterval = setInterval(() => {
            this.updateMinimizedStatus();
        }, 1000);
    }

    /**
     * 停止迷你面板状态更新
     */
    stopMinimizedStatusUpdates() {
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
            this.statusUpdateInterval = null;
        }
    }

    /**
     * 更新迷你面板状态
     */
    updateMinimizedStatus() {
        if (!this.minimizedPanel || this.currentState !== UI_STATES.MINIMIZED_STATUS) {
            return;
        }

        const status = courseManager.getStatus();
        const statusContainer = document.getElementById('minimized-status-content');

        if (!statusContainer) return;

        // 成功信息
        const successInfo = document.createElement('div');
        successInfo.innerHTML = `<strong>成功:</strong> ${status.successCount}/${status.totalCourses} 门课程`;
        successInfo.style.marginBottom = '8px';

        // 课程列表
        const courseList = document.createElement('div');
        courseList.style.maxHeight = '80px';
        courseList.style.overflowY = 'auto';
        courseList.style.fontSize = '11px';

        status.courses.forEach(course => {
            const courseItem = document.createElement('div');

            // 修正状态显示逻辑，增加"待进行"状态
            let statusIcon, statusColor;
            if (course.success) {
                statusIcon = '✅';
                statusColor = '#28a745';
            } else if (status.isRunning) {
                statusIcon = '⏳';
                statusColor = '#007bff';
            } else {
                statusIcon = '⏸️';
                statusColor = '#6c757d';
            }

            courseItem.style.cssText = `
                padding: 2px 0;
                color: ${statusColor};
            `;
            courseItem.textContent = `${course.id} ${statusIcon}`;
            courseList.appendChild(courseItem);
        });

        // 运行时间
        const runTime = this.calculateRunTime();
        const formattedTime = this.formatRunTime(runTime);

        const timeInfo = document.createElement('div');
        timeInfo.innerHTML = `<strong>运行时间:</strong> ${formattedTime}`;
        timeInfo.style.marginTop = '8px';

        statusContainer.innerHTML = '';
        statusContainer.appendChild(successInfo);
        statusContainer.appendChild(courseList);
        statusContainer.appendChild(timeInfo);
    }

    /**
     * 验证课程ID格式
     * @param {string} courseId - 课程ID
     * @returns {boolean} 是否为有效的课程ID
     */
    isValidCourseId(courseId) {
        // 检查是否为空
        if (!courseId || courseId.trim() === '') {
            return false;
        }

        const trimmedId = courseId.trim();

        // 检查是否为字母、数字、下划线和连字符组合（支持大小写字母、数字、下划线和连字符）
        return /^[A-Za-z0-9_-]+$/.test(trimmedId);
    }

    /**
     * 使元素可拖拽
     * @param {HTMLElement} element - 要拖拽的元素
     * @param {HTMLElement} handle - 可选的拖拽手柄元素，如果未提供则使用CSS类名检查
     */
    makeDraggable(element, handle = null) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // 检查是否为移动设备
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // 鼠标事件处理
        element.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        // 触摸事件处理（移动设备支持）
        if (isTouchDevice) {
            element.addEventListener('touchstart', dragStart, { passive: false });
            document.addEventListener('touchmove', drag, { passive: false });
            element.addEventListener('touchend', dragEnd);
        }

        function dragStart(e) {
            // 优化的拖拽权限检查：优先使用手柄，回退到CSS类名检查
            let canDrag = false;

            if (handle) {
                // 使用指定的拖拽手柄
                canDrag = (e.target === handle || handle.contains(e.target));
            } else {
                // 回退到CSS类名检查方式
                canDrag = e.target.closest('.status-title-bar') || e.target.closest('.main-title-bar');
            }

            if (canDrag) {
                if (e.type === "touchstart") {
                    initialX = e.touches[0].clientX - xOffset;
                    initialY = e.touches[0].clientY - yOffset;
                } else {
                    initialX = e.clientX - xOffset;
                    initialY = e.clientY - yOffset;
                }

                if (e.target === element || element.contains(e.target)) {
                    isDragging = true;
                    element.style.cursor = 'grabbing';
                    element.style.userSelect = 'none';
                }
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();

                if (e.type === "touchmove") {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                } else {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                }

                xOffset = currentX;
                yOffset = currentY;

                // 边界检查
                const rect = element.getBoundingClientRect();
                const maxX = window.innerWidth - rect.width;
                const maxY = window.innerHeight - rect.height;

                const newX = Math.max(0, Math.min(currentX, maxX));
                const newY = Math.max(0, Math.min(currentY, maxY));

                element.style.transform = `translate(${newX}px, ${newY}px)`;
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            element.style.cursor = 'grab';
            element.style.userSelect = 'auto';
        }

        // 设置初始鼠标样式
        element.style.cursor = 'grab';
    }

    /**
     * 创建课程输入框
     * @param {number} index - 课程索引
     * @returns {HTMLElement} 课程输入框容器
     */
    /**
     * 创建课程类型选择器
     * @param {string} selectedType - 当前选中的课程类型
     * @returns {HTMLSelectElement} 选择器元素
     */
    createCourseTypeSelector(selectedType = CONFIG.GRAB.DEFAULT_COURSE_TYPE) {
        const selector = document.createElement('select');
        selector.style.cssText = `
            margin-right: 10px;
            padding: 5px;
            border: 1px solid #ccc;
            border-radius: 3px;
            width: 120px;
            font-size: 12px;
        `;

        // 添加课程类型选项
        Object.entries(CONFIG.COURSE_TYPES).forEach(([key, type]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = type.name;
            option.title = type.description;
            if (key === selectedType) {
                option.selected = true;
            }
            selector.appendChild(option);
        });

        return selector;
    }

    createCourseInput(index, courseType = CONFIG.GRAB.DEFAULT_COURSE_TYPE) {
        const div = document.createElement('div');
        div.style.marginBottom = '10px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.flexWrap = 'wrap';

        // 课程类型选择器
        const courseTypeSelector = this.createCourseTypeSelector(courseType);

        const inputId = document.createElement('input');
        inputId.type = 'text';
        inputId.placeholder = `输入课程ID（课程${index + 1}）`;
        inputId.style.cssText = `
            margin-right: 10px;
            padding: 5px;
            border: 1px solid #ccc;
            border-radius: 3px;
            width: 150px;
        `;

        const inputName = document.createElement('input');
        inputName.type = 'text';
        inputName.placeholder = '输入课程名称（可选）';
        inputName.style.cssText = `
            margin-right: 10px;
            padding: 5px;
            border: 1px solid #ccc;
            border-radius: 3px;
            width: 200px;
        `;

        div.appendChild(courseTypeSelector);
        div.appendChild(inputId);
        div.appendChild(inputName);

        // 重构：实现课程替换与更新逻辑
        inputId.addEventListener('blur', () => {
            const newJxbid = inputId.value.trim();
            const oldJxbid = inputId.dataset.currentCourseId || '';
            const selectedCourseType = courseTypeSelector.value;

            if (newJxbid && this.isValidCourseId(newJxbid)) {
                if (oldJxbid && oldJxbid !== newJxbid) {
                    // 替换课程情况
                    const updated = courseManager.updateCourse(oldJxbid, newJxbid, selectedCourseType);
                    if (updated) {
                        inputId.dataset.currentCourseId = newJxbid;
                        const courseTypeInfo = CONFIG.COURSE_TYPES[selectedCourseType];
                        this.showNotification(`课程已更新: ${oldJxbid} → ${newJxbid} [${courseTypeInfo.name}]`, 'success');
                    } else {
                        // 更新失败，恢复原值
                        inputId.value = oldJxbid;
                        this.showNotification(`课程更新失败: ${newJxbid}`, 'error');
                    }
                } else if (!oldJxbid) {
                    // 新增课程情况
                    const added = courseManager.addCourse(newJxbid, selectedCourseType);
                    if (added) {
                        inputId.dataset.currentCourseId = newJxbid;
                        const courseTypeInfo = CONFIG.COURSE_TYPES[selectedCourseType];
                        this.showNotification(`课程 ${newJxbid} 添加成功 [${courseTypeInfo.name}]`, 'success');
                    } else {
                        // 添加失败，可能是重复课程
                        inputId.value = '';
                        inputId.dataset.currentCourseId = '';
                        this.showNotification(`课程 ${newJxbid} 添加失败或已存在`, 'warning');
                    }
                }
                // 保持输入框显示内容，不清空
            } else if (newJxbid) {
                // 格式无效，恢复原值或清空
                this.showNotification(`课程ID格式无效: ${newJxbid}`, 'error');
                inputId.value = oldJxbid || '';
            } else if (oldJxbid) {
                // 清空输入，删除课程
                const removed = courseManager.removeCourse(oldJxbid);
                if (removed) {
                    inputId.dataset.currentCourseId = '';
                    this.showNotification(`课程 ${oldJxbid} 已删除`, 'info');
                }
            }
            // 如果newJxbid为空且oldJxbid也为空，不做任何操作
        });

        // 添加Enter键支持
        inputId.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                inputId.blur();
            }
        });

        return div;
    }

    /**
     * 创建控制面板
     * @returns {HTMLElement} 控制面板元素
     */
    createControlPanel() {
        this.panel = document.createElement('div');
        Object.assign(this.panel.style, CONFIG.UI.PANEL_STYLE);

        // V1.1.1: 初始化动态高度控制
        this.panel.id = 'course-registration-panel';
        this.updatePanelHeight();

        // 创建标题栏容器
        const titleBar = document.createElement('div');
        titleBar.className = 'main-title-bar';
        titleBar.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 0 0 15px 0;
            position: relative;
            cursor: grab;
        `;

        // 标题文字
        const title = document.createElement('h3');
        title.textContent = '自动选课工具';
        title.style.cssText = `
            margin: 0;
            color: #333;
            font-size: 18px;
            flex: 1;
        `;

        // 最小化按钮
        const minimizeButton = document.createElement('button');
        minimizeButton.textContent = '−';
        minimizeButton.style.cssText = `
            background: none;
            border: none;
            font-size: 20px;
            font-weight: bold;
            color: #666;
            cursor: pointer;
            padding: 5px 10px;
            border-radius: 3px;
            margin-left: 10px;
            line-height: 1;
        `;
        minimizeButton.title = '最小化';

        // 添加悬停效果
        minimizeButton.addEventListener('mouseenter', () => {
            minimizeButton.style.backgroundColor = '#e0e0e0';
        });
        minimizeButton.addEventListener('mouseleave', () => {
            minimizeButton.style.backgroundColor = 'transparent';
        });

        // 添加点击处理器
        minimizeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.cycleUIState();
        });

        // 关闭按钮
        const closeButton = document.createElement('button');
        closeButton.textContent = '✕';
        closeButton.style.cssText = `
            background: none;
            border: none;
            font-size: 20px;
            font-weight: bold;
            color: #dc3545;
            cursor: pointer;
            padding: 5px 10px;
            border-radius: 3px;
            margin-left: 5px;
            line-height: 1;
            transition: background-color 0.2s;
        `;
        closeButton.title = '关闭程序';

        // 添加悬停效果
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.backgroundColor = '#f8d9da';
        });

        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.backgroundColor = 'transparent';
        });

        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showCloseConfirmation();
        });

        titleBar.appendChild(title);
        titleBar.appendChild(minimizeButton);
        titleBar.appendChild(closeButton); // 新增关闭按钮
        this.panel.appendChild(titleBar);

        // 课程输入容器
        this.container = document.createElement('div');
        this.container.id = 'course-container';
        this.container.className = 'course-input-container'; // V1.1.1: 添加CSS类名

        // 添加第一个输入框
        this.container.appendChild(this.createCourseInput(0, CONFIG.GRAB.DEFAULT_COURSE_TYPE));

        // 添加更多课程按钮
        this.addButton = document.createElement('button');
        this.addButton.textContent = '添加更多课程';
        this.addButton.style.cssText = `
            ${this.getButtonStyle()}
            background-color: #007bff;
            color: white;
            border-color: #007bff;
        `;
        this.addButton.onclick = () => {
            const courseCount = this.container.children.length;
            this.container.appendChild(this.createCourseInput(courseCount, CONFIG.GRAB.DEFAULT_COURSE_TYPE));
            // V1.1.1: 添加课程后更新面板高度
            this.updatePanelHeight();
        };

        // 开始选课按钮
        this.startButton = document.createElement('button');
        this.startButton.textContent = '开始选课';
        this.startButton.style.cssText = `
            ${this.getButtonStyle()}
            background-color: #28a745;
            color: white;
            border-color: #28a745;
        `;
        this.startButton.onclick = async () => {
            if (courseManager.courses.length === 0) {
                alert('请先输入至少一个课程ID！');
                return;
            }

            this.startButton.disabled = true;
            this.addButton.disabled = true;
            await courseManager.initialize();
        };

        // 停止选课按钮
        this.stopButton = document.createElement('button');
        this.stopButton.textContent = '停止选课';
        this.stopButton.style.cssText = `
            ${this.getButtonStyle()}
            background-color: #dc3545;
            color: white;
            border-color: #dc3545;
        `;
        this.stopButton.onclick = () => {
            courseManager.stopLoop();
            this.startButton.disabled = false;
            this.addButton.disabled = false;
        };

        // 状态显示按钮
        const statusButton = document.createElement('button');
        statusButton.textContent = '查看状态';
        statusButton.style.cssText = `
            ${this.getButtonStyle()}
            background-color: #6c757d;
            color: white;
            border-color: #6c757d;
        `;
        statusButton.onclick = () => {
            this.showStatusModal();
        };

        // 重置按钮
        const resetButton = document.createElement('button');
        resetButton.textContent = '重置';
        resetButton.style.cssText = `
            ${this.getButtonStyle()}
            background-color: #ffc107;
            color: black;
            border-color: #ffc107;
        `;
        resetButton.onclick = () => {
            this.showResetConfirmation();
        };

        // 按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-top: 15px;
        `;

        buttonContainer.appendChild(this.addButton);
        buttonContainer.appendChild(this.startButton);
        buttonContainer.appendChild(this.stopButton);
        buttonContainer.appendChild(statusButton);
        buttonContainer.appendChild(resetButton);

        this.panel.appendChild(this.container);
        this.panel.appendChild(buttonContainer);

        // 添加使用说明
        const helpText = document.createElement('div');
        helpText.style.cssText = `
            margin-top: 15px;
            padding: 10px;
            background-color: #e9ecef;
            border-radius: 5px;
            font-size: 12px;
            color: #495057;
            line-height: 1.4;
        `;
        helpText.innerHTML = `
            <strong>使用说明：</strong><br>
            1. 在输入框中输入课程ID<br>
            2. 点击"添加更多课程"可添加多个课程<br>
            3. 点击"开始选课"开始自动选课<br>
            4. 可拖动此面板到任意位置
        `;
        this.panel.appendChild(helpText);

        // Ensure panel is attached to DOM
        if (!this.panel.parentNode) {
            document.body.appendChild(this.panel);
        }
        return this.panel;
    }

    /**
     * 获取按钮基础样式
     * @returns {string} 按钮样式字符串
     */
    getButtonStyle() {
        return `
            padding: 8px 12px;
            border: 1px solid;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
            box-sizing: border-box;
        `;
    }

    /**
     * 初始化用户界面
     */
    initialize() {
        // 检查是否已存在控制面板
        if (document.getElementById('course-registration-panel')) {
            console.warn(`${CONFIG.LOG.LOG_PREFIX} 控制面板已存在`);
            return;
        }

        // 开始时显示悬浮按钮，而不是自动打开面板
        this.transitionToState(UI_STATES.FLOATING_BUTTON);

        // 课程状态变化监听器
        document.addEventListener('courses:started', () => {
            console.log(`${CONFIG.LOG.LOG_PREFIX} 选课开始事件触发`);
            this.isSelectingCourses = true;
            this.startTime = Date.now(); // 新选课开始时清零重新开始
            this.stopTime = null;

            // 如果当前是悬浮按钮状态，自动展开到主面板
            if (this.currentState === UI_STATES.FLOATING_BUTTON) {
                this.transitionToState(UI_STATES.FULL_PANEL);
            }

            // 自动展开状态面板（如果存在）
            if (this.statusModal && document.body.contains(this.statusModal)) {
                this.statusModal.style.display = 'block';
            }
        });

        document.addEventListener('courses:stopped', () => {
            console.log(`${CONFIG.LOG.LOG_PREFIX} 选课停止事件触发`);
            this.isSelectingCourses = false;
            this.stopTime = Date.now(); // 记录停止时间

            // 立即更新状态面板显示
            if (this.statusModal && document.body.contains(this.statusModal)) {
                this.updateStatusModal();
            }

            // 如果当前是迷你面板状态，自动最小化到悬浮按钮
            if (this.currentState === UI_STATES.MINIMIZED_STATUS) {
                this.transitionToState(UI_STATES.FLOATING_BUTTON);
            }
            // 停止状态更新定时器
            this.stopMinimizedStatusUpdates();
        });

        console.log(`${CONFIG.LOG.LOG_PREFIX} 用户界面初始化完成，开始显示悬浮按钮`);
    }

    /**
     * 销毁用户界面
     */
    destroy() {
        // 停止状态更新定时器
        this.stopMinimizedStatusUpdates();

        // 移除所有UI元素
        if (this.panel && this.panel.parentNode) {
            this.panel.parentNode.removeChild(this.panel);
        }
        if (this.floatingButton && this.floatingButton.parentNode) {
            this.floatingButton.parentNode.removeChild(this.floatingButton);
        }
        if (this.minimizedPanel && this.minimizedPanel.parentNode) {
            this.minimizedPanel.parentNode.removeChild(this.minimizedPanel);
        }

        // 移除事件监听器
        document.removeEventListener('courses:started', this.handleCoursesStarted);
        document.removeEventListener('courses:stopped', this.handleCoursesStopped);

        console.log(`${CONFIG.LOG.LOG_PREFIX} 用户界面已销毁`);
    }

    /**
     * 更新按钮状态
     * @param {boolean} isRunning - 是否正在运行
     */
    updateButtonStates(isRunning) {
        if (this.startButton && this.stopButton && this.addButton) {
            this.startButton.disabled = isRunning;
            this.stopButton.disabled = !isRunning;
            this.addButton.disabled = isRunning;
        }
    }

    /**
     * 显示状态详情弹窗
     */
    showStatusModal() {
        try {
            // 单例检查 - 防止重复创建
            if (this.statusModal && document.body.contains(this.statusModal)) {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 状态面板已存在，不重复创建`);
                // 将现有面板置于前台
                this.statusModal.style.zIndex = '10002';
                return;
            }

            const statusModal = document.createElement('div');
        statusModal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #6c757d;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10001;
            width: 550px;
            max-height: 70vh;
            overflow-y: auto;
            font-family: Arial, sans-serif;
            resize: both;
            min-width: 400px;
            min-height: 300px;
        `;

        // 创建标题栏
        const titleBar = document.createElement('div');
        titleBar.className = 'status-title-bar';
        titleBar.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #dee2e6;
            cursor: grab;
        `;

        const title = document.createElement('h4');
        title.textContent = '📊 选课状态详情';
        title.style.cssText = `
            margin: 0;
            color: #333;
            font-size: 18px;
        `;

        const closeButton = document.createElement('button');
        closeButton.textContent = '✕';
        closeButton.style.cssText = `
            background: none;
            border: none;
            font-size: 20px;
            color: #6c757d;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.color = '#000';
        });

        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.color = '#6c757d';
        });

        titleBar.appendChild(title);
        titleBar.appendChild(closeButton);

        // 创建状态内容容器
        const statusContent = document.createElement('div');
        statusContent.id = 'status-modal-content';

        statusModal.appendChild(titleBar);
        statusModal.appendChild(statusContent);

        // 添加拖拽功能，只允许通过标题栏拖拽
        this.makeDraggable(statusModal, titleBar);

        // 确保拖拽时不会意外关闭
        statusModal.addEventListener('mousedown', (e) => {
            if (e.target === statusModal || statusModal.contains(e.target)) {
                e.stopPropagation();
            }
        });

        document.body.appendChild(statusModal);

        // 设置statusModal引用和ID
        this.statusModal = statusModal;
        statusModal.id = 'course-status-modal';

        // 启动状态更新定时器
        this.startStatusModalUpdates();

        // 关闭事件处理
        const closeModal = () => {
            this.stopStatusModalUpdates();
            this.statusModal = null; // 清除引用
            if (document.body.contains(statusModal)) {
                document.body.removeChild(statusModal);
            }
        };

        closeButton.onclick = closeModal;

        // ESC键关闭
        const escHandler = (e) => {
            if (e.key === 'Escape' && document.body.contains(statusModal)) {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // 点击背景不关闭（确保用户主动关闭）
        statusModal.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        } catch (error) {
            console.error(`${CONFIG.LOG.LOG_PREFIX} 创建状态面板失败:`, error);
            this.showNotification('状态面板创建失败，请重试', 'error');
        }
    }

    /**
     * 启动状态弹窗更新
     */
    startStatusModalUpdates() {
        this.statusModalUpdateInterval = setInterval(() => {
            this.updateStatusModal();
        }, 1000);
        // 立即更新一次
        this.updateStatusModal();
    }

    /**
     * 更新状态弹窗内容
     */
    updateStatusModal() {
        const statusContainer = document.getElementById('status-modal-content');
        if (!statusContainer) return;

        const status = courseManager.getStatus();
        const runTime = this.calculateRunTime();
        const formattedTime = this.formatRunTime(runTime);

        let contentHTML = `
            <div style="margin-bottom: 20px;">
                <h5 style="margin: 0 0 10px 0; color: #495057;">📈 总体状态</h5>
                <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; border-left: 4px solid ${status.isRunning ? '#28a745' : '#dc3545'};">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span><strong>运行状态:</strong></span>
                        <span style="color: ${status.isRunning ? '#28a745' : '#dc3545'}; font-weight: bold;">
                            ${status.isRunning ? '🟢 选课进行中' : '🔴 已停止'}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span><strong>总课程数:</strong></span>
                        <span>${status.totalCourses}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span><strong>成功数量:</strong></span>
                        <span style="color: ${status.successCount === status.totalCourses ? '#28a745' : '#ffc107'};">
                            ${status.successCount}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span><strong>运行时间:</strong></span>
                        <span>${formattedTime}</span>
                    </div>
                </div>
            </div>
        `;

        if (status.courses.length > 0) {
            contentHTML += `
                <div>
                    <h5 style="margin: 0 0 10px 0; color: #495057;">📚 课程详情</h5>
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 6px;">
            `;

            status.courses.forEach((course, index) => {
                // 修正状态显示逻辑，增加"待进行"状态
                let statusIcon, statusColor, statusText, statusBgColor;
                if (course.success) {
                    statusIcon = '✅';
                    statusColor = '#28a745';
                    statusText = '已成功';
                    statusBgColor = '#d4edda';
                } else if (status.isRunning) {
                    statusIcon = '⏳';
                    statusColor = '#007bff';
                    statusText = '进行中';
                    statusBgColor = '#d1ecf1';
                } else {
                    statusIcon = '⏸️';
                    statusColor = '#6c757d';
                    statusText = '待进行';
                    statusBgColor = '#f8f9fa';
                }

                contentHTML += `
                    <div style="padding: 8px 0; ${index < status.courses.length - 1 ? 'border-bottom: 1px solid #dee2e6;' : ''}">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <span style="font-weight: bold; color: #495057;">
                                ${statusIcon} ${course.id}
                            </span>
                            <span style="color: ${statusColor}; font-size: 12px; padding: 2px 8px; background: ${statusBgColor}; border-radius: 12px;">
                                ${statusText}
                            </span>
                        </div>
                        <div style="font-size: 11px; color: #6c757d;">
                            实验班数量: ${course.experimentalClassCount} |
                            就绪状态: ${course.glReady ? '✅ 已就绪' : '⏳ 加载中'}
                        </div>
                    </div>
                `;
            });

            contentHTML += `
                    </div>
                </div>
            `;
        } else {
            contentHTML += `
                <div style="text-align: center; padding: 20px; color: #6c757d; background: #f8f9fa; border-radius: 6px;">
                    <div style="font-size: 16px; margin-bottom: 4px;">📝</div>
                    <div>暂无课程，请先添加课程</div>
                </div>
            `;
        }

        statusContainer.innerHTML = contentHTML;
    }

    /**
     * 停止状态弹窗更新
     */
    stopStatusModalUpdates() {
        if (this.statusModalUpdateInterval) {
            clearInterval(this.statusModalUpdateInterval);
            this.statusModalUpdateInterval = null;
        }
    }

    /**
     * 显示重置确认弹窗
     */
    showResetConfirmation() {
        const status = courseManager.getStatus();
        const isRunning = status.isRunning;
        const hasActiveCourses = status.courses.some(course => !course.success);

        const confirmDialog = document.createElement('div');
        confirmDialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 3px solid #dc3545;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10001;
            min-width: 350px;
            font-family: Arial, sans-serif;
            animation: shake 0.5s ease-in-out;
        `;

        // 添加震动动画样式
        if (!document.getElementById('shake-animation-styles')) {
            const shakeStyle = document.createElement('style');
            shakeStyle.id = 'shake-animation-styles';
            shakeStyle.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translate(-50%, -50%) translateX(0); }
                    25% { transform: translate(-50%, -50%) translateX(-10px); }
                    75% { transform: translate(-50%, -50%) translateX(10px); }
                }
            `;
            document.head.appendChild(shakeStyle);
        }

        let warningContent = '';
        let warningLevel = '';

        if (isRunning && hasActiveCourses) {
            warningLevel = 'high';
            warningContent = `
                <div style="background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin: 10px 0; border: 1px solid #f5c6cb;">
                    <div style="display: flex; align-items: center; margin-bottom: 5px;">
                        <span style="font-size: 18px; margin-right: 8px;">⚠️</span>
                        <strong>极度危险操作警告</strong>
                    </div>
                    选课正在进行中且有未完成的课程！
                </div>
            `;
        } else if (isRunning) {
            warningLevel = 'medium';
            warningContent = `
                <div style="background: #fff3cd; color: #856404; padding: 10px; border-radius: 4px; margin: 10px 0; border: 1px solid #ffeaa7;">
                    <div style="display: flex; align-items: center; margin-bottom: 5px;">
                        <span style="font-size: 18px; margin-right: 8px;">⚠️</span>
                        <strong>警告</strong>
                    </div>
                    选课正在进行中！
                </div>
            `;
        }

        const impactList = [];
        if (isRunning) impactList.push('• 停止正在进行的选课进程');
        if (status.totalCourses > 0) {
            impactList.push(`• 清除所有 ${status.totalCourses} 门课程数据`);
            impactList.push(`• 丢失 ${status.successCount} 门已成功的选课结果`);
        }
        if (status.totalCourses > 0) impactList.push('• 恢复到初始状态');
        impactList.push('• 需要重新添加所有课程');

        confirmDialog.innerHTML = `
            <h4 style="margin: 0 0 15px 0; color: #dc3545; display: flex; align-items: center;">
                <span style="font-size: 24px; margin-right: 10px;">🔄</span>
                确认重置所有状态
            </h4>

            ${warningContent}

            <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #6c757d;">
                <div style="font-weight: bold; margin-bottom: 8px; color: #495057;">当前状态摘要：</div>
                <div style="font-size: 13px; line-height: 1.5;">
                    • 运行状态：${isRunning ? '🟢 选课进行中' : '🔴 已停止'}<br>
                    ${status.totalCourses > 0 ? `• 总课程数：${status.totalCourses} 门` : ''}<br>
                    ${status.successCount > 0 ? `• 成功数量：${status.successCount} 门` : ''}<br>
                    ${hasActiveCourses ? `• 进行中：${status.courses.filter(c => !c.success).length} 门` : ''}
                </div>
            </div>

            <div style="background: #fff; border: 1px solid #dee2e6; padding: 12px; border-radius: 6px; margin: 15px 0;">
                <div style="font-weight: bold; margin-bottom: 8px; color: #dc3545;">重置后将发生：</div>
                <div style="font-size: 13px; line-height: 1.6; color: #495057;">
                    ${impactList.join('<br>')}
                </div>
            </div>

            ${isRunning ? `
                <div style="background: #ffebee; color: #c62828; padding: 10px; border-radius: 4px; margin: 15px 0; font-size: 12px; text-align: center; font-weight: bold;">
                    💡 提示：如非必要，建议先停止选课再重置
                </div>
            ` : ''}

            <div style="text-align: center; margin-top: 20px;">
                <button id="cancel-reset" style="
                    margin-right: 10px;
                    padding: 8px 20px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                ">取消重置</button>
                <button id="confirm-reset" style="
                    padding: 8px 20px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                    ${isRunning && hasActiveCourses ? 'animation: pulse 1s infinite;' : ''}
                ">确认重置</button>
            </div>
        `;

        // 添加脉冲动画（如果需要）
        if (isRunning && hasActiveCourses && !document.getElementById('pulse-animation-styles')) {
            const pulseStyle = document.createElement('style');
            pulseStyle.id = 'pulse-animation-styles';
            pulseStyle.textContent = `
                @keyframes pulse {
                    0% { background-color: #dc3545; }
                    50% { background-color: #c82333; }
                    100% { background-color: #dc3545; }
                }
            `;
            document.head.appendChild(pulseStyle);
        }

        document.body.appendChild(confirmDialog);

        // 事件绑定
        document.getElementById('cancel-reset').onclick = () => {
            document.body.removeChild(confirmDialog);
        };

        document.getElementById('confirm-reset').onclick = () => {
            document.body.removeChild(confirmDialog);
            this.executeReset();
        };

        // ESC键取消
        const escHandler = (e) => {
            if (e.key === 'Escape' && document.body.contains(confirmDialog)) {
                document.body.removeChild(confirmDialog);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // 阻止点击背景关闭
        confirmDialog.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    /**
     * 执行重置操作
     */
    executeReset() {
        console.log(`${CONFIG.LOG.LOG_PREFIX} 用户确认重置，开始执行重置操作`);

        // 重置课程管理器
        courseManager.reset();

        // 重置UI状态
        this.container.innerHTML = '';
        this.container.appendChild(this.createCourseInput(0, CONFIG.GRAB.DEFAULT_COURSE_TYPE));
        this.updateScrollableContainer();
        this.updateButtonStates(false);

        // 显示通知
        this.showNotification('所有状态已重置', 'info');

        console.log(`${CONFIG.LOG.LOG_PREFIX} 重置操作完成`);
    }

    /**
     * 计算运行时间（工具方法）
     * @returns {number} 运行时间（秒）
     */
    calculateRunTime() {
        if (!this.startTime) return 0;

        if (this.isSelectingCourses) {
            // 选课进行中：计算从开始到现在的时间
            return Math.floor((Date.now() - this.startTime) / 1000);
        } else if (this.stopTime) {
            // 选课已停止：计算从开始到停止的时间
            return Math.floor((this.stopTime - this.startTime) / 1000);
        } else {
            // 异常情况：默认为0
            return 0;
        }
    }

    /**
     * 格式化运行时间显示
     * @param {number} seconds - 秒数
     * @returns {string} 格式化的时间字符串 "HH:MM:SS"
     */
    formatRunTime(seconds) {
        if (seconds < 0) return '00:00:00';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * 显示通知消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 ('success', 'error', 'info', 'warning')
     */
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        // 根据类型设置背景色
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#007bff'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        notification.textContent = message;

        // 添加到页面
        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);

        // 自动移除
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 显示关闭确认对话框
     */
    showCloseConfirmation() {
        try {
            // 检查是否已有确认对话框
            if (document.getElementById('close-confirmation-dialog')) {
                return;
            }

            // 获取当前状态
            const status = this.courseManager.getStatus();
            const isRunning = status.isRunning;
            const hasActiveCourses = status.courses.some(course => !course.success);
            const successCount = status.successCount;
            const totalCourses = status.totalCourses;

            // 根据状态确定警告级别
            let warningLevel = 'low'; // low, medium, high
            let warningTitle = '确认关闭';
            let warningMessage = '关闭后将无法自动选课';

            if (isRunning && hasActiveCourses) {
                warningLevel = 'high';
                warningTitle = '⚠️ 严重警告';
                warningMessage = `正在选课中！关闭将导致${totalCourses - successCount}门课程无法完成选课！`;
            } else if (hasActiveCourses) {
                warningLevel = 'medium';
                warningTitle = '⚠️ 重要提醒';
                warningMessage = `还有${totalCourses - successCount}门课程未完成选课！`;
            }

            // 确定颜色方案
            const colorSchemes = {
                low: {
                    bg: '#f8f9fa',
                    border: '#6c757d',
                    title: '#343a40',
                    buttonBg: '#6c757d'
                },
                medium: {
                    bg: '#fff3cd',
                    border: '#ffc107',
                    title: '#856404',
                    buttonBg: '#ffc107'
                },
                high: {
                    bg: '#f8d7da',
                    border: '#dc3545',
                    title: '#721c24',
                    buttonBg: '#dc3545'
                }
            };

            const colors = colorSchemes[warningLevel];

            // 创建确认对话框
            const confirmDialog = document.createElement('div');
            confirmDialog.id = 'close-confirmation-dialog';
            confirmDialog.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.6);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10003;
                font-family: Arial, sans-serif;
                animation: fadeIn 0.3s ease-out;
            `;

            // 创建对话框内容
            const dialogContent = document.createElement('div');
            dialogContent.style.cssText = `
                background: ${colors.bg};
                border: 2px solid ${colors.border};
                border-radius: 12px;
                padding: 25px;
                max-width: 450px;
                width: 90%;
                text-align: center;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                animation: slideDown 0.3s ease-out;
            `;

            dialogContent.innerHTML = `
                <h3 style="margin: 0 0 15px 0; color: ${colors.title}; font-size: 20px; font-weight: bold;">
                    ${warningTitle}
                </h3>
                <div style="margin-bottom: 20px; color: #343a40; line-height: 1.5;">
                    <div style="margin-bottom: 15px; font-size: 16px;">
                        ${warningMessage}
                    </div>
                    <div style="background: rgba(0,0,0,0.05); padding: 12px; border-radius: 6px; margin: 15px 0;">
                        <div style="font-size: 14px; margin-bottom: 8px;">
                            <strong>当前状态：</strong>
                        </div>
                        <div style="font-size: 13px; color: #6c757d;">
                            • 总课程数：${totalCourses} 门<br>
                            • 已成功：${successCount} 门<br>
                            • 选课状态：${isRunning ? '正在运行' : '已停止'}<br>
                            • 关闭后：所有功能将完全停止
                        </div>
                    </div>
                    <div style="font-size: 14px; color: #6c757d; font-style: italic;">
                        确定要关闭选课助手程序吗？
                    </div>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button id="cancel-close" style="
                        margin-right: 12px;
                        padding: 10px 22px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        transition: background-color 0.2s;
                    " onmouseover="this.style.backgroundColor='#5a6268'"
                       onmouseout="this.style.backgroundColor='#6c757d'">取消</button>
                    <button id="confirm-close" style="
                        padding: 10px 22px;
                        background: ${colors.buttonBg};
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        transition: background-color 0.2s;
                        ${warningLevel === 'high' ? 'animation: pulse-red 1s infinite;' : ''}
                    " onmouseover="this.style.backgroundColor='${
                        warningLevel === 'high' ? '#c82333' :
                        warningLevel === 'medium' ? '#e0a800' : '#5a6268'
                    }'" onmouseout="this.style.backgroundColor='${colors.buttonBg}'">
                        确认关闭
                    </button>
                </div>
            `;

            confirmDialog.appendChild(dialogContent);

            // 添加动画样式（如果需要）
            if (warningLevel === 'high' && !document.getElementById('pulse-red-animation-styles')) {
                const pulseRedStyle = document.createElement('style');
                pulseRedStyle.id = 'pulse-red-animation-styles';
                pulseRedStyle.textContent = `
                    @keyframes pulse-red {
                        0% { background-color: #dc3545; box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
                        50% { background-color: #c82333; box-shadow: 0 0 0 8px rgba(220, 53, 69, 0); }
                        100% { background-color: #dc3545; box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideDown {
                        from { transform: translateY(-30px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `;
                document.head.appendChild(pulseRedStyle);
            }

            document.body.appendChild(confirmDialog);

            // 事件绑定
            document.getElementById('cancel-close').onclick = () => {
                try {
                    document.body.removeChild(confirmDialog);
                } catch (error) {
                    console.error('移除关闭确认对话框失败:', error);
                }
            };

            document.getElementById('confirm-close').onclick = () => {
                try {
                    document.body.removeChild(confirmDialog);
                    this.executeClose();
                } catch (error) {
                    console.error('关闭程序失败:', error);
                }
            };

            // 点击背景关闭（低风险时）
            if (warningLevel === 'low') {
                confirmDialog.onclick = (event) => {
                    if (event.target === confirmDialog) {
                        document.body.removeChild(confirmDialog);
                    }
                };
            }

            // ESC 键关闭
            const handleEscKey = (event) => {
                if (event.key === 'Escape' && document.body.contains(confirmDialog)) {
                    document.body.removeChild(confirmDialog);
                    document.removeEventListener('keydown', handleEscKey);
                }
            };
            document.addEventListener('keydown', handleEscKey);

        } catch (error) {
            console.error('显示关闭确认对话框失败:', error);
            this.showNotification('显示确认对话框失败，请重试', 'error');
        }
    }

    /**
     * 执行关闭程序操作
     */
    executeClose() {
        try {
            console.log('🛑 [关闭] 开始关闭选课助手程序...');

            // 1. 停止选课程序
            if (this.courseManager) {
                try {
                    this.courseManager.stopLoop();
                    console.log('🛑 [关闭] 选课程序已停止');
                } catch (error) {
                    console.error('🛑 [关闭] 停止选课程序失败:', error);
                }
            }

            // 2. 清理状态面板更新定时器
            if (this.statusModalUpdateInterval) {
                try {
                    clearInterval(this.statusModalUpdateInterval);
                    this.statusModalUpdateInterval = null;
                    console.log('🛑 [关闭] 状态面板更新定时器已清理');
                } catch (error) {
                    console.error('🛑 [关闭] 清理状态面板定时器失败:', error);
                }
            }

            // 3. 移除主面板
            if (this.controlPanel && document.body.contains(this.controlPanel)) {
                try {
                    document.body.removeChild(this.controlPanel);
                    this.controlPanel = null;
                    console.log('🛑 [关闭] 主控制面板已移除');
                } catch (error) {
                    console.error('🛑 [关闭] 移除主面板失败:', error);
                }
            }

            // 4. 移除状态面板
            if (this.statusModal && document.body.contains(this.statusModal)) {
                try {
                    document.body.removeChild(this.statusModal);
                    this.statusModal = null;
                    console.log('🛑 [关闭] 状态面板已移除');
                } catch (error) {
                    console.error('🛑 [关闭] 移除状态面板失败:', error);
                }
            }

            // 5. 清理全局引用
            try {
                // 清理 window 上的引用
                if (typeof window !== 'undefined') {
                    delete window.courseManager;
                    delete window.uiController;
                    delete window.stopLoop;
                    console.log('🛑 [关闭] 全局引用已清理');
                }
            } catch (error) {
                console.error('🛑 [关闭] 清理全局引用失败:', error);
            }

            // 6. 显示关闭成功消息
            const successMessage = document.createElement('div');
            successMessage.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                padding: 20px 30px;
                border-radius: 10px;
                font-family: Arial, sans-serif;
                font-size: 16px;
                font-weight: bold;
                z-index: 10004;
                box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
                animation: fadeInOut 2s ease-in-out;
            `;
            successMessage.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 20px; margin-bottom: 8px;">✅</div>
                    <div>选课助手已安全关闭</div>
                    <div style="font-size: 12px; margin-top: 8px; opacity: 0.9;">
                        感谢使用，祝您选课顺利！
                    </div>
                </div>
            `;

            // 添加消失动画
            if (!document.getElementById('close-success-animation-styles')) {
                const successStyle = document.createElement('style');
                successStyle.id = 'close-success-animation-styles';
                successStyle.textContent = `
                    @keyframes fadeInOut {
                        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                        20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                    }
                `;
                document.head.appendChild(successStyle);
            }

            document.body.appendChild(successMessage);

            // 2秒后移除成功消息
            setTimeout(() => {
                try {
                    if (successMessage.parentNode) {
                        document.body.removeChild(successMessage);
                    }
                } catch (error) {
                    console.error('移除关闭成功消息失败:', error);
                }
            }, 2000);

            // 7. 记录关闭日志
            console.log('✅ [关闭] 选课助手程序已完全关闭');
            console.log('🎓 [感谢] 感谢使用中南民族大学选课助手！');
            console.log('📝 [提醒] 如需重新使用，请刷新页面后重新运行脚本');

        } catch (error) {
            console.error('🚫 [关闭] 执行关闭程序时发生错误:', error);

            // 显示错误消息
            const errorMessage = document.createElement('div');
            errorMessage.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #dc3545;
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                z-index: 10004;
                box-shadow: 0 4px 15px rgba(220, 53, 69, 0.4);
            `;
            errorMessage.textContent = '关闭程序时发生错误，请手动刷新页面';

            document.body.appendChild(errorMessage);

            // 3秒后移除错误消息
            setTimeout(() => {
                try {
                    if (errorMessage.parentNode) {
                        document.body.removeChild(errorMessage);
                    }
                } catch (cleanupError) {
                    console.error('清理错误消息失败:', cleanupError);
                }
            }, 3000);
        }
    }

    /**
     * V1.1.1: 动态更新面板高度
     * 根据课程数量和内容动态调整面板高度在500px-800px之间
     */
    updatePanelHeight() {
        if (!this.panel) return;

        try {
            const courseCount = this.container ? this.container.children.length : 1;
            const { MIN_HEIGHT, MAX_HEIGHT, BASE_HEIGHT, COURSE_ITEM_HEIGHT } = CONFIG.UI.PANEL_HEIGHT;

            // 计算理想高度：基础高度 + 课程数量 * 单个课程高度
            const calculatedHeight = BASE_HEIGHT + (courseCount * COURSE_ITEM_HEIGHT);

            // 限制在最小和最大高度之间
            const finalHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, calculatedHeight));

            // 应用高度到面板
            this.panel.style.height = `${finalHeight}px`;

            // 如果课程数量超过阈值，启用容器滚动
            if (this.container && courseCount > CONFIG.UI.PANEL_HEIGHT.SCROLL_THRESHOLD) {
                const containerHeight = MAX_HEIGHT - BASE_HEIGHT - 50; // 预留按钮空间
                this.container.style.maxHeight = `${containerHeight}px`;
                this.container.style.overflowY = 'auto';
                this.container.style.paddingRight = '10px';

                // 添加自定义滚动条样式
                if (!document.getElementById('custom-scrollbar-styles')) {
                    const style = document.createElement('style');
                    style.id = 'custom-scrollbar-styles';
                    style.textContent = `
                        #course-registration-panel .course-input-container::-webkit-scrollbar {
                            width: ${CONFIG.UI.SCROLLABLE_CONTAINER.SCROLLBAR_WIDTH};
                        }
                        #course-registration-panel .course-input-container::-webkit-scrollbar-track {
                            background: #f1f1f1;
                            border-radius: 4px;
                        }
                        #course-registration-panel .course-input-container::-webkit-scrollbar-thumb {
                            background: #c1c1c1;
                            border-radius: 4px;
                        }
                        #course-registration-panel .course-input-container::-webkit-scrollbar-thumb:hover {
                            background: #a8a8a8;
                        }
                    `;
                    document.head.appendChild(style);
                }
            } else if (this.container) {
                // 课程数量较少时，禁用滚动
                this.container.style.maxHeight = 'none';
                this.container.style.overflowY = 'visible';
                this.container.style.paddingRight = '0';
            }

            console.log(`${CONFIG.LOG.LOG_PREFIX} 面板高度已更新: ${finalHeight}px (课程数量: ${courseCount})`);
        } catch (error) {
            console.error(`${CONFIG.LOG.LOG_PREFIX} 更新面板高度失败:`, error);
        }
    }
}

// 创建全局UI控制器实例
export const uiController = new UIController();

// 暴露到全局作用域
if (typeof window !== 'undefined') {
    window.uiController = uiController;
}

export default uiController;