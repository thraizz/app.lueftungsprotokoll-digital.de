import { useState } from "react";
import { Room, getDefaultRooms } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, Edit } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RoomManagementProps {
  rooms: Room[];
  onChange: (rooms: Room[]) => void;
  disabled?: boolean;
}

export const RoomManagement = ({ rooms, onChange, disabled }: RoomManagementProps) => {
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", icon: "" });

  const handleAddRoom = () => {
    if (!formData.name.trim()) return;

    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name: formData.name.trim(),
      icon: formData.icon.trim() || undefined,
      order: rooms.length + 1,
    };

    onChange([...rooms, newRoom]);
    setFormData({ name: "", icon: "" });
    setShowAddForm(false);
  };

  const handleEditRoom = () => {
    if (!editingRoom || !formData.name.trim()) return;

    const updatedRooms = rooms.map((room) =>
      room.id === editingRoom.id
        ? { ...room, name: formData.name.trim(), icon: formData.icon.trim() || undefined }
        : room
    );

    onChange(updatedRooms);
    setEditingRoom(null);
    setFormData({ name: "", icon: "" });
  };

  const handleDeleteRoom = () => {
    if (!deleteRoomId) return;

    const filteredRooms = rooms.filter((room) => room.id !== deleteRoomId);
    const reorderedRooms = filteredRooms.map((room, index) => ({
      ...room,
      order: index + 1,
    }));

    onChange(reorderedRooms);
    setDeleteRoomId(null);
  };

  const handleResetToDefaults = () => {
    onChange(getDefaultRooms());
  };

  const startEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({ name: room.name, icon: room.icon || "" });
  };

  const cancelEdit = () => {
    setEditingRoom(null);
    setShowAddForm(false);
    setFormData({ name: "", icon: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Verwalten Sie die Räume für diese Wohnung
        </p>
        <Button
          onClick={handleResetToDefaults}
          variant="outline"
          size="sm"
          disabled={disabled}
        >
          Auf Standard zurücksetzen
        </Button>
      </div>

      <div className="space-y-2">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="flex items-center gap-2 p-3 bg-card rounded-lg border border-border"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {room.icon && <span className="text-lg">{room.icon}</span>}
                <span className="font-medium">{room.name}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => startEdit(room)}
              disabled={disabled}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteRoomId(room.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={disabled}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {!showAddForm && !editingRoom && (
        <Button
          onClick={() => setShowAddForm(true)}
          variant="outline"
          className="w-full"
          disabled={disabled}
        >
          <Plus className="w-4 h-4 mr-2" />
          Raum hinzufügen
        </Button>
      )}

      {(showAddForm || editingRoom) && (
        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
          <h4 className="font-semibold">
            {editingRoom ? "Raum bearbeiten" : "Neuer Raum"}
          </h4>

          <div className="space-y-2">
            <Label htmlFor="room-name">Name *</Label>
            <Input
              id="room-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Gästezimmer"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="room-icon">Icon (optional)</Label>
            <Input
              id="room-icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="z.B. 🏠"
              maxLength={2}
              disabled={disabled}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancelEdit}
              className="flex-1"
              disabled={disabled}
            >
              Abbrechen
            </Button>
            <Button
              onClick={editingRoom ? handleEditRoom : handleAddRoom}
              className="flex-1"
              disabled={disabled || !formData.name.trim()}
            >
              {editingRoom ? "Speichern" : "Hinzufügen"}
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteRoomId} onOpenChange={() => setDeleteRoomId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Raum löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie diesen Raum löschen möchten? Bestehende
              Lüftungseinträge für diesen Raum bleiben erhalten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoom}
              className="bg-destructive hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
