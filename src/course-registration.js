/**
 * 中南民族大学自动选课助手 - 核心模块
 * 负责课程注册的核心逻辑和API调用
 *
 * @author SuShuHeng <https://github.com/sushuheng>
 * @license APACHE 2.0
 * @version 1.0.3
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
        // 控制选课的定时器
        this.intervalId = null;
    }

    /**
     * 初始化每个课程的状态
     * @param {string} jxbid - 课程ID
     */
    initCourseState(jxbid) {
        this.statusMap[jxbid] = {
            success: false,
            glReady: false,
            glAttemptIndex: 0
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
     */
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
            console.log(`${CONFIG.LOG.LOG_PREFIX} 已移除课程: ${jxbid}`);
            return true;
        }
        console.warn(`${CONFIG.LOG.LOG_PREFIX} 课程 ${jxbid} 不存在，无法移除`);
        return false;
    }

    /**
     * 更新/替换课程ID
     * @param {string} oldCourseId - 旧课程ID
     * @param {string} newCourseId - 新课程ID
     * @returns {boolean} 是否更新成功
     */
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
                success: this.statusMap[id]?.success || false,
                glReady: this.statusMap[id]?.glReady || false,
                experimentalClassCount: this.glJxbidMap[id]?.length || 0
            }))
        };
    }

    /**
     * 重置所有状态
     */
    reset() {
        this.stopLoop();
        this.courses = [];
        this.statusMap = {};
        this.glJxbidMap = {};
        console.log(`${CONFIG.LOG.LOG_PREFIX} 所有状态已重置`);
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