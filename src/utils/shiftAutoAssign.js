import dayjs from "dayjs";

/**
 * 日ごとに必要な人数を計算する関数
 * @param {Array} dates - 日付の配列
 * @returns {Object} - 日付ごとの必要人数
 */
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

/**
 * 休み希望・夜勤希望を最優先でシフトに反映する関数
 * @param {Object} shiftMatrix
 * @param {Array} employeeIds
 * @param {Array} dates
 * @param {Object} hopes
 * @returns {Object}
 */
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

/**
 * 夜勤をできるだけ均等に割り振る関数（エラー防止版）
 * @param {Object} shiftMatrix
 * @param {Array} employeeIds
 * @param {Array} dates
 * @param {Object} hopes
 * @param {Object} requiredStaff
 * @returns {Object}
 */
export function assignBalancedNightShifts(shiftMatrix, employeeIds, dates, hopes, requiredStaff) {
  const updated = { ...shiftMatrix };

  const nightShiftCountByStaff = {};
  employeeIds.forEach(empId => {
    nightShiftCountByStaff[empId] = 0;
    dates.forEach(date => {
      if (updated[`${empId}_${date}`] === "/") {
        nightShiftCountByStaff[empId]++;
      }
    });
  });

  dates.forEach((date, i) => {
    const staffRequirement = requiredStaff?.[date];
    if (!staffRequirement) {
      console.warn(`⚠️ 必要人数データがない日をスキップ: ${date}`);
      return;
    }

    const neededNight = staffRequirement.nightShift || 0;
    const currentNight = employeeIds.filter(empId => updated[`${empId}_${date}`] === "/").length;
    const deficit = neededNight - currentNight;

    if (deficit > 0) {
      const candidates = employeeIds
        .filter(empId => {
          const val = updated[`${empId}_${date}`];
          return (val === "" || val === "◯") && (hopes[`${empId}_${date}`] || "none") !== "night";
        })
        .sort((a, b) => nightShiftCountByStaff[a] - nightShiftCountByStaff[b]);

      for (let k = 0; k < deficit && k < candidates.length; k++) {
        const empId = candidates[k];
        updated[`${empId}_${date}`] = "/";
        nightShiftCountByStaff[empId]++;

        const nextDate = dates[i + 1];
        const nextNextDate = dates[i + 2];
        if (nextDate && updated[`${empId}_${nextDate}`] === "") {
          updated[`${empId}_${nextDate}`] = "X]";
        }
        if (nextNextDate && updated[`${empId}_${nextNextDate}`] === "") {
          updated[`${empId}_${nextNextDate}`] = "休";
        }
      }
    }
  });

  return updated;
}

/**
 * 必要人数に従って残りを埋める関数
 * @param {Object} shiftMatrix
 * @param {Array} employeeIds
 * @param {Array} dates
 * @param {Object} requiredStaff
 * @returns {Object}
 */
export function fillShifts(shiftMatrix, employeeIds, dates, requiredStaff) {
  const updated = { ...shiftMatrix };

  dates.forEach((date) => {
    const dayNeed = requiredStaff?.[date] || {};
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

/**
 * 配列をランダムに並び替えるユーティリティ
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
