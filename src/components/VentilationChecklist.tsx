import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Apartment, VentilationEntry, Room } from "@/lib/db";
import { Link } from "react-router-dom";

interface RoomStatus {
  room: Room;
  lastVentilated: VentilationEntry | null;
  status: "done" | "warning" | "overdue";
  timeAgo: string;
}

interface VentilationChecklistProps {
  apartment: Apartment;
  entries: VentilationEntry[];
  onRoomClick?: (room: Room) => void;
}

export const VentilationChecklist = ({ apartment, entries, onRoomClick }: VentilationChecklistProps) => {
  const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([]);

  useEffect(() => {
    calculateRoomStatuses();
  }, [apartment, entries]);

  const calculateRoomStatuses = () => {
    if (!apartment.rooms) return;

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    const statuses: RoomStatus[] = apartment.rooms.map((room) => {
      // Find all entries that include this room
      const roomEntries = entries
        .filter((e) => e.apartmentId === apartment.id && e.rooms?.includes(room.name))
        .sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateB.getTime() - dateA.getTime();
        });

      const lastEntry = roomEntries[0] || null;

      let status: "done" | "warning" | "overdue" = "overdue";
      let timeAgo = "Noch nie gelüftet";

      if (lastEntry) {
        const lastDate = new Date(`${lastEntry.date}T${lastEntry.time}`);
        const hoursSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

        // Was it ventilated today?
        if (lastEntry.date === today) {
          status = "done";
          const minutesAgo = Math.floor(hoursSince * 60);
          const hoursAgo = Math.floor(hoursSince);

          if (minutesAgo < 60) {
            timeAgo = `vor ${minutesAgo} Min.`;
          } else if (hoursAgo < 24) {
            timeAgo = `vor ${hoursAgo}h`;
          } else {
            timeAgo = `heute ${lastEntry.time}`;
          }
        } else if (hoursSince <= 12) {
          status = "warning";
          timeAgo = `vor ${Math.floor(hoursSince)}h`;
        } else if (hoursSince <= 24) {
          status = "warning";
          timeAgo = "gestern";
        } else {
          status = "overdue";
          const daysAgo = Math.floor(hoursSince / 24);
          timeAgo = `vor ${daysAgo} ${daysAgo === 1 ? "Tag" : "Tagen"}`;
        }
      }

      return {
        room,
        lastVentilated: lastEntry,
        status,
        timeAgo,
      };
    });

    setRoomStatuses(statuses);
  };

  const doneCount = roomStatuses.filter((r) => r.status === "done").length;
  const totalCount = roomStatuses.length;
  const progressPercentage = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  const getStatusIcon = (status: "done" | "warning" | "overdue") => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "warning":
        return <Clock className="w-5 h-5 text-warning" />;
      case "overdue":
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: "done" | "warning" | "overdue") => {
    switch (status) {
      case "done":
        return "bg-success/10 border-success/20 hover:bg-success/20";
      case "warning":
        return "bg-warning/10 border-warning/20 hover:bg-warning/20";
      case "overdue":
        return "bg-muted/50 border-border hover:bg-muted";
    }
  };

  if (roomStatuses.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Heute gelüftet</CardTitle>
          <span className="text-sm font-semibold text-muted-foreground">
            {doneCount}/{totalCount}
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-2">
        {roomStatuses.map(({ room, status, timeAgo }) => (
          <Link
            key={room.id}
            to="/new-entry"
            state={{ preselectedRoom: room.name }}
            className="block"
          >
            <Button
              variant="outline"
              className={`w-full justify-start gap-3 h-auto py-3 px-4 transition-all ${getStatusColor(status)}`}
              onClick={(e) => {
                if (onRoomClick) {
                  e.preventDefault();
                  onRoomClick(room);
                }
              }}
            >
              <div className="flex items-center gap-3 flex-1">
                {getStatusIcon(status)}
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-lg">{room.icon}</span>
                  <span className="font-medium">{room.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{timeAgo}</span>
              </div>
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};
