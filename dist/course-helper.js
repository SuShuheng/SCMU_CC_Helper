/**
 * 中南民族大学自动选课助手
 * 单文件版本 - 直接复制粘贴到浏览器控制台使用
 *
 * @author SuShuHeng <https://github.com/sushuheng>
 * @license APACHE 2.0
 * @version 1.0.1
 * @description 专为中南民族大学学生设计的自动化课程注册助手
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

(function() {
    'use strict';

    // ==================== 配置区域 ====================
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
            PANEL_STYLE: {
                position: 'fixed',
                top: '20px',
                left: '20px',
                padding: '20px',
                backgroundColor: '#f1f1f1',
                border: '1px solid #ccc',
                zIndex: '9999',
                fontSize: '16px',
                borderRadius: '10px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            },
            // 悬浮按钮样式
            FLOATING_BUTTON: {
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#007bff',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                cursor: 'pointer',
                zIndex: '9999',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none'
            },
            // 迷你状态面板样式
            MINIMIZED_PANEL: {
                width: '280px',
                minHeight: '180px',
                borderRadius: '8px',
                backgroundColor: 'white',
                border: '1px solid #ccc',
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                cursor: 'pointer',
                zIndex: '9999',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                padding: '15px',
                fontSize: '12px',
                fontFamily: 'Arial, sans-serif'
            },
            SCROLLABLE_CONTAINER: {
                MAX_COURSES_BEFORE_SCROLL: 4,
                CONTAINER_HEIGHT: '250px',
                SCROLLBAR_WIDTH: '8px'
            }
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
            LOG_PREFIX: '[选课助手]'
        }
    };

    // ==================== UI状态常量 ====================
    const UI_STATES = {
        FLOATING_BUTTON: 'floating_button',
        FULL_PANEL: 'full_panel',
        MINIMIZED_STATUS: 'minimized_status'
    };

    // ==================== 核心类定义 ====================

    /**
     * 课程注册管理器
     */
    class CourseRegistrationManager {
        constructor() {
            this.courses = [];
            this.statusMap = {};
            this.glJxbidMap = {};
            this.intervalId = null;
            this.initEventListeners();
        }

        initEventListeners() {
            // 监听自定义事件
            document.addEventListener('course:success', (event) => {
                const { courseId } = event.detail;
                console.log(`🎉 选课成功! 课程: ${courseId}`);
                this.showNotification(`成功抢到课程: ${courseId}`, 'success');
            });
        }

        initCourseState(jxbid) {
            this.statusMap[jxbid] = {
                success: false,
                glReady: false,
                glAttemptIndex: 0
            };
        }

        async fetchExperimentalClasses(jxbid) {
            const url = `${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.GET_EXPERIMENTAL_CLASS}${encodeURIComponent(jxbid)}`;

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    credentials: CONFIG.HTTP.CREDENTIALS,
                    headers: CONFIG.HTTP.HEADERS
                });

                const data = await response.json();

                if (!Array.isArray(data)) {
                    console.warn(`⚠️ [${jxbid}] 实验班数据返回异常:`, data);
                    return [];
                }

                return data.map(item => item.jxbid).filter(Boolean);
            } catch (error) {
                console.error(`🚫 [${jxbid}] 获取实验班失败:`, error);
                return [];
            }
        }

        checkCourseFull(html) {
            return CONFIG.GRAB.COURSE_FULL_KEYWORDS.some(keyword => html.includes(keyword));
        }

        async trySelectCourse(jxbid) {
            const state = this.statusMap[jxbid];

            if (state.success || !state.glReady) return;

            const glList = this.glJxbidMap[jxbid];
            let url = "";
            let glInfo = "";

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
                        console.error(`🚫 [${jxbid}] 返回非 JSON 数据：`, html.substring(0, 100));
                    }
                    throw new Error(`请求失败：HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    console.log(`✅ [成功] ${jxbid}${glInfo} 选课成功！时间: ${data.xksj || new Date().toLocaleTimeString()}`);
                    state.success = true;

                    // 触发成功事件
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

        startLoop() {
            if (this.intervalId) {
                console.warn("定时器已启动！请不要重复启动！");
                return;
            }

            console.log(`${CONFIG.LOG.LOG_PREFIX} 开始选课，轮询间隔: ${CONFIG.GRAB.POLLING_INTERVAL}ms`);

            this.intervalId = setInterval(() => {
                this.courses.forEach(jxbid => {
                    this.trySelectCourse(jxbid);
                });
            }, CONFIG.GRAB.POLLING_INTERVAL);

            // 发出课程开始事件
            document.dispatchEvent(new CustomEvent('courses:started'));
        }

        stopLoop() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
                console.log(`${CONFIG.LOG.LOG_PREFIX} 定时器已停止！`);

                // 发出课程停止事件
                document.dispatchEvent(new CustomEvent('courses:stopped'));
            } else {
                console.log(`${CONFIG.LOG.LOG_PREFIX} 定时器未启动，无法停止！`);
            }
        }

        addCourse(jxbid) {
            // 基础验证
            if (!jxbid || jxbid.trim() === '') {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 课程ID不能为空`);
                return false;
            }

            const trimmedId = jxbid.trim();

            // 检查是否已存在
            if (this.courses.includes(trimmedId)) {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 课程 ${trimmedId} 已存在，无需重复添加`);
                return false;
            }

            // 添加课程
            this.courses.push(trimmedId);
            this.initCourseState(trimmedId);
            console.log(`${CONFIG.LOG.LOG_PREFIX} 已添加课程: ${trimmedId}`);
            return true;
        }

        // 添加移除课程方法
        removeCourse(jxbid) {
            const index = this.courses.indexOf(jxbid);
            if (index !== -1) {
                this.courses.splice(index, 1);
                delete this.statusMap[jxbid];
                delete this.glJxbidMap[jxbid];
                console.log(`${CONFIG.LOG.LOG_PREFIX} 已移除课程: ${jxbid}`);

                // 检查课程列表是否为空，如果为空且正在选课则自动停止
                this.checkEmptyCourseList();
                return true;
            }
            console.warn(`${CONFIG.LOG.LOG_PREFIX} 课程 ${jxbid} 不存在，无法移除`);
            return false;
        }

        // 添加课程更新/替换方法
        updateCourse(oldCourseId, newCourseId) {
            // 验证新课程ID格式
            if (!newCourseId || newCourseId.trim() === '') {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 新课程ID不能为空`);
                return false;
            }

            const trimmedNewId = newCourseId.trim();

            // 验证格式
            if (trimmedNewId.length < 8 || trimmedNewId.length > 12 || !/^\d+$/.test(trimmedNewId)) {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 新课程ID格式无效: ${trimmedNewId}`);
                return false;
            }

            // 如果新课程ID与旧课程ID相同，无需更新
            if (oldCourseId === trimmedNewId) {
                console.log(`${CONFIG.LOG.LOG_PREFIX} 课程ID相同，无需更新: ${trimmedNewId}`);
                return true;
            }

            // 如果存在旧课程ID，先删除它
            if (oldCourseId && this.courses.includes(oldCourseId)) {
                this.removeCourse(oldCourseId);
                console.log(`${CONFIG.LOG.LOG_PREFIX} 已删除旧课程: ${oldCourseId}`);
            }

            // 添加新课程
            return this.addCourse(trimmedNewId);
        }

        // 添加运行时动态添加课程方法
        async addCourseRuntime(jxbid) {
            // 基础验证
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
                    // 即使实验班加载失败，课程仍然添加成功，只是状态未就绪
                    return true;
                }
            }

            return true;
        }

        // 添加课程状态获取方法
        getStatusForCourse(jxbid) {
            const status = this.statusMap[jxbid];
            if (!status) return '未知状态';

            if (status.success) return '选课成功';
            if (!status.glReady) return '加载实验班中...';
            return '正在尝试选课';
        }

        // 添加空列表检查和自动停止逻辑
        checkEmptyCourseList() {
            if (this.courses.length === 0 && this.intervalId) {
                console.log(`${CONFIG.LOG.LOG_PREFIX} 课程列表为空，自动停止选课`);
                this.stopLoop();

                // 触发自动停止事件
                const event = new CustomEvent('selection:auto-stopped', {
                    detail: { reason: 'empty_course_list', timestamp: Date.now() }
                });
                document.dispatchEvent(event);
            }
        }

        async initialize() {
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

        getStatus() {
            return {
                totalCourses: this.courses.length,
                successCount: this.courses.filter(id => this.statusMap[id]?.success).length,
                isRunning: !!this.intervalId,
                courses: this.courses.map(id => ({
                    id,
                    success: this.statusMap[id]?.success || false,
                    glReady: this.statusMap[id]?.glReady || false,
                    experimentalClassCount: this.glJxbidMap[id]?.length || 0
                }))
            };
        }

        reset() {
            this.stopLoop();
            this.courses = [];
            this.statusMap = {};
            this.glJxbidMap = {};
            console.log(`${CONFIG.LOG.LOG_PREFIX} 所有状态已重置`);
        }

        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                padding: 15px 20px;
                border-radius: 5px;
                color: white;
                font-weight: bold;
                z-index: 10000;
                min-width: 200px;
                text-align: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;

            const colors = {
                success: '#28a745',
                error: '#dc3545',
                warning: '#ffc107',
                info: '#007bff'
            };
            notification.style.backgroundColor = colors[type] || colors.info;
            notification.textContent = message;

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
    }

    /**
     * 用户界面控制器
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
                this.courseManager.stopLoop();
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

            const status = this.courseManager.getStatus();
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

        // 添加课程ID验证方法
        isValidCourseId(courseId) {
            if (!courseId || courseId.trim() === '') {
                return false;
            }

            const trimmedId = courseId.trim();

            if (trimmedId.length < 8 || trimmedId.length > 12) {
                return false;
            }

            return /^\d+$/.test(trimmedId);
        }

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

            element.style.cursor = 'grab';
        }

        createCourseInput(index) {
            const div = document.createElement('div');
            div.style.marginBottom = '10px';

            const inputId = document.createElement('input');
            inputId.type = 'text';
            inputId.placeholder = `课程ID (课程${index + 1})`;
            inputId.style.cssText = `
                width: 150px;
                padding: 8px;
                margin-right: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 12px;
            `;

            const inputName = document.createElement('input');
            inputName.type = 'text';
            inputName.placeholder = '课程名称(可选)';
            inputName.style.cssText = `
                width: 120px;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 12px;
            `;

            // 创建删除按钮
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '删除该课程';
            deleteButton.style.cssText = `
                padding: 6px 10px;
                margin-left: 8px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
                color: white;
                background-color: #dc3545;
                transition: background-color 0.2s;
            `;

            // 添加删除按钮悬停效果
            deleteButton.addEventListener('mouseenter', () => {
                deleteButton.style.backgroundColor = '#c82333';
            });

            deleteButton.addEventListener('mouseleave', () => {
                deleteButton.style.backgroundColor = '#dc3545';
            });

            // 设置删除按钮点击事件
            deleteButton.onclick = () => this.handleDeleteCourse(div, inputId);

            div.appendChild(inputId);
            div.appendChild(inputName);
            div.appendChild(deleteButton);

            // 重构：实现课程替换与更新逻辑
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
                } else if (!oldJxbid) {
                    // 新增课程情况
                    let added;
                    if (isRunning) {
                        // 运行时添加，需要异步处理
                        added = await this.courseManager.addCourseRuntime(newJxbid);
                    } else {
                        added = this.courseManager.addCourse(newJxbid);
                    }

                    if (added) {
                        inputId.dataset.currentCourseId = newJxbid;
                        const message = isRunning ? `课程 ${newJxbid} 已添加到选课列表` : `课程 ${newJxbid} 添加成功`;
                        this.showNotification(message, 'success');
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
                const removed = this.courseManager.removeCourse(oldJxbid);
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

        // 添加按钮状态管理方法
        updateButtonStates(isRunning) {
            this.startButton.disabled = isRunning;
            this.stopButton.disabled = !isRunning;
            // 移除对添加按钮的禁用，允许运行时添加课程
            // this.addButton.disabled = isRunning;
        }

        // 添加删除确认对话框方法
        showDeleteConfirmation(courseId, courseName, onConfirm) {
            const courseStatus = this.courseManager.getStatusForCourse(courseId);

            const confirmDialog = document.createElement('div');
            confirmDialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border: 2px solid #dc3545;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10001;
                min-width: 300px;
                font-family: Arial, sans-serif;
            `;

            confirmDialog.innerHTML = `
                <h4 style="margin: 0 0 15px 0; color: #dc3545;">确认删除课程</h4>
                <p style="margin: 8px 0;"><strong>课程ID：</strong>${courseId}</p>
                <p style="margin: 8px 0;"><strong>课程名称：</strong>${courseName || '未填写'}</p>
                <p style="margin: 8px 0;"><strong>选课状态：</strong>${courseStatus}</p>
                <p style="margin: 15px 0; color: #6c757d;">确定要删除这个正在选课的课程吗？</p>
                <div style="text-align: right; margin-top: 20px;">
                    <button id="cancel-delete" style="margin-right: 10px; padding: 6px 16px; border: 1px solid #ccc; background: #f8f9fa; border-radius: 4px; cursor: pointer;">取消</button>
                    <button id="confirm-delete" style="padding: 6px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">确认删除</button>
                </div>
            `;

            document.body.appendChild(confirmDialog);

            // 事件绑定
            document.getElementById('cancel-delete').onclick = () => {
                document.body.removeChild(confirmDialog);
            };

            document.getElementById('confirm-delete').onclick = () => {
                document.body.removeChild(confirmDialog);
                onConfirm();
            };

            // ESC键取消
            const escHandler = (e) => {
                if (e.key === 'Escape' && document.body.contains(confirmDialog)) {
                    document.body.removeChild(confirmDialog);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        }

        // 添加执行删除课程方法
        executeDeleteCourse(courseRow, currentCourseId) {
            // 从管理器中删除课程
            if (currentCourseId) {
                this.courseManager.removeCourse(currentCourseId);
                this.showNotification(`课程 ${currentCourseId} 已删除`, 'info');
            }

            // 移除UI元素
            courseRow.remove();

            // 重新索引课程
            this.reindexCourses();

            // 更新滚动容器状态
            this.updateScrollableContainer();

            // 确保至少保留一个输入行
            if (this.container.children.length === 0) {
                this.container.appendChild(this.createCourseInput(0));
            }
        }

        // 修改删除课程处理方法
        handleDeleteCourse(courseRow, inputElement) {
            const currentCourseId = inputElement.dataset.currentCourseId;
            const isRunning = this.courseManager.intervalId !== null;

            // 如果选课正在进行中且有课程ID，显示确认对话框
            if (isRunning && currentCourseId) {
                const courseName = courseRow.querySelector('input[placeholder*="课程名称"]').value;
                this.showDeleteConfirmation(currentCourseId, courseName, () => {
                    this.executeDeleteCourse(courseRow, currentCourseId);
                });
            } else {
                // 直接删除
                this.executeDeleteCourse(courseRow, currentCourseId);
            }
        }

        // 添加课程重新索引方法
        reindexCourses() {
            Array.from(this.container.children).forEach((child, index) => {
                const inputId = child.querySelector('input[placeholder*="课程ID"]');
                if (inputId) {
                    inputId.placeholder = `课程ID (课程${index + 1})`;
                }
            });
        }

        // 添加滚动容器管理方法
        updateScrollableContainer() {
            const courseCount = this.container.children.length;

            if (courseCount > CONFIG.UI.SCROLLABLE_CONTAINER.MAX_COURSES_BEFORE_SCROLL) {
                this.enableScrolling();
            } else {
                this.disableScrolling();
            }
        }

        enableScrolling() {
            this.container.style.cssText += `
                max-height: ${CONFIG.UI.SCROLLABLE_CONTAINER.CONTAINER_HEIGHT};
                overflow-y: auto;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 10px;
                margin-bottom: 10px;
            `;

            // 添加自定义滚动条样式
            this.addCustomScrollbarStyles();
        }

        disableScrolling() {
            this.container.style.maxHeight = 'none';
            this.container.style.overflowY = 'visible';
            this.container.style.border = 'none';
            this.container.style.padding = '0';
            this.container.style.marginBottom = '0';
        }

        // 添加自定义滚动条样式
        addCustomScrollbarStyles() {
            if (document.getElementById('custom-scrollbar-styles')) return;

            const style = document.createElement('style');
            style.id = 'custom-scrollbar-styles';
            style.textContent = `
                #course-container::-webkit-scrollbar {
                    width: 8px;
                }

                #course-container::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                }

                #course-container::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 4px;
                }

                #course-container::-webkit-scrollbar-thumb:hover {
                    background: #a8a8a8;
                }
            `;
            document.head.appendChild(style);
        }

        createButton(text, onClick, color = '#007bff') {
            const button = document.createElement('button');
            button.textContent = text;
            button.style.cssText = `
                padding: 8px 12px;
                margin: 2px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                color: white;
                background-color: ${color};
                transition: background-color 0.2s;
            `;
            button.onclick = onClick;

            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = this.darkenColor(color);
            });

            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = color;
            });

            return button;
        }

        darkenColor(color) {
            // 简单的颜色变暗函数
            const num = parseInt(color.replace("#", ""), 16);
            const amt = -30;
            const r = (num >> 16) + amt;
            const g = (num >> 8 & 0x00FF) + amt;
            const b = (num & 0x0000FF) + amt;
            return "#" + (0x1000000 + (r < 255 ? r < 1 ? 0 : r : 255) * 0x10000 +
                (g < 255 ? g < 1 ? 0 : g : 255) * 0x100 +
                (b < 255 ? b < 1 ? 0 : b : 255))
                .toString(16).slice(1);
        }

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
            title.textContent = '🎓 中南民族大学自动选课助手';
            title.style.cssText = `
                margin: 0;
                color: #333;
                font-size: 16px;
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
            this.container.appendChild(this.createCourseInput(0));
            this.updateScrollableContainer(); // 添加滚动容器检查

            // 添加更多课程按钮
            this.addButton = this.createButton('➕ 添加课程', () => {
                const courseCount = this.container.children.length;
                this.container.appendChild(this.createCourseInput(courseCount));
                this.updateScrollableContainer(); // 添加滚动容器更新
            }, '#17a2b8');

            // 开始选课按钮
            this.startButton = this.createButton('🚀 开始选课', async () => {
                if (this.courseManager.courses.length === 0) {
                    alert('请先输入至少一个课程ID！');
                    return;
                }

                this.updateButtonStates(true);
                await this.courseManager.initialize();
            }, '#28a745');

            // 停止选课按钮
            this.stopButton = this.createButton('⏹️ 停止选课', () => {
                this.courseManager.stopLoop();
                this.updateButtonStates(false);
            }, '#dc3545');

            // 查看状态按钮
            const statusButton = this.createButton('📊 查看状态', () => {
                const status = this.courseManager.getStatus();
                const statusText = `
选课状态：
总课程数：${status.totalCourses}
成功数量：${status.successCount}
运行状态：${status.isRunning ? '🟢 运行中' : '🔴 已停止'}
                `;
                alert(statusText.trim());
            }, '#6c757d');

            // 重置按钮
            const resetButton = this.createButton('🔄 重置', () => {
                if (confirm('确定要重置所有状态吗？')) {
                    this.courseManager.reset();
                    this.container.innerHTML = '';
                    this.container.appendChild(this.createCourseInput(0));
                    this.updateScrollableContainer(); // 添加滚动容器更新
                    this.updateButtonStates(false);
                }
            }, '#fd7e14');

            // 按钮容器
            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = `
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin-top: 15px;
                justify-content: center;
            `;

            buttonContainer.appendChild(this.addButton);
            buttonContainer.appendChild(this.startButton);
            buttonContainer.appendChild(this.stopButton);
            buttonContainer.appendChild(statusButton);
            buttonContainer.appendChild(resetButton);

            // 使用说明
            const helpText = document.createElement('div');
            helpText.style.cssText = `
                margin-top: 15px;
                padding: 10px;
                background-color: #e9ecef;
                border-radius: 5px;
                font-size: 11px;
                color: #495057;
                line-height: 1.4;
            `;
            helpText.innerHTML = `
                <strong>📖 使用说明：</strong><br>
                1️⃣ 输入课程ID<br>
                2️⃣ 点击"开始选课"<br>
                3️⃣ 查看控制台日志<br>
                4️⃣ 可拖动此面板
            `;

            this.panel.appendChild(this.container);
            this.panel.appendChild(buttonContainer);
            this.panel.appendChild(helpText);

            // 添加版权信息区域
            const copyrightDiv = document.createElement('div');
            copyrightDiv.style.cssText = `
                margin-top: 15px;
                padding: 10px;
                font-size: 10px;
                color: #666;
                text-align: center;
                border-top: 1px solid #ddd;
                background-color: #f8f9fa;
                border-radius: 4px;
                line-height: 1.4;
            `;
            copyrightDiv.innerHTML = `
                © 2025 <a href="https://github.com/sushuheng" target="_blank" style="color: #007bff; text-decoration: none;">SuShuHeng</a> |
                <a href="https://github.com/sushuheng" target="_blank" style="color: #007bff; text-decoration: none;">GitHub</a> |
                APACHE 2.0 |
                <span style="color: #dc3545; font-weight: bold;">仅供学习使用</span><br>
                <small style="color: #999;">商业使用请联系作者 | 禁止以盈利目的使用</small>
            `;
            this.panel.appendChild(copyrightDiv);

            // Ensure panel is attached to DOM
            if (!this.panel.parentNode) {
                document.body.appendChild(this.panel);
            }
            return this.panel;
        }

        // 添加自动停止通知方法
        showAutoStopNotification() {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                background: #fd7e14;
                color: white;
                font-weight: bold;
                border-radius: 5px;
                z-index: 10000;
                max-width: 350px;
                word-wrap: break-word;
                opacity: 0;
                transition: opacity 0.3s ease;
                font-size: 14px;
            `;

            notification.textContent = '选课列表无选课课程，已自动结束选课状态';
            document.body.appendChild(notification);

            // 显示动画
            setTimeout(() => { notification.style.opacity = '1'; }, 10);

            // 2秒后自动移除
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 2000);
        }

        // 添加事件监听器初始化方法
        initEventListeners() {
            // 监听自动停止事件
            document.addEventListener('selection:auto-stopped', () => {
                this.showAutoStopNotification();
                this.updateButtonStates(false);

                // 确保至少保留一个空输入框
                if (this.container.children.length === 0) {
                    this.container.appendChild(this.createCourseInput(0));
                }
            });
        }

        // 添加showNotification方法以修复"this.showNotification is not a function"错误
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

        initialize() {
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
    }

    // ==================== 主程序入口 ====================

    // 创建管理器实例
    const courseManager = new CourseRegistrationManager();
    const uiController = new UIController(courseManager);

    // 初始化界面
    uiController.initialize();

    // 暴露到全局作用域
    window.courseManager = courseManager;
    window.uiController = uiController;
    window.stopLoop = () => courseManager.stopLoop();

    // 显示版权信息和启动消息
    console.log(`
🎓 中南民族大学自动选课助手 v1.0.1
👤 作者: SuShuHeng (https://github.com/sushuheng)
📜 许可证: APACHE 2.0
⚠️  免责声明: 本项目仅用于学习目的，请遵守学校相关规定
📧 商用请联系: https://github.com/sushuheng
⚖️  协议: http://www.apache.org/licenses/LICENSE-2.0

Licensed under the Apache License, Version 2.0

🚀 选课助手启动成功！
📝 使用方法：
   1. 在控制面板中输入课程ID
   2. 点击"开始选课"按钮
   3. 查看控制台日志了解进度
🔧 全局函数：
   - courseManager: 选课管理器
   - uiController: 界面控制器
   - stopLoop(): 停止选课
⚠️ 重要提醒：请仅在合法的选课时间使用本工具！
    `);

})();