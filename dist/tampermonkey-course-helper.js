// ==UserScript==
// @name         SCMU自动选课助手
// @namespace    https://github.com/sushuheng/SCMU_CC_Helper
// @version      2.1.0
// @description  专为中南民族大学学生设计的自动化课程注册助手，支持7种选课类型，完整UI优化和数据持久化
// @author       SuShuHeng <https://github.com/sushuheng>
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
 * 中南民族大学自动选课助手 v2.1.0
 * 油猴脚本版本 - 支持7种课程类型的完整选课功能，优化UI体验和数据持久化
 *
 * @file         tampermonkey-course-helper.js
 * @author       SuShuHeng <https://github.com/sushuheng>
 * @license      APACHE 2.0
 * @version      2.1.0
 * @description   专为中南民族大学学生设计的自动化课程注册助手，支持所有选课类型，包含完整UI优化和数据持久化功能
 * @keywords     选课助手, SCMU, 中南民族大学, 自动选课, 课程注册
 *
 * Copyright (c) 2025 SuShuHeng
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * ==================== 重要提示 ====================
 * 本脚本为开源学习项目，仅供学习和交流使用
 * 使用本脚本前请确保已阅读并理解以下条款：
 *
 * 商业使用限制：
 * - 严格禁止任何形式的商业用途和盈利行为
 * - 商业使用需获得作者的明确书面授权
 * - 禁止对本脚本进行反编译、破解或修改后分发
 * - 禁止将本脚本集成到商业软件中
 *
 * 使用须知：
 * - 本脚本仅用于辅助选课，不代表一定能成功选课
 * - 使用者需自行承担使用本脚本的所有风险和后果
 * - 请遵守学校选课相关规定和网站使用条款
 * - 因使用本脚本导致的任何问题，作者不承担责任
 *
 * 免责声明：
 * - 本项目仅用于学习交流目的
 * - 使用者需自行承担使用风险
 * - 请遵守学校相关规定和网站使用条款
 * - 本脚本不保证在任何情况下都能正常工作
 * - 使用本脚本时请遵守相关法律法规
 *
 * 技术支持：
 * - GitHub: https://github.com/sushuheng/SCMU_CC_Helper
 * - 作者邮箱: (请通过GitHub联系)
 * - 更新日志: 详见项目README
 *
 * 感谢使用中南民族大学自动选课助手！
 */

(function() {
    'use strict';

    // ==================== 本地数据管理器 ====================
    class LocalDataManager {
        constructor() {
            this.STORAGE_KEYS = {
                COURSES: 'scmu_courses',
                EXPERIMENTAL_CLASSES: 'scmu_experimental_classes',
                METADATA: 'scmu_metadata'
            };
            this.DATA_VERSION = '2.0.0';
            this.storageAvailable = this.checkStorageAvailability();
            this.DEFAULT_COURSE_NAME = '请输入名称(可选)';
        }

        checkStorageAvailability() {
            try {
                return typeof GM_setValue !== 'undefined' && typeof GM_getValue !== 'undefined';
            } catch (e) {
                console.error(`[选课助手] 存储功能检测失败:`, e);
                return false;
            }
        }

        saveCoursesData(courses, experimentalClasses, statusMap) {
            if (!this.storageAvailable) {
                console.warn(`[选课助手] 存储功能不可用，数据无法保存`);
                return false;
            }

            try {
                // 数据验证
                if (!Array.isArray(courses)) {
                    console.error(`[选课助手] 课程数据格式错误，期望数组格式`);
                    return false;
                }

                // 过滤无效课程ID
                const validCourses = courses.filter(courseId =>
                    courseId && typeof courseId === 'string' && courseId.trim().length > 0
                );

                if (validCourses.length === 0) {
                    console.log(`[选课助手] 没有有效的课程数据需要保存`);
                    return true;
                }

                // 获取现有数据以保留课程名称等信息
                const existingDataStr = GM_getValue(this.STORAGE_KEYS.COURSES, '[]');
                let existingCourses = [];
                try {
                    existingCourses = JSON.parse(existingDataStr);
                } catch (e) {
                    console.warn(`[选课助手] 读取现有课程数据失败，将使用默认数据`);
                }

                // 合并数据，保留已存在的课程信息
                const mergedCourses = validCourses.map(courseId => {
                    const existing = existingCourses.find(c => c.id === courseId);
                    return {
                        id: courseId,
                        name: existing?.name || this.DEFAULT_COURSE_NAME,
                        addedTime: existing?.addedTime || Date.now(),
                        status: {
                            success: statusMap[courseId]?.success || existing?.status?.success || false
                        }
                    };
                });

                const storageData = {
                    courses: mergedCourses,
                    experimentalClasses: experimentalClasses || {},
                    metadata: {
                        lastSaved: Date.now(),
                        version: this.DATA_VERSION,
                        sessionCount: this.getSessionCount() + 1,
                        coursesCount: mergedCourses.length
                    }
                };

                // 保存数据
                GM_setValue(this.STORAGE_KEYS.COURSES, JSON.stringify(storageData.courses));
                GM_setValue(this.STORAGE_KEYS.EXPERIMENTAL_CLASSES, JSON.stringify(storageData.experimentalClasses));
                GM_setValue(this.STORAGE_KEYS.METADATA, JSON.stringify(storageData.metadata));

                console.log(`[选课助手] 数据保存成功，共${storageData.courses.length}门课程，会话次数:${storageData.metadata.sessionCount}`);
                return true;
            } catch (error) {
                console.error(`[选课助手] 保存数据失败:`, error);
                return false;
            }
        }

        loadCoursesData() {
            if (!this.storageAvailable) {
                console.warn(`[选课助手] 本地存储不可用，无法加载数据`);
                return null;
            }

            try {
                const coursesStr = GM_getValue(this.STORAGE_KEYS.COURSES, '[]');
                const experimentalClassesStr = GM_getValue(this.STORAGE_KEYS.EXPERIMENTAL_CLASSES, '{}');
                const metadataStr = GM_getValue(this.STORAGE_KEYS.METADATA, '{}');

                const courses = JSON.parse(coursesStr);
                const experimentalClasses = JSON.parse(experimentalClassesStr);
                const metadata = JSON.parse(metadataStr);

                console.log(`[选课助手] 从本地存储读取到 ${courses.length} 门课程数据`);

                if (courses.length === 0) {
                    console.log(`[选课助手] 本地存储中没有课程数据`);
                    return null;
                }

                const result = {
                    courses: courses.map(course => course.id),
                    courseDetails: courses,
                    experimentalClasses,
                    metadata: metadata
                };

                console.log(`[选课助手] 数据加载完成:`, result);
                return result;
            } catch (error) {
                console.error(`[选课助手] 加载本地存储数据失败:`, error);
                // 清理损坏的数据
                try {
                    GM_deleteValue(this.STORAGE_KEYS.COURSES);
                    GM_deleteValue(this.STORAGE_KEYS.EXPERIMENTAL_CLASSES);
                    GM_deleteValue(this.STORAGE_KEYS.METADATA);
                    console.log(`[选课助手] 已清理损坏的本地存储数据`);
                } catch (clearError) {
                    console.error(`[选课助手] 清理数据失败:`, clearError);
                }
                return null;
            }
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

                console.log(`[选课助手] 课程已从本地存储删除: ${courseId}`);
                return true;
            } catch (error) {
                console.error(`[选课助手] 删除课程失败:`, error);
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
                console.log(`[选课助手] 所有本地存储数据已清空`);
                return true;
            } catch (error) {
                console.error(`[选课助手] 清空数据失败:`, error);
                return false;
            }
        }
    }

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

            this.localDataManager = new LocalDataManager();

            this.initEventListeners();
            // 注意：不要在这里立即加载数据，等待UIController准备就绪
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

        loadSavedData() {
            console.log(`${CONFIG.LOG.LOG_PREFIX} 开始加载本地存储数据...`);

            const savedData = this.localDataManager.loadCoursesData();

            if (savedData && savedData.courses.length > 0) {
                console.log(`${CONFIG.LOG.LOG_PREFIX} 发现${savedData.courses.length}门保存的课程:`, savedData.courses);

                // 更新课程列表
                this.courses = savedData.courses;
                this.glJxbidMap = savedData.experimentalClasses;

                // 初始化课程状态和类型（使用默认类型，因为旧版本没有保存类型信息）
                savedData.courseDetails.forEach(courseDetail => {
                    const courseType = 'KZYXK'; // 默认为方案外选课
                    this.courseTypeMap[courseDetail.id] = courseType;
                    this.statusMap[courseDetail.id] = {
                        success: courseDetail.status?.success || false,
                        glReady: false,
                        glAttemptIndex: 0,
                        courseType: courseType
                    };
                });

                console.log(`${CONFIG.LOG.LOG_PREFIX} 数据加载完成，准备触发UI更新事件`);

                // 延迟触发数据加载完成事件，给UI更多初始化时间
                const eventData = {
                    courses: this.courses,
                    courseDetails: savedData.courseDetails,
                    statusMap: this.statusMap
                };

                setTimeout(() => {
                    document.dispatchEvent(new CustomEvent('storage:dataLoaded', {
                        detail: eventData
                    }));
                    console.log(`${CONFIG.LOG.LOG_PREFIX} UI更新事件已触发`);
                }, 200); // 增加延迟确保UI容器有足够时间创建
            } else {
                console.log(`${CONFIG.LOG.LOG_PREFIX} 没有找到保存的数据或数据为空`);
            }
        }

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

                    // 自动保存选课成功状态
                    this.saveCurrentData();

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
            console.log(`${CONFIG.LOG.LOG_PREFIX} 开始添加课程:`, { jxbid, courseType });

            // 基础验证
            if (!jxbid || jxbid.trim() === '') {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 课程ID不能为空`);
                return false;
            }

            const trimmedId = jxbid.trim();
            console.log(`${CONFIG.LOG.LOG_PREFIX} 处理后的课程ID: ${trimmedId}`);

            // 检查是否已存在
            if (this.courses.includes(trimmedId)) {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 课程 ${trimmedId} 已存在，无需重复添加`);
                return false;
            }

            // 验证课程类型
            if (!CONFIG.COURSE_TYPES[courseType]) {
                console.error(`${CONFIG.LOG.LOG_PREFIX} 未知的课程类型: ${courseType}，可用类型:`, Object.keys(CONFIG.COURSE_TYPES));
                return false;
            }

            // 验证格式
            if (!CONFIG.COURSE_ID.VALIDATION_REGEX.test(trimmedId)) {
                console.error(`${CONFIG.LOG.LOG_PREFIX} 课程ID格式无效: ${trimmedId}，正则: ${CONFIG.COURSE_ID.VALIDATION_REGEX}`);
                return false;
            }

            try {
                // 添加课程
                this.courses.push(trimmedId);
                this.courseTypeMap[trimmedId] = courseType;
                this.initCourseState(trimmedId, courseType);

                const courseTypeInfo = CONFIG.COURSE_TYPES[courseType];
                console.log(`${CONFIG.LOG.LOG_PREFIX} 已添加课程: ${trimmedId} [${courseTypeInfo.name}]`);

                // 自动保存数据
                const saveResult = this.saveCurrentData();
                if (!saveResult) {
                    console.error(`${CONFIG.LOG.LOG_PREFIX} 课程 ${trimmedId} 添加成功，但数据保存失败`);
                }

                return true;
            } catch (error) {
                console.error(`${CONFIG.LOG.LOG_PREFIX} 添加课程 ${trimmedId} 时发生错误:`, error);
                // 回滚操作
                const index = this.courses.indexOf(trimmedId);
                if (index !== -1) {
                    this.courses.splice(index, 1);
                }
                delete this.courseTypeMap[trimmedId];
                delete this.statusMap[trimmedId];
                return false;
            }
        }

        removeCourse(jxbid) {
            console.log(`${CONFIG.LOG.LOG_PREFIX} 开始移除课程: ${jxbid}`);

            if (!jxbid || jxbid.trim() === '') {
                console.warn(`${CONFIG.LOG.LOG_PREFIX} 课程ID不能为空`);
                return false;
            }

            const trimmedId = jxbid.trim();
            const index = this.courses.indexOf(trimmedId);

            if (index !== -1) {
                try {
                    // 备份数据以防回滚
                    const backupCourse = this.courses[index];
                    const backupStatus = this.statusMap[trimmedId];
                    const backupGlJxbid = this.glJxbidMap[trimmedId];
                    const backupCourseType = this.courseTypeMap[trimmedId];

                    // 移除课程数据
                    this.courses.splice(index, 1);
                    delete this.statusMap[trimmedId];
                    delete this.glJxbidMap[trimmedId];
                    delete this.courseTypeMap[trimmedId];

                    console.log(`${CONFIG.LOG.LOG_PREFIX} 已移除课程: ${trimmedId}`);

                    // 从本地存储中删除课程记录
                    const storageRemoved = this.localDataManager.removeCourse(trimmedId);
                    if (storageRemoved) {
                        console.log(`${CONFIG.LOG.LOG_PREFIX} 课程${trimmedId}已从本地存储删除`);
                    } else {
                        console.warn(`${CONFIG.LOG.LOG_PREFIX} 课程${trimmedId}从本地存储删除失败`);
                    }

                    // 自动保存数据
                    const saveResult = this.saveCurrentData();
                    if (!saveResult) {
                        console.error(`${CONFIG.LOG.LOG_PREFIX} 课程 ${trimmedId} 移除成功，但数据保存失败`);
                    }

                    return true;
                } catch (error) {
                    console.error(`${CONFIG.LOG.LOG_PREFIX} 移除课程 ${trimmedId} 时发生错误:`, error);
                    return false;
                }
            }

            console.warn(`${CONFIG.LOG.LOG_PREFIX} 课程 ${trimmedId} 不存在，无法移除`);
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

    // ==================== UI控制器 ====================
    class UIController {
        constructor(courseManager) {
            this.courseManager = courseManager;
            this.panel = null;
            this.container = null;
            this.startButton = null;
            this.stopButton = null;
            this.addButton = null;
            this.resetButton = null;
            this.floatingButton = null;
            this.successRecordsContainer = null;
            this.recordsList = null;
            this.currentCoursesContainer = null;
            this.currentCoursesList = null;
            this.currentState = 'FLOATING_BUTTON';
            this.isSelectingCourses = false;

            // 添加待恢复数据机制
            this.pendingRestoreData = null;

            this.initStorageEventListeners();
            this.initialize();
        }

        initStorageEventListeners() {
            console.log(`${CONFIG.LOG.LOG_PREFIX} 初始化存储事件监听器...`);

            // 监听数据加载完成事件
            document.addEventListener('storage:dataLoaded', (event) => {
                const { courses, courseDetails, statusMap } = event.detail;

                console.log('[选课助手] 接收到数据加载事件:', { courses, courseDetails, statusMap });
                console.log('[选课助手] 当前UI状态:', {
                    panel: !!this.panel,
                    container: !!this.container,
                    recordsList: !!this.recordsList,
                    currentCoursesList: !!this.currentCoursesList
                });

                if (!courses || courses.length === 0) {
                    console.log('[选课助手] 没有课程数据需要恢复');
                    return;
                }

                // 如果面板还未创建，保存数据供后续使用
                if (!this.panel) {
                    this.pendingRestoreData = { courses, courseDetails, statusMap };
                    console.log('[选课助手] 面板未创建，保存恢复数据待后续处理');
                    return;
                }

                // 执行实际UI恢复
                this.performUIRestore(courses, courseDetails, statusMap);
            });
        }

        // 执行实际UI恢复的方法
        performUIRestore(courses, courseDetails, statusMap) {
            console.log('[选课助手] 开始执行UI恢复');

            // 确保UI容器存在
            if (!this.container && this.panel) {
                this.container = this.panel.querySelector('div');
            }

            // 恢复主面板输入框
            if (this.container) {
                console.log('[选课助手] 恢复主面板课程输入框');
                // 清空现有输入框
                this.container.innerHTML = '';

                // 为每个保存的课程创建输入框
                courses.forEach((courseId, index) => {
                    const courseType = this.courseManager.courseTypeMap[courseId] || CONFIG.GRAB.DEFAULT_COURSE_TYPE;
                    const courseInput = this.createCourseInput(index, courseType);

                    const inputs = courseInput.querySelectorAll('input[type="text"]');
                    const inputId = inputs[0];
                    const inputName = inputs[1];

                    // 设置课程ID和类型
                    inputId.value = courseId;
                    inputId.dataset.currentCourseId = courseId;

                    // 设置课程类型选择器
                    const courseTypeSelector = courseInput.querySelector('select');
                    if (courseTypeSelector) {
                        courseTypeSelector.value = courseType;
                    }

                    // 设置课程名称
                    const courseDetail = courseDetails.find(detail => detail.id === courseId);
                    if (courseDetail && courseDetail.name && courseDetail.name !== this.courseManager.localDataManager.DEFAULT_COURSE_NAME) {
                        inputName.value = courseDetail.name;
                    }

                    this.container.appendChild(courseInput);
                });

                console.log(`[选课助手] 已恢复 ${courses.length} 个课程输入框`);
            } else {
                console.warn('[选课助手] 主面板容器不存在，无法恢复输入框');
            }

            // 更新当前选课课程信息记录容器
            this.updateCurrentCoursesList(courses, courseDetails, statusMap);

            // 更新选课成功记录容器
            this.updateSuccessRecordsFromStorage(courseDetails, statusMap);

            console.log('[选课助手] UI恢复完成');
        }

        initialize() {
            this.createFloatingButton();
            this.setupEventListeners();

            // 设置存储事件监听器
            this.initStorageEventListeners();

            // 现在可以安全地加载数据了，因为事件监听器已经设置好
            setTimeout(() => {
                this.courseManager.loadSavedData();
            }, 100); // 小延迟确保UI完全初始化
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

            // 强制覆盖所有可能的样式冲突
            this.floatingButton.style.cssText += `
                background-color: #007bff !important;
                color: #ffffff !important;
                border: none !important;
                outline: none !important;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
                text-shadow: none !important;
                opacity: 1 !important;
                visibility: visible !important;
                font-weight: bold !important;
                font-size: 14px !important;
                line-height: 1 !important;
                font-family: inherit !important;
            `;

            this.floatingButton.addEventListener('click', () => {
                this.showControlPanel();
            });

            // 优先寻找页面顶部的 .header 容器
            const headerContainer = document.querySelector('.header');
            const hTopContainer = document.querySelector('.hTop');

            // 设置按钮基础样式（确保在任何容器中都能正常显示）
            this.floatingButton.style.position = 'relative';
            this.floatingButton.style.display = 'inline-block';
            this.floatingButton.style.verticalAlign = 'middle';
            this.floatingButton.style.zIndex = '9999';
            this.floatingButton.style.margin = '0';
            this.floatingButton.style.padding = '0';
            this.floatingButton.style.float = 'none';
            this.floatingButton.style.width = '60px';
            this.floatingButton.style.height = '60px';
            this.floatingButton.style.borderRadius = '50%';
            this.floatingButton.style.backgroundColor = '#007bff';
            this.floatingButton.style.color = 'white';
            this.floatingButton.style.fontSize = '14px';
            this.floatingButton.style.fontWeight = 'bold';
            this.floatingButton.style.cursor = 'pointer';
            this.floatingButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            this.floatingButton.style.lineHeight = '60px';
            this.floatingButton.style.textAlign = 'center';
            this.floatingButton.style.userSelect = 'none';
            this.floatingButton.style.transition = 'all 0.3s ease';

            if (headerContainer) {
                // 挂载到 .header 容器内
                // 尝试添加到 .hTop 的末尾
                if (hTopContainer && headerContainer.contains(hTopContainer)) {
                    hTopContainer.appendChild(this.floatingButton);
                    this.floatingButton.style.marginLeft = '20px';
                    this.floatingButton.style.marginTop = '5px';
                    this.floatingButton.style.display = 'inline-block';
                    console.log('[选课助手] 悬浮按钮已添加到页面顶部 Header.hTop 容器中');
                } else {
                    // 如果有 .header 但没有 .hTop，直接添加到 header
                    headerContainer.appendChild(this.floatingButton);
                    this.floatingButton.style.position = 'absolute';
                    this.floatingButton.style.top = '10px';
                    this.floatingButton.style.right = '20px';
                    console.log('[选课助手] 悬浮按钮已添加到页面顶部 Header 容器中');
                }
            } else if (hTopContainer) {
                // 备选：挂载到 .hTop 容器
                hTopContainer.appendChild(this.floatingButton);
                this.floatingButton.style.marginLeft = '20px';
                this.floatingButton.style.marginTop = '5px';
                this.floatingButton.style.display = 'inline-block';
                console.log('[选课助手] 悬浮按钮已添加到页面顶部 .hTop 容器中');
            } else {
                // 最后备选：默认的 body 挂载方式
                this.floatingButton.style.position = 'fixed';
                this.floatingButton.style.top = '20px';
                this.floatingButton.style.right = '20px';
                this.floatingButton.style.margin = '0';
                this.floatingButton.style.display = 'flex';
                this.floatingButton.style.alignItems = 'center';
                this.floatingButton.style.justifyContent = 'center';

                document.body.appendChild(this.floatingButton);
                console.log('[选课助手] 未找到 Header 容器，使用默认位置');
            }
        }

        showControlPanel() {
            if (this.panel) {
                this.panel.style.display = 'block';
                this.floatingButton.style.display = 'none';
                return;
            }

            this.createControlPanel();

            // 如果有待恢复的数据，立即恢复
            if (this.pendingRestoreData) {
                console.log('[选课助手] 发现有待恢复数据，开始恢复UI');
                const { courses, courseDetails, statusMap } = this.pendingRestoreData;
                this.performUIRestore(courses, courseDetails, statusMap);
                this.pendingRestoreData = null; // 清除待恢复数据
            }

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
                background: none !important;
                border: none !important;
                font-size: 20px !important;
                cursor: pointer !important;
                padding: 0 !important;
                width: 20px !important;
                height: 20px !important;
                color: #333 !important;
                font-weight: bold !important;
                line-height: 1 !important;
                font-family: inherit !important;
                opacity: 1 !important;
                visibility: visible !important;
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

            // 添加当前选课课程信息记录容器
            this.createCurrentCoursesContainer();

            // 添加更多课程按钮
            this.addButton = document.createElement('button');
            this.addButton.textContent = '添加更多课程';
            this.addButton.style.cssText = `
                margin-top: 10px;
                padding: 8px 16px;
                margin-right: 10px;
                background-color: #007bff !important;
                color: #ffffff !important;
                border: none !important;
                border-radius: 5px !important;
                cursor: pointer !important;
                font-size: 14px !important;
                font-weight: 500 !important;
                transition: all 0.3s ease !important;
                box-shadow: 0 2px 4px rgba(0,123,255,0.3) !important;
                text-align: center !important;
                line-height: 1.4 !important;
                font-family: inherit !important;
                opacity: 1 !important;
                visibility: visible !important;
            `;

            // 添加悬停效果
            this.addButton.addEventListener('mouseenter', () => {
                this.addButton.style.backgroundColor = '#0056b3';
                this.addButton.style.transform = 'translateY(-1px)';
                this.addButton.style.boxShadow = '0 4px 8px rgba(0,123,255,0.4)';
            });

            this.addButton.addEventListener('mouseleave', () => {
                this.addButton.style.backgroundColor = '#007bff';
                this.addButton.style.transform = 'translateY(0)';
                this.addButton.style.boxShadow = '0 2px 4px rgba(0,123,255,0.3)';
            });

            this.addButton.addEventListener('mousedown', () => {
                this.addButton.style.transform = 'translateY(1px)';
            });

            this.addButton.addEventListener('mouseup', () => {
                this.addButton.style.transform = 'translateY(-1px)';
            });

            this.addButton.onclick = () => {
                const courseCount = this.container.children.length;
                this.container.appendChild(this.createCourseInput(courseCount, CONFIG.GRAB.DEFAULT_COURSE_TYPE));
            };

            this.panel.appendChild(this.addButton);

            // 控制按钮
            this.startButton = document.createElement('button');
            this.startButton.textContent = '开始选课';
            this.startButton.style.cssText = `
                margin-top: 10px;
                padding: 10px 20px;
                background-color: #28a745 !important;
                color: #ffffff !important;
                border: none !important;
                border-radius: 5px !important;
                cursor: pointer !important;
                margin-right: 10px;
                font-size: 14px !important;
                font-weight: 600 !important;
                transition: all 0.3s ease !important;
                box-shadow: 0 2px 4px rgba(40,167,69,0.3) !important;
                text-align: center !important;
                line-height: 1.4 !important;
                font-family: inherit !important;
                opacity: 1 !important;
                visibility: visible !important;
            `;

            // 添加悬停效果
            this.startButton.addEventListener('mouseenter', () => {
                if (!this.startButton.disabled) {
                    this.startButton.style.backgroundColor = '#218838';
                    this.startButton.style.transform = 'translateY(-1px)';
                    this.startButton.style.boxShadow = '0 4px 8px rgba(40,167,69,0.4)';
                }
            });

            this.startButton.addEventListener('mouseleave', () => {
                if (!this.startButton.disabled) {
                    this.startButton.style.backgroundColor = '#28a745';
                    this.startButton.style.transform = 'translateY(0)';
                    this.startButton.style.boxShadow = '0 2px 4px rgba(40,167,69,0.3)';
                }
            });

            this.startButton.addEventListener('mousedown', () => {
                if (!this.startButton.disabled) {
                    this.startButton.style.transform = 'translateY(1px)';
                }
            });

            this.startButton.addEventListener('mouseup', () => {
                if (!this.startButton.disabled) {
                    this.startButton.style.transform = 'translateY(-1px)';
                }
            });

            
            this.stopButton = document.createElement('button');
            this.stopButton.textContent = '停止选课';
            this.stopButton.style.cssText = `
                margin-top: 10px;
                padding: 10px 20px;
                background-color: #dc3545 !important;
                color: #ffffff !important;
                border: none !important;
                border-radius: 5px !important;
                cursor: pointer !important;
                margin-right: 10px;
                font-size: 14px !important;
                font-weight: 600 !important;
                transition: all 0.3s ease !important;
                box-shadow: 0 2px 4px rgba(220,53,69,0.3) !important;
                text-align: center !important;
                line-height: 1.4 !important;
                font-family: inherit !important;
                opacity: 1 !important;
                visibility: visible !important;
            `;

            // 添加悬停效果
            this.stopButton.addEventListener('mouseenter', () => {
                if (!this.stopButton.disabled) {
                    this.stopButton.style.backgroundColor = '#c82333';
                    this.stopButton.style.transform = 'translateY(-1px)';
                    this.stopButton.style.boxShadow = '0 4px 8px rgba(220,53,69,0.4)';
                }
            });

            this.stopButton.addEventListener('mouseleave', () => {
                if (!this.stopButton.disabled) {
                    this.stopButton.style.backgroundColor = '#dc3545';
                    this.stopButton.style.transform = 'translateY(0)';
                    this.stopButton.style.boxShadow = '0 2px 4px rgba(220,53,69,0.3)';
                }
            });

            this.stopButton.addEventListener('mousedown', () => {
                if (!this.stopButton.disabled) {
                    this.stopButton.style.transform = 'translateY(1px)';
                }
            });

            this.stopButton.addEventListener('mouseup', () => {
                if (!this.stopButton.disabled) {
                    this.stopButton.style.transform = 'translateY(-1px)';
                }
            });

            
            this.resetButton = document.createElement('button');
            this.resetButton.textContent = '重置所有';
            this.resetButton.style.cssText = `
                margin-top: 10px;
                padding: 10px 20px;
                background-color: #ffc107 !important;
                color: #212529 !important;
                border: none !important;
                border-radius: 5px !important;
                cursor: pointer !important;
                font-size: 14px !important;
                font-weight: 600 !important;
                transition: all 0.3s ease !important;
                box-shadow: 0 2px 4px rgba(255,193,7,0.3) !important;
                text-align: center !important;
                line-height: 1.4 !important;
                font-family: inherit !important;
                opacity: 1 !important;
                visibility: visible !important;
            `;

            // 添加悬停效果
            this.resetButton.addEventListener('mouseenter', () => {
                this.resetButton.style.backgroundColor = '#e0a800';
                this.resetButton.style.transform = 'translateY(-1px)';
                this.resetButton.style.boxShadow = '0 4px 8px rgba(255,193,7,0.4)';
            });

            this.resetButton.addEventListener('mouseleave', () => {
                this.resetButton.style.backgroundColor = '#ffc107';
                this.resetButton.style.transform = 'translateY(0)';
                this.resetButton.style.boxShadow = '0 2px 4px rgba(255,193,7,0.3)';
            });

            this.resetButton.addEventListener('mousedown', () => {
                this.resetButton.style.transform = 'translateY(1px)';
            });

            this.resetButton.addEventListener('mouseup', () => {
                this.resetButton.style.transform = 'translateY(-1px)';
            });

            this.panel.appendChild(this.startButton);
            this.panel.appendChild(this.stopButton);
            this.panel.appendChild(this.resetButton);

            // 添加选课成功记录容器
            this.createSuccessRecordsContainer();

            // 使面板可拖拽
            this.makeDraggable(this.panel, titleBar);

            document.body.appendChild(this.panel);
        }

        createCurrentCoursesContainer() {
            // 创建当前选课课程信息记录容器
            this.currentCoursesContainer = document.createElement('div');
            this.currentCoursesContainer.style.cssText = `
                margin-top: 10px;
                margin-bottom: 15px;
                padding: 10px;
                border: 1px solid #007bff;
                border-radius: 5px;
                background-color: #f8f9ff;
                font-size: 12px;
            `;

            // 添加标题
            const currentTitle = document.createElement('div');
            currentTitle.textContent = '📚 当前选课课程列表';
            currentTitle.style.cssText = `
                font-weight: bold;
                color: #007bff;
                margin-bottom: 8px;
                font-size: 14px;
            `;
            this.currentCoursesContainer.appendChild(currentTitle);

            // 添加课程列表容器
            this.currentCoursesList = document.createElement('div');
            this.currentCoursesList.id = 'current-courses-list';
            this.currentCoursesList.style.cssText = `
                line-height: 1.4;
            `;

            // 添加空状态提示
            const emptyState = document.createElement('div');
            emptyState.textContent = '暂无课程数据';
            emptyState.style.cssText = `
                color: #6c757d;
                font-style: italic;
            `;
            this.currentCoursesList.appendChild(emptyState);

            this.currentCoursesContainer.appendChild(this.currentCoursesList);
            this.panel.appendChild(this.currentCoursesContainer);

            console.log('[选课助手] 当前选课课程信息记录容器已创建');
        }

        createSuccessRecordsContainer() {
            // 创建选课成功记录容器
            this.successRecordsContainer = document.createElement('div');
            this.successRecordsContainer.style.cssText = `
                margin-top: 15px;
                padding: 10px;
                border: 1px solid #28a745;
                border-radius: 5px;
                background-color: #f8fff9;
                max-height: 150px;
                overflow-y: auto;
                font-size: 12px;
            `;

            // 添加标题
            const recordsTitle = document.createElement('div');
            recordsTitle.textContent = '🎉 选课成功记录';
            recordsTitle.style.cssText = `
                font-weight: bold;
                color: #28a745;
                margin-bottom: 8px;
                font-size: 14px;
            `;
            this.successRecordsContainer.appendChild(recordsTitle);

            // 添加记录列表容器
            this.recordsList = document.createElement('div');
            this.recordsList.id = 'success-records-list';
            this.recordsList.style.cssText = `
                line-height: 1.4;
            `;
            this.successRecordsContainer.appendChild(this.recordsList);

            // 添加空状态提示
            this.updateRecordsList([]);

            this.panel.appendChild(this.successRecordsContainer);
        }

        addSuccessRecord(courseData) {
            console.log('[选课助手] 添加选课成功记录:', courseData);
            const { courseId, courseType, timestamp } = courseData;

            if (!courseId || !courseType) {
                console.error('[选课助手] 添加成功记录失败: 缺少必要数据', { courseId, courseType });
                return;
            }

            const courseTypeInfo = CONFIG.COURSE_TYPES[courseType];
            if (!courseTypeInfo) {
                console.error('[选课助手] 添加成功记录失败: 无效的课程类型', courseType);
                return;
            }

            const time = new Date(timestamp).toLocaleTimeString();

            const record = {
                id: Date.now(),
                courseId: courseId,
                courseType: courseTypeInfo.name,
                time: time
            };

            console.log('[选课助手] 创建成功记录:', record);

            // 获取现有记录
            const existingRecords = this.getSuccessRecords();
            existingRecords.unshift(record);

            // 保持最多显示10条记录
            if (existingRecords.length > 10) {
                existingRecords.splice(10);
            }

            this.updateRecordsList(existingRecords);
        }

        getSuccessRecords() {
            if (!this.recordsList) return [];

            const records = [];
            const recordElements = this.recordsList.querySelectorAll('.success-record');

            recordElements.forEach(element => {
                const courseId = element.dataset.courseId;
                const courseType = element.dataset.courseType;
                const time = element.dataset.time;

                if (courseId && courseType && time) {
                    records.push({
                        courseId: courseId,
                        courseType: courseType,
                        time: time
                    });
                }
            });

            return records;
        }

        updateRecordsList(records) {
            if (!this.recordsList) return;

            this.recordsList.innerHTML = '';

            if (records.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.textContent = '暂无选课成功记录';
                emptyMessage.style.cssText = `
                    color: #666;
                    font-style: italic;
                    text-align: center;
                    padding: 10px;
                `;
                this.recordsList.appendChild(emptyMessage);
                return;
            }

            records.forEach(record => {
                const recordElement = document.createElement('div');
                recordElement.className = 'success-record';
                recordElement.dataset.courseId = record.courseId;
                recordElement.dataset.courseType = record.courseType;
                recordElement.dataset.time = record.time;

                recordElement.innerHTML = `
                    <div style="
                        margin-bottom: 5px;
                        padding: 5px;
                        background-color: #e8f5e8;
                        border-radius: 3px;
                        border-left: 3px solid #28a745;
                    ">
                        <strong>课程:</strong> ${record.courseId}
                        <span style="color: #28a745;">[${record.courseType}]</span>
                        <div style="font-size: 11px; color: #666; margin-top: 2px;">
                            选课时间: ${record.time}
                        </div>
                    </div>
                `;

                this.recordsList.appendChild(recordElement);
            });
        }

        clearSuccessRecords() {
            this.updateRecordsList([]);
        }

        updateCurrentCoursesList(courses, courseDetails, statusMap) {
            console.log('[选课助手] 开始更新当前课程列表:', {
                courses: courses,
                courseDetails: courseDetails,
                statusMap: statusMap,
                courseTypeMap: this.courseManager?.courseTypeMap,
                container: !!this.currentCoursesList
            });

            if (!this.currentCoursesList) {
                console.warn('[选课助手] 当前课程列表容器不存在');
                return;
            }

            // 清空现有内容
            this.currentCoursesList.innerHTML = '';

            if (!courses || courses.length === 0) {
                console.log('[选课助手] 没有课程数据，显示空状态');
                const emptyState = document.createElement('div');
                emptyState.textContent = '暂无课程数据';
                emptyState.style.cssText = `
                    color: #6c757d;
                    font-style: italic;
                `;
                this.currentCoursesList.appendChild(emptyState);
                return;
            }

            console.log(`[选课助手] 开始创建 ${courses.length} 个课程项目`);

            // 创建课程列表
            courses.forEach((courseId, index) => {
                console.log(`[选课助手] 处理课程 ${index + 1}: ${courseId}`);

                const courseDetail = courseDetails.find(detail => detail.id === courseId);
                const courseType = this.courseManager.courseTypeMap[courseId] || CONFIG.GRAB.DEFAULT_COURSE_TYPE;
                const courseTypeInfo = CONFIG.COURSE_TYPES[courseType];
                const status = statusMap[courseId] || {};

                console.log(`[选课助手] 课程 ${courseId} 信息:`, {
                    detail: courseDetail,
                    type: courseType,
                    typeInfo: courseTypeInfo,
                    status: status
                });

                const courseItem = document.createElement('div');
                courseItem.style.cssText = `
                    margin-bottom: 8px;
                    padding: 6px 8px;
                    background: white;
                    border-radius: 4px;
                    border-left: 3px solid #007bff;
                `;

                const courseIdElement = document.createElement('div');
                courseIdElement.style.cssText = `
                    font-weight: bold;
                    color: #333;
                    font-size: 13px;
                `;
                courseIdElement.textContent = `${index + 1}. ${courseId}`;

                const courseTypeInfoElement = document.createElement('div');
                courseTypeInfoElement.style.cssText = `
                    color: #666;
                    font-size: 11px;
                    margin-top: 2px;
                `;
                courseTypeInfoElement.textContent = `类型: ${courseTypeInfo.name}`;

                const courseNameElement = document.createElement('div');
                courseNameElement.style.cssText = `
                    color: #888;
                    font-size: 11px;
                    font-style: ${courseDetail?.name === this.courseManager.localDataManager.DEFAULT_COURSE_NAME ? 'italic' : 'normal'};
                    margin-top: 2px;
                `;
                courseNameElement.textContent = `名称: ${courseDetail?.name || '未设置'}`;

                const statusElement = document.createElement('div');
                statusElement.style.cssText = `
                    color: ${status.success ? '#28a745' : '#6c757d'};
                    font-size: 11px;
                    margin-top: 2px;
                    font-weight: ${status.success ? 'bold' : 'normal'};
                `;
                statusElement.textContent = `状态: ${status.success ? '✅ 已选上' : '⏳ 等待中'}`;

                courseItem.appendChild(courseIdElement);
                courseItem.appendChild(courseTypeInfoElement);
                courseItem.appendChild(courseNameElement);
                courseItem.appendChild(statusElement);

                this.currentCoursesList.appendChild(courseItem);
            });

            console.log(`[选课助手] 当前课程列表已更新，共 ${courses.length} 门课程`);
        }

        updateSuccessRecordsFromStorage(courseDetails, statusMap) {
            if (!this.recordsList) {
                console.warn('[选课助手] 选课成功记录容器不存在');
                return;
            }

            console.log('[选课助手] 开始恢复选课成功记录，数据:', { courseDetails, statusMap });

            // 从已选上的课程中提取成功记录
            const successRecords = [];
            if (courseDetails && statusMap) {
                courseDetails.forEach(course => {
                    if (statusMap[course.id]?.success) {
                        const courseType = this.courseManager.courseTypeMap[course.id] || CONFIG.GRAB.DEFAULT_COURSE_TYPE;
                        const courseTypeInfo = CONFIG.COURSE_TYPES[courseType];
                        const timestamp = course.status?.timestamp || course.addedTime || Date.now();

                        const record = {
                            id: timestamp, // 使用时间戳作为唯一ID
                            courseId: course.id,
                            courseType: courseTypeInfo.name, // 修复：添加课程类型
                            time: new Date(timestamp).toLocaleTimeString() // 修复：格式化时间
                        };

                        successRecords.push(record);
                        console.log('[选课助手] 添加成功记录:', record);
                    }
                });
            }

            // 按时间倒序排列（最新的在前面）
            successRecords.sort((a, b) => b.id - a.id);

            // 保持最多显示10条记录
            if (successRecords.length > 10) {
                successRecords.splice(10);
            }

            this.updateRecordsList(successRecords);
            console.log(`[选课助手] 选课成功记录已从存储恢复，共 ${successRecords.length} 条记录`);
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
            // 由于按钮可能还未创建，使用事件委托
            document.addEventListener('click', (e) => {
                if (e.target === this.startButton) {
                    const status = this.courseManager.getStatus();
                    if (status.totalCourses === 0) {
                        this.courseManager.showNotification('请先添加课程', 'warning');
                        return;
                    }
                    this.courseManager.initialize();
                    this.startButton.disabled = true;
                    this.stopButton.disabled = false;
                    this.updateButtonStyles();
                } else if (e.target === this.stopButton) {
                    this.courseManager.stopLoop();
                    this.startButton.disabled = false;
                    this.stopButton.disabled = true;
                    this.updateButtonStyles();
                } else if (e.target === this.resetButton) {
                    // 增强重置确认对话框
                    const confirmMessage = `⚠️ 重置操作将清除以下所有数据：\n\n` +
                        `• 所有已添加的课程\n` +
                        `• 课程选课状态和成功记录\n` +
                        `• 本地存储的持久化数据\n` +
                        `• 当前选课课程列表\n\n` +
                        `此操作不可恢复，确定要继续吗？`;

                    if (confirm(confirmMessage)) {
                        try {
                            // 1. 清空本地存储数据
                            const clearSuccess = this.courseManager.localDataManager.clearAllData();
                            if (clearSuccess) {
                                console.log('[选课助手] 本地存储数据已清空');
                            } else {
                                console.warn('[选课助手] 清空本地存储数据失败');
                            }

                            // 2. 重置课程管理器状态
                            this.courseManager.reset();

                            // 3. 清空UI容器并重置界面
                            this.container.innerHTML = '';
                            this.container.appendChild(this.createCourseInput(0, CONFIG.GRAB.DEFAULT_COURSE_TYPE));

                            // 4. 清空选课成功记录
                            this.clearSuccessRecords();

                            // 5. 重置当前课程列表
                            if (this.currentCoursesList) {
                                this.currentCoursesList.innerHTML = '';
                                const emptyState = document.createElement('div');
                                emptyState.textContent = '暂无课程数据';
                                emptyState.style.cssText = `
                                    color: #6c757d;
                                    font-style: italic;
                                `;
                                this.currentCoursesList.appendChild(emptyState);
                            }

                            // 6. 重置按钮状态
                            this.startButton.disabled = false;
                            this.stopButton.disabled = true;
                            this.updateButtonStyles();

                            // 7. 显示成功通知
                            this.courseManager.showNotification('✅ 所有数据已完全重置', 'success');
                            console.log('[选课助手] 完整重置操作已完成');

                        } catch (error) {
                            console.error('[选课助手] 重置操作过程中发生错误:', error);
                            this.courseManager.showNotification('❌ 重置操作失败，请查看控制台', 'error');
                        }
                    }
                }
            });

            // 监听选课成功事件，更新成功记录
            document.addEventListener('course:success', (event) => {
                if (this.addSuccessRecord) {
                    this.addSuccessRecord(event.detail);
                }
            });
        }

        updateButtonStyles() {
            // 更新开始选课按钮样式
            if (this.startButton) {
                if (this.startButton.disabled) {
                    this.startButton.style.backgroundColor = '#6c757d';
                    this.startButton.style.cursor = 'not-allowed';
                    this.startButton.style.boxShadow = 'none';
                    this.startButton.style.transform = 'translateY(0)';
                } else {
                    this.startButton.style.backgroundColor = '#28a745';
                    this.startButton.style.cursor = 'pointer';
                    this.startButton.style.boxShadow = '0 2px 4px rgba(40,167,69,0.3)';
                }
            }

            // 更新停止选课按钮样式
            if (this.stopButton) {
                if (this.stopButton.disabled) {
                    this.stopButton.style.backgroundColor = '#6c757d';
                    this.stopButton.style.cursor = 'not-allowed';
                    this.stopButton.style.boxShadow = 'none';
                    this.stopButton.style.transform = 'translateY(0)';
                } else {
                    this.stopButton.style.backgroundColor = '#dc3545';
                    this.stopButton.style.cursor = 'pointer';
                    this.stopButton.style.boxShadow = '0 2px 4px rgba(220,53,69,0.3)';
                }
            }
        }
    }

    // ==================== 初始化 ====================
    console.log('%c🎓 中南民族大学自动选课助手 v2.1.0', 'color: #007bff; font-size: 16px; font-weight: bold;');
    console.log('%c✨ 现已支持7种课程类型：推荐选课、方案内选课、方案外选课、重修选课、体育选择课、通识课程选修、创新创业类选修课', 'color: #28a745; font-size: 12px;');
    console.log('%c💾 自动保存课程数据，支持持久化存储，完善UI恢复', 'color: #17a2b8; font-size: 12px;');
    console.log('%c⚠️ 本工具仅供学习交流使用，请遵守学校相关规定', 'color: #ffc107; font-size: 12px;');

    // 首先创建CourseManager，但不立即加载数据
    const courseManager = new CourseRegistrationManager();
    // 然后创建UIController，它会负责数据的延迟加载
    const uiController = new UIController(courseManager);

    // 暴露到全局作用域
    if (typeof window !== 'undefined') {
        window.courseManager = courseManager;
        window.uiController = uiController;
        window.stopLoop = () => courseManager.stopLoop();
    }

    console.log('✅ 选课助手初始化完成！点击右上角"抢课"按钮开始使用。');
})();