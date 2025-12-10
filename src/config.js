/**
 * 中南民族大学自动选课助手 - 配置文件
 * 包含所有可配置的参数和设置
 *
 * @author SuShuHeng <https://github.com/sushuheng>
 * @license APACHE 2.0
 * @version V1.1.1
 * @description 专为中南民族大学学生设计的自动化课程注册助手配置模块
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

// 课程类型配置
export const COURSE_TYPES = {
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

// API端点配置 - V1.1.1 支持校园网和VPN访问
export const API_CONFIG = {
    // VPN公网访问配置
    VPN_BASE_URL: 'https://xk.webvpn.scuec.edu.cn/xsxk',
    // 校园网内部访问配置
    CAMPUS_BASE_URL: 'http://xk.scuec.edu.cn/xsxk',
    // 动态获取当前基础URL
    get BASE_URL() {
        return this.detectNetworkEnvironment();
    },
    ENDPOINTS: {
        // 获取实验班信息
        GET_EXPERIMENTAL_CLASS: '/loadData.xk?method=getGljxb&jxbid=',
        // 选课操作基础端点
        COURSE_OPERATION: '/xkOper.xk?method='
    },
    // 检测网络环境并返回对应的基础URL
    detectNetworkEnvironment() {
        const currentHost = window.location.hostname;
        const currentProtocol = window.location.protocol;

        // 校园网内部访问检测
        if (currentHost === 'xk.scuec.edu.cn' || currentHost.includes('scuec.edu.cn')) {
            return currentProtocol === 'http:' ? this.CAMPUS_BASE_URL : this.CAMPUS_BASE_URL.replace('http://', 'https://');
        }

        // VPN公网访问（默认）
        return this.VPN_BASE_URL;
    }
};

// 选课参数配置
export const GRAB_CONFIG = {
    // 轮询间隔（毫秒）
    POLLING_INTERVAL: 500,
    // 请求超时时间（毫秒）
    REQUEST_TIMEOUT: 10000,
    // 最大重试次数
    MAX_RETRY_COUNT: 3,
    // 课程满员检测关键词
    COURSE_FULL_KEYWORDS: ['课程已满', '已选满'],
    // 默认志愿等级（用于通识选修课）
    DEFAULT_VOLUNTEER_LEVEL: 1,
    // 默认课程类型（向后兼容）
    DEFAULT_COURSE_TYPE: 'KZYXK'
};

// 课程ID验证配置
export const COURSE_ID_CONFIG = {
    // 验证正则表达式（支持大小写字母、数字、下划线和连字符）
    VALIDATION_REGEX: /^[A-Za-z0-9_-]+$/,
    // 错误提示信息
    ERROR_MESSAGES: {
        EMPTY: '课程ID不能为空',
        INVALID_FORMAT: '课程ID只能包含字母、数字、下划线和连字符'
    }
};

// 用户界面配置
export const UI_CONFIG = {
    // 控制面板样式
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
    // 迷你状态面板样式
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
    // 动态面板高度配置 - V1.1.1
    PANEL_HEIGHT: {
        // 面板最小高度（像素）
        MIN_HEIGHT: 500,
        // 面板最大高度（像素）
        MAX_HEIGHT: 800,
        // 基础UI元素高度（控制按钮、标题等）
        BASE_HEIGHT: 150,
        // 每个课程项的高度
        COURSE_ITEM_HEIGHT: 60,
        // 滚动触发阈值
        SCROLL_THRESHOLD: 6
    },
    // 滚动容器配置
    SCROLLABLE_CONTAINER: {
        MAX_COURSES_BEFORE_SCROLL: 4,
        CONTAINER_HEIGHT: 'auto', // V1.1.1 改为动态计算
        SCROLLBAR_WIDTH: '8px'
    },
    // 按钮样式
    BUTTON_STYLE: {
        marginTop: '10px',
        padding: '5px 10px',
        marginRight: '5px'
    },
    // 输入框样式
    INPUT_STYLE: {
        marginRight: '10px',
        padding: '5px',
        marginBottom: '10px'
    }
};

// HTTP请求配置
export const HTTP_CONFIG = {
    HEADERS: {
        'accept': '*/*',
        'x-requested-with': 'XMLHttpRequest'
    },
    CREDENTIALS: 'include'
};

// 日志配置
export const LOG_CONFIG = {
    // 是否启用详细日志
    ENABLE_VERBOSE_LOGGING: true,
    // 日志前缀
    LOG_PREFIX: '[选课助手]',
    // 日志级别
    LOG_LEVELS: {
        INFO: 'info',
        WARN: 'warn',
        ERROR: 'error',
        SUCCESS: 'success'
    }
};

// z-index层级管理配置
export const Z_INDEX_CONFIG = {
    BASE_LAYER: 9999,        // 基础UI组件（主面板、悬浮按钮、迷你面板）
    NOTIFICATION: 10000,     // 通知消息
    MODAL: 10001,           // 普通弹窗（状态详情弹窗）
    DIALOG: 10002,          // 确认对话框（删除课程、重置确认）
    OVERLAY: 10003,         // 全屏遮罩（关闭程序确认）
    TOPMOST: 10004          // 最高层级（关闭成功消息）
};

// 开发者配置
export const DEV_CONFIG = {
    // 是否为开发模式
    DEBUG_MODE: false,
    // 是否显示调试信息
    SHOW_DEBUG_INFO: false
};

// 导出所有配置
export const CONFIG = {
    API: API_CONFIG,
    COURSE_TYPES: COURSE_TYPES,
    GRAB: GRAB_CONFIG,
    COURSE_ID: COURSE_ID_CONFIG,
    UI: UI_CONFIG,
    HTTP: HTTP_CONFIG,
    LOG: LOG_CONFIG,
    DEV: DEV_CONFIG,
    Z_INDEX: Z_INDEX_CONFIG
};

// 默认导出配置对象
export default CONFIG;