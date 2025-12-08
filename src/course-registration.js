/**
 * 中南民族大学自动选课助手 - 核心模块
 * 负责课程注册的核心逻辑和API调用
 *
 * @author SuShuHeng <https://github.com/sushuheng>
 * @license APACHE 2.0
 * @version V1.1.0
 * @description 专为中南民族大学学生设计的自动化课程注册助手核心逻辑模块
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
import { LocalDataManager } from './local-data-manager.js';

/**
 * 课程注册管理类
 */
class CourseRegistrationManager {
    constructor() {
        // 存储课程ID列表
        this.courses = [];
        // 记录每门课程的选课状态
        this.statusMap = {};
        // 记录每门课程的实验班信息
        this.glJxbidMap = {};
        // 记录每门课程的课程类型
        this.courseTypeMap = {};
        // 控制选课的定时器
        this.intervalId = null;

        // 本地数据管理器
        this.localDataManager = new LocalDataManager();

        // 初始化事件监听
        this.initEventListeners();

        // 加载保存的数据
        this.loadSavedData();
    }

    /**
     * 初始化事件监听器
     */
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

    /**
     * 构建选课API端点URL
     * @param {string} courseType - 课程类型
     * @param {string} jxbid - 课程ID
     * @param {string} glJxbid - 实验班ID（可选）
     * @param {number} xkzy - 志愿等级（通识选修课需要）
     * @returns {string} 完整的API端点URL
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

    /**
     * 初始化每个课程的状态
     * @param {string} jxbid - 课程ID
     * @param {string} courseType - 课程类型
     */
    initCourseState(jxbid, courseType = CONFIG.GRAB.DEFAULT_COURSE_TYPE) {
        this.statusMap[jxbid] = {
            success: false,
            glReady: false,
            glAttemptIndex: 0,
            courseType: courseType
        };
    }

    /**
     * 获取实验班信息
     * @param {string} jxbid - 课程ID
     * @returns {Promise<string[]>} 实验班ID列表
     */
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

    /**
     * 检查课程是否已满
     * @param {string} html - HTML内容
     * @returns {boolean} 是否已满
     */
    checkCourseFull(html) {
        return CONFIG.GRAB.COURSE_FULL_KEYWORDS.some(keyword => html.includes(keyword));
    }

    /**
     * 尝试选择课程
     * @param {string} jxbid - 课程ID
     */
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

    /**
     * 启动选课定时器
     */
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

    /**
     * 停止选课
     */
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

    /**
     * 添加课程到选课列表
     * @param {string} jxbid - 课程ID
     * @param {string} courseType - 课程类型
     */
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

        // 添加课程
        this.courses.push(trimmedId);
        this.courseTypeMap[trimmedId] = courseType;
        this.initCourseState(trimmedId, courseType);

        const courseTypeInfo = CONFIG.COURSE_TYPES[courseType];
        console.log(`${CONFIG.LOG.LOG_PREFIX} 已添加课程: ${trimmedId} [${courseTypeInfo.name}]`);

        // 自动保存数据
        this.saveCurrentData();

        return true;
    }

    /**
     * 移除课程
     * @param {string} jxbid - 课程ID
     * @returns {boolean} 是否成功移除
     */
    removeCourse(jxbid) {
        const index = this.courses.indexOf(jxbid);
        if (index !== -1) {
            this.courses.splice(index, 1);
            delete this.statusMap[jxbid];
            delete this.glJxbidMap[jxbid];
            delete this.courseTypeMap[jxbid];
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

    /**
     * 更新/替换课程ID
     * @param {string} oldCourseId - 旧课程ID
     * @param {string} newCourseId - 新课程ID
     * @param {string} courseType - 课程类型
     * @returns {boolean} 是否更新成功
     */
    updateCourse(oldCourseId, newCourseId, courseType = CONFIG.GRAB.DEFAULT_COURSE_TYPE) {
        // 验证新课程ID格式
        if (!newCourseId || newCourseId.trim() === '') {
            console.warn(`${CONFIG.LOG.LOG_PREFIX} 新课程ID不能为空`);
            return false;
        }

        const trimmedNewId = newCourseId.trim();

        // 验证格式
        if (trimmedNewId.length < 6 || trimmedNewId.length > 20 || !/^[A-Za-z0-9_-]+$/.test(trimmedNewId)) {
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

    /**
     * 初始化系统，加载实验班信息并开始选课
     */
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

    /**
     * 获取选课状态
     * @returns {Object} 选课状态信息
     */
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

    /**
     * 获取课程状态
     * @param {string} jxbid - 课程ID
     * @returns {string} 课程状态描述
     */
    getStatusForCourse(jxbid) {
        const status = this.statusMap[jxbid];
        if (!status) return '未知状态';

        if (status.success) return '选课成功';
        if (!status.glReady) return '加载实验班中...';
        return '正在尝试选课';
    }

    /**
     * 检查课程列表是否为空并自动停止
     */
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

    /**
     * 运行时动态添加课程
     * @param {string} jxbid - 课程ID
     * @returns {Promise<boolean>} 添加是否成功
     */
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

    /**
     * 重置所有状态
     */
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

    /**
     * 显示通知消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型
     */
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

// 创建全局实例
export const courseManager = new CourseRegistrationManager();

// 暴露到全局作用域（为了兼容原始脚本的使用方式）
if (typeof window !== 'undefined') {
    window.stopLoop = () => courseManager.stopLoop();
    window.courseManager = courseManager;
}

export default courseManager;