import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

const sampleProcedure = {
  name: "遊離空腸",
  departmentId: "耳鼻科",
  standard: true,
  requiredRoles: [
    {
      role: "scrub",
      count: 1,
      skills: [["頸部郭清", "皮弁"]],
    },
    {
      role: "scrub",
      count: 1,
      skills: [["開腹腸切除"]],
    },
    {
      role: "circulating",
      count: 1,
      skills: [["外回り一般", "内視鏡補助"]],
    },
  ],
};

const insertProcedure = async () => {
  await addDoc(collection(db, "procedures"), sampleProcedure);
  console.log("✅ 術式追加完了！");
};

insertProcedure();
