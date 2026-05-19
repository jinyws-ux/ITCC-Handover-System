import { Lang } from '../types'

const tx = {
  zh: {
    app: 'ITCC 交接系统', sub: '运维班次交接中心', switch: 'English', login: '登录', logout: '退出', username: '用户名', password: '密码', demo: '测试账号：admin/admin123 · lead/lead123 · user/user123',
    pages: { handover: '交接看板', new: '新建任务', timeline: '历史时间线', calendar: '日历排班', admin: '后台管理' }, hero: '班次交接看板', heroDesc: '集中查看下个班次需要知道、继续处理或持续关注的事项。', current: '当前班次', next: '下一班次',
    waiting: '待下班处理', monitoring: '持续关注', confirm: '需要确认', todayHypercare: '今日 Hypercare', recent: '最近更新', search: '搜索任务...', noItems: '暂无事项', view: '查看详情',
    title: '标题', type: '任务类型', priority: '级别', status: '状态', source: '来源', category: '交接分类', factory: '厂区', system: '系统', group: '小组', targetShift: '目标班次', targetGroup: '目标小组', desc: '描述', nextAction: '下一步动作',
    create: '创建', creating: '创建中...', external: '外部关联', addExternal: '追加外部关联', extId: '外部编号', extTitle: '外部标题', extUrl: '外部链接', extStatus: '外部状态', none: '无', open: '打开', close: '关闭', logs: '处理记录', actions: '操作', ack: '确认已读', accept: '确认接手', closeTask: '关闭任务', note: '添加处理备注...', addNote: '添加备注', apply: '应用筛选', loading: '加载中...',
    compactCalendar: '紧凑日程', calendarHint: '只显示本月当前日期到月末的排班和 Hypercare。', prevMonth: '上个月', nextMonth: '下个月', thisMonth: '本月', scheduleCreate: '新增排班', shift: '班次', startTime: '开始时间', endTime: '结束时间', members: '人员', remark: '备注',
    richTimeline: '默认时间流', richTimelineHint: '不用筛选也能看到任务、日志、交接、外部关联、Hypercare 与时间的对应关系。', filters: '筛选条件',
    hypercare: 'Hypercare 检查点', addHypercare: '新增 Hypercare 检查点', checkTime: '检查时间', checkItem: '检查项目', expectedResult: '预期结果', actualResult: '实际结果', planned: 'Planned', done: 'Done', skipped: 'Skipped', ng: 'NG', updateStatus: '更新状态', adminUsers: '用户', adminGroups: '小组', adminFactories: '厂区', adminSystems: '系统', adminShifts: '班次', code: '编码', name: '名称', email: '邮箱', role: '角色', refresh: '刷新', adminHint: '后台基础数据管理暂时保留基础入口，后续会拆分成独立页面。'
  },
  en: {
    app: 'ITCC Handover', sub: 'Shift operations control center', switch: '中文', login: 'Login', logout: 'Logout', username: 'Username', password: 'Password', demo: 'Accounts: admin/admin123 · lead/lead123 · user/user123',
    pages: { handover: 'Handover', new: 'New Task', timeline: 'Timeline', calendar: 'Calendar', admin: 'Admin' }, hero: 'Shift Handover Dashboard', heroDesc: 'Focus on what the next shift must know, continue, or monitor.', current: 'Current shift', next: 'Next shift',
    waiting: 'Waiting', monitoring: 'Monitoring', confirm: 'Need Confirm', todayHypercare: 'Today Hypercare', recent: 'Recently Updated', search: 'Search task...', noItems: 'No items', view: 'View details',
    title: 'Title', type: 'Task Type', priority: 'Priority', status: 'Status', source: 'Source', category: 'Category', factory: 'Factory', system: 'System', group: 'Group', targetShift: 'Target Shift', targetGroup: 'Target Group', desc: 'Description', nextAction: 'Next Action',
    create: 'Create', creating: 'Creating...', external: 'External Link', addExternal: 'Add External Link', extId: 'External ID', extTitle: 'External Title', extUrl: 'External URL', extStatus: 'External Status', none: 'None', open: 'Open', close: 'Close', logs: 'Process Logs', actions: 'Actions', ack: 'Acknowledge', accept: 'Accept', closeTask: 'Close Task', note: 'Add process note...', addNote: 'Add Note', apply: 'Apply', loading: 'Loading...',
    compactCalendar: 'Compact Agenda', calendarHint: 'Shows schedules and Hypercare from today to month end only.', prevMonth: 'Prev', nextMonth: 'Next', thisMonth: 'This Month', scheduleCreate: 'Create Schedule', shift: 'Shift', startTime: 'Start', endTime: 'End', members: 'Members', remark: 'Remark',
    richTimeline: 'Default Event Stream', richTimelineHint: 'See task, log, handover, external link, Hypercare, and time relationship without filtering.', filters: 'Filters',
    hypercare: 'Hypercare Checks', addHypercare: 'Add Hypercare Check', checkTime: 'Check Time', checkItem: 'Check Item', expectedResult: 'Expected Result', actualResult: 'Actual Result', planned: 'Planned', done: 'Done', skipped: 'Skipped', ng: 'NG', updateStatus: 'Update Status', adminUsers: 'Users', adminGroups: 'Groups', adminFactories: 'Factories', adminSystems: 'Systems', adminShifts: 'Shifts', code: 'Code', name: 'Name', email: 'Email', role: 'Role', refresh: 'Refresh', adminHint: 'Admin master-data management is kept as a basic entry and will be split later.'
  }
}


export type I18nText = typeof tx.zh
export const tByLang = (lang: Lang) => tx[lang]
