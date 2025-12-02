/**
 * 中南民族大学自动选课助手 - 用户界面控制模块
 * 负责创建和管理选课助手的用户界面
 *
 * @author SuShuHeng <https://github.com/sushuheng>
 * @license APACHE 2.0
 * @version 1.0.1
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
    constructor() {
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
        this.statusUpdateInterval = null;
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
            // 使面板可拖拽
            this.makeDraggable(this.panel);
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
            courseItem.style.cssText = `
                padding: 2px 0;
                color: ${course.success ? '#28a745' : '#6c757d'};
            `;
            courseItem.textContent = `${course.id} ${course.success ? '✅' : '⏳'}`;
            courseList.appendChild(courseItem);
        });

        // 运行时间
        const runTime = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
        const hours = Math.floor(runTime / 3600);
        const minutes = Math.floor((runTime % 3600) / 60);
        const seconds = runTime % 60;

        const timeInfo = document.createElement('div');
        timeInfo.innerHTML = `<strong>运行时间:</strong> ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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

        // 检查长度（课程ID通常为8-12位数字）
        if (trimmedId.length < 8 || trimmedId.length > 12) {
            return false;
        }

        // 检查是否为纯数字（根据实际情况调整）
        return /^\d+$/.test(trimmedId);
    }

    /**
     * 使元素可拖拽
     * @param {HTMLElement} element - 要拖拽的元素
     */
    makeDraggable(element) {
        let offsetX = 0;
        let offsetY = 0;
        let isMouseDown = false;

        element.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            offsetX = e.clientX - element.offsetLeft;
            offsetY = e.clientY - element.offsetTop;
            element.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (isMouseDown) {
                element.style.left = `${e.clientX - offsetX}px`;
                element.style.top = `${e.clientY - offsetY}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            isMouseDown = false;
            element.style.cursor = 'grab';
        });

        // 设置初始鼠标样式
        element.style.cursor = 'grab';
    }

    /**
     * 创建课程输入框
     * @param {number} index - 课程索引
     * @returns {HTMLElement} 课程输入框容器
     */
    createCourseInput(index) {
        const div = document.createElement('div');
        div.style.marginBottom = '10px';

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

        div.appendChild(inputId);
        div.appendChild(inputName);

        // 重构：实现课程替换与更新逻辑
        inputId.addEventListener('blur', () => {
            const newJxbid = inputId.value.trim();
            const oldJxbid = inputId.dataset.currentCourseId || '';

            if (newJxbid && this.isValidCourseId(newJxbid)) {
                if (oldJxbid && oldJxbid !== newJxbid) {
                    // 替换课程情况
                    const updated = courseManager.updateCourse(oldJxbid, newJxbid);
                    if (updated) {
                        inputId.dataset.currentCourseId = newJxbid;
                        this.showNotification(`课程已更新: ${oldJxbid} → ${newJxbid}`, 'success');
                    } else {
                        // 更新失败，恢复原值
                        inputId.value = oldJxbid;
                        this.showNotification(`课程更新失败: ${newJxbid}`, 'error');
                    }
                } else if (!oldJxbid) {
                    // 新增课程情况
                    const added = courseManager.addCourse(newJxbid);
                    if (added) {
                        inputId.dataset.currentCourseId = newJxbid;
                        this.showNotification(`课程 ${newJxbid} 添加成功`, 'success');
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

        // 创建标题栏容器
        const titleBar = document.createElement('div');
        titleBar.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 0 0 15px 0;
            position: relative;
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

        titleBar.appendChild(title);
        titleBar.appendChild(minimizeButton);
        this.panel.appendChild(titleBar);

        // 课程输入容器
        this.container = document.createElement('div');
        this.container.id = 'course-container';

        // 添加第一个输入框
        this.container.appendChild(this.createCourseInput(0));

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
            this.container.appendChild(this.createCourseInput(courseCount));
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
            const status = courseManager.getStatus();
            alert(`选课状态：\n总课程数：${status.totalCourses}\n成功数量：${status.successCount}\n运行状态：${status.isRunning ? '运行中' : '已停止'}`);
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
            if (confirm('确定要重置所有状态吗？')) {
                courseManager.reset();
                this.container.innerHTML = '';
                this.container.appendChild(this.createCourseInput(0));
                this.startButton.disabled = false;
                this.addButton.disabled = false;
            }
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
            this.isSelectingCourses = true;
            this.startTime = Date.now();
            console.log(`${CONFIG.LOG.LOG_PREFIX} 课程开始，UI状态更新为选课中`);
            // 如果当前是悬浮按钮状态，自动展开到主面板
            if (this.currentState === UI_STATES.FLOATING_BUTTON) {
                this.transitionToState(UI_STATES.FULL_PANEL);
            }
        });

        document.addEventListener('courses:stopped', () => {
            this.isSelectingCourses = false;
            console.log(`${CONFIG.LOG.LOG_PREFIX} 课程停止，UI状态更新为非选课中`);
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
}

// 创建全局UI控制器实例
export const uiController = new UIController();

// 暴露到全局作用域
if (typeof window !== 'undefined') {
    window.uiController = uiController;
}

export default uiController;