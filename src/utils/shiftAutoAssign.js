import dayjs from "dayjs";

/**
 * 日ごとに必要な人数を計算する関数
 * @param {Array} dates - 日付の配列（例: ["2025-04-01", "2025-04-02", ...]）
 * @returns {Object} - 各日付ごとの必要人数セット
 */
export function calculateRequiredStaff(dates) {
  const result = {};

  dates.forEach((dateStr) => {
    const date = dayjs(dateStr);
    const dayOfWeek = date.day(); // 曜日（0=日, 6=土）
    const weekOfMonth = Math.ceil(date.date() / 7);

    if (dayOfWeek === 0) {
      // 日曜日
      result[dateStr] = {
        dayShift: 0,
        nightShift: 3,
        onCallDuty: 3,
        onCallShift: 3,
      };
    } else if (dayOfWeek === 6) {
      // 土曜日
      if (weekOfMonth === 2 || weekOfMonth === 4) {
        // ある土（第2・4土曜）
        result[dateStr] = {
          dayShift: 20,
          nightShift: 3,
          onCallDuty: 0,
          onCallShift: 3,
        };
      } else {
        // ない土（第1・3・5土曜）
        result[dateStr] = {
          dayShift: 0,
          nightShift: 3,
          onCallDuty: 3,
          onCallShift: 3,
        };
      }
    } else {
      // 平日
      result[dateStr] = {
        dayShift: 42,
        nightShift: 4,
        onCallDuty: 0,
        onCallShift: 2,
      };
    }
  });

  return result;
}

/**
 * 休み希望・夜勤希望を最優先でシフトに反映する関数
 * @param {Object} shiftMatrix - 現在のシフト表（key = empId_date）
 * @param {Array} employeeIds - スタッフのemployeeIdリスト
 * @param {Array} dates - 日付リスト
 * @param {Object} hopes - 希望情報（key = empId_date, value = "off" / "night" / "none"）
 * @returns {Object} - 更新後のshiftMatrix
 */
export function applyHopes(shiftMatrix, employeeIds, dates, hopes) {
    const updated = { ...shiftMatrix };
    const nightAssigned = new Set(); // 夜勤希望にセット済みの人を追跡
  
    dates.forEach((date, i) => {
      employeeIds.forEach((empId) => {
        const key = `${empId}_${date}`;
        const hope = hopes[key];
  
        if (hope === "off") {
          // 休み希望ならそのまま休みに
          updated[key] = "休";
        } else if (hope === "night" && !nightAssigned.has(empId)) {
          // 夜勤希望なら / → X] → 休 を割り当て
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
 * 必要人数に従ってシフトを割り当てる関数
 * @param {Object} shiftMatrix - 現在のシフト表
 * @param {Array} employeeIds - スタッフのemployeeIdリスト
 * @param {Array} dates - 日付リスト
 * @param {Object} requiredStaff - 日付ごとの必要人数セット (calculateRequiredStaffの結果)
 * @param {Object} options - 追加オプション（将来NG関係など入れる予定）
 * @returns {Object} - 更新後のshiftMatrix
 */
export function fillShifts(shiftMatrix, employeeIds, dates, requiredStaff, options = {}) {
    const updated = { ...shiftMatrix };
  
    dates.forEach((date) => {
      const dayNeed = requiredStaff[date] || {};
      const freeStaff = employeeIds.filter((empId) => !updated[`${empId}_${date}`]); // 未割当の人
  
      // シャッフルしてランダム性
      const shuffled = shuffleArray(freeStaff);
  
      // 夜勤4人配置（/）
      for (let i = 0; i < (dayNeed.nightShift || 0) && shuffled.length; i++) {
        const empId = shuffled.shift();
        updated[`${empId}_${date}`] = "/";
      }
  
      // 遅C2人配置（ｵC）
      for (let i = 0; i < (dayNeed.lateCShift || 0) && shuffled.length; i++) {
        const empId = shuffled.shift();
        updated[`${empId}_${date}`] = "ｵC";
      }
  
      // オンコール2人配置（ｵﾛ）
      for (let i = 0; i < (dayNeed.onCallShift || 0) && shuffled.length; i++) {
        const empId = shuffled.shift();
        updated[`${empId}_${date}`] = "ｵﾛ";
      }
  
      // 日勤残り（◯）
      shuffled.forEach((empId) => {
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

  
  
  /**
 * 夜勤をできるだけ均等に割り振る関数
 * @param {Object} shiftMatrix - 現在のシフト表
 * @param {Array} employeeIds - スタッフのemployeeIdリスト
 * @param {Array} dates - 日付リスト
 * @param {Object} hopes - 希望データ
 * @param {Object} requiredStaff - calculateRequiredStaffで計算した必要人数データ
 * @returns {Object} - 更新後のshiftMatrix
 */
export function assignBalancedNightShifts(shiftMatrix, employeeIds, dates, hopes, requiredStaff) {
    const updated = { ...shiftMatrix };
  
    // まず各スタッフの夜勤回数を数える
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
      const neededNight = requiredStaff[date]?.nightShift || 0;
      const currentNight = employeeIds.filter(empId => updated[`${empId}_${date}`] === "/").length;
      const deficit = neededNight - currentNight;
  
      if (deficit > 0) {
        // 夜勤をさらに割り当てる必要あり
        // 候補者リストを作成（その日まだ何も入っていない or ◯だけの人）
        const candidates = employeeIds
          .filter(empId => {
            const val = updated[`${empId}_${date}`];
            return (val === "" || val === "◯") && hopes[`${empId}_${date}`] !== "night";
          })
          .sort((a, b) => nightShiftCountByStaff[a] - nightShiftCountByStaff[b]); // 夜勤回数が少ない順に並び替え
  
        // 足りない人数分だけ割り当て
        for (let k = 0; k < deficit && k < candidates.length; k++) {
          const empId = candidates[k];
          updated[`${empId}_${date}`] = "/";
          nightShiftCountByStaff[empId]++;
  
          // 明けと休みも入れる（翌日X]、翌々日休）
          const nextDate = dates[i + 1];
          const nextNextDate = dates[i + 2];
          if (nextDate) updated[`${empId}_${nextDate}`] = "X]";
          if (nextNextDate) updated[`${empId}_${nextNextDate}`] = "休";
        }
      }
    });
  
    return updated;
  }
  