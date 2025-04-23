import { useDrag } from "react-dnd";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase"; // ✅ firebaseのパスを適切に
import dayjs from "dayjs";

function DraggableSurgeryBar({ surgery, quarter, room, onClick }) {
  const durationMinutes = dayjs(`2024-01-01 ${surgery.end}`).diff(
    dayjs(`2024-01-01 ${surgery.start}`),
    "minute"
  );

  const [{ isDragging }, dragRef] = useDrag({
    type: "surgery",
    item: {
      docId: surgery.docId,
      durationMinutes,
      room,
      start: surgery.start,
    },
    end: async (item, monitor) => {
      const result = monitor.getDropResult();
      if (result && item.docId) {
        const ref = doc(db, "surgerySchedules", item.docId);
        await updateDoc(ref, {
          room: result.room,
          start: result.start,
          end: dayjs(`2024-01-01 ${result.start}`)
            .add(item.durationMinutes, "minute")
            .format("HH:mm"),
        });
        window.location.reload(); // ✅ 後で useEffect に変更
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
    

  return (
    <div
      ref={dragRef}
      onClick={onClick}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "move",
        fontSize: "0.7rem",
        fontWeight: "bold",
      }}
    >
      {surgery.procedure}<br />
      {surgery.surgeon}<br />
      {surgery.position}<br />
      {surgery.anesthesia}<br />
      {surgery.start}~{surgery.end}
    </div>
  );
}

export default DraggableSurgeryBar;
