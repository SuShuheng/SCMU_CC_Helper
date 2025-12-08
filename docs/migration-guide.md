# 版本迁移指南：V1.0.4 → V1.1.0

---

## 📋 概述

本指南帮助用户从 SCMU 自动选课助手 V1.0.4 平滑升级到 V1.1.0。V1.1.0 是一个重要的功能更新版本，引入了 7 种课程类型支持和完善的功能对等。

**重要特性**:
- ✅ 数据完全兼容，无需手动备份
- ✅ 自动数据迁移和版本升级
- ✅ 保留所有现有课程和设置
- ✅ 新增课程类型功能

---

## 🎯 V1.1.0 主要变化

### 新增功能

1. **7种课程类型支持**
   - 推荐选课 (TJXK)
   - 方案内选课 (BFAK)
   - 方案外选课 (KZYXK)
   - 重修选课 (CXXK)
   - 体育选择课 (TYKXK)
   - 通识课程选修 (QXGXK)
   - 创新创业类选修课 (CXCY)

2. **作者信息显示**
   - 控制台版权信息
   - 界面底部作者信息
   - Apache 2.0 许可证声明

3. **版本功能对等**
   - 单文件版本、油猴版本、模块化版本功能完全一致
   - 统一的用户体验和API接口

### 数据结构变化

**V1.0.0 (V1.0.4)**:
```javascript
{
  courses: [
    {
      id: "courseId",
      name: "course name",
      addedTime: timestamp,
      status: { success: boolean }
    }
  ],
  experimentalClasses: { "courseId": ["expClassIds"] },
  metadata: {
    version: "1.0.0",
    sessionCount: number,
    lastSaved: timestamp
  }
}
```

**V2.0.0 (V1.1.0)**:
```javascript
{
  courses: [
    {
      id: "courseId",
      name: "course name",
      courseType: "KZYXK",        // 新增：课程类型
      addedTime: timestamp,
      status: { success: boolean }
    }
  ],
  experimentalClasses: { "courseId": ["expClassIds"] },
  metadata: {
    version: "2.0.0",             // 升级：数据版本
    sessionCount: number,
    lastSaved: timestamp
  }
}
```

---

## 🔄 升级步骤

### 方法一：油猴版本用户 (推荐)

**自动升级** (最简单):
1. 打开油猴管理面板
2. 编辑现有的选课助手脚本
3. 复制 `dist/tampermonkey-course-helper.js` 的全部内容
4. 粘贴到编辑器中，替换旧内容
5. 按 `Ctrl+S` 保存
6. 刷新选课系统页面

**迁移结果**:
- ✅ 所有课程数据自动保留
- ✅ 课程类型自动设置为"方案外选课"
- ✅ 选课状态正确恢复
- ✅ 新功能立即可用

### 方法二：单文件版本用户

**手动升级**:
1. 备份当前使用的代码 (可选)
2. 打开 `dist/course-helper.js`
3. 复制全部内容
4. 在选课系统页面打开控制台 (F12)
5. 粘贴新代码并执行
6. 刷新页面验证功能

**迁移结果**:
- ✅ 本地存储数据自动迁移
- ✅ 课程信息完整保留
- ✅ 新界面自动显示

### 方法三：模块化版本用户

**开发者升级**:
1. 下载最新的 `src/` 目录文件
2. 更新所有模块到 V1.1.0 版本
3. 重新导入模块：
   ```javascript
   import { CONFIG } from './src/config.js';
   import { courseManager } from './src/course-registration.js';
   import { uiController } from './src/ui-controller.js';
   ```
4. 初始化界面：
   ```javascript
   uiController.initialize();
   ```

---

## 📊 迁移验证清单

升级完成后，请验证以下项目：

### 基本功能验证

- [ ] 页面加载后显示选课助手界面
- [ ] 所有之前添加的课程仍然存在
- [ ] 课程名称和状态正确显示
- [ ] 可以添加新的课程
- [ ] 选课功能正常工作

### 新功能验证

- [ ] 控制台显示版权信息
- [ ] 界面底部显示作者信息
- [ ] 课程输入框显示课程类型选择
- [ ] 默认课程类型为"方案外选课"
- [ ] 可以切换不同的课程类型

### 数据验证

- [ ] 课程ID保持不变
- [ ] 课程名称正确保留
- [ ] 选课成功状态正确恢复
- [ ] 实验班信息完整保留

---

## 🔧 升级后配置

### 课程类型设置

升级后，所有现有课程的类型会自动设置为"方案外选课" (KZYXK)。建议根据实际情况调整：

```javascript
// 检查当前课程的类型设置
const courses = courseManager.courses;
courses.forEach(courseId => {
    const status = courseManager.statusMap[courseId];
    console.log(`课程 ${courseId} 类型: ${status.courseType}`);
});

// 更新课程类型（如果需要）
// courseManager.courseTypeMap[courseId] = 'TJXK'; // 推荐选课
```

### 推荐配置

根据课程性质调整类型：

1. **必修课程** → 方案内选课 (BFAK) 或 推荐选课 (TJXK)
2. **选修课程** → 方案外选课 (KZYXK)
3. **体育课程** → 体育选择课 (TYKXK)
4. **通识课程** → 通识课程选修 (QXGXK)
5. **重修课程** → 重修选课 (CXXK)

---

## ⚠️ 常见问题和解决方案

### 问题1：升级后课程数据丢失

**症状**: 页面刷新后看不到之前的课程

**原因**: 数据迁移失败或存储异常

**解决方案**:
1. 检查浏览器控制台是否有错误信息
2. 手动恢复数据：
   ```javascript
   // 检查存储数据
   const savedData = courseManager.localDataManager.loadCoursesData();
   console.log('存储数据:', savedData);

   // 如果数据存在但未显示，手动触发UI更新
   if (savedData && savedData.courses.length > 0) {
       uiController.restoreUIFromStorage(
           courseManager.courses,
           savedData.courseDetails,
           courseManager.statusMap
       );
   }
   ```

### 问题2：课程类型选择框不显示

**症状**: 看不到课程类型选择下拉框

**原因**: 界面未正确初始化或版本兼容性问题

**解决方案**:
1. 刷新页面重新加载
2. 检查是否使用了正确的V1.1.0代码
3. 清除浏览器缓存后重试

### 问题3：选课失败率变高

**症状**: 升级后选课成功率下降

**可能原因**:
- 课程类型选择错误
- API端点配置问题

**解决方案**:
1. 确认选择了正确的课程类型
2. 优先使用"方案外选课" (KZYXK)
3. 检查课程ID是否正确

### 问题4：界面显示异常

**症状**: 界面布局错乱或样式异常

**解决方案**:
1. 刷新页面
2. 清除浏览器缓存
3. 确认使用了完整的V1.1.0代码

### 问题5：控制台错误信息

**常见错误及解决**:

```javascript
// 错误: Cannot read property 'courseType' of undefined
// 解决: 课程状态初始化问题，刷新页面即可

// 错误: CONFIG.COURSE_TYPES is not defined
// 解决: 配置文件未正确加载，重新导入模块

// 错误: UI container not found
// 解决: 界面容器未创建，等待页面完全加载
```

---

## 🔄 回滚方案

如果升级后遇到严重问题，可以回滚到 V1.0.4：

### 临时回滚

1. 使用之前备份的 V1.0.4 代码
2. 数据完全兼容，无需额外操作
3. 所有功能正常工作

### 数据备份

升级前建议备份重要数据：

```javascript
// 备份当前数据到剪贴板
const backupData = {
    courses: courseManager.courses,
    courseDetails: courseManager.localDataManager.loadCoursesData()?.courseDetails || [],
    statusMap: courseManager.statusMap,
    glJxbidMap: courseManager.glJxbidMap,
    courseTypeMap: courseManager.courseTypeMap
};

navigator.clipboard.writeText(JSON.stringify(backupData, null, 2))
    .then(() => console.log('数据已备份到剪贴板'))
    .catch(err => console.error('备份失败:', err));
```

---

## 🎯 最佳实践

### 升级前准备

1. **确认版本**: 当前使用的是 V1.0.4
2. **备份重要数据**: 记录重要的课程信息
3. **选择合适时间**: 在非选课高峰期进行升级
4. **阅读新功能**: 了解 V1.1.0 的新特性

### 升级后建议

1. **验证功能**: 确认所有功能正常工作
2. **调整设置**: 根据新功能优化配置
3. **学习新功能**: 了解课程类型的使用方法
4. **反馈问题**: 遇到问题及时反馈

### 长期维护

1. **定期更新**: 保持使用最新版本
2. **数据清理**: 定期清理无用的课程数据
3. **功能学习**: 持续学习新功能的使用方法

---

## 📞 技术支持

如果在升级过程中遇到问题：

### 自助解决

1. 查看 [故障排除指南](troubleshooting.md)
2. 阅读 [课程类型使用指南](course-types-guide.md)
3. 检查浏览器控制台的详细错误信息

### 社区支持

1. **GitHub Issues**: 在项目页面提交问题
2. **详细描述**: 包含版本信息、错误截图、操作步骤
3. **重现步骤**: 提供详细的问题重现方法

### 联系方式

- **项目地址**: https://github.com/SuShuHeng/SCMU_CC_Helper
- **问题反馈**: GitHub Issues
- **功能建议**: GitHub Discussions

---

## 🎓 总结

V1.1.0 升级的核心优势：

- ✅ **无缝迁移**: 数据完全兼容，自动升级
- ✅ **功能增强**: 7种课程类型支持
- ✅ **体验改进**: 统一的用户界面
- ✅ **版本对等**: 所有部署方式功能一致

升级后的主要收益：

- 🎯 **更高成功率**: 正确的课程类型选择
- 🎨 **更好体验**: 统一的界面和交互
- 📊 **更强功能**: 课程类型管理和统计
- 🔧 **更好维护**: 版本一致性和可维护性

希望本迁移指南能帮助你顺利升级到 V1.1.0，享受更强大的选课功能！

---

*文档版本: V1.1.0*
*最后更新: 2025年12月9日*
*适用版本: V1.0.4 → V1.1.0*