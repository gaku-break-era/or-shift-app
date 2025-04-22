import React from "react";
import dayjs from "dayjs";

const OperatingRoomRow = React.memo(function OperatingRoomRow({
  orNumber,
  todayStr,
  surgeryMap,
  openModal,
}) {
  const timeCache = new Map();

  return (
    <div className="sr-row" style={{ display: "flex", height: "80px" }}>
      <div className="sr-room" style={{ width: 60, border: "1px solid #ccc", textAlign: "center", fontWeight: "bold", background: "#f9f9f9" }}>{orNumber}</div>
      {Array.from({ length: 96 }, (_, quarter) => {
        const hour = Math.floor(quarter / 4);
        const min = (quarter % 4) * 15;
        const timeStr = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
        const surgery = surgeryMap.get(orNumber)?.get(timeStr);

        if (surgery) {
          const startKey = `${todayStr} ${surgery.start}`;
          const endKey = `${todayStr} ${surgery.end}`;
          const start = timeCache.get(startKey) || dayjs(startKey);
          const end = timeCache.get(endKey) || dayjs(endKey);
          timeCache.set(startKey, start);
          timeCache.set(endKey, end);

          const span = end.diff(start, "minute") / 15;
          return (
            <div
              key={quarter}
              style={{
                background: "#d0ebff",
                border: "1px solid #87c4ff",
                width: `${40 * span}px`,
                fontSize: "0.7rem",
                whiteSpace: "pre-line",
                lineHeight: 1.3,
                padding: "4px",
                cursor: "pointer",
                height: "100%",
                textAlign: "left"
              }}
              onClick={() => openModal(orNumber, quarter)}
            >
              <div style={{ fontWeight: "bold", fontSize: "0.85rem" }}>{surgery.procedure}</div>
              {`${surgery.start}〜${surgery.end}\n${surgery.surgeon}\n${surgery.position}\n${surgery.anesthesia}`}
            </div>
          );
        }

        const isCovered = (() => {
          const entries = surgeryMap.get(orNumber);
          if (!entries) return false;
          for (const [time, s] of entries.entries()) {
            const sStartKey = `${todayStr} ${s.start}`;
            const sEndKey = `${todayStr} ${s.end}`;
            const tKey = `${todayStr} ${timeStr}`;

            const sStart = timeCache.get(sStartKey) || dayjs(sStartKey);
            const sEnd = timeCache.get(sEndKey) || dayjs(sEndKey);
            const t = timeCache.get(tKey) || dayjs(tKey);
            timeCache.set(sStartKey, sStart);
            timeCache.set(sEndKey, sEnd);
            timeCache.set(tKey, t);

            if (t.isAfter(sStart.subtract(1, "minute")) && t.isBefore(sEnd)) {
              return true;
            }
          }
          return false;
        })();

        if (isCovered) return null;

        return (
          <div
            key={quarter}
            className="sr-cell"
            style={{ width: 40, border: "1px solid #eee", cursor: "pointer", height: "100%" }}
            onClick={() => openModal(orNumber, quarter)}
          />
        );
      })}
    </div>
  );
});

export default OperatingRoomRow;