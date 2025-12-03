/**
 * 本地数据管理器 - 负责课程数据的持久化存储和恢复
 *
 * @author SuShuHeng <https://github.com/sushuheng>
 * @license APACHE 2.0
 * @version 1.0.4
 */

import { CONFIG } from './config.js';

/**
 * 本地数据管理器类
 * 提供课程信息的本地存储、加载、更新和删除功能
 */
export class LocalDataManager {
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
     * @param {Array} courses - 课程ID数组
     * @param {Object} experimentalClasses - 实验班数据映射
     * @param {Object} statusMap - 课程状态映射
     * @returns {boolean} 保存是否成功
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
     * @returns {Object|null} 加载的数据对象，失败时返回null
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
     * @param {string} courseId - 课程ID
     * @param {string} courseName - 新的课程名称
     * @returns {boolean} 更新是否成功
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
     * @param {string} courseId - 要删除的课程ID
     * @returns {boolean} 删除是否成功
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
     * @returns {number} 当前会话计数
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
     * @returns {boolean} 清空是否成功
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
     * @returns {Object} 存储状态信息
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
     * @returns {Object} 课程摘要信息
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