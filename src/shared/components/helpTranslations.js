const text = (en, zh) => [en, zh]
const paragraph = (en, zh) => ({ type: 'paragraph', text: text(en, zh) })
const tip = (en, zh, variant = 'info') => ({ type: 'tip', text: text(en, zh), variant })
const formula = (en, zh) => ({ type: 'formula', text: text(en, zh) })
const list = (...items) => ({ type: 'list', items })
const table = (headers, rows) => ({ type: 'table', headers, rows })
const step = (enTitle, zhTitle, en, zh) => ({ title: text(enTitle, zhTitle), text: text(en, zh) })
const steps = (...items) => ({ type: 'steps', items })
const section = (en, zh, ...blocks) => ({ title: text(en, zh), blocks })

export const translatedHelp = {
  intro: [
    section('What is LWO?', '什么是 LWO？',
      paragraph(
        'LWO (Logistics Work Optimizer) measures and calculates nine key logistics KPIs on a phone. Measurements are saved automatically and results can be exported to Excel.',
        'LWO（物流工作优化工具）可通过手机测量并计算九项物流关键指标。测量数据会自动保存，结果可导出为 Excel。'
      ),
      tip('Replace the stopwatch, tape measure and notes with one on-site screen.', '在一个界面完成现场秒表、卷尺和纸笔记录的工作。', 'ok')
    ),
    section('Eight menus and nine analyses at a glance', '八个菜单与九项分析一览',
      table(
        [text('Module', '模块'), text('What is measured?', '测量内容'), text('Results', '结果')],
        [
          [text('👷 Worker workload', '👷 人员负荷率'), text('Transport cycle: picking, travel, loading/unloading and return', '搬运周期：拣货、移动、装载/卸载及返回'), text('Workload %, total transport time', '负荷率 %、总搬运时间')],
          [text('🛗 Elevator workload', '🛗 电梯负荷率'), text('Transport time and loading ratio for each elevator', '各电梯搬运时间及装载率'), text('Workload % and loading ratio %', '负荷率 %、装载率 %')],
          [text('📐 Area efficiency', '📐 面积效率'), text('Factory/zone area and load volume', '工厂/区域面积及装载体积'), text('Area efficiency % and volume utilization %', '面积效率 %、体积利用率 %')],
          [text('📦 Optimal inventory', '📦 适当库存量'), text('Choose UPH-based or actuals-based inventory by tab', '通过标签选择 UPH 基准或实际数据基准库存'), text('Total optimal inventory / 99.9% and 99.5% inventory', '适当库存总量 / 99.9% 与 99.5% 适当库存')],
          [text('🤖 AMR fleet size', '🤖 AMR 数量'), text('Production tact time and AMR round-trip time', '生产节拍时间与 AMR 往返时间'), text('Required number of AMRs', '所需 AMR 数量')],
          [text('👥 Logistics staffing', '👥 物流适当人员数'), text('Picking, unloading, travel and trip count per item', '各项目的拣货、卸载、移动时间与搬运次数'), text('Final staffing requirement', '最终所需人员数')],
          [text('🏭 Warehouse area', '🏭 物流仓库面积'), text('Required area based on UPH or container size', '按 UPH 或容器尺寸计算所需面积'), text('Total required logistics area (m²)', '物流所需面积合计（m²）')],
          [text('⚙️ Logistics automation', '⚙️ 物流自动化率'), text('Automated items and re-handled items', '自动化项目与二次搬运项目'), text('Automation % and re-handling %', '自动化率 %、二次搬运率 %')]
        ]
      ),
      tip('To use actuals-based inventory, open Optimal inventory and select the Actuals-based inventory tab.', '使用实际数据基准库存时，请打开“适当库存量”并选择“按实际数据计算库存”标签。')
    ),
    section('Common workflow', '通用操作流程',
      steps(
        step('Choose a module', '选择模块', 'Select a module from the phone’s bottom tabs or the computer’s left sidebar.', '在手机底部标签或电脑左侧栏选择分析模块。'),
        step('Enter basic information', '输入基本信息', 'Enter dimensions, UPH, times and other inputs. Blank fields are calculated as zero.', '输入尺寸、UPH、时间等基本信息；空白项按零计算。'),
        step('Measure / calculate', '测量 / 自动计算', 'In stopwatch modules, press ▶ Start and then ⏹ Stop. Other modules calculate as data is entered.', '秒表模块按 ▶ 开始，再按 ⏹ 结束；其他模块在输入时自动计算。'),
        step('Save / export', '保存 / 导出', 'Use the top 💾 Save (JSON) and 📊 Excel buttons to retain results.', '使用顶部的 💾 保存（JSON）和 📊 Excel 按钮保存结果。')
      )
    ),
    section('Top buttons', '顶部按钮说明',
      table(
        [text('Button', '按钮'), text('Purpose', '用途')],
        [
          [text('📂 Open', '📂 打开'), text('Load a previously saved JSON file.', '加载以前保存的 JSON 文件。')],
          [text('💾 Save', '💾 保存'), text('Save current inputs as JSON in Documents/LWO/.', '将当前输入以 JSON 格式保存到 Documents/LWO/。')],
          [text('📊 Excel', '📊 Excel'), text('Export all nine analyses to one Excel file.', '将全部九项分析导出到一个 Excel 文件。')],
          [text('🔄 Reset', '🔄 重置'), text('Delete all inputs; this cannot be undone.', '删除所有输入，无法撤销。')],
          [text('📖 Guide', '📖 说明书'), text('Open this guide again at any time.', '随时重新打开本说明。')]
        ]
      ),
      tip('Inputs are saved automatically in the phone/browser and persist after restarting the app. Reset deletes them all.', '输入会自动保存在手机/浏览器中，重新打开应用后仍会保留；重置会删除全部输入。')
    )
  ],
  worker: [
    section('When should I use this module?', '何时使用此模块？',
      paragraph('Measure the time for one worker or transport method to complete a cycle—picking, travel, loading/unloading and return—and calculate workload (%). Use it to compare people or transport methods.', '实测一名作业人员或一种搬运方式完成拣货、移动、装载/卸载和返回一周期的时间，并计算负荷率（%），用于比较人员或搬运方式的效率。')
    ),
    section('Input procedure', '输入步骤',
      steps(
        step('Add / select a worker', '添加 / 选择作业人员', 'Select the person from the worker tabs. Use Manage workers to add names.', '在顶部人员标签中选择测量对象；通过“管理人员”添加姓名。'),
        step('Set transport type, speed, weight and supply frequency', '设置搬运类型、速度、权重与供给次数', 'Walking (2.3 m/s), cart (1.8), pallet (2.0) and AGV (1.5) fill in a standard speed; the speed can be edited for every type. The workload weight is 0.5–1.0 (typically 0.8 = 80% operation). Supply frequency (trips/h) in the result area is essential for the workload calculation and defaults to 1.', '选择步行（2.3 m/s）、推车（1.8）、托盘（2.0）或 AGV（1.5）会自动填入标准速度，所有类型的速度均可修改。负荷权重为 0.5–1.0（通常 0.8 = 运行率 80%）。结果区的每小时供给次数（次/h）是换算负荷率的关键，默认值为 1。'),
        step('Record four stages for each cycle', '每次测量记录四个阶段', 'Use ▶ Start and ⏹ Stop to time picking (including material types), travel (process 1–10), loading/unloading at the destination (process number), and return with the empty carrier. All four stages complete one cycle.', '使用 ▶ 开始和 ⏹ 结束测量拣货（同时记录物料种数）、移动（工序 1–10）、目的地装载/卸载（工序编号）及空载返回；四个阶段全部完成才算一个周期。'),
        step('Add cycles', '添加测量次数', 'Repeat the same cycle 3–5 times for a more reliable average; use + Cycle to add a measurement.', '同一周期重复测量 3–5 次以提高平均值的可靠性，使用“+ 测量次数”添加记录。')
      )
    ),
    section('Automatic calculations', '自动计算公式',
      formula(
        'Average transport time per trip = Σ (picking + travel + loading/unloading + return) ÷ measurements\nOccupied time per hour = average trip time × trips per hour\nWeighted available time = 3,600 sec × workload weight\nWorkload (%) = occupied time per hour ÷ weighted available time × 100',
        '平均单次搬运时间 = Σ（拣货 + 移动 + 装载/卸载 + 返回）÷ 测量次数\n每小时占用时间 = 平均单次搬运时间 × 每小时供给次数\n负荷加权时间 = 3,600 秒 × 负荷权重\n负荷率（%）= 每小时占用时间 ÷ 负荷加权时间 × 100'
      ),
      tip('Example: an average of 400 sec × 6 trips = 2,400 sec; with 2,880 sec weighted time the workload is about 83%. If supply frequency is omitted, the default is 1 trip/h.', '示例：平均 400 秒 × 6 次 = 2,400 秒；加权时间为 2,880 秒时，负荷率约为 83%。未输入供给次数时按默认的 1 次/h 计算。')
    ),
    section('Detailed time chart', '详细时间图表',
      paragraph('After at least one measurement, the detailed chart can show times by cycle or worker.', '至少测量一次后，可在详细时间图表中按测量次数或人员查看时间。'),
      list(
        text('By cycle: compare the selected worker’s picking, travel, loading/unloading and return times.', '按次数：比较所选人员各次的拣货、移动、装载/卸载及返回时间。'),
        text('By worker: compare total transport time and average workload for multiple workers.', '按人员：比较多名人员的总搬运时间和平均负荷率。'),
        text('Choose a line or box chart to view trends or compare component breakdowns.', '选择折线图或箱形图查看趋势或比较各项构成。')
      )
    ),
    section('Interpreting results', '结果解读',
      table(
        [text('Workload', '负荷率'), text('Assessment', '判断'), text('Response', '应对')],
        [
          [text('Up to 70%', '不超过 70%'), text('Capacity available', '有余量'), text('Consider reallocating staff', '考虑重新分配人员')],
          [text('70–90%', '70–90%'), text('Appropriate', '负荷适当'), text('Maintain current operation', '维持现状')],
          [text('90% or more', '90% 及以上'), text('Overloaded', '过载'), text('Add staff, shorten routes or change transport method', '增加人员、缩短路线或更换搬运方式')]
        ]
      )
    ),
    section('Frequently asked questions', '常见问题',
      tip('A transport method is missing? Add its name and speed using Manage transport types.', '找不到需要的搬运方式？可在“管理搬运类型”中添加名称和速度。'),
      tip('The timer continues if you switch tabs during measurement, but you must press Stop yourself.', '测量途中切换标签时计时器仍会运行，但必须手动按结束。', 'warn')
    )
  ],
  elevator: [
    section('When should I use this module?', '何时使用此模块？',
      paragraph('Compare transport efficiency across factory elevators 1–9 and check actual loading area against the car area.', '比较工厂内 1–9 号电梯的搬运效率，并检查实际装载面积占轿厢面积的比例。')
    ),
    section('Input procedure', '输入步骤',
      steps(
        step('Select an elevator', '选择电梯', 'Choose the elevator to measure from tabs 1–9.', '在顶部 1–9 号标签中选择测量对象。'),
        step('Enter elevator width and depth (m)', '输入电梯宽度与深度（m）', 'Example: 2.2 m × 1.5 m automatically gives 3.3 m².', '例如：2.2 m × 1.5 m，面积自动计算为 3.3 m²。'),
        step('Add actual loads', '添加实际装载项目', 'Enter the types, quantities and dimensions (m) of boxes, carts, pallets, etc. Enter the number of stacked tiers as a common value for the elevator.', '输入箱子、推车、托盘等实际载荷的类型、数量和尺寸（m）；装载层数作为该电梯的共同值输入。'),
        step('Measure a cycle', '开始测量周期', 'Time loading into the elevator (and material types), travel between floors (1–10), unloading at the destination (process number), and return with the empty cart.', '测量电梯装载（同时记录物料种数）、楼层间移动（1–10 层）、到达后卸载（工序编号）及空车返回四个阶段。'),
        step('Enter weight and trips per hour', '输入负荷权重与每小时供给次数', 'On the results card enter the workload weight (0.5–1.0) and supply frequency (trips/h; default 1). Workload is calculated from average trip time × trips per hour.', '在结果卡输入负荷权重（0.5–1.0）及每小时供给次数（次/h，默认 1）；负荷率按平均单次时间 × 供给次数换算。')
      )
    ),
    section('Automatic calculations', '自动计算公式',
      formula(
        'Elevator area = width × depth [m²]\nActual loading area = Σ (width × depth × quantity) ÷ stacked tiers [m²]\nElevator loading ratio (%) = actual loading area ÷ elevator area × 100\n\nAverage transport time = Σ (loading + travel + unloading + return) ÷ measurements\nElevator workload (%) = (average trip time × trips per hour) ÷ (3,600 × weight) × 100',
        '电梯面积 = 宽 × 深 [m²]\n实际装载面积 = Σ（宽 × 深 × 数量）÷ 装载层数 [m²]\n电梯装载率（%）= 实际装载面积 ÷ 电梯面积 × 100\n\n平均单次搬运时间 = Σ（装载 + 移动 + 卸载 + 返回）÷ 测量次数\n电梯负荷率（%）=（平均单次时间 × 每小时供给次数）÷（3,600 × 权重）× 100'
      )
    ),
    section('Elevator comparison dashboard', '电梯对比仪表板',
      paragraph('After measuring at least two elevators, a dashboard appears at the bottom of the screen.', '测量至少两台电梯后，屏幕底部会自动显示对比仪表板。'),
      list(
        text('Work-time bar chart per elevator, color-coded by loading, travel, unloading and return.', '各电梯作业时间柱状图，以颜色区分装载、移动、卸载及返回。'),
        text('Horizontal workload bars; values over 90% are red.', '各电梯负荷率横向柱状图；超过 90% 时显示红色。')
      ),
      tip('Large differences between elevators may indicate that operating policies should be reviewed.', '电梯间差异较大时，可考虑重新检查运行策略。', 'ok')
    )
  ],
  area: [
    section('When should I use this module?', '何时使用此模块？',
      paragraph('Divide a factory into zones to analyze floor-area utilization and load-volume (height) utilization together when considering space rearrangement.', '将工厂划分为多个区域，同时分析面积利用效率和装载体积（高度）效率，用于评估空间重新配置。')
    ),
    section('Input procedure', '输入步骤',
      steps(
        step('Factory dimensions', '工厂整体尺寸', 'Enter factory width and depth in metres; a factory photo is optional.', '输入工厂宽度和深度（m）；工厂照片为可选项。'),
        step('Add zones', '添加区域', 'Use + Zone to add zones 1, 2, etc.; enter each zone’s width, depth and optional photo.', '使用“+ 区域”添加区域 1、2 等，并输入各区域的宽度、深度和可选照片。'),
        step('Enter loads', '输入装载项目', 'For each zone add boxes, pallets, carts, racks or other loads: type, quantity, width/depth (m), lowest and highest load height (m), highest-height occupancy (0.5–1.0, typically 0.8), and an optional load photo.', '为各区域添加箱子、托盘、推车、货架或其他载荷：类型、数量、宽/深（m）、最低和最高装载高度（m）、最高高度占用率（0.5–1.0，通常 0.8）及可选装载照片。')
      )
    ),
    section('Automatic calculations', '自动计算公式',
      formula(
        'Zone area = width × depth [m²]\nTotal load area = width × depth × quantity [m²]\nArea efficiency (%) = total load area ÷ zone area × 100\n\nVolume loss rate (%) = ((highest − lowest) ÷ highest) × highest-height occupancy\nAverage volume utilization = average of (highest − loss) ÷ highest for all items',
        '区域面积 = 宽 × 深 [m²]\n装载总面积 = 宽 × 深 × 数量 [m²]\n面积效率（%）= 装载总面积 ÷ 区域面积 × 100\n\n体积损失率（%）=（最高 − 最低）÷ 最高 × 最高高度占用率\n平均体积利用率 = 各项目（最高 − 损失量）÷ 最高的平均值'
      ),
      tip('Example: highest 5.0 m, lowest 0.5 m, occupancy 0.5 → 45% volume loss and 55% utilization.', '示例：最高 5.0 m、最低 0.5 m、占用率 0.5 → 体积损失率 45%，利用率 55%。')
    ),
    section('Results visualization', '结果可视化',
      paragraph('The area-efficiency bar chart compares each zone’s efficiency, shows used and total zone area together, and also displays total factory area.', '区域面积效率柱状图比较各区域的效率，同时显示实际使用面积、区域总面积及工厂总面积。'),
      tip('Over 90% indicates saturation and a need to secure aisles. Under 50% indicates low utilization; consider rearrangement.', '超过 90% 表示空间饱和，需要确保通道；低于 50% 表示利用率低，可考虑重新配置。', 'warn')
    )
  ],
  inventory: [
    section('When should I use this module?', '何时使用此模块？',
      paragraph('The UPH-based inventory tab estimates stock needed to avoid shortages when supplying customers. It adds the absolute shortage/surplus difference, transport lead-time inventory and customer operating inventory.', 'UPH 基准库存标签用于估算避免客户供货不足所需的库存，将每日不足/盈余差的绝对值、运输提前期库存及客户运营库存相加。')
    ),
    section('Four input stages', '四个输入阶段',
      steps(
        step('① Basic inventory: customer / own line', '① 基础库存：客户 / 本公司产线', 'Enter day/night UPH and working hours for both the customer and your line. Daily shortage/surplus = customer daily production − own daily production; the final calculation uses its absolute value.', '分别输入客户及本公司产线的白班/夜班 UPH 和工作时间。每日不足/盈余差 = 客户日产量 − 本公司日产量；最终库存计算使用其绝对值。'),
        step('② Transport lead time → quantity', '② 运输提前期 → 数量', 'Enter four times in seconds: aging/storage before shipment, contingency inventory time for accidents or breakdowns, depot-to-loading waiting/loading time, and travel from your site to the customer.', '以秒输入四种时间：出货前熟成存储时间、应对事故或故障的安心库存时间、仓库至装车的等待/装车时间，以及本公司至客户的运输时间。'),
        step('③ Customer operating inventory', '③ 客户运营库存', 'Enter dock-to-depot unloading time, waiting time before the assembly line, and customer safety-inventory time accounting for the seven major losses.', '输入客户侧码头至仓库的卸货时间、投入装配线前的等待时间，以及考虑七大损失的客户安全库存时间。'),
        step('④ Total optimal inventory', '④ 适当库存总量', 'The absolute value from ① plus ② and ③ is summed automatically at the bottom.', '① 的绝对值加上 ② 和 ③，在页面底部自动汇总。')
      )
    ),
    section('Automatic calculations', '自动计算公式',
      formula(
        'Customer daily production = day (UPH × hours) + night (UPH × hours)\nOwn daily production = day (UPH × hours) + night (UPH × hours)\nDaily shortage/surplus = customer daily − own daily\n  Positive → shortage; negative → own surplus (green)\nApplied quantity = |daily shortage/surplus|\n\nQuantity for each time = (seconds ÷ 3,600) × customer day-shift UPH\nLead-time inventory = aging + contingency + loading + transport quantities\nOperating inventory = unloading + waiting + safety quantities\nTotal optimal inventory = applied quantity + lead-time inventory + operating inventory',
        '客户日产量 = 白班（UPH × 小时）+ 夜班（UPH × 小时）\n本公司日产量 = 白班（UPH × 小时）+ 夜班（UPH × 小时）\n每日不足/盈余差 = 客户日产量 − 本公司日产量\n  正数 → 不足；负数 → 本公司盈余（绿色显示）\n适用数量 = |每日不足/盈余差|\n\n各时间对应数量 =（秒 ÷ 3,600）× 客户白班 UPH\n提前期库存 = 熟成 + 安心 + 装车 + 运输数量\n运营库存 = 卸货 + 等待 + 安全库存数量\n适当库存总量 = 适用数量 + 提前期库存 + 运营库存'
      )
    ),
    section('Glossary', '术语说明',
      table(
        [text('Term', '术语'), text('Meaning', '说明')],
        [
          [text('UPH', 'UPH'), text('Units per hour', '每小时生产数量')],
          [text('Aging storage', '熟成存储'), text('Storage before shipment for quality stabilization', '为稳定质量而在出货前存储')],
          [text('Contingency inventory', '安心库存'), text('Extra stock for unexpected accidents or failures', '应对事故、故障等突发情况的额外库存')],
          [text('Depot', 'Depot'), text('Logistics hub / shipping waiting area', '物流据点 / 出货等待场所')],
          [text('Seven major losses', '七大损失'), text('Operating losses such as defects, waiting and travel', '不良、等待、移动等七种运营损失')],
          [text('Lead time', '提前期'), text('Total time from order to delivery', '从订单到交付的总时间')]
        ]
      ),
      tip('All time inputs are in seconds. One hour = 3,600 seconds.', '所有时间均以秒输入。1 小时 = 3,600 秒。')
    ),
    section('Calculate required space', '计算所需空间',
      paragraph('Convert the total optimal inventory into actual warehouse floor area (m²).', '将适当库存总量换算为实际仓库地面面积（m²）。'),
      formula(
        'Area per layer = width × depth [m²]\nRequired floor area = area per layer × optimal inventory ÷ height (layers) [m²]\nFinal optimal area = required floor area × allowance factor [m²]',
        '单层面积 = 宽 × 深 [m²]\n所需地面面积 = 单层面积 × 适当库存 ÷ 高度（层数）[m²]\n最终适当面积 = 所需地面面积 × 余量系数 [m²]'
      ),
      tip('Enter width/depth (m), height (layers), and allowance factor (1.2 means 20% allowance).', '输入宽/深（m）、高度（层数）及余量系数（1.2 表示 20% 余量）。')
    )
  ],
  invStats: [
    section('When should I use this module?', '何时使用此模块？',
      paragraph('Statistically analyze actual production, shipment and inventory data instead of a theoretical formula. Results become more reliable as daily history accumulates.', '不使用理论公式，而是统计分析实际生产、出货和库存数据。每日实绩数据越多，计算结果越可靠。')
    ),
    section('Statistical method', '统计方法',
      formula(
        'Optimal inventory = average demand + (safety factor × demand deviation)\n                  = average shipments + Z × shipment standard deviation',
        '适当库存 = 平均需求量 +（安全系数 × 需求量偏差）\n         = 平均出货量 + Z × 出货量标准偏差'
      ),
      paragraph('The safety factor Z depends on the target service level: the probability of satisfying demand without a stockout.', '安全系数 Z 由目标服务率决定，即不断货而满足需求的概率。'),
      table(
        [text('Service level', '服务率'), text('Z', 'Z 值'), text('Note', '备注')],
        [
          [text('90%', '90%'), text('1.28', '1.28'), text('', '')],
          [text('95%', '95%'), text('1.65', '1.65'), text('Common practical standard', '常用实务标准')],
          [text('98%', '98%'), text('2.05', '2.05'), text('', '')],
          [text('99%', '99%'), text('2.33', '2.33'), text('', '')],
          [text('99.5%', '99.5%'), text('2.575', '2.575'), text('Calculated by this module', '本模块自动计算')],
          [text('99.9%', '99.9%'), text('3.09', '3.09'), text('Calculated by this module', '本模块自动计算')]
        ]
      )
    ),
    section('Procedure', '操作步骤',
      steps(
        step('Select product / model', '选择产品 / 型号', 'Select the product and model; use Manage to add, rename or delete them. Data is saved independently for each combination.', '选择产品和型号；通过“管理”添加、重命名或删除。每种产品/型号组合的数据独立保存。'),
        step('Enter daily actuals', '输入每日实绩', 'Use + Add date or bulk Excel entry for date, production, shipments and inventory. Enter at least 7 days; 30 or more are recommended.', '使用“+ 添加日期”或 Excel 批量输入日期、生产量、出货量和库存量；至少输入 7 天，建议 30 天以上。'),
        step('Check calculations', '确认自动计算', 'Review mean, standard deviation, min/max, optimal inventory at 99.9% and 99.5%, and inventory days.', '确认平均值、标准偏差、最小/最大值、99.9% 和 99.5% 适当库存及库存天数。'),
        step('Check trends', '查看趋势图', 'A production/shipment/inventory line chart appears after at least two days are entered.', '输入至少两天数据后，会自动显示生产/出货/库存折线图。')
      )
    ),
    section('Interpreting results', '结果解读',
      formula(
        '99.9% optimal inventory = average shipments + shipment standard deviation × 3.09\n99.5% optimal inventory = average shipments + shipment standard deviation × 2.575\nInventory days = optimal inventory ÷ average shipments [days]',
        '99.9% 适当库存 = 平均出货量 + 出货量标准偏差 × 3.09\n99.5% 适当库存 = 平均出货量 + 出货量标准偏差 × 2.575\n库存天数 = 适当库存 ÷ 平均出货量 [天]'
      ),
      paragraph('Inventory days describes how many days stock can support shipments.', '库存天数表示库存可支持多少天的出货。'),
      tip('Greater shipment variation (higher standard deviation) naturally increases safety inventory.', '出货波动越大（标准偏差越高），安全库存自然越高。', 'ok'),
      tip('With only one or two days of data, the standard deviation is not meaningful and the result is less reliable.', '仅有 1–2 天数据时，标准偏差意义有限，计算结果的可靠性较低。', 'warn')
    ),
    section('UPH-based versus actuals-based inventory', 'UPH 基准与实际数据基准库存的区别',
      table(
        [text('Aspect', '项目'), text('UPH-based', 'UPH 基准'), text('Actuals-based', '实际数据基准')],
        [
          [text('Data', '数据'), text('Plan/theory: UPH, time, etc.', '计划/理论：UPH、时间等'), text('Actual operating results', '实际运营实绩')],
          [text('Best use', '适用场景'), text('Designing a new line', '设计新产线'), text('Optimizing an existing line', '优化现有产线')],
          [text('Key inputs', '关键变量'), text('Customer/own UPH and lead time', '客户/本公司 UPH 与提前期'), text('Daily shipments', '每日出货量')],
          [text('Result', '结果'), text('Sum of four stages', '四阶段累计合计'), text('Mean + Z × standard deviation', '平均值 + Z × 标准偏差')]
        ]
      )
    )
  ],
  amr: [
    section('When should I use this module?', '何时使用此模块？',
      paragraph('Calculate the number of autonomous mobile robots needed for factory operation by comparing production tact time with AMR round-trip time, then add spares. For items supplied across multiple zones, enter each item/zone separately; their unit requirements are added.', '通过比较生产节拍与 AMR 往返时间，计算工厂所需自主移动机器人数量并加入备用数量。多个区域供应多个项目时，请分别输入各项目/区域，其单位需求量会汇总。')
    ),
    section('Input procedure', '输入步骤',
      steps(
        step('Add / select item (zone)', '添加 / 选择项目（区域）', 'Use item tabs or + Add item. Production and travel conditions are stored independently for each item; unit requirements are summed.', '使用项目标签或“+ 添加项目”。各项目的生产与运行条件独立保存，单位需求量会相加。'),
        step('Production quantities', '生产数量信息', 'Enter tact time (seconds per unit), yield (e.g. 90%), and load quantity (units per AMR trip).', '输入节拍时间（每件秒数）、良品率（如 90%）及装载数量（每次 AMR 搬运件数）。'),
        step('AMR travel', 'AMR 运行信息', 'Enter AMR speed (typically 1.0–2.0 m/s), one-way distance, and loading/unloading counts and seconds per occurrence.', '输入 AMR 速度（通常 1.0–2.0 m/s）、单程距离，以及每周期装载/卸载次数和每次耗时。'),
        step('Allowance and spares', '余量与备用数量', 'Enter the AMR allowance factor (e.g. 1.2 for charging, repair and route allowance) and spare units (typically 1). These are applied once to the total of all items.', '输入 AMR 余量系数（如 1.2，用于充电、维修和路线余量）及备用数量（通常 1 台）；对所有项目汇总后仅应用一次。')
      )
    ),
    section('Automatic calculations', '自动计算公式',
      formula(
        '[Per item / zone]\nUPH = (3,600 ÷ tact) × yield\nAMR trips per hour = UPH ÷ load quantity\nAMR cycle time = 3,600 ÷ trips per hour\nRound-trip distance = one-way distance × 2\nTotal round-trip time = (round-trip distance ÷ speed) + loading + unloading\nAMR unit requirement = total round-trip time ÷ cycle time\n\n[All items]\nTotal unit requirement = Σ item unit requirements\nUnits with allowance = ⌈total unit requirement × AMR allowance⌉\nRequired units = units with allowance + spares',
        '[每个项目 / 区域]\nUPH =（3,600 ÷ 节拍）× 良品率\nAMR 每小时运行次数 = UPH ÷ 装载数量\nAMR 周期时间 = 3,600 ÷ 每小时运行次数\n往返距离 = 单程距离 × 2\n总往返时间 =（往返距离 ÷ 速度）+ 装载 + 卸载\nAMR 单位需求量 = 总往返时间 ÷ 周期时间\n\n[全部项目]\n总单位需求量 = Σ 各项目单位需求量\n应用余量的数量 = ⌈总单位需求量 × AMR 余量系数⌉\n所需数量 = 应用余量的数量 + 备用数量'
      ),
      tip('For example, 0.2 + 0.4 + 0.2 = 0.8 AMR. Apply allowance, rounding up and spares once after summing. ⌈ ⌉ means round up.', '例如 0.2 + 0.4 + 0.2 = 0.8 台 AMR；汇总后仅应用一次余量、向上取整及备用数量。⌈ ⌉ 表示向上取整。')
    ),
    section('Worked example', '计算示例',
      table(
        [text('Input', '项目'), text('Value', '输入值')],
        [
          [text('Tact time', '节拍时间'), text('60 sec', '60 秒')],
          [text('Yield', '良品率'), text('90%', '90%')],
          [text('Load quantity', '装载数量'), text('5 units/trip', '5 件/次')],
          [text('AMR speed', 'AMR 速度'), text('1.5 m/s', '1.5 m/s')],
          [text('One-way distance', '单程距离'), text('60 m', '60 m')],
          [text('Loading count × time', '装载次数 × 时间'), text('1 × 15 sec', '1 次 × 15 秒')],
          [text('Unloading count × time', '卸载次数 × 时间'), text('1 × 15 sec', '1 次 × 15 秒')],
          [text('Allowance', '余量系数'), text('1.2', '1.2')],
          [text('Spares', '备用数量'), text('1 unit', '1 台')]
        ]
      ),
      formula(
        'UPH = 3,600 / 60 × 0.9 = 54\nTrips = 54 / 5 = 10.8 per hour\nCycle = 3,600 / 10.8 ≈ 333 sec\n\nRound-trip distance = 120 m\nRound-trip time = 120 / 1.5 + 15 + 15 = 110 sec\n\nItem requirement = 110 / 333 = 0.33 AMR\nTotal requirement = 0.33 AMR for one item; sum multiple items\nRequired units = ⌈0.33 × 1.2⌉ + 1 = ⌈0.40⌉ + 1 = 2 AMRs',
        'UPH = 3,600 / 60 × 0.9 = 54\n运行次数 = 54 / 5 = 10.8 次/h\n周期 = 3,600 / 10.8 ≈ 333 秒\n\n往返距离 = 120 m\n往返时间 = 120 / 1.5 + 15 + 15 = 110 秒\n\n项目单位需求量 = 110 / 333 = 0.33 台\n总单位需求量 = 0.33 台（一个项目；多个项目需相加）\n所需数量 = ⌈0.33 × 1.2⌉ + 1 = ⌈0.40⌉ + 1 = 2 台'
      )
    )
  ],
  personnelPlan: [
    section('When should I use this module?', '何时使用此模块？',
      paragraph('Calculate appropriate logistics transport staffing from each load item’s picking, unloading and travel time and daily working hours. Bulk entry follows the reference Excel column structure.', '根据各装载项目的拣货、卸载、移动时间及每日工作时间，计算适当物流搬运人员数。可按参考 Excel 的列结构批量输入。')
    ),
    section('Input procedure', '输入步骤',
      steps(
        step('Add / select an item', '添加 / 选择项目', 'Select a load item in the tabs; use + Add item to calculate multiple items separately.', '在顶部标签选择装载项目，通过“+ 添加项目”分开计算多个项目。'),
        step('Enter transport time per trip', '输入单次搬运时间', 'Enter picking and unloading times, travel distance and speed. Travel time and total transport time are calculated automatically.', '输入拣货时间、卸载时间、单次移动距离和速度，自动计算单次移动及搬运时间。'),
        step('Enter daily transport', '输入每日搬运', 'Enter trips per hour and daily working hours to calculate daily trips and transport time.', '输入每小时搬运次数及每日工作时间，自动计算每日搬运次数和时间。'),
        step('Apply standard work time', '应用标准作业时间', 'Enter the standard-work allowance factor to calculate standard transport work time and final staffing.', '输入标准作业余量系数，计算标准搬运作业时间及最终适当人员数。')
      )
    ),
    section('Automatic calculations', '自动计算公式',
      formula(
        'Travel time = round-trip distance ÷ travel speed\nTransport time per trip = picking + unloading + travel\nDaily trips = trips per hour × daily working hours\nDaily transport time = transport time per trip × daily trips\nStandard transport work time = daily working hours × 3,600 sec × standard-work allowance\nFinal staffing = daily transport time ÷ standard transport work time',
        '移动时间 = 往返距离 ÷ 移动速度\n物流单次搬运时间 = 拣货 + 卸载 + 移动时间\n每日搬运次数 = 每小时搬运次数 × 每日工作时间\n每日搬运时间 = 单次搬运时间 × 每日搬运次数\n标准搬运作业时间 = 每日工作时间 × 3,600 秒 × 标准作业余量\n最终适当人员数 = 每日搬运时间 ÷ 标准搬运作业时间'
      ),
      tip('The phone’s bottom tab uses the shorter label Staffing.', '手机底部标签使用较短的“物流人员”名称。')
    )
  ],
  warehouseArea: [
    section('When should I use this module?', '何时使用此模块？',
      paragraph('Calculate the logistics area required for each item using either UPH or container size. Bulk entry follows the reference Excel format.', '按 UPH 或容器尺寸计算各项目所需物流面积，可按参考 Excel 格式批量输入。')
    ),
    section('Input procedure', '输入步骤',
      steps(
        step('Choose a basis', '选择计算基准', 'Select required area by UPH or by container size.', '选择按 UPH 或按容器尺寸计算所需面积。'),
        step('Enter each item', '输入各项目', 'Enter the load item and type. For UPH, enter UPH, working hours, capacity, container width/depth and area allowance; for container size, enter the number and dimensions of containers.', '输入装载项目和类型。UPH 基准需输入 UPH、工作时间、容纳数、容器宽/深及面积余量；容器基准需输入容器数量和尺寸。'),
        step('Check the total', '确认合计', 'Review each final area and the total required logistics area.', '确认各项目最终面积及物流所需面积合计。')
      )
    ),
    section('Automatic calculations', '自动计算公式',
      formula(
        '[UPH basis]\nDaily production = UPH × working hours\nDaily load quantity = daily production ÷ capacity\nLoad quantity including supply = daily load quantity × 1.3 (30% supply buffer)\nUnit area = container width × container depth\nFinal optimal area = load quantity including supply × (unit area × area allowance)\n\n[Container size basis]\nFloor load count = number across width × number across depth\nRequired area = floor load count × unit area × allowance',
        '[UPH 基准]\n日产量 = UPH × 工作时间\n每日装载数量 = 日产量 ÷ 容纳数\n含供给的装载数量 = 每日装载数量 × 1.3（30% 供给缓冲）\n单位面积 = 容器宽 × 容器深\n最终适当面积 = 含供给的装载数量 ×（单位面积 × 面积余量）\n\n[容器尺寸基准]\n地面装载数量 = 横向数量 × 纵向数量\n所需面积 = 地面装载数量 × 单位面积 × 余量'
      ),
      tip('Area allowance can be entered directly or selected from presets: manual cart 220%, AMR cart 280%, three-tier rack boxes 84%. The phone tab is labeled Warehouse.', '面积余量可直接输入或使用预设：手动推车 220%、AMR 推车 280%、三层货架箱 84%。手机标签显示为“仓库面积”。')
    )
  ],
  automationRate: [
    section('When should I use this module?', '何时使用此模块？',
      paragraph('Review logistics automation and re-handling rates based on the counts of automated and re-handled items.', '根据自动化项目数及二次搬运项目数，查看物流自动化率与二次搬运率。')
    ),
    section('Input procedure', '输入步骤',
      steps(
        step('Enter automation items', '输入自动化项目', 'Enter total item count and automated item count.', '输入项目总数和已应用自动化的项目数。'),
        step('Enter re-handling items', '输入二次搬运项目', 'Enter total incoming item count and the number requiring re-handling.', '输入总入库项目数及需要二次搬运的项目数。'),
        step('Attach site photos', '附加现场照片', 'Optionally attach photos of the automated or re-handling area as evidence.', '可附加自动化或二次搬运区域照片作为依据。')
      )
    ),
    section('Automatic calculations', '自动计算公式',
      formula(
        'Logistics automation (%) = automated items ÷ total incoming items × 100\nRe-handling (%) = re-handled items ÷ total incoming items × 100',
        '物流自动化率（%）= 自动化项目数 ÷ 总入库项目数 × 100\n二次搬运率（%）= 二次搬运项目数 ÷ 总入库项目数 × 100'
      ),
      tip('The phone’s bottom tab uses the shorter label Automation.', '手机底部标签使用较短的“自动化率”名称。')
    )
  ]
}
