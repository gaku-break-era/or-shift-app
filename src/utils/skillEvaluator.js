// src/utils/skillEvaluator.js

const statusMap = {
    "未経験": 0,
    "見学済み": 1,
    "経験1回": 2,
    "経験2回": 3,
    "経験3回以上": 4,
    "外から見守り": 5,
    "独り立ち": 6,
    "指導可": 7,
  };
  
  const DEFAULT_PASS_THRESHOLD = 60;
  
  /**
   * スタッフの戦闘力＆独り立ち科目を算出する
   */
  export function calculateStaffSkills(proceduresByDept, passThreshold = DEFAULT_PASS_THRESHOLD) {
    let totalScore = 0;
    let totalItems = 0;
    const independentDepartments = [];
  
    for (const dept in proceduresByDept) {
      const procs = proceduresByDept[dept];
  
      let scrubIndependents = 0;
      let scrubTotal = 0;
      let circulatingIndependents = 0;
      let circulatingTotal = 0;
  
      procs.forEach(proc => {
        const scrubLevel = statusMap[proc.scrub] ?? 0;
        const circLevel = statusMap[proc.circulating] ?? 0;
  
        totalScore += scrubLevel + circLevel;
        totalItems += 2;
  
        scrubTotal++;
        circulatingTotal++;
  
        if (scrubLevel >= 6) scrubIndependents++;
        if (circLevel >= 6) circulatingIndependents++;
      });
  
      const scrubRate = scrubTotal ? (scrubIndependents / scrubTotal) * 100 : 0;
      const circulatingRate = circulatingTotal ? (circulatingIndependents / circulatingTotal) * 100 : 0;
  
      if (scrubRate >= passThreshold && circulatingRate >= passThreshold) {
        independentDepartments.push(dept);
      }
    }
  
    const overallScore = totalItems ? Math.round((totalScore / (totalItems * 7)) * 100) : 0;
  
    return {
      overallScore,
      independentDepartments,
    };
  }
  