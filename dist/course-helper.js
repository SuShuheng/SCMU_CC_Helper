/**
 * 中南民族大学自动选课助手
 * 单文件版本 - 直接复制粘贴到浏览器控制台使用
 * 支持7种课程类型的完整选课功能
 *
 * @author SuShuHeng <https://github.com/sushuheng>
 * @license APACHE 2.0
 * @version 2.0.0
 * @description 专为中南民族大学学生设计的自动化课程注册助手，支持所有选课类型
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
    // 课程类型配置
    const COURSE_TYPES = {
        TJXK: {
            method: 'handleTjxk',
            name: '推荐选课',
            needsGlJxbid: true,
            needsXkzy: false,
            description: '系统推荐的专业课程'
        },
        BFAK: {
            method: 'handleBfakc',
            name: '方案内选课',
            needsGlJxbid: true,
            needsXkzy: false,
            description: '培养方案内的必修课程'
        },
        KZYXK: {
            method: 'handleKzyxk',
            name: '方案外选课',
            needsGlJxbid: true,
            needsXkzy: false,
            description: '培养方案外的选修课程'
        },
        CXXK: {
            method: 'handleCxxk',
            name: '重修选课',
            needsGlJxbid: true,
            needsXkzy: false,
            description: '重修之前未通过的课程'
        },
        TYKXK: {
            method: 'handleTykxk',
            name: '体育选择课',
            needsGlJxbid: false,
            needsXkzy: false,
            description: '体育类选修课程'
        },
        QXGXK: {
            method: 'handleQxgxk',
            name: '通识课程选修',
            needsGlJxbid: true,
            needsXkzy: true,
            description: '通识教育选修课程'
        },
        CXCY: {
            method: 'handleCxcy',
            name: '创新创业类选修课',
            needsGlJxbid: false,
            needsXkzy: false,
            description: '创新创业教育类选修课程'
        }
    };

    const CONFIG = {
        API: {
            BASE_URL: 'https://xk.webvpn.scuec.edu.cn/xsxk',
            ENDPOINTS: {
                GET_EXPERIMENTAL_CLASS: '/loadData.xk?method=getGljxb&jxbid=',
                COURSE_OPERATION: '/xkOper.xk?method='
            }
        },
        COURSE_TYPES: COURSE_TYPES,
        GRAB: {
            POLLING_INTERVAL: 500,
            REQUEST_TIMEOUT: 10000,
            MAX_RETRY_COUNT: 3,
            COURSE_FULL_KEYWORDS: ['课程已满', '已选满'],
            DEFAULT_VOLUNTEER_LEVEL: 1,
            DEFAULT_COURSE_TYPE: 'KZYXK'
        },
        COURSE_ID: {
            VALIDATION_REGEX: /^[A-Za-z0-9_-]+$/,
            ERROR_MESSAGES: {
                EMPTY: '课程ID不能为空',
                INVALID_FORMAT: '课程ID只能包含字母、数字、下划线和连字符'
            }
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
            FLOATING_BUTTON: {
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#007bff',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                position: 'fixed',
                top: '20px',
                right: '20px',
                cursor: 'pointer',
                zIndex: '9999',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none'
            },
            MINIMIZED_PANEL: {
                width: '280px',
                minHeight: '180px',
                borderRadius: '8px',
                backgroundColor: 'white',
                border: '1px solid #ccc',
                position: 'fixed',
                top: '90px',
                right: '20px',
                cursor: 'pointer',
                zIndex: '9999',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                padding: '15px',
                fontSize: '12px',
                fontFamily: 'Arial, sans-serif'
            },
            BUTTON_STYLE: {
                marginTop: '10px',
                padding: '5px 10px',
                marginRight: '5px'
            },
            INPUT_STYLE: {
                marginRight: '10px',
                padding: '5px',
                marginBottom: '10px'
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
            LOG_PREFIX: '[选课助手]',
            LOG_LEVELS: {
                INFO: 'info',
                WARN: 'warn',
                ERROR: 'error',
                SUCCESS: 'success'
            }
        },
        Z_INDEX: {
            BASE_LAYER: 9999,
            NOTIFICATION: 10000,
            MODAL: 10001,
            DIALOG: 10002,
            OVERLAY: 10003,
            TOPMOST: 10004
        },
        DEV: {
            DEBUG_MODE: false,
            SHOW_DEBUG_INFO: false
        }
    };

    // ==================== 课程注册管理器 ====================
    class CourseRegistrationManager {
        constructor() {
            this.courses = [];
            this.statusMap = {};
            this.glJxbidMap = {};
            this.courseTypeMap = {};
            this.intervalId = null;

            this.initEventListeners();
        }

        /**
         * 构建选课API端点URL
         */
        buildCourseApiUrl(courseType, jxbid, glJxbid = '', xkzy = null) {
            const courseTypeInfo = CONFIG.COURSE_TYPES[courseType];
            if (!courseTypeInfo) {
                throw new Error(`未知的课程类型: ${courseType}`);
            }

            const baseUrl = `${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.COURSE_OPERATION}${courseTypeInfo.method}`;
            const params = new URLSearchParams();

            params.append('jxbid', jxbid);

            if (courseTypeInfo.needsGlJxbid && glJxbid) {
                params.append('glJxbid', glJxbid);
            }

            if (courseTypeInfo.needsXkzy && xkzy !== null) {
                params.append('xkzy', xkzy.toString());
            }

            return `${baseUrl}&${params.toString()}`;
        }

        initCourseState(jxbid, courseType = CONFIG.GRAB.DEFAULT_COURSE_TYPE) {
            this.statusMap[jxbid] = {
                success: false,
                glReady: false,
                glAttemptIndex: 0,
                courseType: courseType
            };
        }

        initEventListeners() {
            document.addEventListener('course:success', (event) => {
                const { courseId, courseType } = event.detail;
                const courseTypeInfo = CONFIG.COURSE_TYPES[courseType];
                console.log(`🎉 选课成功! 课程: ${courseId} [${courseTypeInfo.name}]`);
                this.showNotification(`成功抢到课程: ${courseId} [${courseTypeInfo.name}]`, 'success');
            });
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
            const courseType = this.courseTypeMap[jxbid] || CONFIG.GRAB.DEFAULT_COURSE_TYPE;

            if (state.success || !state.glReady) return;

            const glList = this.glJxbidMap[jxbid];
            let url = "";
            let glInfo = "";
            let courseTypeInfo = CONFIG.COURSE_TYPES[courseType];

            // 根据课程类型构建不同的请求参数
            if (courseTypeInfo.needsGlJxbid && glList && glList.length > 0) {
                if (state.glAttemptIndex >= glList.length) {
                    console.log(`❌ [${jxbid}] 所有实验班尝试失败`);
                    state.glAttemptIndex = 0;
                }

                const glJxbid = glList[state.glAttemptIndex];
                url = this.buildCourseApiUrl(courseType, jxbid, glJxbid,
                    courseTypeInfo.needsXkzy ? CONFIG.GRAB.DEFAULT_VOLUNTEER_LEVEL : null);
                glInfo = ` 实验班: ${glJxbid}`;
            } else {
                url = this.buildCourseApiUrl(courseType, jxbid, '',
                    courseTypeInfo.needsXkzy ? CONFIG.GRAB.DEFAULT_VOLUNTEER_LEVEL : null);
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
                        console.log(`⚠️ [${jxbid}][${courseTypeInfo.name}] 课程已满，但继续尝试`);
                    } else {
                        console.error(`🚫 [${jxbid}][${courseTypeInfo.name}] 返回非 JSON 数据：`, html);
                    }
                    throw new Error(`请求失败：HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    console.log(`✅ [${courseTypeInfo.name}][成功] ${jxbid}${glInfo} 选课成功！时间: ${data.xksj || new Date().toLocaleTimeString()}`);
                    state.success = true;

                    // 触发成功事件
                    const event = new CustomEvent('course:success', {
                        detail: { courseId: jxbid, courseType: courseType, timestamp: Date.now() }
                    });
                    document.dispatchEvent(event);
                } else {
                    console.log(`⚠️ [${courseTypeInfo.name}][${jxbid}] 选课失败${glInfo ? `，继续尝试下一个实验班` : ""}：`, data);

                    // 特殊错误处理
                    if (data.message && data.message.includes('未获取到教学班，非法操作')) {
                        console.warn(`⚠️ [${jxbid}] 可能是课程类型不匹配，当前使用: ${courseTypeInfo.name}`);
                    }

                    if (courseTypeInfo.needsGlJxbid && glList && glList.length > 0) {
                        state.glAttemptIndex++;
                    }
                }
            } catch (error) {
                console.error(`🚫 [${courseTypeInfo.name}][${jxbid}] 请求错误:`, error);
                if (courseTypeInfo.needsGlJxbid && glList && glList.length > 0) {
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

        addCourse(jxbid, courseType = CONFIG.GRAB.DEFAULT_COURSE_TYPE) {
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

            // 验证课程类型
            if (!CONFIG.COURSE_TYPES[courseType]) {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 未知的课程类型: ${courseType}`);
                return false;
            }

            // 验证格式
            if (!CONFIG.COURSE_ID.VALIDATION_REGEX.test(trimmedId)) {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 课程ID格式无效: ${trimmedId}`);
                return false;
            }

            // 添加课程
            this.courses.push(trimmedId);
            this.courseTypeMap[trimmedId] = courseType;
            this.initCourseState(trimmedId, courseType);

            const courseTypeInfo = CONFIG.COURSE_TYPES[courseType];
            console.log(`${CONFIG.LOG.LOG_PREFIX} 已添加课程: ${trimmedId} [${courseTypeInfo.name}]`);

            return true;
        }

        removeCourse(jxbid) {
            const index = this.courses.indexOf(jxbid);
            if (index !== -1) {
                this.courses.splice(index, 1);
                delete this.statusMap[jxbid];
                delete this.glJxbidMap[jxbid];
                delete this.courseTypeMap[jxbid];
                console.log(`${CONFIG.LOG.LOG_PREFIX} 已移除课程: ${jxbid}`);
                return true;
            }
            console.warn(`${CONFIG.LOG.LOG_PREFIX} 课程 ${jxbid} 不存在，无法移除`);
            return false;
        }

        updateCourse(oldCourseId, newCourseId, courseType = CONFIG.GRAB.DEFAULT_COURSE_TYPE) {
            // 验证新课程ID格式
            if (!newCourseId || newCourseId.trim() === '') {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 新课程ID不能为空`);
                return false;
            }

            const trimmedNewId = newCourseId.trim();

            // 验证格式
            if (!CONFIG.COURSE_ID.VALIDATION_REGEX.test(trimmedNewId)) {
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
            return this.addCourse(trimmedNewId, courseType);
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
                    courseType: this.courseTypeMap[id] || CONFIG.GRAB.DEFAULT_COURSE_TYPE,
                    courseTypeName: CONFIG.COURSE_TYPES[this.courseTypeMap[id] || CONFIG.GRAB.DEFAULT_COURSE_TYPE]?.name || '未知类型',
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
            this.courseTypeMap = {};
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
                z-index: ${CONFIG.Z_INDEX.NOTIFICATION};
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

    // ==================== UI控制器 ====================
    class UIController {
        constructor(courseManager) {
            this.courseManager = courseManager;
            this.panel = null;
            this.container = null;
            this.startButton = null;
            this.stopButton = null;
            this.addButton = null;
            this.floatingButton = null;
            this.currentState = 'FLOATING_BUTTON';
            this.isSelectingCourses = false;

            this.initialize();
        }

        initialize() {
            this.createFloatingButton();
            this.setupEventListeners();
        }

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

            // 课程添加/更新逻辑
            inputId.addEventListener('blur', () => {
                const newJxbid = inputId.value.trim();
                const oldJxbid = inputId.dataset.currentCourseId || '';
                const selectedCourseType = courseTypeSelector.value;

                if (newJxbid && this.isValidCourseId(newJxbid)) {
                    if (oldJxbid && oldJxbid !== newJxbid) {
                        // 替换课程情况
                        const updated = this.courseManager.updateCourse(oldJxbid, newJxbid, selectedCourseType);
                        if (updated) {
                            inputId.dataset.currentCourseId = newJxbid;
                            const courseTypeInfo = CONFIG.COURSE_TYPES[selectedCourseType];
                            this.courseManager.showNotification(`课程已更新: ${oldJxbid} → ${newJxbid} [${courseTypeInfo.name}]`, 'success');
                        } else {
                            inputId.value = oldJxbid;
                            this.courseManager.showNotification(`课程更新失败: ${newJxbid}`, 'error');
                        }
                    } else if (!oldJxbid) {
                        // 新增课程情况
                        const added = this.courseManager.addCourse(newJxbid, selectedCourseType);
                        if (added) {
                            inputId.dataset.currentCourseId = newJxbid;
                            const courseTypeInfo = CONFIG.COURSE_TYPES[selectedCourseType];
                            this.courseManager.showNotification(`课程 ${newJxbid} 添加成功 [${courseTypeInfo.name}]`, 'success');
                        } else {
                            inputId.value = '';
                            inputId.dataset.currentCourseId = '';
                            this.courseManager.showNotification(`课程 ${newJxbid} 添加失败或已存在`, 'warning');
                        }
                    }
                } else if (newJxbid) {
                    this.courseManager.showNotification(`课程ID格式无效: ${newJxbid}`, 'error');
                    inputId.value = oldJxbid || '';
                } else if (oldJxbid) {
                    // 清空输入，删除课程
                    const removed = this.courseManager.removeCourse(oldJxbid);
                    if (removed) {
                        inputId.dataset.currentCourseId = '';
                        this.courseManager.showNotification(`课程 ${oldJxbid} 已删除`, 'info');
                    }
                }
            });

            // Enter键支持
            inputId.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    inputId.blur();
                }
            });

            return div;
        }

        isValidCourseId(courseId) {
            return CONFIG.COURSE_ID.VALIDATION_REGEX.test(courseId);
        }

        createFloatingButton() {
            this.floatingButton = document.createElement('div');
            Object.assign(this.floatingButton.style, CONFIG.UI.FLOATING_BUTTON);
            this.floatingButton.textContent = '抢课';
            this.floatingButton.title = '点击打开自动选课工具';

            this.floatingButton.addEventListener('click', () => {
                this.showControlPanel();
            });

            document.body.appendChild(this.floatingButton);
        }

        showControlPanel() {
            if (this.panel) {
                this.panel.style.display = 'block';
                this.floatingButton.style.display = 'none';
                return;
            }

            this.createControlPanel();
            this.panel.style.display = 'block';
            this.floatingButton.style.display = 'none';
        }

        createControlPanel() {
            this.panel = document.createElement('div');
            Object.assign(this.panel.style, CONFIG.UI.PANEL_STYLE);

            // 标题栏
            const titleBar = document.createElement('div');
            titleBar.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 0 0 15px 0;
                cursor: grab;
            `;

            const title = document.createElement('h3');
            title.textContent = '自动选课工具 v2.0.0';
            title.style.cssText = `
                margin: 0;
                color: #333;
                font-size: 18px;
            `;

            const closeButton = document.createElement('button');
            closeButton.textContent = '×';
            closeButton.style.cssText = `
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
            `;

            closeButton.addEventListener('click', () => {
                this.hideControlPanel();
            });

            titleBar.appendChild(title);
            titleBar.appendChild(closeButton);
            this.panel.appendChild(titleBar);

            // 课程输入容器
            this.container = document.createElement('div');
            this.container.style.cssText = `
                max-height: 300px;
                overflow-y: auto;
                margin-bottom: 15px;
            `;

            // 添加一个默认课程输入框
            this.container.appendChild(this.createCourseInput(0, CONFIG.GRAB.DEFAULT_COURSE_TYPE));
            this.panel.appendChild(this.container);

            // 添加更多课程按钮
            this.addButton = document.createElement('button');
            this.addButton.textContent = '添加更多课程';
            Object.assign(this.addButton.style, CONFIG.UI.BUTTON_STYLE);

            this.addButton.onclick = () => {
                const courseCount = this.container.children.length;
                this.container.appendChild(this.createCourseInput(courseCount, CONFIG.GRAB.DEFAULT_COURSE_TYPE));
            };

            this.panel.appendChild(this.addButton);

            // 控制按钮
            this.startButton = document.createElement('button');
            this.startButton.textContent = '开始选课';
            this.startButton.style.cssText = `
                margin-top: '10px';
                padding: '10px 20px';
                backgroundColor: '#28a745';
                color: 'white';
                border: 'none';
                borderRadius: '5px';
                cursor: 'pointer';
                marginRight: '10px';
            `;

            this.stopButton = document.createElement('button');
            this.stopButton.textContent = '停止选课';
            this.stopButton.style.cssText = `
                margin-top: '10px';
                padding: '10px 20px';
                backgroundColor: '#dc3545';
                color: 'white';
                border: 'none';
                borderRadius: '5px';
                cursor: 'pointer';
                marginRight: '10px';
            `;

            this.resetButton = document.createElement('button');
            this.resetButton.textContent = '重置所有';
            this.resetButton.style.cssText = `
                margin-top: '10px';
                padding: '10px 20px';
                backgroundColor: '#ffc107';
                color: 'black';
                border: 'none';
                borderRadius: '5px';
                cursor: 'pointer';
            `;

            this.panel.appendChild(this.startButton);
            this.panel.appendChild(this.stopButton);
            this.panel.appendChild(this.resetButton);

            // 使面板可拖拽
            this.makeDraggable(this.panel, titleBar);

            document.body.appendChild(this.panel);
        }

        hideControlPanel() {
            if (this.panel) {
                this.panel.style.display = 'none';
            }
            this.floatingButton.style.display = 'flex';
        }

        makeDraggable(element, handle) {
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

            handle.onmousedown = dragMouseDown;

            function dragMouseDown(e) {
                e.preventDefault();
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = closeDragElement;
                document.onmousemove = elementDrag;
                handle.style.cursor = 'grabbing';
            }

            function elementDrag(e) {
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                element.style.top = (element.offsetTop - pos2) + "px";
                element.style.left = (element.offsetLeft - pos1) + "px";
            }

            function closeDragElement() {
                document.onmouseup = null;
                document.onmousemove = null;
                handle.style.cursor = 'grab';
            }
        }

        setupEventListeners() {
            this.startButton?.addEventListener('click', () => {
                const status = this.courseManager.getStatus();
                if (status.totalCourses === 0) {
                    this.courseManager.showNotification('请先添加课程', 'warning');
                    return;
                }
                this.courseManager.initialize();
                this.startButton.disabled = true;
                this.stopButton.disabled = false;
            });

            this.stopButton?.addEventListener('click', () => {
                this.courseManager.stopLoop();
                this.startButton.disabled = false;
                this.stopButton.disabled = true;
            });

            this.resetButton?.addEventListener('click', () => {
                if (confirm('确定要重置所有课程和状态吗？')) {
                    this.courseManager.reset();
                    this.container.innerHTML = '';
                    this.container.appendChild(this.createCourseInput(0, CONFIG.GRAB.DEFAULT_COURSE_TYPE));
                    this.startButton.disabled = false;
                    this.stopButton.disabled = true;
                    this.courseManager.showNotification('所有状态已重置', 'info');
                }
            });
        }
    }

    // ==================== 初始化 ====================
    console.log('%c🎓 中南民族大学自动选课助手 v2.0.0', 'color: #007bff; font-size: 16px; font-weight: bold;');
    console.log('%c✨ 现已支持7种课程类型：推荐选课、方案内选课、方案外选课、重修选课、体育选择课、通识课程选修、创新创业类选修课', 'color: #28a745; font-size: 12px;');
    console.log('%c⚠️ 本工具仅供学习交流使用，请遵守学校相关规定', 'color: #ffc107; font-size: 12px;');

    const courseManager = new CourseRegistrationManager();
    const uiController = new UIController(courseManager);

    // 暴露到全局作用域
    if (typeof window !== 'undefined') {
        window.courseManager = courseManager;
        window.uiController = uiController;
        window.stopLoop = () => courseManager.stopLoop();
    }

    console.log('✅ 选课助手初始化完成！点击右上角"抢课"按钮开始使用。');
})();