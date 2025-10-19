import { useState } from "react";
import { useForm } from "react-hook-form";
import { Room, getDefaultRooms } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

interface RoomFormData {
  name: string;
  icon: string;
}

export const RoomManagement = ({ rooms, onChange, disabled }: RoomManagementProps) => {
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const form = useForm<RoomFormData>({
    defaultValues: {
      name: "",
      icon: "",
    },
  });

  const handleAddRoom = (data: RoomFormData) => {
    if (!data.name.trim()) return;

    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name: data.name.trim(),
      icon: data.icon.trim() || undefined,
      order: rooms.length + 1,
    };

    onChange([...rooms, newRoom]);
    form.reset();
    setShowAddForm(false);
  };

  const handleEditRoom = (data: RoomFormData) => {
    if (!editingRoom || !data.name.trim()) return;

    const updatedRooms = rooms.map((room) =>
      room.id === editingRoom.id
        ? { ...room, name: data.name.trim(), icon: data.icon.trim() || undefined }
        : room
    );

    onChange(updatedRooms);
    setEditingRoom(null);
    form.reset();
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
    form.setValue("name", room.name);
    form.setValue("icon", room.icon || "");
  };

  const cancelEdit = () => {
    setEditingRoom(null);
    setShowAddForm(false);
    form.reset();
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
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(editingRoom ? handleEditRoom : handleAddRoom)}
            className="p-4 bg-muted/50 rounded-lg space-y-4"
          >
            <h4 className="font-semibold">
              {editingRoom ? "Raum bearbeiten" : "Neuer Raum"}
            </h4>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. Gästezimmer"
                      disabled={disabled}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. 🏠"
                      maxLength={2}
                      disabled={disabled}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                type="submit"
                className="flex-1"
                disabled={disabled || !form.watch("name").trim()}
              >
                {editingRoom ? "Speichern" : "Hinzufügen"}
              </Button>
            </div>
          </form>
        </Form>
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
