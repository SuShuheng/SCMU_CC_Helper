/**
 * 中南民族大学自动选课助手
 * 单文件版本 - 直接复制粘贴到浏览器控制台使用
 * 支持7种课程类型的完整选课功能
 *
 * @author SuShuHeng <https://github.com/sushuheng>
 * @license APACHE 2.0
 * @version V1.1.0
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

    // ==================== 本地数据管理器 ====================
    class LocalDataManager {
        constructor() {
            this.STORAGE_KEYS = {
                COURSES: 'scmu_courses',
                EXPERIMENTAL_CLASSES: 'scmu_experimental_classes',
                METADATA: 'scmu_metadata'
            };
            this.DATA_VERSION = 'V1.1.0';
            this.storageAvailable = this.checkStorageAvailability();
            this.DEFAULT_COURSE_NAME = '请输入名称(可选)';
        }

        checkStorageAvailability() {
            try {
                return typeof localStorage !== 'undefined';
            } catch (e) {
                console.error(`[选课助手] 存储功能检测失败:`, e);
                return false;
            }
        }

        // 适配localStorage的GM_setValue等效方法
        setValue(key, value) {
            try {
                if (this.storageAvailable) {
                    localStorage.setItem(key, value);
                    return true;
                }
                return false;
            } catch (e) {
                console.error(`[选课助手] localStorage写入失败:`, e);
                return false;
            }
        }

        // 适配localStorage的GM_getValue等效方法
        getValue(key, defaultValue = '') {
            try {
                if (this.storageAvailable) {
                    const value = localStorage.getItem(key);
                    return value !== null ? value : defaultValue;
                }
                return defaultValue;
            } catch (e) {
                console.error(`[选课助手] localStorage读取失败:`, e);
                return defaultValue;
            }
        }

        saveCoursesData(courses, experimentalClasses, statusMap, courseTypeMap = {}, courseNameMap = {}) {
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
                const existingDataStr = this.getValue(this.STORAGE_KEYS.COURSES, '[]');
                let existingCourses = [];
                try {
                    existingCourses = JSON.parse(existingDataStr);
                } catch (e) {
                    console.warn(`[选课助手] 读取现有课程数据失败，将使用默认数据`);
                }

                // 合并数据，保留已存在的课程信息、课程类型和课程名称
                const mergedCourses = validCourses.map(courseId => {
                    const existing = existingCourses.find(c => c.id === courseId);
                    const courseName = courseNameMap[courseId] || existing?.name || this.DEFAULT_COURSE_NAME;
                    const courseType = courseTypeMap[courseId] || existing?.courseType || CONFIG.GRAB.DEFAULT_COURSE_TYPE;

                    console.log(`[选课助手] 合并课程数据: ${courseId}, 名称: "${courseName}", 类型: ${courseType}`);

                    return {
                        id: courseId,
                        name: courseName,
                        courseType: courseType,
                        addedTime: existing?.addedTime || Date.now(),
                        nameUpdatedTime: courseNameMap[courseId] ? Date.now() : existing?.nameUpdatedTime,
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
                this.setValue(this.STORAGE_KEYS.COURSES, JSON.stringify(storageData.courses));
                this.setValue(this.STORAGE_KEYS.EXPERIMENTAL_CLASSES, JSON.stringify(storageData.experimentalClasses));
                this.setValue(this.STORAGE_KEYS.METADATA, JSON.stringify(storageData.metadata));

                console.log(`[选课助手] 数据保存成功，共${storageData.courses.length}门课程，会话次数:${storageData.metadata.sessionCount}`);
                return true;
            } catch (error) {
                console.error(`[选课助手] 保存数据失败:`, error);
                return false;
            }
        }

        loadCoursesData() {
            if (!this.storageAvailable) {
                console.warn(`[选课助手] 存储功能不可用，无法加载数据`);
                return {
                    courses: [],
                    experimentalClasses: {},
                    courseDetails: {},
                    statusMap: {}
                };
            }

            try {
                // 读取课程数据
                const coursesDataStr = this.getValue(this.STORAGE_KEYS.COURSES, '[]');
                const coursesData = JSON.parse(coursesDataStr);

                if (!Array.isArray(coursesData)) {
                    console.warn(`[选课助手] 课程数据格式异常，使用默认数据`);
                    return {
                        courses: [],
                        experimentalClasses: {},
                        courseDetails: {},
                        statusMap: {}
                    };
                }

                // 读取实验班数据
                const experimentalClassesStr = this.getValue(this.STORAGE_KEYS.EXPERIMENTAL_CLASSES, '{}');
                const experimentalClasses = JSON.parse(experimentalClassesStr);

                // 提取课程ID、详细信息、状态映射
                const courses = [];
                const courseDetails = {};
                const statusMap = {};

                coursesData.forEach(course => {
                    if (course && course.id) {
                        courses.push(course.id);
                        courseDetails[course.id] = {
                            name: course.name || this.DEFAULT_COURSE_NAME,
                            courseType: course.courseType || CONFIG.GRAB.DEFAULT_COURSE_TYPE,
                            addedTime: course.addedTime || Date.now(),
                            nameUpdatedTime: course.nameUpdatedTime,
                            status: course.status || { success: false }
                        };
                        statusMap[course.id] = course.status || { success: false };
                    }
                });

                console.log(`[选课助手] 数据加载成功，共${courses.length}门课程`);
                console.log(`[选课助手] 课程详情:`, courseDetails);

                return {
                    courses,
                    experimentalClasses,
                    courseDetails,
                    statusMap
                };
            } catch (error) {
                console.error(`[选课助手] 加载数据失败:`, error);
                return {
                    courses: [],
                    experimentalClasses: {},
                    courseDetails: {},
                    statusMap: {}
                };
            }
        }

        updateCourseName(courseId, courseName) {
            if (!this.storageAvailable || !courseId) {
                console.warn(`[选课助手] 存储功能不可用或课程ID为空，无法更新课程名称`);
                return false;
            }

            try {
                const existingDataStr = this.getValue(this.STORAGE_KEYS.COURSES, '[]');
                let coursesData = JSON.parse(existingDataStr);

                if (!Array.isArray(coursesData)) {
                    coursesData = [];
                }

                // 查找并更新课程
                const courseIndex = coursesData.findIndex(c => c.id === courseId);
                if (courseIndex !== -1) {
                    coursesData[courseIndex].name = courseName;
                    coursesData[courseIndex].nameUpdatedTime = Date.now();
                    console.log(`[选课助手] 课程名称已更新: ${courseId} -> "${courseName}"`);
                } else {
                    console.warn(`[选课助手] 课程 ${courseId} 不存在，无法更新名称`);
                    return false;
                }

                // 保存更新后的数据
                this.setValue(this.STORAGE_KEYS.COURSES, JSON.stringify(coursesData));
                console.log(`[选课助手] 课程名称更新成功并已保存`);
                return true;
            } catch (error) {
                console.error(`[选课助手] 更新课程名称失败:`, error);
                return false;
            }
        }

        removeCourse(courseId) {
            if (!this.storageAvailable || !courseId) {
                console.warn(`[选课助手] 存储功能不可用或课程ID为空，无法删除课程`);
                return false;
            }

            try {
                const existingDataStr = this.getValue(this.STORAGE_KEYS.COURSES, '[]');
                let coursesData = JSON.parse(existingDataStr);

                if (!Array.isArray(coursesData)) {
                    coursesData = [];
                }

                const originalLength = coursesData.length;
                coursesData = coursesData.filter(c => c.id !== courseId);

                if (coursesData.length === originalLength) {
                    console.warn(`[选课助手] 课程 ${courseId} 不存在，无需删除`);
                    return true;
                }

                // 保存更新后的数据
                this.setValue(this.STORAGE_KEYS.COURSES, JSON.stringify(coursesData));
                console.log(`[选课助手] 课程 ${courseId} 已删除并保存`);
                return true;
            } catch (error) {
                console.error(`[选课助手] 删除课程失败:`, error);
                return false;
            }
        }

        clearAllData() {
            if (!this.storageAvailable) {
                console.warn(`[选课助手] 存储功能不可用，无法清除数据`);
                return false;
            }

            try {
                this.setValue(this.STORAGE_KEYS.COURSES, '[]');
                this.setValue(this.STORAGE_KEYS.EXPERIMENTAL_CLASSES, '{}');
                this.setValue(this.STORAGE_KEYS.METADATA, '{}');
                console.log(`[选课助手] 所有本地数据已清除`);
                return true;
            } catch (error) {
                console.error(`[选课助手] 清除数据失败:`, error);
                return false;
            }
        }

        getSessionCount() {
            if (!this.storageAvailable) {
                return 0;
            }

            try {
                const metadataStr = this.getValue(this.STORAGE_KEYS.METADATA, '{}');
                const metadata = JSON.parse(metadataStr);
                return metadata.sessionCount || 0;
            } catch (error) {
                return 0;
            }
        }

        getStorageStats() {
            if (!this.storageAvailable) {
                return {
                    available: false,
                    coursesCount: 0,
                    sessionCount: 0,
                    lastSaved: null
                };
            }

            try {
                const coursesDataStr = this.getValue(this.STORAGE_KEYS.COURSES, '[]');
                const coursesData = JSON.parse(coursesDataStr);
                const metadataStr = this.getValue(this.STORAGE_KEYS.METADATA, '{}');
                const metadata = JSON.parse(metadataStr);

                return {
                    available: true,
                    coursesCount: Array.isArray(coursesData) ? coursesData.length : 0,
                    sessionCount: metadata.sessionCount || 0,
                    lastSaved: metadata.lastSaved || null,
                    version: metadata.version || 'unknown'
                };
            } catch (error) {
                console.error(`[选课助手] 获取存储统计信息失败:`, error);
                return {
                    available: true,
                    coursesCount: 0,
                    sessionCount: 0,
                    lastSaved: null
                };
            }
        }
    }

    // ==================== 课程注册管理器 ====================
    class CourseRegistrationManager {
        constructor() {
            this.courses = [];
            this.statusMap = {};
            this.glJxbidMap = {};
            this.courseTypeMap = {};
            this.courseNameMap = {};
            this.intervalId = null;
            this.localDataManager = new LocalDataManager();

            // 加载保存的数据
            this.loadSavedData();

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

                // 添加成功记录（如果UI控制器存在）
                if (window.uiController && window.uiController.addSuccessRecord) {
                    window.uiController.addSuccessRecord(event.detail);
                }
            });
        }

        /**
         * 加载保存的数据
         */
        loadSavedData() {
            try {
                const savedData = this.localDataManager.loadCoursesData();

                if (savedData.courses.length > 0) {
                    this.courses = savedData.courses;
                    this.courseTypeMap = {};
                    this.courseNameMap = {};

                    // 恢复课程类型和名称映射
                    savedData.courses.forEach(courseId => {
                        const detail = savedData.courseDetails[courseId];
                        if (detail) {
                            this.courseTypeMap[courseId] = detail.courseType;
                            this.courseNameMap[courseId] = detail.name;
                        } else {
                            this.courseTypeMap[courseId] = CONFIG.GRAB.DEFAULT_COURSE_TYPE;
                            this.courseNameMap[courseId] = this.localDataManager.DEFAULT_COURSE_NAME;
                        }
                        this.initCourseState(courseId, this.courseTypeMap[courseId]);
                    });

                    // 恢复状态映射
                    this.statusMap = savedData.statusMap;

                    console.log(`[选课助手] 成功加载${savedData.courses.length}门课程的数据`);
                    console.log(`[选课助手] 课程类型映射:`, this.courseTypeMap);
                    console.log(`[选课助手] 课程名称映射:`, this.courseNameMap);

                    // 触发数据加载完成事件
                    document.dispatchEvent(new CustomEvent('storage:dataLoaded', {
                        detail: {
                            courses: this.courses,
                            courseDetails: savedData.courseDetails,
                            statusMap: this.statusMap
                        }
                    }));
                } else {
                    console.log('[选课助手] 没有找到保存的课程数据');
                }
            } catch (error) {
                console.error('[选课助手] 加载保存数据失败:', error);
            }
        }

        /**
         * 保存当前数据
         */
        saveCurrentData() {
            try {
                return this.localDataManager.saveCoursesData(
                    this.courses,
                    this.glJxbidMap,
                    this.statusMap,
                    this.courseTypeMap,
                    this.courseNameMap
                );
            } catch (error) {
                console.error('[选课助手] 保存当前数据失败:', error);
                return false;
            }
        }

        /**
         * 更新课程名称
         */
        updateCourseName(courseId, courseName) {
            if (!courseId) {
                console.warn('[选课助手] 课程ID不能为空');
                return false;
            }

            try {
                // 更新内存中的映射
                this.courseNameMap[courseId] = courseName;

                // 更新存储
                const success = this.localDataManager.updateCourseName(courseId, courseName);

                if (success) {
                    console.log(`[选课助手] 课程名称更新成功: ${courseId} -> "${courseName}"`);

                    // 触发更新事件
                    document.dispatchEvent(new CustomEvent('course:nameUpdated', {
                        detail: { courseId, courseName }
                    }));

                    return true;
                }

                return false;
            } catch (error) {
                console.error('[选课助手] 更新课程名称失败:', error);
                return false;
            }
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
            this.courseNameMap[trimmedId] = this.localDataManager.DEFAULT_COURSE_NAME;
            this.initCourseState(trimmedId, courseType);

            const courseTypeInfo = CONFIG.COURSE_TYPES[courseType];
            console.log(`${CONFIG.LOG.LOG_PREFIX} 已添加课程: ${trimmedId} [${courseTypeInfo.name}]`);

            // 保存数据
            this.saveCurrentData();

            return true;
        }

        removeCourse(jxbid) {
            const index = this.courses.indexOf(jxbid);
            if (index !== -1) {
                this.courses.splice(index, 1);
                delete this.statusMap[jxbid];
                delete this.glJxbidMap[jxbid];
                delete this.courseTypeMap[jxbid];
                delete this.courseNameMap[jxbid];

                // 从存储中删除课程
                this.localDataManager.removeCourse(jxbid);

                // 保存更新后的数据
                this.saveCurrentData();

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
            this.setupDataRecovery();
        }

        /**
         * 设置数据恢复逻辑
         */
        setupDataRecovery() {
            // 监听数据加载完成事件
            document.addEventListener('storage:dataLoaded', (event) => {
                const { courses, courseDetails, statusMap } = event.detail;
                this.restoreUIFromStorage(courses, courseDetails, statusMap);
            });

            // 如果数据已经加载完成，立即恢复
            if (this.courseManager.courses.length > 0) {
                const courseDetails = {};
                this.courseManager.courses.forEach(courseId => {
                    courseDetails[courseId] = {
                        name: this.courseManager.courseNameMap[courseId] || this.courseManager.localDataManager.DEFAULT_COURSE_NAME,
                        courseType: this.courseManager.courseTypeMap[courseId] || CONFIG.GRAB.DEFAULT_COURSE_TYPE
                    };
                });
                this.restoreUIFromStorage(this.courseManager.courses, courseDetails, this.courseManager.statusMap);
            }
        }

        /**
         * 从存储恢复UI状态
         */
        restoreUIFromStorage(courses, courseDetails, statusMap) {
            if (!this.container || courses.length === 0) {
                return;
            }

            // 清空现有的输入框
            this.container.innerHTML = '';

            // 为每个保存的课程创建输入框
            courses.forEach((courseId, index) => {
                const detail = courseDetails[courseId];
                const courseType = detail?.courseType || CONFIG.GRAB.DEFAULT_COURSE_TYPE;
                const courseName = detail?.name || this.courseManager.localDataManager.DEFAULT_COURSE_NAME;

                // 创建课程输入框
                const courseInput = this.createCourseInput(index, courseType);
                this.container.appendChild(courseInput);

                // 设置课程ID
                const inputId = courseInput.querySelector('input[type="text"]:first-child');
                inputId.value = courseId;
                inputId.dataset.currentCourseId = courseId;

                // 设置课程类型
                const courseTypeSelector = courseInput.querySelector('select');
                courseTypeSelector.value = courseType;

                // 设置课程名称
                const inputName = courseInput.querySelector('input[placeholder*="课程名称"]');
                inputName.value = courseName;

                console.log(`[选课助手] 恢复课程: ${courseId}, 类型: ${courseType}, 名称: "${courseName}"`);
            });

            // 如果没有课程，添加一个默认输入框
            if (courses.length === 0) {
                this.container.appendChild(this.createCourseInput(0, CONFIG.GRAB.DEFAULT_COURSE_TYPE));
            }

            console.log(`[选课助手] UI恢复完成，共${courses.length}门课程`);
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

            // 课程名称处理逻辑
            let courseNameSaveTimeout = null;

            // 课程类型变更事件
            courseTypeSelector.addEventListener('change', () => {
                const currentCourseId = inputId.dataset.currentCourseId;
                if (currentCourseId) {
                    const selectedCourseType = courseTypeSelector.value;
                    this.courseManager.courseTypeMap[currentCourseId] = selectedCourseType;
                    this.courseManager.saveCurrentData();

                    const courseTypeInfo = CONFIG.COURSE_TYPES[selectedCourseType];
                    console.log(`[选课助手] 课程类型已更新: ${currentCourseId} -> ${courseTypeInfo.name}`);
                }
            });

            // 课程名称输入事件
            inputName.addEventListener('input', () => {
                clearTimeout(courseNameSaveTimeout);
                courseNameSaveTimeout = setTimeout(() => {
                    const currentCourseId = inputId.dataset.currentCourseId;
                    const courseName = inputName.value.trim();

                    if (currentCourseId) {
                        this.courseManager.updateCourseName(currentCourseId, courseName);
                    }
                }, 800); // 800ms防抖
            });

            // 课程名称失焦事件
            inputName.addEventListener('blur', () => {
                clearTimeout(courseNameSaveTimeout);
                const currentCourseId = inputId.dataset.currentCourseId;
                const courseName = inputName.value.trim();

                if (currentCourseId) {
                    this.courseManager.updateCourseName(currentCourseId, courseName);
                }
            });

            // 恢复课程名称（如果有保存的数据）
            const currentCourseId = inputId.dataset.currentCourseId;
            if (currentCourseId && this.courseManager.courseNameMap[currentCourseId]) {
                inputName.value = this.courseManager.courseNameMap[currentCourseId];
            }

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
            title.textContent = '自动选课工具 V1.1.0';
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

            // 添加成功记录区域
            this.createSuccessRecordsContainer();
            this.panel.appendChild(this.successRecordsContainer);

            // 添加作者信息底部区域
            this.createAuthorFooter();
            this.panel.appendChild(this.authorFooter);

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

        /**
         * 创建成功记录区域
         */
        createSuccessRecordsContainer() {
            this.successRecordsContainer = document.createElement('div');
            this.successRecordsContainer.style.cssText = `
                margin-top: 15px;
                padding: 10px;
                background-color: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 5px;
                font-size: 12px;
            `;

            const recordsTitle = document.createElement('div');
            recordsTitle.style.cssText = `
                font-weight: bold;
                color: #28a745;
                margin-bottom: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            recordsTitle.innerHTML = `
                <span>📝 选课成功记录</span>
                <button id="clear-records-btn" style="
                    font-size: 10px;
                    padding: 2px 6px;
                    background-color: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                ">清除记录</button>
            `;

            this.recordsList = document.createElement('div');
            this.recordsList.id = 'success-records-list';
            this.recordsList.style.cssText = `
                max-height: 120px;
                overflow-y: auto;
                font-size: 11px;
                line-height: 1.4;
            `;

            this.successRecordsContainer.appendChild(recordsTitle);
            this.successRecordsContainer.appendChild(this.recordsList);

            // 绑定清除记录按钮事件
            recordsTitle.querySelector('#clear-records-btn').addEventListener('click', () => {
                this.clearSuccessRecords();
            });

            // 加载现有记录
            const existingRecords = this.getSuccessRecords();
            this.updateRecordsList(existingRecords);
        }

        /**
         * 更新成功记录列表
         */
        updateRecordsList(records) {
            if (!this.recordsList) return;

            if (records.length === 0) {
                this.recordsList.innerHTML = `
                    <div style="color: #6c757d; text-align: center; padding: 10px;">
                        暂无选课成功记录
                    </div>
                `;
                return;
            }

            this.recordsList.innerHTML = records.map(record => `
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
            `).join('');
        }

        /**
         * 添加选课成功记录
         */
        addSuccessRecord(courseData) {
            console.log('[选课助手] 添加选课成功记录:', courseData);
            const { courseId, courseType } = courseData;

            if (!courseId || !courseType) {
                console.error('[选课助手] 添加成功记录失败: 缺少必要数据', { courseId, courseType });
                return;
            }

            const courseTypeInfo = CONFIG.COURSE_TYPES[courseType];
            if (!courseTypeInfo) {
                console.error('[选课助手] 添加成功记录失败: 无效的课程类型', courseType);
                return;
            }

            // 创建记录
            const record = {
                courseId,
                courseType: courseTypeInfo.name,
                timestamp: Date.now(),
                time: new Date().toLocaleString()
            };

            // 获取现有记录
            const existingRecords = this.getSuccessRecords();
            existingRecords.unshift(record); // 添加到开头

            // 限制记录数量（最多保存10条）
            const limitedRecords = existingRecords.slice(0, 10);

            // 保存到本地存储
            this.saveSuccessRecords(limitedRecords);

            // 更新显示
            this.updateRecordsList(limitedRecords);

            console.log(`[选课助手] 选课成功记录已添加: ${courseId} [${courseTypeInfo.name}]`);
        }

        /**
         * 获取成功记录
         */
        getSuccessRecords() {
            try {
                const recordsStr = localStorage.getItem('scmu_success_records') || '[]';
                return JSON.parse(recordsStr);
            } catch (error) {
                console.error('[选课助手] 读取成功记录失败:', error);
                return [];
            }
        }

        /**
         * 保存成功记录
         */
        saveSuccessRecords(records) {
            try {
                localStorage.setItem('scmu_success_records', JSON.stringify(records));
            } catch (error) {
                console.error('[选课助手] 保存成功记录失败:', error);
            }
        }

        /**
         * 清除成功记录
         */
        clearSuccessRecords() {
            if (confirm('确定要清除所有选课成功记录吗？')) {
                localStorage.removeItem('scmu_success_records');
                this.updateRecordsList([]);
                this.courseManager.showNotification('成功记录已清除', 'info');
            }
        }

        /**
         * 创建作者信息底部区域
         */
        createAuthorFooter() {
            this.authorFooter = document.createElement('div');
            this.authorFooter.style.cssText = `
                margin-top: 10px;
                padding: 8px 12px;
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border-radius: 8px;
                border: 1px solid #dee2e6;
                font-size: 11px;
                color: #495057;
                line-height: 1.4;
                text-align: center;
            `;

            this.authorFooter.innerHTML = `
                <div style="margin-bottom: 4px; font-weight: bold; color: #007bff;">
                    📝 SCMU自动选课助手 V1.1.0
                </div>
                <div style="margin-bottom: 3px;">
                    <span style="color: #6c757d;">作者：</span>
                    <a href="https://github.com/SuShuHeng" target="_blank" style="color: #007bff; text-decoration: none; font-weight: 500;">SuShuHeng</a>
                </div>
                <div style="margin-bottom: 3px;">
                    <span style="color: #6c757d;">项目：</span>
                    <a href="https://github.com/SuShuHeng/SCMU_CC_Helper" target="_blank" style="color: #007bff; text-decoration: none;">GitHub仓库</a>
                    <span style="color: #28a745; margin-left: 4px;">(Apache 2.0)</span>
                </div>
                <div style="color: #dc3545; font-weight: bold; font-size: 10px; margin-top: 4px;">
                    ⚠️ 本项目仅用于学习，禁止用于盈利！
                </div>
            `;
        }
    }

    // ==================== 初始化 ====================
    console.log('%c🎓 中南民族大学自动选课助手 V1.1.0', 'color: #007bff; font-size: 16px; font-weight: bold;');
    console.log('%c✨ 现已支持7种课程类型：推荐选课、方案内选课、方案外选课、重修选课、体育选择课、通识课程选修、创新创业类选修课', 'color: #28a745; font-size: 12px;');
    console.log('%c💾 自动保存课程数据，支持持久化存储，完善UI恢复', 'color: #17a2b8; font-size: 12px;');
    console.log('%c⚠️ 本工具仅供学习交流使用，请遵守学校相关规定', 'color: #ffc107; font-size: 12px;');
    console.log('');
    console.log('%c📜 版权信息：', 'color: #6f42c1; font-size: 14px; font-weight: bold;');
    console.log('%c作者: SuShuHeng (https://github.com/SuShuHeng)', 'color: #6c757d; font-size: 11px;');
    console.log('%c项目仓库: https://github.com/SuShuHeng/SCMU_CC_Helper', 'color: #6c757d; font-size: 11px;');
    console.log('%c开源协议: Apache 2.0 License', 'color: #6c757d; font-size: 11px;');
    console.log('%c⚠️ 本项目仅用于学习，禁止用于盈利！', 'color: #dc3545; font-size: 11px; font-weight: bold;');
    console.log('');

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