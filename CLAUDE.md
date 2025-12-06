# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a JavaScript userscript for automated course registration at South-Central Minzu University (SCMU - 中南民族大学). The project provides both a modular architecture with separate source files and a single-file distribution version for easy browser execution.

## File Structure

- `src/config.js` - Configuration module with API endpoints, UI settings, and system parameters
- `src/course-registration.js` - Core course registration logic and automation engine
- `src/ui-controller.js` - User interface management and control panel
- `dist/course-helper.js` - Single-file distribution version (all modules combined)
- `examples/usage-examples.js` - Usage examples and API demonstrations
- `docs/` - Documentation directory with installation guides and API references
- `.claude/settings.local.json` - Claude Code configuration

## Core Architecture

### Module Structure

The project uses ES6 modules with clear separation of concerns:

1. **Configuration Module** (`src/config.js`)
   - Centralized configuration object `CONFIG`
   - API endpoint definitions and HTTP settings
   - UI styling and layout parameters
   - Logging and development preferences

2. **Course Registration Manager** (`src/course-registration.js`)
   - `CourseRegistrationManager` class handling all automation logic
   - Course list management with add/remove/update operations
   - Experimental class discovery and fallback mechanisms
   - Real-time status tracking with `statusMap` and `glJxbidMap`

3. **UI Controller** (`src/ui-controller.js`)
   - `UIController` class for interface management
   - Draggable control panel with dynamic course input fields
   - Real-time validation and course management integration
   - Notification system for user feedback

### Key Components

1. **Course Management System**
   - `courses[]` - Array storing course IDs to register for
   - `statusMap{}` - Object tracking registration status for each course
   - `glJxbidMap{}` - Object storing experimental class information
   - Dynamic course addition/removal with validation

2. **Automation Engine**
   - Timer-based polling system (500ms intervals via `setInterval`)
   - HTTP requests using Fetch API to university endpoints
   - Automatic retry mechanism with experimental class fallback
   - Promise-based async operations for non-blocking execution

3. **User Interface**
   - Floating draggable control panel (`position: fixed`)
   - Dynamic course input fields with real-time validation
   - Course replacement logic (blur event handling)
   - Start/Stop controls with state management
   - Toast notification system for user feedback

### API Endpoints

- **Base URL**: `https://xk.webvpn.scuec.edu.cn/xsxk/`
- **Get experimental classes**: `/loadData.xk?method=getGljxb&jxbid={id}`
- **Course registration**: `/xkOper.xk?method=handleKzyxk&jxbid={id}&glJxbid={exp_id}`

## Common Development Tasks

### Building the Project

The project doesn't require a traditional build process. The `dist/course-helper.js` file is a manually maintained single-file version that combines all modules. When updating:

1. Make changes to individual modules in `src/`
2. Test changes using the modular approach
3. If creating a new distribution version, combine modules manually
4. Ensure all exports/imports are properly handled

### Running Tests

No formal test suite exists. Testing is done through:

1. **Manual Browser Testing**: Load modules directly in browser console
2. **Live System Testing**: Test against actual university course selection system
3. **Validation Testing**: Test course ID validation and UI interactions

### Module Import Patterns

```javascript
// For development/testing in browser console
import { CONFIG } from './src/config.js';
import { courseManager } from './src/course-registration.js';
import { uiController } from './src/ui-controller.js';

// Initialize the system
uiController.initialize();
```

### Distribution Usage

```javascript
// For end users - copy/paste entire dist/course-helper.js file
// No imports required - everything is self-contained
// UI initializes automatically when script runs
```

**Tampermonkey Version** (`dist/tampermonkey-course-helper.js`):
- Self-contained userscript with GM_setValue/GM_getValue for persistent storage
- Automatic course data persistence across page refreshes
- LocalDataManager class handles storage operations
- Event-driven architecture for data synchronization (storage:dataLoaded events)
- Critical timing considerations: event listeners must be initialized before CourseRegistrationManager loads data

## Technical Details

### Authentication & Security
- Uses browser cookies (`credentials: 'include'`)
- No manual authentication required
- Must be run while logged into university system
- ⚠️ **Security Warning**: This automation may violate university terms of service

### Error Handling Strategy
- Detects course full conditions using configurable keywords
- Continues retrying on full courses with exponential backoff
- Falls back to alternative experimental classes automatically
- Comprehensive console logging with Chinese language support
- Graceful degradation when API endpoints are unavailable

### Performance Optimizations
- 500ms polling interval balances effectiveness vs server load
- Efficient state management prevents duplicate requests
- Course status caching reduces unnecessary API calls
- Lazy loading of experimental class information
- Modular loading allows for selective feature usage

## Code Standards

### Module Design Principles
- ES6 modules with clear import/export boundaries
- Single responsibility principle for each module
- Dependency injection through import statements
- Configuration-driven behavior via `CONFIG` object
- Backward compatibility maintained for global window object

### Language and Documentation Standards
- Primary language: Chinese (comments, UI text, console output)
- JSDoc comments for all public methods and classes
- No external dependencies or frameworks
- Vanilla JavaScript with modern ES6+ features
- Consistent error message formatting and logging

### Security Considerations
- No sensitive data storage in localStorage or cookies
- Uses existing browser authentication sessions
- No external API calls beyond university system
- All operations contained within userscript scope
- Input validation prevents XSS attacks

## Development Guidelines

### Module Modification Process
1. Edit relevant files in `src/` directory
2. Test changes using modular import approach
3. Validate against university system requirements
4. Update distribution version if needed
5. Maintain Chinese language consistency

### Debugging and Monitoring
- All operations log to browser console with prefixed format
- Status tracking available via `courseManager.getStatus()`
- Real-time feedback on registration attempts
- Network request debugging via browser dev tools
- UI state debugging via DOM inspection

### Extension Points and Customization

**Configuration Customization** (`src/config.js`):
- Modify `POLLING_INTERVAL` for request frequency
- Update `COURSE_FULL_KEYWORDS` for detection logic
- Adjust UI styling in `PANEL_STYLE`
- Customize HTTP headers and timeouts

**Course Logic Extensions** (`src/course-registration.js`):
- Modify `checkCourseFull()` for custom detection logic
- Extend `trySelectCourse()` for custom registration handling
- Add new course management methods to `CourseRegistrationManager`
- Implement custom retry strategies

**UI Enhancements** (`src/ui-controller.js`):
- Extend `createCourseInput()` for custom input types
- Add new control buttons in `createControlPanel()`
- Customize notification styles in `showNotification()`
- Implement advanced validation in `isValidCourseId()`

### Integration with University System
- All API endpoints are university-specific
- Course ID format: 8-12 digit numeric strings
- Experimental class system requires special handling
- Rate limiting considerations for server load

## UI State Management and Advanced Features

### Z-Index Layer System
The project implements a comprehensive z-index management system defined in `CONFIG.Z_INDEX`:
- `BASE_LAYER: 9999` - Main UI components (panels, floating buttons)
- `NOTIFICATION: 10000` - Toast notifications and temporary messages
- `MODAL: 10001` - Status modals and detail windows
- `DIALOG: 10002` - Confirmation dialogs (reset, delete, close)
- `OVERLAY: 10003` - Full-screen overlays for high-risk confirmations
- `TOPMOST: 10004` - Critical messages (close success notifications)

### Multi-State UI System
The UI controller operates through distinct states:
- `FLOATING_BUTTON` - Initial compact state with "抢课" button
- `FULL_PANEL` - Complete control panel with course management
- `MINIMIZED_STATUS` - Real-time status display during active selection

### Advanced UI Features

**Draggable and Resizable Panels**:
- `makeDraggable()` method with DOMMatrix transform calculations
- Touch device support via event delegation
- Boundary checking to prevent off-screen positioning
- Resize functionality with corner handles on status panels

**Intelligent Scrolling**:
- Automatic scroll containers when course count exceeds thresholds
- Custom scrollbar styling with 8px width
- Dynamic height calculations for panel boundaries

**Status Management**:
- Real-time status updates via `setInterval` polling
- Course state tracking (success, in-progress, pending)
- Experimental class fallback mechanisms
- Runtime calculations with formatted HH:MM:SS display

**Dialog System Patterns**:
Two distinct dialog approaches are used:

1. **High-Risk Overlays** (Reset, Close Confirmations):
   - Full-screen overlay with `rgba(0,0,0,0.6)` background
   - Animated content with shake/pulse effects
   - ESC key support and background click handling
   - Multi-level warning system based on operational risk

2. **Direct Dialogs** (Delete Confirmations):
   - Simple direct DOM insertion without overlays
   - Click-outside-to-close behavior
   - Minimal animation for reduced interaction friction

### Course Input and Validation System

**Dynamic Course Management**:
- Real-time course ID validation (8-12 digit numeric)
- Blur-event driven course replacement logic
- Automatic duplicate detection and prevention
- Course name support for user identification

**Input Field Behavior**:
- `dataset.currentCourseId` tracks bound courses
- Automatic course addition on valid input
- Course deletion on field clearing
- Enter key support for rapid input

### Notification System

**Toast Notifications** (`showNotification()`):
- Fixed positioning at top-right with auto-fade
- Color-coded by type (success, error, warning, info)
- 3-second auto-dismiss with opacity transitions
- Z-index management for layering above panels

**Status-Driven UI Transitions**:
- Automatic panel expansion when course selection starts
- Progressive minimization during active selection
- State restoration on selection completion
- Event-driven architecture using `CustomEvent`

### Performance and Resource Management

**Timer Management**:
- Multiple interval timers for different UI components
- Proper cleanup on state transitions and component destruction
- Memory leak prevention through reference clearing

**DOM Efficiency**:
- Single-element status updates via innerHTML
- Event delegation for dynamic content
- Minimal DOM queries through cached references

## Browser Compatibility and Deployment

### Target Browser Support
- Chrome 60+ (primary testing platform)
- Firefox 55+ (ES6+ feature compatibility)
- Safari 10+ (Fetch API and modern JavaScript)
- Edge 79+ (Chromium-based Edge)

### Deployment Patterns

**Development Mode**:
```javascript
// Modular testing in browser console
import { CONFIG } from './src/config.js';
import { courseManager } from './src/course-registration.js';
import { uiController } from './src/ui-controller.js';
uiController.initialize();
```

**Production Distribution**:
- Single `dist/course-helper.js` file for end users
- Self-contained IIFE wrapper
- No external dependencies or build tools required
- Copy-paste execution in browser console

**Error Recovery**:
- Graceful degradation on API failures
- Fallback experimental class selection
- Comprehensive error logging with Chinese messages
- User-friendly error notifications

## Local Storage and Data Persistence (Tampermonkey Version)

### Critical Architecture Patterns

**Data Flow Timing**:
1. `CourseRegistrationManager` constructor calls `loadSavedData()` immediately
2. This triggers `storage:dataLoaded` CustomEvent with course data
3. `UIController.initialize()` must set up event listeners **before** step 1
4. If timing is misaligned, implement fallback data restoration

**Event-Driven Synchronization**:
- `storage:dataLoaded` event carries `{courses, courseDetails, statusMap}`
- UI components listen for course lifecycle events (`courses:started`, `courses:stopped`)
- Real-time status updates through `selection:auto-stopped` events

**LocalDataManager Class Responsibilities**:
- `loadCoursesData()`: Loads and parses stored course information
- `saveCoursesData()`: Persists current state to GM_setValue storage
- `updateCourseName()`: Updates course names in storage
- `removeCourse()`: Complete removal of course records from storage
- `clearAllData()`: Full storage reset functionality

### Storage Data Structure

```javascript
// Persistent storage format via GM_setValue/GM_getValue
{
  courses: [
    {
      id: "courseId",
      name: "user-defined name or default",
      addedTime: timestamp,
      status: { success: boolean }
    }
  ],
  experimentalClasses: { "courseId": ["expClassIds"] },
  metadata: {
    lastSaved: timestamp,
    version: "1.0.0",
    sessionCount: number
  }
}
```

### Common Storage-Related Issues

**Double ID Extraction Bug**:
- Symptom: Course data loads but UI shows empty fields
- Cause: `LocalDataManager.loadCoursesData()` extracts IDs, but `CourseRegistrationManager` tries to extract again
- Fix: Use `savedData.courses` directly (already extracted ID array)

**Event Listener Timing**:
- Symptom: Data loads but UI doesn't update
- Cause: Event dispatched before UI listener initialization
- Fix: Set up listeners in `UIController.initialize()` before `CourseRegistrationManager` construction

### Development Commands for Storage Testing

```javascript
// Clear all storage data
courseManager.localDataManager.clearAllData();

// Force data reload
const savedData = courseManager.localDataManager.loadCoursesData();
uiController.restoreUIFromStorage(courseManager.courses, savedData.courseDetails, courseManager.statusMap);

// Check storage availability
console.log('Storage available:', courseManager.localDataManager.storageAvailable);
```