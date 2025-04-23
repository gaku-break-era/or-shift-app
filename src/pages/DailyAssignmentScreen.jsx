
import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "../components/ui/dialog";
import { Input } from "../components/ui/input";

const DailyAssignmentScreen = () => {
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [allStaffs, setAllStaffs] = useState([]);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    const querySnapshot = await getDocs(collection(db, "surgerySchedules"));
    const schedules = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setScheduleData(schedules);
  };

  const generateAICandidates = async (surgery) => {
    try {
      const staffSnapshot = await getDocs(collection(db, "staffs"));
      const staffList = staffSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const scrubCandidates = staffList.filter(
        (staff) => staff.years === 1 && !staff.restrictions?.includes(surgery.procedure)
      ).map(staff => ({ name: staff.name, experience: staff.years, score: 90, reason: "1年目 + NGなし" }));

      const circulatingCandidates = staffList.filter(
        (staff) => staff.years >= 3 && !staff.restrictions?.includes(surgery.procedure)
      ).map(staff => ({ name: staff.name, experience: staff.years, score: 85, reason: "3年目以上 + NGなし" }));

      await updateDoc(doc(db, "surgerySchedules", surgery.id), {
        aiCandidates: {
          scrub: scrubCandidates,
          circulating: circulatingCandidates,
        }
      });
    } catch (err) {
      console.error("生成エラー:", err);
    }
  };

  const generateAICandidatesForAll = async () => {
    setLoading(true);
    try {
      await Promise.all(scheduleData.map((surgery) => generateAICandidates(surgery)));
      await fetchSchedules();
      alert("全手術のAI候補を生成しました！");
    } catch (err) {
      alert("一括生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const assignStaff = async (surgeryId, role, candidate) => {
    try {
      await updateDoc(doc(db, "surgerySchedules", surgeryId), {
        [role]: candidate
      });
      alert(`${candidate.name} さんを ${role === "scrub" ? "器械出し" : "外回り"} に割り当てました`);
      await fetchSchedules();
    } catch (err) {
      console.error("割り当てエラー:", err);
      alert("割り当てに失敗しました");
    }
  };

  const openManualEdit = async (surgery) => {
    setSelectedSurgery(surgery);
    setShowDialog(true);
    const staffSnapshot = await getDocs(collection(db, "staffs"));
    const staffList = staffSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setAllStaffs(staffList);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setSearchTerm("");
  };

  const filteredStaffs = allStaffs.filter(staff => staff.name.includes(searchTerm));

  const orNumbers = Array.from({ length: 20 }, (_, i) => `OR${i + 1}`);


  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">🗓️ 1日の手術割り当て一覧</h1>
      <Button onClick={generateAICandidatesForAll} disabled={loading} className="mb-6">
        🔁 全手術AI候補生成
      </Button>
      <div className="grid grid-cols-1 gap-4">
        {orNumbers.map((or) => {
          const orSchedules = scheduleData.filter((surgery) => surgery.room === or);
          return (
            <Card key={or}>
              <CardContent>
                <h2 className="text-lg font-semibold mb-2">{or}</h2>
                {orSchedules.length > 0 ? (
                  orSchedules.map((surgery) => (
                    <div key={surgery.id} className="mb-4 border p-2 rounded">
                      <p className="font-semibold">{surgery.procedure}</p>
                      <p className="text-sm text-gray-600">
                        診療科: {surgery.department} / 時間: {surgery.startTime || "未設定"} - {surgery.endTime || "未設定"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm" onClick={() => generateAICandidates(surgery)} disabled={loading}>
                          AI候補生成
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openManualEdit(surgery)}>手動編集</Button>
                      </div>
                      {(surgery.aiCandidates?.scrub?.length > 0 || surgery.aiCandidates?.circulating?.length > 0) ? (
                        <div className="mt-4">
                          {surgery.aiCandidates?.scrub?.length > 0 && (
                            <div className="mb-2">
                              <h3 className="font-semibold">🔧 器械出し候補</h3>
                              {surgery.aiCandidates.scrub.map((candidate, index) => (
                                <div key={index} className="flex justify-between items-center border p-2 rounded mt-1">
                                  <div>
                                    <p>{candidate.name}（{candidate.experience}年目）</p>
                                    <p className="text-sm text-gray-500">教育スコア: {candidate.score}</p>
                                    <p className="text-xs text-gray-400">理由: {candidate.reason}</p>
                                  </div>
                                  {surgery.scrub?.name === candidate.name ? (
                                    <p className="text-green-600 font-semibold">✅ 割り当て済み</p>
                                  ) : (
                                    <Button size="sm" variant="outline" onClick={() => assignStaff(surgery.id, "scrub", candidate)}>
                                      このスタッフを割り当てる
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {surgery.aiCandidates?.circulating?.length > 0 && (
                            <div className="mb-2">
                              <h3 className="font-semibold">🚶 外回り候補</h3>
                              {surgery.aiCandidates.circulating.map((candidate, index) => (
                                <div key={index} className="flex justify-between items-center border p-2 rounded mt-1">
                                  <div>
                                    <p>{candidate.name}（{candidate.experience}年目）</p>
                                    <p className="text-sm text-gray-500">教育スコア: {candidate.score}</p>
                                    <p className="text-xs text-gray-400">理由: {candidate.reason}</p>
                                  </div>
                                  {surgery.circulating?.name === candidate.name ? (
                                    <p className="text-green-600 font-semibold">✅ 割り当て済み</p>
                                  ) : (
                                    <Button size="sm" variant="outline" onClick={() => assignStaff(surgery.id, "circulating", candidate)}>
                                      このスタッフを割り当てる
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">AI候補がまだ生成されていません</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">この部屋には手術がありません</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {showDialog && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent showClose={false}>
          <style>{`.close-icon-button { display: none !important; }`}</style>
          <h2 className="font-semibold mb-2">スタッフを検索</h2>
          <Input
            placeholder="名前で検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="mt-4 max-h-60 overflow-y-auto">
            {filteredStaffs.map((staff) => (
              <div key={staff.id} className="flex justify-between items-center border p-2 rounded mt-1">
                <div>
                  <p>{staff.name}（{staff.years}年目）</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => assignStaff(selectedSurgery.id, "scrub", staff)}>器械出し</Button>
                  <Button size="sm" onClick={() => assignStaff(selectedSurgery.id, "circulating", staff)}>外回り</Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-right">
            <Button variant="outline" onClick={closeDialog}>閉じる</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      
      )}
    </div>
  );
};

export default DailyAssignmentScreen;
