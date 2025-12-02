/**
 * 中南民族大学自动选课助手 - 配置文件
 * 包含所有可配置的参数和设置
 *
 * @author SuShuHeng <https://github.com/sushuheng>
 * @license APACHE 2.0
 * @version 1.0.1
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

// API端点配置
export const API_CONFIG = {
    BASE_URL: 'https://xk.webvpn.scuec.edu.cn/xsxk',
    ENDPOINTS: {
        // 获取实验班信息
        GET_EXPERIMENTAL_CLASS: '/loadData.xk?method=getGljxb&jxbid=',
        // 课程注册
        COURSE_REGISTRATION: '/xkOper.xk?method=handleKzyxk&jxbid='
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
    COURSE_FULL_KEYWORDS: ['课程已满', '已选满']
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
    GRAB: GRAB_CONFIG,
    UI: UI_CONFIG,
    HTTP: HTTP_CONFIG,
    LOG: LOG_CONFIG,
    DEV: DEV_CONFIG
};

// 默认导出配置对象
export default CONFIG;