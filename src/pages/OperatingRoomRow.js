import React from "react";
import dayjs from "dayjs";

const OperatingRoomRow = React.memo(function OperatingRoomRow({
  orNumber,
  todayStr,
  surgeryData,
  surgeryEntries,
  openModal,
}) {
  return (
    <tr>
      <td className="sr-room" style={{ height: "80px" }}>{orNumber}</td>
      {Array.from({ length: 96 }, (_, quarter) => {
        const hour = Math.floor(quarter / 4);
        const min = (quarter % 4) * 15;
        const currentKey = `${todayStr}_${orNumber}_${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
        const surgery = surgeryData[currentKey];

        if (surgery) {
          const start = dayjs(`${todayStr} ${surgery.start}`);
          const end = dayjs(`${todayStr} ${surgery.end}`);
          const span = end.diff(start, "minute") / 15;
          return (
            <td
              key={quarter}
              colSpan={span}
              style={{
                background: "#d0ebff",
                border: "1px solid #87c4ff",
                minWidth: `${40 * span}px`,
                fontSize: "0.7rem",
                whiteSpace: "pre-line",
                lineHeight: 1.3,
                padding: "4px",
                cursor: "pointer",
                height: "80px",
                verticalAlign: "top",
                textAlign: "left"
              }}
              onClick={() => openModal(orNumber, quarter)}
            >
              <div style={{ fontWeight: "bold", fontSize: "0.85rem" }}>{surgery.procedure}</div>
              {`${surgery.start}〜${surgery.end}\n${surgery.surgeon}\n${surgery.position}\n${surgery.anesthesia}`}
            </td>
          );
        }

        const isCovered = surgeryEntries.some(([_, s]) => {
          if (s.room !== orNumber) return false;
          const sStart = dayjs(`${todayStr} ${s.start}`);
          const sEnd = dayjs(`${todayStr} ${s.end}`);
          const t = dayjs(`${todayStr} ${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
          return t.isAfter(sStart.subtract(1, "minute")) && t.isBefore(sEnd);
        });

        if (isCovered) return null;

        return (
          <td
            key={quarter}
            className="sr-cell"
            style={{ height: "80px" }}
            onClick={() => openModal(orNumber, quarter)}
          />
        );
      })}
    </tr>
  );
});

export default OperatingRoomRow;
