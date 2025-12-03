// ==UserScript==
// @name         SCMU自动选课助手
// @namespace    https://github.com/sushuheng/SCMU_CC_Helper
// @version      1.0.4
// @description  专为中南民族大学学生设计的自动化课程注册助手
// @author       SuShuHeng
// @license      APACHE 2.0
// @match        https://xk.webvpn.scuec.edu.cn/xsxk/*
// @match        https://xk.webvpn.scuec.edu.cn/*
// @run-at       document-idle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// ==/UserScript==
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
                zIndex: '9999', // CONFIG.Z_INDEX.BASE_LAYER
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
                zIndex: '9999', // CONFIG.Z_INDEX.BASE_LAYER
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
                zIndex: '9999', // CONFIG.Z_INDEX.BASE_LAYER
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
        },
        Z_INDEX: {
            BASE_LAYER: 9999,        // 基础UI组件（主面板、悬浮按钮、迷你面板）
            NOTIFICATION: 10000,     // 通知消息
            MODAL: 10001,           // 普通弹窗（状态详情弹窗）
            DIALOG: 10002,          // 确认对话框（删除课程、重置确认）
            OVERLAY: 10003,         // 全屏遮罩（关闭程序确认）
            TOPMOST: 10004          // 最高层级（关闭成功消息）
        }
    };

    // ==================== UI状态常量 ====================
    const UI_STATES = {
        FLOATING_BUTTON: 'floating_button',
        FULL_PANEL: 'full_panel',
        MINIMIZED_STATUS: 'minimized_status'
    };

    // ==================== 本地数据管理器 ====================

    /**
     * 本地数据管理器 - 负责课程数据的持久化存储和恢复
     */
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

        /**
         * 检查存储功能是否可用
         */
        checkStorageAvailability() {
            try {
                return typeof GM_setValue !== 'undefined' && typeof GM_getValue !== 'undefined';
            } catch (e) {
                console.error(`${CONFIG.LOG.LOG_PREFIX} 存储功能检测失败:`, e);
                return false;
            }
        }

        /**
         * 保存课程数据到本地存储
         */
        saveCoursesData(courses, experimentalClasses, statusMap) {
            if (!this.storageAvailable) {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 存储功能不可用，数据无法保存`);
                return false;
            }

            try {
                // 转换数据格式为存储格式
                const storageData = {
                    courses: courses.map(courseId => ({
                        id: courseId,
                        name: this.DEFAULT_COURSE_NAME, // 默认名称，后续会通过UI更新
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

                // 保存到本地存储
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

        /**
         * 从本地存储加载课程数据
         */
        loadCoursesData() {
            console.log(`${CONFIG.LOG.LOG_PREFIX} ===== LocalDataManager.loadCoursesData 开始 =====`);
            console.log(`${CONFIG.LOG.LOG_PREFIX} 存储功能状态:`, {
                available: this.storageAvailable,
                storageKeys: this.STORAGE_KEYS,
                gmGetValue: typeof GM_getValue !== 'undefined',
                gmSetValue: typeof GM_setValue !== 'undefined'
            });

            if (!this.storageAvailable) {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 存储功能不可用，无法加载保存的数据`);
                return null;
            }

            try {
                console.log(`${CONFIG.LOG.LOG_PREFIX} 开始从各存储键读取数据...`);

                const coursesStr = GM_getValue(this.STORAGE_KEYS.COURSES, '[]');
                const experimentalClassesStr = GM_getValue(this.STORAGE_KEYS.EXPERIMENTAL_CLASSES, '{}');
                const metadataStr = GM_getValue(this.STORAGE_KEYS.METADATA, '{}');

                console.log(`${CONFIG.LOG.LOG_PREFIX} 原始存储数据:`, {
                    coursesStr: coursesStr.substring(0, 200) + (coursesStr.length > 200 ? '...' : ''),
                    experimentalClassesStr: experimentalClassesStr.substring(0, 200) + (experimentalClassesStr.length > 200 ? '...' : ''),
                    metadataStr: metadataStr.substring(0, 200) + (metadataStr.length > 200 ? '...' : '')
                });

                const courses = JSON.parse(coursesStr);
                const experimentalClasses = JSON.parse(experimentalClassesStr);
                const metadata = JSON.parse(metadataStr);

                console.log(`${CONFIG.LOG.LOG_PREFIX} 解析后的数据:`, {
                    coursesType: typeof courses,
                    coursesLength: courses.length,
                    courses: courses,
                    experimentalClassesType: typeof experimentalClasses,
                    experimentalClassesKeys: Object.keys(experimentalClasses),
                    metadata: metadata
                });

                if (courses.length === 0) {
                    console.log(`${CONFIG.LOG.LOG_PREFIX} 课程数组为空，没有保存的课程数据`);
                    return null;
                }

                console.log(`${CONFIG.LOG.LOG_PREFIX} 成功解析${courses.length}门课程数据`);

                const result = {
                    courses: courses.map(course => course.id),
                    courseDetails: courses, // 保留详细信息供UI使用
                    experimentalClasses,
                    metadata
                };

                console.log(`${CONFIG.LOG.LOG_PREFIX} 返回的数据结构:`, {
                    coursesCount: result.courses.length,
                    courseDetailsCount: result.courseDetails.length,
                    experimentalClassesCount: Object.keys(result.experimentalClasses).length,
                    courses: result.courses,
                    courseDetails: result.courseDetails,
                    experimentalClasses: result.experimentalClasses
                });

                console.log(`${CONFIG.LOG.LOG_PREFIX} ===== LocalDataManager.loadCoursesData 完成 =====`);
                return result;

            } catch (error) {
                console.error(`${CONFIG.LOG.LOG_PREFIX} 加载本地存储数据失败:`, error);
                console.error(`${CONFIG.LOG.LOG_PREFIX} 错误详情:`, {
                    message: error.message,
                    stack: error.stack,
                    storageKeys: this.STORAGE_KEYS,
                    storageAvailable: this.storageAvailable
                });
                return null;
            }
        }

        /**
         * 更新课程名称
         */
        updateCourseName(courseId, courseName) {
            if (!this.storageAvailable) {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 存储功能不可用，无法更新课程名称`);
                return false;
            }

            try {
                const courses = JSON.parse(GM_getValue(this.STORAGE_KEYS.COURSES, '[]'));
                const courseIndex = courses.findIndex(course => course.id === courseId);

                if (courseIndex !== -1) {
                    const oldName = courses[courseIndex].name;
                    courses[courseIndex].name = courseName;
                    courses[courseIndex].nameUpdatedTime = Date.now();

                    GM_setValue(this.STORAGE_KEYS.COURSES, JSON.stringify(courses));

                    // 更新元数据
                    const metadata = JSON.parse(GM_getValue(this.STORAGE_KEYS.METADATA, '{}'));
                    metadata.lastSaved = Date.now();
                    GM_setValue(this.STORAGE_KEYS.METADATA, JSON.stringify(metadata));

                    console.log(`${CONFIG.LOG.LOG_PREFIX} 课程名称已更新: ${courseId} (${oldName} -> ${courseName})`);
                    return true;
                } else {
                    console.warn(`${CONFIG.LOG.LOG_PREFIX} 课程 ${courseId} 不存在，无法更新名称`);
                }
            } catch (error) {
                console.error(`${CONFIG.LOG.LOG_PREFIX} 更新课程名称失败:`, error);
            }
            return false;
        }

        /**
         * 从本地存储中删除指定课程
         */
        removeCourse(courseId) {
            if (!this.storageAvailable) return false;

            try {
                // 删除课程数据
                let courses = JSON.parse(GM_getValue(this.STORAGE_KEYS.COURSES, '[]'));
                courses = courses.filter(course => course.id !== courseId);

                // 删除实验班数据
                const experimentalClasses = JSON.parse(GM_getValue(this.STORAGE_KEYS.EXPERIMENTAL_CLASSES, '{}'));
                delete experimentalClasses[courseId];

                // 保存更新后的数据
                GM_setValue(this.STORAGE_KEYS.COURSES, JSON.stringify(courses));
                GM_setValue(this.STORAGE_KEYS.EXPERIMENTAL_CLASSES, JSON.stringify(experimentalClasses));

                // 更新元数据
                const metadata = JSON.parse(GM_getValue(this.STORAGE_KEYS.METADATA, '{}'));
                metadata.lastSaved = Date.now();
                GM_setValue(this.STORAGE_KEYS.METADATA, JSON.stringify(metadata));

                console.log(`${CONFIG.LOG.LOG_PREFIX} 课程已从本地存储删除: ${courseId}`);
                return true;
            } catch (error) {
                console.error(`${CONFIG.LOG.LOG_PREFIX} 删除课程失败:`, error);
                return false;
            }
        }

        /**
         * 获取会话计数
         */
        getSessionCount() {
            try {
                const metadata = JSON.parse(GM_getValue(this.STORAGE_KEYS.METADATA, '{}'));
                return metadata.sessionCount || 0;
            } catch (e) {
                return 0;
            }
        }

        /**
         * 清空所有本地存储数据
         */
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

        /**
         * 获取存储状态信息
         */
        getStorageInfo() {
            if (!this.storageAvailable) {
                return { available: false, message: '存储功能不可用' };
            }

            try {
                const courses = JSON.parse(GM_getValue(this.STORAGE_KEYS.COURSES, '[]'));
                const metadata = JSON.parse(GM_getValue(this.STORAGE_KEYS.METADATA, '{}'));

                return {
                    available: true,
                    coursesCount: courses.length,
                    lastSaved: metadata.lastSaved ? new Date(metadata.lastSaved).toLocaleString() : '未知',
                    version: metadata.version || '1.0.0',
                    sessionCount: metadata.sessionCount || 0
                };
            } catch (error) {
                return { available: true, error: error.message };
            }
        }

        /**
         * 获取已保存课程的详细摘要
         */
        getSavedCoursesSummary() {
            if (!this.storageAvailable) {
                return { available: false, courses: [] };
            }

            try {
                const courses = JSON.parse(GM_getValue(this.STORAGE_KEYS.COURSES, '[]'));
                const experimentalClasses = JSON.parse(GM_getValue(this.STORAGE_KEYS.EXPERIMENTAL_CLASSES, '{}'));

                return {
                    available: true,
                    courses: courses.map(course => ({
                        id: course.id,
                        name: course.name,
                        addedTime: course.addedTime,
                        hasExperimentalClasses: experimentalClasses[course.id] && experimentalClasses[course.id].length > 0,
                        experimentalClassesCount: experimentalClasses[course.id] ? experimentalClasses[course.id].length : 0,
                        isSuccessful: course.status?.success || false
                    })),
                    totalCourses: courses.length,
                    successfulCourses: courses.filter(c => c.status?.success).length
                };
            } catch (error) {
                console.error(`${CONFIG.LOG.LOG_PREFIX} 获取课程摘要失败:`, error);
                return { available: true, error: error.message, courses: [] };
            }
        }
    }

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
            this.localDataManager = new LocalDataManager();
            this.initEventListeners();
            this.loadSavedData();
        }

        initEventListeners() {
            // 监听自定义事件
            document.addEventListener('course:success', (event) => {
                const { courseId } = event.detail;
                console.log(`🎉 选课成功! 课程: ${courseId}`);
                this.showNotification(`成功抢到课程: ${courseId}`, 'success');
            });
        }

        /**
         * 加载保存的课程数据
         */
        loadSavedData() {
            console.log(`${CONFIG.LOG.LOG_PREFIX} 开始加载本地存储数据...`);

            const savedData = this.localDataManager.loadCoursesData();
            console.log(`${CONFIG.LOG.LOG_PREFIX} 本地存储数据读取结果:`, {
                hasData: !!savedData,
                coursesCount: savedData?.courses?.length || 0,
                courseDetailsCount: savedData?.courseDetails?.length || 0,
                experimentalClassesCount: Object.keys(savedData?.experimentalClasses || {}).length,
                storageAvailable: this.localDataManager.storageAvailable
            });

            if (savedData && savedData.courses.length > 0) {
                console.log(`${CONFIG.LOG.LOG_PREFIX} 发现${savedData.courses.length}门保存的课程:`, savedData.courses);
                console.log(`${CONFIG.LOG.LOG_PREFIX} 课程详细信息:`, savedData.courseDetails);
                console.log(`${CONFIG.LOG.LOG_PREFIX} 实验班信息:`, savedData.experimentalClasses);

                // 更新课程列表
                this.courses = savedData.courses; // ✅ 修复：直接使用已提取的ID数组
                this.glJxbidMap = savedData.experimentalClasses;

                console.log(`${CONFIG.LOG.LOG_PREFIX} 更新后的课程ID列表:`, this.courses);
                console.log(`${CONFIG.LOG.LOG_PREFIX} 更新后的实验班映射:`, this.glJxbidMap);

                // 初始化课程状态（使用保存的状态）
                savedData.courseDetails.forEach(courseDetail => {
                    this.statusMap[courseDetail.id] = {
                        success: courseDetail.status?.success || false,
                        glReady: false,
                        glAttemptIndex: 0
                    };
                    console.log(`${CONFIG.LOG.LOG_PREFIX} 课程${courseDetail.id}状态初始化:`, {
                        name: courseDetail.name,
                        success: this.statusMap[courseDetail.id].success
                    });
                });

                console.log(`${CONFIG.LOG.LOG_PREFIX} 完整的状态映射:`, this.statusMap);
                console.log(`${CONFIG.LOG.LOG_PREFIX} 数据加载完成，准备触发UI更新事件`);

                // 触发数据加载完成事件，通知UI更新
                const eventData = {
                    courses: this.courses,
                    courseDetails: savedData.courseDetails,
                    statusMap: this.statusMap
                };
                console.log(`${CONFIG.LOG.LOG_PREFIX} 触发storage:dataLoaded事件，数据:`, eventData);

                document.dispatchEvent(new CustomEvent('storage:dataLoaded', {
                    detail: eventData
                }));

                console.log(`${CONFIG.LOG.LOG_PREFIX} storage:dataLoaded事件已触发`);
            } else {
                console.log(`${CONFIG.LOG.LOG_PREFIX} 没有找到保存的数据或数据为空，使用默认状态`);
                console.log(`${CONFIG.LOG.LOG_PREFIX} savedData详情:`, savedData);
                console.log(`${CONFIG.LOG.LOG_PREFIX} 当前课程列表:`, this.courses);
                console.log(`${CONFIG.LOG.LOG_PREFIX} 当前状态映射:`, this.statusMap);
            }
        }

        /**
         * 保存当前数据到本地存储
         */
        saveCurrentData() {
            const success = this.localDataManager.saveCoursesData(
                this.courses,
                this.glJxbidMap,
                this.statusMap
            );

            if (!success) {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 数据保存失败，但不影响功能使用`);
            }

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
                        console.error(`🚫 [${jxbid}] 返回非 JSON 数据：`, html.substring(0, 100));
                    }
                    throw new Error(`请求失败：HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    console.log(`✅ [成功] ${jxbid}${glInfo} 选课成功！时间: ${data.xksj || new Date().toLocaleTimeString()}`);
                    state.success = true;

                    // 自动保存选课成功状态
                    this.saveCurrentData();

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

            // 自动保存数据
            this.saveCurrentData();

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

                // ✅ 修复：直接从本地存储中删除课程记录
                const storageRemoved = this.localDataManager.removeCourse(jxbid);
                if (storageRemoved) {
                    console.log(`${CONFIG.LOG.LOG_PREFIX} 课程${jxbid}已从本地存储删除`);
                } else {
                    console.warn(`${CONFIG.LOG.LOG_PREFIX} 从本地存储删除课程${jxbid}失败`);
                }

                // 自动保存数据（保存更新后的状态）
                this.saveCurrentData();

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

            // 重置后保存空数据
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

            // 防止重复创建状态面板的属性
            this.statusModal = null;
            this.stopTime = null;
            this.statusModalUpdateInterval = null;

            // 初始化存储事件监听
            this.initStorageEventListeners();
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
                        this.makeDraggable(this.panel, this.panel);
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
                    }
                } else if (!newJxbid && oldJxbid) {
                    // 删除课程情况
                    this.courseManager.removeCourse(oldJxbid);
                    inputId.dataset.currentCourseId = '';
                    inputName.value = '';
                }
            });

            // 绑定课程名称输入框的blur事件
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
                                this.makeDraggable(this.panel, this.panel);
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

                        const courseInput = this.createCourseInput(index);
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

                        // 设置课程名称（如果有的话）
                        const courseDetail = courseDetails.find(detail => detail.id === courseId);
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
                // 使面板可拖拽（使用整个面板作为拖拽手柄）
                this.makeDraggable(this.panel, this.panel);
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

            // 为课程名称输入框添加blur事件监听器
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

            // 添加Enter键支持
            inputName.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    inputName.blur();
                }
            });

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

        // 添加删除确认对话框方法（参考重置弹窗实现）
        showDeleteConfirmation(courseId, courseName, onConfirm) {
            const courseStatus = this.courseManager.getStatusForCourse(courseId);

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
                z-index: ${CONFIG.Z_INDEX.DIALOG};
                min-width: 350px;
                font-family: Arial, sans-serif;
                animation: shake 0.5s ease-in-out;
            `;

            confirmDialog.innerHTML = `
                <h4 style="margin: 0 0 15px 0; color: #dc3545; display: flex; align-items: center;">
                    <span style="font-size: 24px; margin-right: 10px;">🗑️</span>
                    确认删除课程
                </h4>

                <div style="background: #fff5f5; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; border-radius: 4px;">
                    <p style="margin: 5px 0;"><strong>课程ID：</strong><span style="color: #dc3545;">${courseId}</span></p>
                    <p style="margin: 5px 0;"><strong>课程名称：</strong>${courseName || '<span style="color: #6c757d;">未填写</span>'}</p>
                    <p style="margin: 5px 0;"><strong>选课状态：</strong>${courseStatus}</p>
                </div>

                <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 12px; margin: 15px 0; border-radius: 4px;">
                    <div style="display: flex; align-items: center; margin-bottom: 5px;">
                        <span style="font-size: 16px; margin-right: 8px;">⚠️</span>
                        <strong style="color: #991b1b;">删除后果</strong>
                    </div>
                    <div style="color: #991b1b; font-size: 13px; line-height: 1.4;">
                        • 停止对该课程的抢课进程<br>
                        • 如果选课尚未成功，需要重新添加该课程<br>
                        • 已选成功的课程不受影响
                    </div>
                </div>

                ${courseStatus !== '选课成功' ? `
                    <div style="background: #ffebee; color: #c62828; padding: 10px; border-radius: 4px; margin: 15px 0; font-size: 12px; text-align: center;">
                        💡 提示：该课程尚未成功，删除后将失去抢课机会
                    </div>
                ` : ''}

                <div style="text-align: center; margin-top: 20px;">
                    <button id="cancel-delete" style="
                        margin-right: 10px;
                        padding: 8px 20px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">取消</button>
                    <button id="confirm-delete" style="
                        padding: 8px 20px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        ${courseStatus !== '选课成功' ? 'animation: pulse 1s infinite;' : ''}
                    ">确认删除</button>
                </div>
            `;

            // 添加脉冲动画（如果需要）
            if (courseStatus !== '选课成功' && !document.getElementById('pulse-animation-styles')) {
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

            // 事件绑定（使用重置弹窗的简单方式）
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

            // 阻止点击背景关闭
            confirmDialog.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // 显示状态详情弹窗（增强版 - 单例模式 + 拖拽功能）
        showStatusModal() {
            try {
                // 单例模式：检查是否已有状态面板存在
                if (this.statusModal && document.body.contains(this.statusModal)) {
                    console.log('状态面板已存在，提升层级并返回');
                    this.statusModal.style.zIndex = CONFIG.Z_INDEX.MODAL;
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
                    z-index: ${CONFIG.Z_INDEX.MODAL};
                    width: 400px;
                    min-width: 400px;
                    max-width: 90vw;
                    height: auto;
                    max-height: 70vh;
                    resize: none;
                    font-family: Arial, sans-serif;
                    cursor: move;
                    user-select: none;
                `;

                // 创建标题栏（可拖拽）
                const titleBar = document.createElement('div');
                titleBar.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #dee2e6;
                    cursor: move;
                `;

                const title = document.createElement('h4');
                title.textContent = '📊 选课状态详情';
                title.style.cssText = `
                    margin: 0;
                    color: #333;
                    font-size: 18px;
                    pointer-events: none;
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
                    pointer-events: auto;
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
                statusContent.style.cssText = `
                    pointer-events: auto;
                    max-height: calc(70vh - 120px); /* 减去标题栏、padding和resize手柄的高度 */
                    overflow-y: auto;
                    overflow-x: hidden;
                `;

                statusModal.appendChild(titleBar);
                statusModal.appendChild(statusContent);

                // 添加resize手柄（右下角）
                const resizeHandle = document.createElement('div');
                resizeHandle.style.cssText = `
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 20px;
                    height: 20px;
                    background: linear-gradient(135deg, transparent 50%, #6c757d 50%);
                    border-radius: 0 0 6px 0;
                    cursor: nwse-resize;
                    pointer-events: auto;
                    z-index: ${CONFIG.Z_INDEX.MODAL + 1};
                `;
                statusModal.appendChild(resizeHandle);

                document.body.appendChild(statusModal);

                // 存储引用
                this.statusModal = statusModal;

                // 启用拖拽功能
                this.makeDraggable(statusModal, titleBar);

                // 启用resize功能
                this.makeResizable(statusModal, resizeHandle);

                // 启动状态更新定时器
                this.startStatusModalUpdates();

                // 关闭事件处理
                const closeModal = () => {
                    this.stopStatusModalUpdates();
                    if (document.body.contains(statusModal)) {
                        document.body.removeChild(statusModal);
                        this.statusModal = null;
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

                console.log('状态详情面板已创建');

            } catch (error) {
                console.error('创建状态面板失败:', error);
            }
        }

        // 启动状态弹窗更新
        startStatusModalUpdates() {
            this.statusModalUpdateInterval = setInterval(() => {
                this.updateStatusModal();
            }, 1000);
            // 立即更新一次
            this.updateStatusModal();
        }

        // 更新状态弹窗内容（增强版 - 正确时间计算 + 课程状态逻辑）
        updateStatusModal() {
            const statusContainer = document.getElementById('status-modal-content');
            if (!statusContainer) return;

            // 添加自定义滚动条样式（仅一次）
            if (!document.getElementById('custom-scrollbar-styles')) {
                const scrollbarStyle = document.createElement('style');
                scrollbarStyle.id = 'custom-scrollbar-styles';
                scrollbarStyle.textContent = `
                    /* 自定义滚动条样式 */
                    #status-modal-content {
                        scrollbar-width: thin;
                        scrollbar-color: #6c757d #f1f3f4;
                    }

                    #status-modal-content::-webkit-scrollbar {
                        width: 8px;
                    }

                    #status-modal-content::-webkit-scrollbar-track {
                        background: #f1f3f4;
                        border-radius: 4px;
                        border: 1px solid #e9ecef;
                    }

                    #status-modal-content::-webkit-scrollbar-thumb {
                        background: #6c757d;
                        border-radius: 4px;
                        border: 1px solid #adb5bd;
                        transition: background-color 0.2s;
                    }

                    #status-modal-content::-webkit-scrollbar-thumb:hover {
                        background: #495057;
                    }

                    #status-modal-content::-webkit-scrollbar-thumb:active {
                        background: #343a40;
                    }

                    /* 滚动条容器阴影效果 */
                    #status-modal-content {
                        box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
                    }
                `;
                document.head.appendChild(scrollbarStyle);
            }

            const status = this.courseManager.getStatus();

            // 使用统一的时间计算方法
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
                        <h5 style="margin: 0 0 10px 0; color: #495057;">📚 课程详情 (${status.courses.length}门)</h5>
                        <div style="
                            background: #f8f9fa;
                            border-radius: 6px;
                            padding: 12px;
                            position: relative;
                        " class="course-details-container">
                `;

                status.courses.forEach((course, index) => {
                    // 根据选课状态决定课程状态显示
                    let courseStatus, statusIcon, statusColor, statusBg;

                    if (course.success) {
                        courseStatus = '已成功';
                        statusIcon = '✅';
                        statusColor = '#28a745';
                        statusBg = '#d4edda';
                    } else if (status.isRunning) {
                        courseStatus = '进行中';
                        statusIcon = '⏳';
                        statusColor = '#007bff';
                        statusBg = '#d1ecf1';
                    } else {
                        courseStatus = '待进行';
                        statusIcon = '⏸️';
                        statusColor = '#6c757d';
                        statusBg = '#f8f9fa';
                    }

                    contentHTML += `
                        <div style="padding: 8px 0; ${index < status.courses.length - 1 ? 'border-bottom: 1px solid #dee2e6;' : ''}">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <span style="font-weight: bold; color: #495057;">
                                    ${statusIcon} ${course.id}
                                </span>
                                <span style="color: ${statusColor}; font-size: 12px; padding: 2px 8px; background: ${statusBg}; border-radius: 12px;">
                                    ${courseStatus}
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

        // 停止状态弹窗更新
        stopStatusModalUpdates() {
            if (this.statusModalUpdateInterval) {
                clearInterval(this.statusModalUpdateInterval);
                this.statusModalUpdateInterval = null;
            }
        }

        // 计算运行时间（统一方法）
        calculateRunTime() {
            if (!this.startTime) return 0;
            if (this.isSelectingCourses) {
                return Math.floor((Date.now() - this.startTime) / 1000);
            } else if (this.stopTime) {
                return Math.floor((this.stopTime - this.startTime) / 1000);
            }
            return 0;
        }

        // 格式化运行时间显示
        formatRunTime(totalSeconds) {
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        // 拖拽功能实现（支持触控设备，修复transform转换问题）
        makeDraggable(element, handle) {
            let isDragging = false;
            let startX, startY;

            function dragStart(e) {
                try {
                    // 检查拖拽权限
                    if (handle && e.target !== handle && !handle.contains(e.target)) {
                        return;
                    }

                    isDragging = true;
                    element.style.cursor = 'grabbing';
                    element.style.zIndex = CONFIG.Z_INDEX.DIALOG;

                    const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
                    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;

                    const rect = element.getBoundingClientRect();
                    const computedStyle = window.getComputedStyle(element);

                    // 统一位置计算逻辑 - 修复transform转换问题
                    if (computedStyle.transform && computedStyle.transform !== 'none') {
                        // 处理transform定位（包括 translate(-50%, -50%)）
                        const matrix = new DOMMatrix(computedStyle.transform);
                        const translateX = matrix.m41; // X轴平移值
                        const translateY = matrix.m42; // Y轴平移值

                        // 计算实际的左上角位置
                        const actualLeft = rect.left + translateX;
                        const actualTop = rect.top + translateY;

                        startX = clientX - actualLeft;
                        startY = clientY - actualTop;

                        // 转换为left/top定位，避免右下角跳跃
                        element.style.transform = 'none';
                        element.style.left = actualLeft + 'px';
                        element.style.top = actualTop + 'px';
                        element.style.right = 'auto';
                        element.style.bottom = 'auto';

                    } else {
                        // 处理已经使用left/top定位的元素
                        startX = clientX - rect.left;
                        startY = clientY - rect.top;
                    }

                } catch (error) {
                    console.error('拖拽开始失败:', error);
                    isDragging = false;
                }
            }

            function dragMove(e) {
                if (!isDragging) return;

                try {
                    e.preventDefault();

                    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
                    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;

                    let newLeft = clientX - startX;
                    let newTop = clientY - startY;

                    // 边界检查
                    const maxX = window.innerWidth - element.offsetWidth;
                    const maxY = window.innerHeight - element.offsetHeight;

                    // 限制在窗口边界内
                    newLeft = Math.max(0, Math.min(newLeft, maxX));
                    newTop = Math.max(0, Math.min(newTop, maxY));

                    // 更新位置（确保使用整数像素值）
                    element.style.left = Math.round(newLeft) + 'px';
                    element.style.top = Math.round(newTop) + 'px';

                } catch (error) {
                    console.error('拖拽过程失败:', error);
                }
            }

            function dragEnd() {
                if (!isDragging) return;

                try {
                    isDragging = false;
                    element.style.cursor = handle ? 'grab' : 'move';
                } catch (error) {
                    console.error('拖拽结束失败:', error);
                }
            }

            // 事件监听器
            const eventTarget = handle || element;

            // 鼠标事件
            eventTarget.addEventListener('mousedown', dragStart);
            document.addEventListener('mousemove', dragMove);
            document.addEventListener('mouseup', dragEnd);

            // 触控事件
            eventTarget.addEventListener('touchstart', dragStart, { passive: false });
            document.addEventListener('touchmove', dragMove, { passive: false });
            document.addEventListener('touchend', dragEnd);
        }

        // resize功能实现（右下角resize手柄）
        makeResizable(element, handle) {
            let isResizing = false;
            let startX, startY, startWidth, startHeight;

            function resizeStart(e) {
                try {
                    e.preventDefault();
                    isResizing = true;

                    const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
                    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;

                    startX = clientX;
                    startY = clientY;
                    startWidth = parseInt(window.getComputedStyle(element).width, 10);
                    startHeight = parseInt(window.getComputedStyle(element).height, 10);

                    element.style.cursor = 'nwse-resize';

                } catch (error) {
                    console.error('resize开始失败:', error);
                    isResizing = false;
                }
            }

            function resizeMove(e) {
                if (!isResizing) return;

                try {
                    e.preventDefault();

                    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
                    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;

                    let newWidth = startWidth + (clientX - startX);
                    let newHeight = startHeight + (clientY - startY);

                    // 应用最小和最大尺寸限制
                    const minWidth = 400; // 最小宽度
                    const minHeight = 300; // 最小高度
                    const maxWidth = window.innerWidth * 0.9; // 最大宽度
                    const maxHeight = window.innerHeight * 0.9; // 最大高度

                    newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
                    newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

                    // 更新尺寸
                    element.style.width = newWidth + 'px';
                    element.style.height = newHeight + 'px';
                    element.style.maxHeight = 'none'; // 取消maxHeight限制以允许手动调整

                    // 如果是状态面板，同时更新状态内容容器的最大高度
                    if (element.id === 'course-registration-panel' || element.querySelector('#status-modal-content')) {
                        const statusContent = element.querySelector('#status-modal-content');
                        if (statusContent) {
                            const titleBar = element.querySelector('div[style*="cursor: move"]');
                            const titleBarHeight = titleBar ? titleBar.offsetHeight : 60;
                            const paddingAndHandle = 80; // padding + resize handle + margin
                            const newMaxHeight = newHeight - titleBarHeight - paddingAndHandle;
                            statusContent.style.maxHeight = Math.max(200, newMaxHeight) + 'px';
                        }
                    }

                } catch (error) {
                    console.error('resize过程失败:', error);
                }
            }

            function resizeEnd() {
                if (!isResizing) return;

                try {
                    isResizing = false;
                    element.style.cursor = 'move';
                } catch (error) {
                    console.error('resize结束失败:', error);
                }
            }

            // 事件监听器
            // 鼠标事件
            handle.addEventListener('mousedown', resizeStart);
            document.addEventListener('mousemove', resizeMove);
            document.addEventListener('mouseup', resizeEnd);

            // 触控事件
            handle.addEventListener('touchstart', resizeStart, { passive: false });
            document.addEventListener('touchmove', resizeMove, { passive: false });
            document.addEventListener('touchend', resizeEnd);
        }

        // 显示重置确认弹窗
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
                z-index: ${CONFIG.Z_INDEX.DIALOG};
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

        // 执行重置操作
        executeReset() {
            console.log(`${CONFIG.LOG.LOG_PREFIX} 用户确认重置，开始执行重置操作`);

            // 重置课程管理器
            this.courseManager.reset();

            // 清空本地存储
            const storageCleared = this.courseManager.localDataManager.clearAllData();
            if (storageCleared) {
                console.log(`${CONFIG.LOG.LOG_PREFIX} 本地存储数据已清空`);
            } else {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 清空本地存储失败，但不影响重置操作`);
            }

            // 重置UI状态
            this.container.innerHTML = '';
            this.container.appendChild(this.createCourseInput(0));
            this.updateScrollableContainer();
            this.updateButtonStates(false);

            // 显示增强的通知消息
            const storageStatus = storageCleared ? '及本地存储数据' : '';
            this.showNotification(`所有状态${storageStatus}已重置`, 'info');

            console.log(`${CONFIG.LOG.LOG_PREFIX} 重置操作完成`);
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

            // 关闭按钮
            const closeButton = document.createElement('button');
            closeButton.textContent = '✕';
            closeButton.style.cssText = `
                background: none;
                border: none;
                font-size: 18px;
                font-weight: bold;
                color: #dc3545;
                cursor: pointer;
                padding: 5px 8px;
                border-radius: 3px;
                margin-left: 5px;
                line-height: 1;
                transition: all 0.2s ease;
            `;
            closeButton.title = '关闭程序';

            // 添加悬停效果
            closeButton.addEventListener('mouseenter', () => {
                closeButton.style.backgroundColor = '#dc3545';
                closeButton.style.color = 'white';
                closeButton.style.transform = 'scale(1.1)';
            });
            closeButton.addEventListener('mouseleave', () => {
                closeButton.style.backgroundColor = 'transparent';
                closeButton.style.color = '#dc3545';
                closeButton.style.transform = 'scale(1)';
            });

            // 添加点击处理器
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showCloseConfirmation();
            });

            titleBar.appendChild(title);
            titleBar.appendChild(minimizeButton);
            titleBar.appendChild(closeButton);
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
                    this.showNotification('请先输入至少一个课程ID！', 'warning');
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
                this.showStatusModal();
            }, '#6c757d');

            // 重置按钮
            const resetButton = this.createButton('🔄 重置', () => {
                this.showResetConfirmation();
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
                z-index: ${CONFIG.Z_INDEX.NOTIFICATION};
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
                z-index: ${CONFIG.Z_INDEX.NOTIFICATION};
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

            // ✅ 修复：初始化存储事件监听器（在数据加载事件之前设置）
            this.initStorageEventListeners();

            // 开始时显示悬浮按钮，而不是自动打开面板
            this.transitionToState(UI_STATES.FLOATING_BUTTON);

            // ✅ 修复：检查是否已有数据加载完成但事件未被捕获
            if (this.courseManager.courses.length > 0) {
                console.log(`${CONFIG.LOG.LOG_PREFIX} 检测到已有课程数据，恢复UI界面`);
                const savedData = this.courseManager.localDataManager.loadCoursesData();
                if (savedData) {
                    this.restoreUIFromStorage(this.courseManager.courses, savedData.courseDetails, this.courseManager.statusMap);
                }
            }

            // 课程状态变化监听器
            document.addEventListener('courses:started', () => {
                this.isSelectingCourses = true;
                this.startTime = Date.now();
                this.stopTime = null; // 重置停止时间
                console.log(`${CONFIG.LOG.LOG_PREFIX} 课程开始，UI状态更新为选课中`);
                // 如果当前是悬浮按钮状态，自动展开到主面板
                if (this.currentState === UI_STATES.FLOATING_BUTTON) {
                    this.transitionToState(UI_STATES.FULL_PANEL);
                }
            });

            document.addEventListener('courses:stopped', () => {
                this.isSelectingCourses = false;
                this.stopTime = Date.now(); // 记录停止时间
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

        // 显示关闭确认对话框
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
                    z-index: ${CONFIG.Z_INDEX.OVERLAY};
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

        // 执行关闭程序操作
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
                if (this.panel && document.body.contains(this.panel)) {
                    try {
                        document.body.removeChild(this.panel);
                        this.panel = null;
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

                // 5. 移除悬浮按钮
                if (this.floatingButton && document.body.contains(this.floatingButton)) {
                    try {
                        document.body.removeChild(this.floatingButton);
                        this.floatingButton = null;
                        console.log('🛑 [关闭] 悬浮按钮已移除');
                    } catch (error) {
                        console.error('🛑 [关闭] 移除悬浮按钮失败:', error);
                    }
                }

                // 6. 移除迷你状态面板
                if (this.minimizedPanel && document.body.contains(this.minimizedPanel)) {
                    try {
                        document.body.removeChild(this.minimizedPanel);
                        this.minimizedPanel = null;
                        console.log('🛑 [关闭] 迷你状态面板已移除');
                    } catch (error) {
                        console.error('🛑 [关闭] 移除迷你状态面板失败:', error);
                    }
                }

                // 7. 清理全局引用
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

                // 8. 显示关闭成功消息
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
                    z-index: ${CONFIG.Z_INDEX.TOPMOST};
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

                // 9. 记录关闭日志
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
                    z-index: ${CONFIG.Z_INDEX.TOPMOST};
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

        // 显示通知消息（简化版）
        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 6px;
                color: white;
                font-family: Arial, sans-serif;
                font-size: 14px;
                z-index: ${CONFIG.Z_INDEX.TOPMOST + 1};
                opacity: 0;
                transition: opacity 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            `;

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
// ==================== Tampermonkey环境检测 ====================
    function initializeScript() {
        try {
            // 验证运行环境
            if (!window.location.hostname.includes("scuec.edu.cn")) {
                console.warn("[选课助手] 非目标域名，跳过初始化");
                return;
            }
            // 检查是否已经初始化过，避免重复加载
            if (window.courseManager || window.uiController) {
                console.log("[选课助手] 脚本已初始化，跳过重复加载");
                return;
            }
            console.log("[选课助手] Tampermonkey环境初始化开始");

            // ==================== 主程序入口 ====================

            // 创建管理器实例
            const courseManager = new CourseRegistrationManager();
            const uiController = new UIController(courseManager);

            // 初始化界面（包含数据恢复逻辑）
            uiController.initialize();

            // 暴露到全局作用域
            window.courseManager = courseManager;
            window.uiController = uiController;
            window.stopLoop = () => courseManager.stopLoop();

            // 显示版权信息和启动消息
            console.log(`
🎓 中南民族大学自动选课助手 v1.0.4
👤 作者: SuShuHeng (https://github.com/sushuheng)
📜 许可证: APACHE 2.0
⚠️  免责声明: 本项目仅用于学习目的，请遵守学校相关规定
📧 商用请联系: https://github.com/sushuheng
⚖️  协议: http://www.apache.org/licenses/LICENSE-2.0

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

        } catch (error) {
            console.error("[选课助手] 初始化过程中发生错误:", error);
            // 尝试清理可能已创建的全局变量
            if (window.courseManager) delete window.courseManager;
            if (window.uiController) delete window.uiController;
            if (window.stopLoop) delete window.stopLoop;
        }
    }

    // ==================== Tampermonkey初始化调度 ====================
    // Tampermonkey环境下使用document-idle时机
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            setTimeout(initializeScript, 500);
        });
    } else if (document.readyState === "interactive") {
        document.addEventListener("load", () => {
            setTimeout(initializeScript, 500);
        });
    } else {
        // 页面已完全加载，延迟500ms确保稳定
        setTimeout(initializeScript, 500);
    }

})();