import dayjs from "dayjs";

/** 配列シャッフルユーティリティ */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 夜勤3日セット（/ → X] → 休）を割り当てる */
export function assignNightSet(updated, candidates, dates, dateIndex) {
  const date = dates[dateIndex];
  const nextDate = dates[dateIndex + 1];
  const nextNextDate = dates[dateIndex + 2];
  if (!date || !nextDate || !nextNextDate) return null;

  const empId = candidates.shift();
  if (!empId) return null;

  updated[`${empId}_${date}`] = "/";
  updated[`${empId}_${nextDate}`] = "X]";
  updated[`${empId}_${nextNextDate}`] = "休";

  return empId;
}

/** 日ごとに必要な人数を計算する */
export function calculateRequiredStaff(dates) {
  const result = {};
  dates.forEach((dateStr) => {
    const date = dayjs(dateStr);
    const dayOfWeek = date.day();
    const weekOfMonth = Math.ceil(date.date() / 7);

    if (dayOfWeek === 0) {
      result[dateStr] = { dayShift: 0, nightShift: 3, onCallDuty: 3, onCallShift: 3 };
    } else if (dayOfWeek === 6) {
      if (weekOfMonth === 2 || weekOfMonth === 4) {
        result[dateStr] = { dayShift: 20, nightShift: 3, onCallDuty: 0, onCallShift: 3 };
      } else {
        result[dateStr] = { dayShift: 0, nightShift: 3, onCallDuty: 3, onCallShift: 3 };
      }
    } else {
      result[dateStr] = { dayShift: 42, nightShift: 4, onCallDuty: 0, onCallShift: 2 };
    }
  });
  return result;
}

/** 休み希望・夜勤希望を反映する */
export function applyHopes(shiftMatrix, employeeIds, dates, hopes) {
  const updated = { ...shiftMatrix };
  const nightAssigned = new Set();

  dates.forEach((date, i) => {
    employeeIds.forEach((empId) => {
      const key = `${empId}_${date}`;
      const hope = hopes[key] || "none";
      if (hope === "off") {
        updated[key] = "休";
      } else if (hope === "night" && !nightAssigned.has(empId)) {
        const d2 = dates[i + 1];
        const d3 = dates[i + 2];
        if (d2 && d3) {
          updated[`${empId}_${date}`] = "/";
          updated[`${empId}_${d2}`] = "X]";
          updated[`${empId}_${d3}`] = "休";
          nightAssigned.add(empId);
        }
      }
    });
  });

  return updated;
}

// --- ▼ 新ロジック：夜勤・オンコール・遅C・当直・待機 ▼ ---

export async function assignComplexShifts(shiftMatrix, employeeIds, dates, skillData, requiredStaff) {
  const updated = { ...shiftMatrix };
  const warnings = [];

  const nightCounts = {}, onCallCounts = {}, lateCCounts = {}, dutyCounts = {}, waitCounts = {};
  employeeIds.forEach(empId => {
    nightCounts[empId] = 0;
    onCallCounts[empId] = 0;
    lateCCounts[empId] = 0;
    dutyCounts[empId] = 0;
    waitCounts[empId] = 0;
  });

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const dayInfo = requiredStaff[date] || {};
    const isWeekend = [0, 6].includes(dayjs(date).day());

    // 夜勤
    const nightCandidates = employeeIds.filter(empId => !updated[`${empId}_${date}`])
      .sort((a, b) => nightCounts[a] - nightCounts[b]);

    const nightRoles = [
      { condition: empId => skillData[empId]?.heartCirculating === true },
      { condition: empId => skillData[empId]?.heartScrub === true },
      { condition: empId => skillData[empId]?.combatPower >= 80 },
      { condition: () => true },
    ];

    for (let n = 0; n < (isWeekend ? 3 : 4); n++) {
      const role = nightRoles[n];
      const cand = nightCandidates.find(empId => (role?.condition || (() => true))(empId));
      if (cand) {
        assignNightSet(updated, [cand], dates, i);
        nightCounts[cand]++;
      } else {
        warnings.push(`【${date} 夜勤${n + 1}番目】条件に該当者なし → 最良条件で代替`);
      }
    }

    // オンコール
    const onCallRoles = [
      { condition: empId => skillData[empId]?.heartAny === true },
      { condition: empId => skillData[empId]?.brainScrub === true }
    ];
    const onCallCandidates = employeeIds.filter(empId => !updated[`${empId}_${date}`])
      .sort((a, b) => onCallCounts[a] - onCallCounts[b]);

    for (let n = 0; n < (dayInfo.onCallShift || 0); n++) {
      const role = onCallRoles[n];
      const cand = onCallCandidates.find(empId => (role?.condition || (() => true))(empId));
      if (cand) {
        updated[`${cand}_${date}`] = "ｵﾛ";
        onCallCounts[cand]++;
      } else {
        warnings.push(`【${date} オンコール${n + 1}番目】条件に該当者なし → 最良条件で代替`);
      }
    }

    // 遅C
    const needLateC = dayInfo.lateCShift || 0;
    const lateCCandidates = employeeIds
      .filter(empId => !updated[`${empId}_${date}`])
      .sort((a, b) => lateCCounts[a] - lateCCounts[b]);

    for (let n = 0; n < needLateC; n++) {
      const cand = lateCCandidates.find(empId => skillData[empId]?.lateCQualified === true);
      if (cand) {
        updated[`${cand}_${date}`] = "ｵC";
        lateCCounts[cand]++;
      } else {
        warnings.push(`【${date} 遅C${n + 1}番目】条件に該当者なし → 最良条件で代替`);
        const fallback = lateCCandidates.find(empId => !updated[`${empId}_${date}`]);
        if (fallback) {
          updated[`${fallback}_${date}`] = "ｵC";
          lateCCounts[fallback]++;
        }
      }
    }

    // 当直・待機（休日）
    if (isWeekend && dayInfo.dayShift > 0) {
      const dutyCandidates = employeeIds
        .filter(empId => !updated[`${empId}_${date}`])
        .sort((a, b) => dutyCounts[a] - dutyCounts[b]);
      const waitCandidates = [...dutyCandidates];

      const dutyRoles = [
        { condition: empId => skillData[empId]?.heartAny === true },
        { condition: empId => skillData[empId]?.brainAny === true },
        { condition: () => true }
      ];
      const waitRoles = [
        { condition: empId => skillData[empId]?.heartAny === true },
        { condition: empId => skillData[empId]?.brainAny === true },
        { condition: empId => skillData[empId]?.lateCQualified === true }
      ];

      for (let n = 0; n < 3; n++) {
        const role = dutyRoles[n];
        const cand = dutyCandidates.find(empId => (role?.condition || (() => true))(empId));
        if (cand) {
          updated[`${cand}_${date}`] = "□";
          dutyCounts[cand]++;
        } else {
          warnings.push(`【${date} 当直${n + 1}番目】条件に該当者なし → 最良条件で代替`);
        }
      }

      for (let n = 0; n < 3; n++) {
        const role = waitRoles[n];
        const cand = waitCandidates.find(empId => (role?.condition || (() => true))(empId));
        if (cand) {
          updated[`${cand}_${date}`] = "□";
          waitCounts[cand]++;
        } else {
          warnings.push(`【${date} 待機${n + 1}番目】条件に該当者なし → 最良条件で代替`);
        }
      }
    }
  }

  if (warnings.length > 0) {
    alert(warnings.join("\n\n"));
  }

  return updated;
}

// --- ▲ ここまで追加！ ▲ ---

/** 必要人数に従って、日勤・遅C・オンコールを埋める */
export function fillShifts(shiftMatrix, employeeIds, dates, requiredStaff) {
  const updated = { ...shiftMatrix };

  dates.forEach((date) => {
    const dayNeed = requiredStaff[date] || {};
    const freeStaff = employeeIds.filter(empId => !updated[`${empId}_${date}`]);
    const shuffled = shuffleArray(freeStaff);

    for (let i = 0; i < (dayNeed.lateCShift || 0) && shuffled.length; i++) {
      updated[`${shuffled.shift()}_${date}`] = "ｵC";
    }
    for (let i = 0; i < (dayNeed.onCallShift || 0) && shuffled.length; i++) {
      updated[`${shuffled.shift()}_${date}`] = "ｵﾛ";
    }
    shuffled.forEach(empId => {
      updated[`${empId}_${date}`] = "◯";
    });
  });

  return updated;
}
