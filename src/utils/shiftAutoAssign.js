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

/** 🧠 新・夜勤割り当てロジック（心外独り立ち → 中堅 → 誰でも） */
export function assignNightShifts(shiftMatrix, employeeIds, dates, skillData, requiredStaff) {
  const updated = { ...shiftMatrix };

  dates.forEach((date, i) => {
    const needNight = requiredStaff[date]?.nightShift || 0;
    if (needNight < 1) return;

    const available = employeeIds.filter(empId => !updated[`${empId}_${date}`]);

    // 1番目：心外器械（combatPower 90以上）
    const firstCandidates = available.filter(empId => (skillData[empId]?.combatPower || 0) >= 90);
    if (firstCandidates.length) assignNightSet(updated, firstCandidates, dates, i);

    // 2番目：心外外回り（combatPower 85以上）
    const secondCandidates = available.filter(empId => (skillData[empId]?.combatPower || 0) >= 85);
    if (secondCandidates.length) assignNightSet(updated, secondCandidates, dates, i);

    // 3番目：中堅（combatPower 70以上）
    const thirdCandidates = available.filter(empId => (skillData[empId]?.combatPower || 0) >= 70);
    if (thirdCandidates.length) assignNightSet(updated, thirdCandidates, dates, i);

    // 4番目：誰でもOK
    const others = available.filter(empId =>
      !firstCandidates.includes(empId) &&
      !secondCandidates.includes(empId) &&
      !thirdCandidates.includes(empId)
    );
    if (others.length) assignNightSet(updated, others, dates, i);
  });

  return updated;
}

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
