/**
 * 中南民族大学自动选课助手
 * 单文件版本 - 直接复制粘贴到浏览器控制台使用
 *
 * @author SuShuHeng <https://github.com/sushuheng>
 * @license APACHE 2.0
 * @version 1.0.4
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

    // ==================== 本地数据管理器 ====================
    class LocalDataManager {
        constructor() {
            this.STORAGE_KEYS = {
                COURSES: 'scmu_courses',
                EXPERIMENTAL_CLASSES: 'scmu_experimental_classes',
                METADATA: 'scmu_metadata'
            };
            this.DATA_VERSION = '1.0.0';
            this.storageAvailable = this.checkStorageAvailability();
            this.DEFAULT_COURSE_NAME = '请输入名称(可选)';
        }

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
                    experimentalClasses: experimentalClasses,
                    metadata: {
                        lastSaved: Date.now(),
                        version: this.DATA_VERSION,
                        sessionCount: this.getSessionCount() + 1
                    }
                };

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

        updateCourseName(courseId, courseName) {
            if (!this.storageAvailable) {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 存储功能不可用，无法更新课程名称`);
                return false;
            }

            try {
                const courses = JSON.parse(GM_getValue(this.STORAGE_KEYS.COURSES, '[]'));
                const courseIndex = courses.findIndex(course => course.id === courseId);

                if (courseIndex !== -1) {
                    courses[courseIndex].name = courseName;
                    courses[courseIndex].nameUpdatedTime = Date.now();

                    GM_setValue(this.STORAGE_KEYS.COURSES, JSON.stringify(courses));

                    const metadata = JSON.parse(GM_getValue(this.STORAGE_KEYS.METADATA, '{}'));
                    metadata.lastSaved = Date.now();
                    GM_setValue(this.STORAGE_KEYS.METADATA, JSON.stringify(metadata));

                    return true;
                }
            } catch (error) {
                console.error(`${CONFIG.LOG.LOG_PREFIX} 更新课程名称失败:`, error);
            }
            return false;
        }

        removeCourse(courseId) {
            if (!this.storageAvailable) return false;

            try {
                let courses = JSON.parse(GM_getValue(this.STORAGE_KEYS.COURSES, '[]'));
                courses = courses.filter(course => course.id !== courseId);

                const experimentalClasses = JSON.parse(GM_getValue(this.STORAGE_KEYS.EXPERIMENTAL_CLASSES, '{}'));
                delete experimentalClasses[courseId];

                GM_setValue(this.STORAGE_KEYS.COURSES, JSON.stringify(courses));
                GM_setValue(this.STORAGE_KEYS.EXPERIMENTAL_CLASSES, JSON.stringify(experimentalClasses));

                const metadata = JSON.parse(GM_getValue(this.STORAGE_KEYS.METADATA, '{}'));
                metadata.lastSaved = Date.now();
                GM_setValue(this.STORAGE_KEYS.METADATA, JSON.stringify(metadata));

                return true;
            } catch (error) {
                console.error(`${CONFIG.LOG.LOG_PREFIX} 删除课程失败:`, error);
                return false;
            }
        }

        getSessionCount() {
            try {
                const metadata = JSON.parse(GM_getValue(this.STORAGE_KEYS.METADATA, '{}'));
                return metadata.sessionCount || 0;
            } catch (e) {
                return 0;
            }
        }

        clearAllData() {
            if (!this.storageAvailable) return false;

            try {
                Object.values(this.STORAGE_KEYS).forEach(key => {
                    GM_deleteValue(key);
                });
                return true;
            } catch (error) {
                console.error(`${CONFIG.LOG.LOG_PREFIX} 清空数据失败:`, error);
                return false;
            }
        }
    }

    // ==================== 课程注册管理器 ====================
    class CourseRegistrationManager {
        constructor() {
            this.courses = [];
            this.statusMap = {};
            this.glJxbidMap = {};
            this.intervalId = null;

            this.localDataManager = new LocalDataManager();

            this.initEventListeners();
            this.loadSavedData();
        }

        initEventListeners() {
            document.addEventListener('course:success', (event) => {
                const { courseId } = event.detail;
                console.log(`🎉 选课成功! 课程: ${courseId}`);
                this.showNotification(`成功抢到课程: ${courseId}`, 'success');
            });
        }

        loadSavedData() {
            console.log(`${CONFIG.LOG.LOG_PREFIX} 开始加载本地存储数据...`);

            const savedData = this.localDataManager.loadCoursesData();

            if (savedData && savedData.courses.length > 0) {
                this.courses = savedData.courses;
                this.glJxbidMap = savedData.experimentalClasses;

                savedData.courseDetails.forEach(courseDetail => {
                    this.statusMap[courseDetail.id] = {
                        success: courseDetail.status?.success || false,
                        glReady: false,
                        glAttemptIndex: 0
                    };
                });

                const eventData = {
                    courses: this.courses,
                    courseDetails: savedData.courseDetails,
                    statusMap: this.statusMap
                };

                document.dispatchEvent(new CustomEvent('storage:dataLoaded', {
                    detail: eventData
                }));
            }
        }

        saveCurrentData() {
            const success = this.localDataManager.saveCoursesData(
                this.courses,
                this.glJxbidMap,
                this.statusMap
            );

            return success;
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
                        console.error(`🚫 [${jxbid}] 返回非 JSON 数据：`, html);
                    }
                    throw new Error(`请求失败：HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    console.log(`✅ [成功] ${jxbid}${glInfo} 选课成功！时间: ${data.xksj || new Date().toLocaleTimeString()}`);
                    state.success = true;

                    this.saveCurrentData();

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

            document.dispatchEvent(new CustomEvent('courses:started'));
        }

        stopLoop() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
                console.log(`${CONFIG.LOG.LOG_PREFIX} 定时器已停止！`);

                document.dispatchEvent(new CustomEvent('courses:stopped'));
            } else {
                console.log(`${CONFIG.LOG.LOG_PREFIX} 定时器未启动，无法停止！`);
            }
        }

        addCourse(jxbid) {
            if (!jxbid || jxbid.trim() === '') {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 课程ID不能为空`);
                return false;
            }

            const trimmedId = jxbid.trim();

            if (this.courses.includes(trimmedId)) {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 课程 ${trimmedId} 已存在，无需重复添加`);
                return false;
            }

            this.courses.push(trimmedId);
            this.initCourseState(trimmedId);
            console.log(`${CONFIG.LOG.LOG_PREFIX} 已添加课程: ${trimmedId}`);

            this.saveCurrentData();

            return true;
        }

        removeCourse(jxbid) {
            const index = this.courses.indexOf(jxbid);
            if (index !== -1) {
                this.courses.splice(index, 1);
                delete this.statusMap[jxbid];
                delete this.glJxbidMap[jxbid];
                console.log(`${CONFIG.LOG.LOG_PREFIX} 已移除课程: ${jxbid}`);

                const storageRemoved = this.localDataManager.removeCourse(jxbid);
                if (storageRemoved) {
                    console.log(`${CONFIG.LOG.LOG_PREFIX} 课程${jxbid}已从本地存储删除`);
                }

                this.saveCurrentData();
                this.checkEmptyCourseList();
                return true;
            }
            console.warn(`${CONFIG.LOG.LOG_PREFIX} 课程 ${jxbid} 不存在，无法移除`);
            return false;
        }

        updateCourse(oldCourseId, newCourseId) {
            if (!newCourseId || newCourseId.trim() === '') {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 新课程ID不能为空`);
                return false;
            }

            const trimmedNewId = newCourseId.trim();

            if (trimmedNewId.length < 8 || trimmedNewId.length > 12 || !/^\d+$/.test(trimmedNewId)) {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 新课程ID格式无效: ${trimmedNewId}`);
                return false;
            }

            if (oldCourseId === trimmedNewId) {
                console.log(`${CONFIG.LOG.LOG_PREFIX} 课程ID相同，无需更新: ${trimmedNewId}`);
                return true;
            }

            if (oldCourseId && this.courses.includes(oldCourseId)) {
                this.removeCourse(oldCourseId);
                console.log(`${CONFIG.LOG.LOG_PREFIX} 已删除旧课程: ${oldCourseId}`);
            }

            return this.addCourse(trimmedNewId);
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

        getStatusForCourse(jxbid) {
            const status = this.statusMap[jxbid];
            if (!status) return '未知状态';

            if (status.success) return '选课成功';
            if (!status.glReady) return '加载实验班中...';
            return '正在尝试选课';
        }

        checkEmptyCourseList() {
            if (this.courses.length === 0 && this.intervalId) {
                console.log(`${CONFIG.LOG.LOG_PREFIX} 课程列表为空，自动停止选课`);
                this.stopLoop();

                const event = new CustomEvent('selection:auto-stopped', {
                    detail: { reason: 'empty_course_list', timestamp: Date.now() }
                });
                document.dispatchEvent(event);
            }
        }

        async addCourseRuntime(jxbid) {
            if (!jxbid || jxbid.trim() === '') return false;

            const trimmedId = jxbid.trim();
            if (this.courses.includes(trimmedId)) return false;

            this.courses.push(trimmedId);
            this.initCourseState(trimmedId);

            if (this.intervalId) {
                try {
                    const glList = await this.fetchExperimentalClasses(trimmedId);
                    this.glJxbidMap[trimmedId] = glList;
                    this.statusMap[trimmedId].glReady = true;
                    console.log(`${CONFIG.LOG.LOG_PREFIX} 运行时添加课程: ${trimmedId}`);
                    return true;
                } catch (error) {
                    console.error(`${CONFIG.LOG.LOG_PREFIX} 运行时加载实验班失败:`, error);
                    return true;
                }
            }

            return true;
        }

        reset() {
            this.stopLoop();
            this.courses = [];
            this.statusMap = {};
            this.glJxbidMap = {};

            this.saveCurrentData();

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
    const UI_STATES = {
        FLOATING_BUTTON: 'floating_button',
        FULL_PANEL: 'full_panel',
        MINIMIZED_STATUS: 'minimized_status'
    };

    class UIController {
        constructor(courseManager) {
            this.courseManager = courseManager;
            this.panel = null;
            this.container = null;
            this.startButton = null;
            this.stopButton = null;
            this.addButton = null;

            this.currentState = UI_STATES.FLOATING_BUTTON;
            this.isSelectingCourses = false;
            this.floatingButton = null;
            this.minimizedPanel = null;
            this.startTime = null;
            this.stopTime = null;
            this.statusUpdateInterval = null;
            this.statusModal = null;
            this.statusModalUpdateInterval = null;

            this.initStorageEventListeners();
        }

        initStorageEventListeners() {
            document.addEventListener('storage:dataLoaded', (event) => {
                const { courses, courseDetails, statusMap } = event.detail;

                if (!this.container) {
                    this.createControlPanel();
                    if (this.panel) {
                        this.panel.style.display = 'none';
                        this.panel.id = 'course-registration-panel';
                        this.makeDraggable(this.panel, this.panel);
                        document.body.appendChild(this.panel);
                    }
                }

                this.restoreUIFromStorage(courses, courseDetails, statusMap);
            });
        }

        restoreUIFromStorage(courses, courseDetails, statusMap, retryCount = 0) {
            if (!courses || courses.length === 0) {
                return;
            }

            try {
                setTimeout(() => {
                    const MAX_RETRY_COUNT = 2;
                    if (!this.container) {
                        if (retryCount >= MAX_RETRY_COUNT) {
                            this.createControlPanel();
                            if (this.panel) {
                                this.panel.style.display = 'none';
                                this.panel.id = 'course-registration-panel';
                                this.makeDraggable(this.panel, this.panel);
                                document.body.appendChild(this.panel);
                            }
                        } else {
                            setTimeout(() => this.restoreUIFromStorage(courses, courseDetails, statusMap, retryCount + 1), 500);
                            return;
                        }
                    }

                    this.container.innerHTML = '';

                    courses.forEach((courseId, index) => {
                        const courseInput = this.createCourseInput(index);
                        const inputs = courseInput.querySelectorAll('input[type="text"]');
                        const inputId = inputs[0];
                        const inputName = inputs[1];
                        const statusDisplay = courseInput.querySelector('.status-display');

                        inputId.value = courseId;
                        inputId.dataset.currentCourseId = courseId;

                        const courseDetail = courseDetails.find(detail => detail.id === courseId);
                        if (courseDetail && courseDetail.name && courseDetail.name !== this.courseManager.localDataManager.DEFAULT_COURSE_NAME) {
                            inputName.value = courseDetail.name;
                            inputId.title = courseDetail.name;
                        }

                        if (statusDisplay && statusMap[courseId]) {
                            const courseStatus = statusMap[courseId];
                            if (courseStatus.success) {
                                statusDisplay.textContent = '✅ 已选上';
                                statusDisplay.style.color = '#28a745';
                            } else {
                                statusDisplay.textContent = '等待中...';
                                statusDisplay.style.color = '#6c757d';
                            }
                        }

                        this.bindCourseInputEvents(courseInput, inputId, inputName);
                        this.container.appendChild(courseInput);
                    });

                    this.updateScrollableContainer();
                    this.updateButtonStates(false);
                    this.showNotification(`已恢复${courses.length}门课程`, 'info');

                }, 100);

            } catch (error) {
                console.error(`${CONFIG.LOG.LOG_PREFIX} UI恢复失败:`, error);
                this.showNotification('UI恢复失败，请刷新页面重试', 'error');
            }
        }

        bindCourseInputEvents(courseInput, inputId, inputName) {
            const div = courseInput;

            inputId.addEventListener('blur', async () => {
                const newJxbid = inputId.value.trim();
                const oldJxbid = inputId.dataset.currentCourseId || '';
                const isRunning = this.courseManager.intervalId !== null;

                if (newJxbid && this.isValidCourseId(newJxbid)) {
                    if (oldJxbid && oldJxbid !== newJxbid) {
                        const updated = this.courseManager.updateCourse(oldJxbid, newJxbid);
                        if (updated) {
                            inputId.dataset.currentCourseId = newJxbid;
                            this.showNotification(`课程已更新: ${oldJxbid} → ${newJxbid}`, 'success');
                        } else {
                            inputId.value = oldJxbid;
                            this.showNotification(`课程更新失败: ${newJxbid}`, 'error');
                        }
                    } else if (!newJxbid && oldJxbid) {
                        this.courseManager.removeCourse(oldJxbid);
                        inputId.dataset.currentCourseId = '';
                        inputName.value = '';
                    }
                }
            });

            inputName.addEventListener('blur', async () => {
                const courseId = inputId.value.trim();
                const courseName = inputName.value.trim();

                if (courseId && this.isValidCourseId(courseId) && courseName) {
                    const success = this.courseManager.localDataManager.updateCourseName(courseId, courseName);
                    if (success) {
                        console.log(`${CONFIG.LOG.LOG_PREFIX} 课程名称已保存: ${courseId} - ${courseName}`);
                        this.showNotification(`课程名称已更新: ${courseName}`, 'success');
                    }
                }
            });

            inputName.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    inputName.blur();
                }
            });

            const deleteButton = div.querySelector('button');
            if (deleteButton) {
                deleteButton.onclick = () => this.handleDeleteCourse(div, inputId);
            }
        }

        hideAllStates() {
            if (this.panel) this.panel.style.display = 'none';
            if (this.floatingButton) this.floatingButton.style.display = 'none';
            if (this.minimizedPanel) this.minimizedPanel.style.display = 'none';
        }

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

        cycleUIState() {
            if (this.isSelectingCourses) {
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
                this.transitionToState(
                    this.currentState === UI_STATES.FLOATING_BUTTON ?
                        UI_STATES.FULL_PANEL :
                        UI_STATES.FLOATING_BUTTON
                );
            }
        }

        createFloatingButton() {
            if (this.floatingButton) return;

            this.floatingButton = document.createElement('div');
            Object.assign(this.floatingButton.style, CONFIG.UI.FLOATING_BUTTON);
            this.floatingButton.textContent = '抢课';
            this.floatingButton.id = 'floating-button';

            this.floatingButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.cycleUIState();
            });

            document.body.appendChild(this.floatingButton);
        }

        showFloatingButton() {
            if (!this.floatingButton) {
                this.createFloatingButton();
            }
            this.floatingButton.style.display = 'flex';
        }

        showFullPanel() {
            if (!this.panel) {
                this.createControlPanel();
                this.panel.id = 'course-registration-panel';
                this.makeDraggable(this.panel);
                document.body.appendChild(this.panel);
            }
            this.panel.style.display = 'block';
        }

        createMinimizedStatusPanel() {
            if (this.minimizedPanel) return;

            this.minimizedPanel = document.createElement('div');
            Object.assign(this.minimizedPanel.style, CONFIG.UI.MINIMIZED_PANEL);
            this.minimizedPanel.id = 'minimized-status-panel';

            const title = document.createElement('div');
            title.textContent = '抢课进行中';
            title.style.cssText = 'font-weight: bold; margin-bottom: 10px; color: #28a745;';

            const statusContainer = document.createElement('div');
            statusContainer.id = 'minimized-status-content';

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
            this.startMinimizedStatusUpdates();
        }

        showMinimizedStatus() {
            if (!this.minimizedPanel) {
                this.createMinimizedStatusPanel();
            }
            this.minimizedPanel.style.display = 'block';
        }

        startMinimizedStatusUpdates() {
            this.stopMinimizedStatusUpdates();
            this.statusUpdateInterval = setInterval(() => {
                this.updateMinimizedStatus();
            }, 1000);
        }

        stopMinimizedStatusUpdates() {
            if (this.statusUpdateInterval) {
                clearInterval(this.statusUpdateInterval);
                this.statusUpdateInterval = null;
            }
        }

        updateMinimizedStatus() {
            if (!this.minimizedPanel || this.currentState !== UI_STATES.MINIMIZED_STATUS) {
                return;
            }

            const status = this.courseManager.getStatus();
            const statusContainer = document.getElementById('minimized-status-content');

            if (!statusContainer) return;

            const successInfo = document.createElement('div');
            successInfo.innerHTML = `<strong>成功:</strong> ${status.successCount}/${status.totalCourses} 门课程`;
            successInfo.style.marginBottom = '8px';

            const courseList = document.createElement('div');
            courseList.style.maxHeight = '80px';
            courseList.style.overflowY = 'auto';
            courseList.style.fontSize = '11px';

            status.courses.forEach(course => {
                const courseItem = document.createElement('div');

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
            let isDragging = false;
            let currentX;
            let currentY;
            let initialX;
            let initialY;
            let xOffset = 0;
            let yOffset = 0;

            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            element.addEventListener('mousedown', dragStart);
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', dragEnd);

            if (isTouchDevice) {
                element.addEventListener('touchstart', dragStart, { passive: false });
                document.addEventListener('touchmove', drag, { passive: false });
                element.addEventListener('touchend', dragEnd);
            }

            function dragStart(e) {
                if (e.target.closest('.status-title-bar') || e.target.closest('.main-title-bar')) {
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

            element.style.cursor = 'grab';
        }

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

            inputId.addEventListener('blur', () => {
                const newJxbid = inputId.value.trim();
                const oldJxbid = inputId.dataset.currentCourseId || '';

                if (newJxbid && this.isValidCourseId(newJxbid)) {
                    if (oldJxbid && oldJxbid !== newJxbid) {
                        const updated = this.courseManager.updateCourse(oldJxbid, newJxbid);
                        if (updated) {
                            inputId.dataset.currentCourseId = newJxbid;
                            this.showNotification(`课程已更新: ${oldJxbid} → ${newJxbid}`, 'success');
                        } else {
                            inputId.value = oldJxbid;
                            this.showNotification(`课程更新失败: ${newJxbid}`, 'error');
                        }
                    } else if (!oldJxbid) {
                        const added = this.courseManager.addCourse(newJxbid);
                        if (added) {
                            inputId.dataset.currentCourseId = newJxbid;
                            this.showNotification(`课程 ${newJxbid} 添加成功`, 'success');
                        } else {
                            inputId.value = '';
                            inputId.dataset.currentCourseId = '';
                            this.showNotification(`课程 ${newJxbid} 添加失败或已存在`, 'warning');
                        }
                    }
                } else if (newJxbid) {
                    this.showNotification(`课程ID格式无效: ${newJxbid}`, 'error');
                    inputId.value = oldJxbid || '';
                } else if (oldJxbid) {
                    const removed = this.courseManager.removeCourse(oldJxbid);
                    if (removed) {
                        inputId.dataset.currentCourseId = '';
                        this.showNotification(`课程 ${oldJxbid} 已删除`, 'info');
                    }
                }
            });

            inputId.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    inputId.blur();
                }
            });

            return div;
        }

        createControlPanel() {
            this.panel = document.createElement('div');
            Object.assign(this.panel.style, CONFIG.UI.PANEL_STYLE);

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

            const title = document.createElement('h3');
            title.textContent = '自动选课工具';
            title.style.cssText = `
                margin: 0;
                color: #333;
                font-size: 18px;
                flex: 1;
            `;

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

            minimizeButton.addEventListener('mouseenter', () => {
                minimizeButton.style.backgroundColor = '#e0e0e0';
            });
            minimizeButton.addEventListener('mouseleave', () => {
                minimizeButton.style.backgroundColor = 'transparent';
            });

            minimizeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.cycleUIState();
            });

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
            titleBar.appendChild(closeButton);
            this.panel.appendChild(titleBar);

            this.container = document.createElement('div');
            this.container.id = 'course-container';

            this.container.appendChild(this.createCourseInput(0));

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

            this.startButton = document.createElement('button');
            this.startButton.textContent = '开始选课';
            this.startButton.style.cssText = `
                ${this.getButtonStyle()}
                background-color: #28a745;
                color: white;
                border-color: #28a745;
            `;
            this.startButton.onclick = async () => {
                if (this.courseManager.courses.length === 0) {
                    alert('请先输入至少一个课程ID！');
                    return;
                }

                this.startButton.disabled = true;
                this.addButton.disabled = true;
                await this.courseManager.initialize();
            };

            this.stopButton = document.createElement('button');
            this.stopButton.textContent = '停止选课';
            this.stopButton.style.cssText = `
                ${this.getButtonStyle()}
                background-color: #dc3545;
                color: white;
                border-color: #dc3545;
            `;
            this.stopButton.onclick = () => {
                this.courseManager.stopLoop();
                this.startButton.disabled = false;
                this.addButton.disabled = false;
            };

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

            if (!this.panel.parentNode) {
                document.body.appendChild(this.panel);
            }
            return this.panel;
        }

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

        updateScrollableContainer() {
            if (!this.container) return;

            const courseCount = this.container.children.length;
            const { MAX_COURSES_BEFORE_SCROLL, CONTAINER_HEIGHT, SCROLLBAR_WIDTH } = CONFIG.UI.SCROLLABLE_CONTAINER;

            if (courseCount > MAX_COURSES_BEFORE_SCROLL) {
                this.container.style.maxHeight = CONTAINER_HEIGHT;
                this.container.style.overflowY = 'auto';
                this.container.style.paddingRight = `${parseInt(SCROLLBAR_WIDTH) + 5}px`;

                // 自定义滚动条样式
                this.container.style.scrollbarWidth = 'thin';
                this.container.style.scrollbarColor = '#888 #f1f1f1';

                // Webkit 浏览器滚动条样式
                const style = document.createElement('style');
                style.textContent = `
                    #course-container::-webkit-scrollbar {
                        width: ${SCROLLBAR_WIDTH};
                    }
                    #course-container::-webkit-scrollbar-track {
                        background: #f1f1f1;
                        border-radius: 4px;
                    }
                    #course-container::-webkit-scrollbar-thumb {
                        background: #888;
                        border-radius: 4px;
                    }
                    #course-container::-webkit-scrollbar-thumb:hover {
                        background: #555;
                    }
                `;

                // 避免重复添加样式
                if (!document.getElementById('course-container-scrollbar-style')) {
                    style.id = 'course-container-scrollbar-style';
                    document.head.appendChild(style);
                }
            } else {
                this.container.style.maxHeight = '';
                this.container.style.overflowY = '';
                this.container.style.paddingRight = '';
            }
        }

        initialize() {
            if (document.getElementById('course-registration-panel')) {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 控制面板已存在`);
                return;
            }

            this.transitionToState(UI_STATES.FLOATING_BUTTON);

            document.addEventListener('courses:started', () => {
                console.log(`${CONFIG.LOG.LOG_PREFIX} 选课开始事件触发`);
                this.isSelectingCourses = true;
                this.startTime = Date.now();
                this.stopTime = null;

                if (this.currentState === UI_STATES.FLOATING_BUTTON) {
                    this.transitionToState(UI_STATES.FULL_PANEL);
                }

                if (this.statusModal && document.body.contains(this.statusModal)) {
                    this.statusModal.style.display = 'block';
                }
            });

            document.addEventListener('courses:stopped', () => {
                console.log(`${CONFIG.LOG.LOG_PREFIX} 选课停止事件触发`);
                this.isSelectingCourses = false;
                this.stopTime = Date.now();

                if (this.statusModal && document.body.contains(this.statusModal)) {
                    this.updateStatusModal();
                }

                if (this.currentState === UI_STATES.MINIMIZED_STATUS) {
                    this.transitionToState(UI_STATES.FLOATING_BUTTON);
                }
                this.stopMinimizedStatusUpdates();
            });

            console.log(`${CONFIG.LOG.LOG_PREFIX} 用户界面初始化完成，开始显示悬浮按钮`);
        }

        destroy() {
            this.stopMinimizedStatusUpdates();

            if (this.panel && this.panel.parentNode) {
                this.panel.parentNode.removeChild(this.panel);
            }
            if (this.floatingButton && this.floatingButton.parentNode) {
                this.floatingButton.parentNode.removeChild(this.floatingButton);
            }
            if (this.minimizedPanel && this.minimizedPanel.parentNode) {
                this.minimizedPanel.parentNode.removeChild(this.minimizedPanel);
            }

            console.log(`${CONFIG.LOG.LOG_PREFIX} 用户界面已销毁`);
        }

        updateButtonStates(isRunning) {
            if (this.startButton && this.stopButton && this.addButton) {
                this.startButton.disabled = isRunning;
                this.stopButton.disabled = !isRunning;
                this.addButton.disabled = isRunning;
            }
        }

        showStatusModal() {
            try {
                if (this.statusModal && document.body.contains(this.statusModal)) {
                    console.warn(`${CONFIG.LOG.LOG_PREFIX} 状态面板已存在，不重复创建`);
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

                this.makeDraggable(statusModal);

                statusModal.addEventListener('mousedown', (e) => {
                    if (e.target === statusModal || statusModal.contains(e.target)) {
                        e.stopPropagation();
                    }
                });

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

                const statusContent = document.createElement('div');
                statusContent.id = 'status-modal-content';

                statusModal.appendChild(titleBar);
                statusModal.appendChild(statusContent);
                document.body.appendChild(statusModal);

                this.statusModal = statusModal;
                statusModal.id = 'course-status-modal';

                this.startStatusModalUpdates();

                const closeModal = () => {
                    this.stopStatusModalUpdates();
                    this.statusModal = null;
                    if (document.body.contains(statusModal)) {
                        document.body.removeChild(statusModal);
                    }
                };

                closeButton.onclick = closeModal;

                const escHandler = (e) => {
                    if (e.key === 'Escape' && document.body.contains(statusModal)) {
                        closeModal();
                        document.removeEventListener('keydown', escHandler);
                    }
                };
                document.addEventListener('keydown', escHandler);

                statusModal.addEventListener('click', (e) => {
                    e.stopPropagation();
                });

            } catch (error) {
                console.error(`${CONFIG.LOG.LOG_PREFIX} 创建状态面板失败:`, error);
                this.showNotification('状态面板创建失败，请重试', 'error');
            }
        }

        startStatusModalUpdates() {
            this.statusModalUpdateInterval = setInterval(() => {
                this.updateStatusModal();
            }, 1000);
            this.updateStatusModal();
        }

        updateStatusModal() {
            const statusContainer = document.getElementById('status-modal-content');
            if (!statusContainer) return;

            const status = this.courseManager.getStatus();
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

        stopStatusModalUpdates() {
            if (this.statusModalUpdateInterval) {
                clearInterval(this.statusModalUpdateInterval);
                this.statusModalUpdateInterval = null;
            }
        }

        showResetConfirmation() {
            const status = this.courseManager.getStatus();
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

            if (isRunning && hasActiveCourses) {
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
                    ">确认重置</button>
                </div>
            `;

            document.body.appendChild(confirmDialog);

            document.getElementById('cancel-reset').onclick = () => {
                document.body.removeChild(confirmDialog);
            };

            document.getElementById('confirm-reset').onclick = () => {
                document.body.removeChild(confirmDialog);
                this.executeReset();
            };

            const escHandler = (e) => {
                if (e.key === 'Escape' && document.body.contains(confirmDialog)) {
                    document.body.removeChild(confirmDialog);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);

            confirmDialog.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        executeReset() {
            console.log(`${CONFIG.LOG.LOG_PREFIX} 用户确认重置，开始执行重置操作`);

            this.courseManager.reset();

            this.container.innerHTML = '';
            this.container.appendChild(this.createCourseInput(0));
            this.updateScrollableContainer();
            this.updateButtonStates(false);

            this.showNotification('所有状态已重置', 'info');

            console.log(`${CONFIG.LOG.LOG_PREFIX} 重置操作完成`);
        }

        calculateRunTime() {
            if (!this.startTime) return 0;

            if (this.isSelectingCourses) {
                return Math.floor((Date.now() - this.startTime) / 1000);
            } else if (this.stopTime) {
                return Math.floor((this.stopTime - this.startTime) / 1000);
            } else {
                return 0;
            }
        }

        formatRunTime(seconds) {
            if (seconds < 0) return '00:00:00';

            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;

            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        showNotification(message, type = 'info') {
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

        showCloseConfirmation() {
            try {
                if (document.getElementById('close-confirmation-dialog')) {
                    return;
                }

                const status = this.courseManager.getStatus();
                const isRunning = status.isRunning;
                const hasActiveCourses = status.courses.some(course => !course.success);
                const successCount = status.successCount;
                const totalCourses = status.totalCourses;

                let warningLevel = 'low';
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
                        " onmouseover="this.style.backgroundColor='${
                            warningLevel === 'high' ? '#c82333' :
                            warningLevel === 'medium' ? '#e0a800' : '#5a6268'
                        }'" onmouseout="this.style.backgroundColor='${colors.buttonBg}'">
                            确认关闭
                        </button>
                    </div>
                `;

                confirmDialog.appendChild(dialogContent);

                document.body.appendChild(confirmDialog);

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

                if (warningLevel === 'low') {
                    confirmDialog.onclick = (event) => {
                        if (event.target === confirmDialog) {
                            document.body.removeChild(confirmDialog);
                        }
                    };
                }

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

        executeClose() {
            try {
                console.log('🛑 [关闭] 开始关闭选课助手程序...');

                if (this.courseManager) {
                    try {
                        this.courseManager.stopLoop();
                        console.log('🛑 [关闭] 选课程序已停止');
                    } catch (error) {
                        console.error('🛑 [关闭] 停止选课程序失败:', error);
                    }
                }

                if (this.statusModalUpdateInterval) {
                    try {
                        clearInterval(this.statusModalUpdateInterval);
                        this.statusModalUpdateInterval = null;
                        console.log('🛑 [关闭] 状态面板更新定时器已清理');
                    } catch (error) {
                        console.error('🛑 [关闭] 清理状态面板定时器失败:', error);
                    }
                }

                if (this.panel && document.body.contains(this.panel)) {
                    try {
                        document.body.removeChild(this.panel);
                        this.panel = null;
                        console.log('🛑 [关闭] 主控制面板已移除');
                    } catch (error) {
                        console.error('🛑 [关闭] 移除主面板失败:', error);
                    }
                }

                if (this.statusModal && document.body.contains(this.statusModal)) {
                    try {
                        document.body.removeChild(this.statusModal);
                        this.statusModal = null;
                        console.log('🛑 [关闭] 状态面板已移除');
                    } catch (error) {
                        console.error('🛑 [关闭] 移除状态面板失败:', error);
                    }
                }

                try {
                    if (typeof window !== 'undefined') {
                        delete window.courseManager;
                        delete window.uiController;
                        delete window.stopLoop;
                        console.log('🛑 [关闭] 全局引用已清理');
                    }
                } catch (error) {
                    console.error('🛑 [关闭] 清理全局引用失败:', error);
                }

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

                setTimeout(() => {
                    try {
                        if (successMessage.parentNode) {
                            document.body.removeChild(successMessage);
                        }
                    } catch (error) {
                        console.error('移除关闭成功消息失败:', error);
                    }
                }, 2000);

                console.log('✅ [关闭] 选课助手程序已完全关闭');
                console.log('🎓 [感谢] 感谢使用中南民族大学选课助手！');
                console.log('📝 [提醒] 如需重新使用，请刷新页面后重新运行脚本');

            } catch (error) {
                console.error('🚫 [关闭] 执行关闭程序时发生错误:', error);

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

        handleDeleteCourse(div, inputId) {
            const courseId = inputId.dataset.currentCourseId || inputId.value.trim();

            if (!courseId) {
                // 如果没有课程ID，直接移除输入框
                if (div.parentNode) {
                    div.parentNode.removeChild(div);
                }
                this.updateScrollableContainer();
                return;
            }

            // 创建删除确认对话框
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
                z-index: 10002;
                min-width: 300px;
                font-family: Arial, sans-serif;
                text-align: center;
            `;

            confirmDialog.innerHTML = `
                <h4 style="margin: 0 0 15px 0; color: #dc3545;">确认删除课程</h4>
                <div style="margin-bottom: 20px; color: #333;">
                    确定要删除课程 <strong>${courseId}</strong> 吗？
                </div>
                <div style="text-align: center;">
                    <button id="cancel-delete" style="
                        margin-right: 10px;
                        padding: 8px 16px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    ">取消</button>
                    <button id="confirm-delete" style="
                        padding: 8px 16px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    ">确认删除</button>
                </div>
            `;

            document.body.appendChild(confirmDialog);

            document.getElementById('cancel-delete').onclick = () => {
                document.body.removeChild(confirmDialog);
            };

            document.getElementById('confirm-delete').onclick = () => {
                // 从课程管理器中删除课程
                const removed = this.courseManager.removeCourse(courseId);

                if (removed) {
                    // 从UI中移除输入框
                    if (div.parentNode) {
                        div.parentNode.removeChild(div);
                    }

                    // 更新滚动容器
                    this.updateScrollableContainer();

                    // 如果这是最后一个输入框，添加一个新的空输入框
                    if (this.container.children.length === 0) {
                        this.container.appendChild(this.createCourseInput(0));
                    }

                    this.showNotification(`课程 ${courseId} 已删除`, 'info');
                } else {
                    this.showNotification(`删除课程 ${courseId} 失败`, 'error');
                }

                document.body.removeChild(confirmDialog);
            };

            // ESC 键取消
            const escHandler = (e) => {
                if (e.key === 'Escape' && document.body.contains(confirmDialog)) {
                    document.body.removeChild(confirmDialog);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);

            // 点击背景取消
            confirmDialog.addEventListener('click', (e) => {
                if (e.target === confirmDialog) {
                    document.body.removeChild(confirmDialog);
                    document.removeEventListener('keydown', escHandler);
                }
            });
        }
    }

    // ==================== 初始化程序 ====================
    const courseManager = new CourseRegistrationManager();
    const uiController = new UIController(courseManager);

    // 暴露到全局作用域
    if (typeof window !== 'undefined') {
        window.courseManager = courseManager;
        window.uiController = uiController;
        window.stopLoop = () => courseManager.stopLoop();
    }

    // 初始化UI
    uiController.initialize();

    console.log(`${CONFIG.LOG.LOG_PREFIX} 中南民族大学自动选课助手 v1.0.4 已启动`);
    console.log(`${CONFIG.LOG.LOG_PREFIX} 使用说明：`);
    console.log(`${CONFIG.LOG.LOG_PREFIX} 1. 点击右下角"抢课"按钮打开控制面板`);
    console.log(`${CONFIG.LOG.LOG_PREFIX} 2. 输入课程ID和可选的课程名称`);
    console.log(`${CONFIG.LOG.LOG_PREFIX} 3. 点击"开始选课"开始自动抢课`);
    console.log(`${CONFIG.LOG.LOG_PREFIX} 4. 可随时查看选课状态和进度`);

})();