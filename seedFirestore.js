// seedFirestore.js
// ScrubEdge用：ローカルFirebase Emulatorにサンプルデータ投入

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

const admin = require('firebase-admin');

admin.initializeApp({
    projectId: 'or-shift-app'  // ✅ これを必ず指定！
  });

const db = admin.firestore();


async function seed() {
  console.log('🚀 サンプルデータ投入開始...');

  // スタッフデータ（例：1名分）
  const staffs = [
    {
      staffId: 'suzuki_001',
      name: '鈴木 花子',
      yearLevel: 1,
      startDepartment: 'gastrointestinal',
      departmentRoles: ['orthopedic'],
      workRoles: ['equipment'],
      currentAssignments: [],
      pastAssignments: [],
      skills: {
        lap_chole: {
          scrub: {
            checklistProgress: 0.7,
            timesAssigned: 2,
            instructorHistory: ['tanaka_002'],
            independent: false
          }
        }
      },
      personalRestrictions: {
        prohibitedProcedures: ['orthopedic'],
        workingTimeLimit: '09:00-17:00',
        notes: '妊娠中につき透視不可'
      },
      interpersonalRestrictions: ['yamada_003'],
      mentorEligible: false
    }
  ];

  // 術式データ
  const procedures = [
    {
      procedureId: 'lap_chole',
      name: '腹腔鏡下胆嚢摘出術',
      department: 'gastrointestinal',
      level: 1,
      standard: true,
      tags: ['unsterile', 'implant'],
      requiredRoles: { scrub: 1, circulate: 1 },
      scrubLevel: 1,
      circulateLevel: 1,
      trainable: true
    }
  ];

  // 手術スケジュール
  const surgeries = [
    {
      scheduleId: 'OR1_2025-04-15_1',
      date: '2025-04-15',
      room: 'OR1',
      department: 'gastrointestinal',
      procedureId: 'lap_chole',
      surgeon: 'dr_sato',
      assistant: 'dr_kimura',
      startTime: '09:00',
      endTime: '10:30',
      occupancyMinutes: 90,
      asaScore: 2,
      severity: 'moderate',
      vip: false,
      specialHandling: ['new_equipment'],
      assignment: {
        scrub: null,
        scrubMentor: null,
        circulate: null
      },
      status: 'pending'
    }
  ];

  // データ投入
  for (const s of staffs) {
    await db.collection('staffs').doc(s.staffId).set(s);
  }
  for (const p of procedures) {
    await db.collection('procedures').doc(p.procedureId).set(p);
  }
  for (const s of surgeries) {
    await db.collection('surgerySchedules').doc(s.scheduleId).set(s);
  }

  console.log('✅ サンプルデータ投入完了！');
}

seed();
