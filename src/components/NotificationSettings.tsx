import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getAllNotificationSettings,
  saveNotificationSettings,
  getDefaultNotificationTimes,
  getAllApartments,
  type NotificationSettings,
  type NotificationTime,
} from '@/lib/db';
import { notificationService } from '@/lib/notification-service';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Plus, Trash2, TestTube } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const NotificationSettings = () => {
  const { toast } = useToast();
  const [permissionStatus, setPermissionStatus] = useState<
    NotificationPermission | 'unsupported'
  >('default');
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddTimeDialog, setShowAddTimeDialog] = useState(false);
  const [newTimeLabel, setNewTimeLabel] = useState('');
  const [newTimeValue, setNewTimeValue] = useState('12:00');

  useEffect(() => {
    loadSettings();
    setPermissionStatus(notificationService.getPermissionStatus());
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const allSettings = await getAllNotificationSettings();
      const apartments = await getAllApartments();

      if (allSettings.length > 0) {
        setSettings(allSettings[0]);
      } else if (apartments.length > 0) {
        const defaultSettings: NotificationSettings = {
          id: 'global-settings',
          apartmentId: apartments[0].id,
          times: getDefaultNotificationTimes(),
          enabled: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await saveNotificationSettings(defaultSettings);
        setSettings(defaultSettings);
      } else {
        const defaultSettings: NotificationSettings = {
          id: 'global-settings',
          times: getDefaultNotificationTimes(),
          enabled: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast({
        title: 'Fehler',
        description: 'Benachrichtigungseinstellungen konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async () => {
    const permission = await notificationService.requestPermission();
    setPermissionStatus(permission);

    if (permission === 'granted') {
      toast({
        title: 'Berechtigung erteilt',
        description: 'Sie erhalten jetzt Benachrichtigungen.',
      });
    } else if (permission === 'denied') {
      toast({
        title: 'Berechtigung verweigert',
        description:
          'Bitte aktivieren Sie Benachrichtigungen in den Browsereinstellungen.',
        variant: 'destructive',
      });
    }
  };

  const handleGlobalToggle = async (enabled: boolean) => {
    if (!settings) return;

    if (enabled && permissionStatus !== 'granted') {
      await requestPermission();
      if (notificationService.getPermissionStatus() !== 'granted') {
        return;
      }
    }

    const updatedSettings = { ...settings, enabled };
    await saveNotificationSettings(updatedSettings);
    setSettings(updatedSettings);

    if (enabled) {
      await notificationService.rescheduleNotificationsForSettings(settings.id);
      toast({
        title: 'Benachrichtigungen aktiviert',
        description: 'Sie erhalten nun Erinnerungen zu den eingestellten Zeiten.',
      });
    } else {
      await notificationService.disableAllNotifications();
      toast({
        title: 'Benachrichtigungen deaktiviert',
        description: 'Sie erhalten keine Erinnerungen mehr.',
      });
    }
  };

  const handleTimeToggle = async (timeId: string, enabled: boolean) => {
    if (!settings) return;

    const updatedTimes = settings.times.map(t =>
      t.id === timeId ? { ...t, enabled } : t
    );

    const updatedSettings = { ...settings, times: updatedTimes };
    await saveNotificationSettings(updatedSettings);
    setSettings(updatedSettings);

    if (settings.enabled) {
      await notificationService.rescheduleNotificationsForSettings(settings.id);
    }

    toast({
      title: enabled ? 'Zeit aktiviert' : 'Zeit deaktiviert',
      description: `Benachrichtigung um ${
        settings.times.find(t => t.id === timeId)?.time
      } ${enabled ? 'aktiviert' : 'deaktiviert'}.`,
    });
  };

  const handleAddTime = async () => {
    if (!settings || !newTimeLabel || !newTimeValue) return;

    const newTime: NotificationTime = {
      id: `time-custom-${Date.now()}`,
      time: newTimeValue,
      enabled: true,
      label: newTimeLabel,
    };

    const updatedSettings = {
      ...settings,
      times: [...settings.times, newTime],
    };

    await saveNotificationSettings(updatedSettings);
    setSettings(updatedSettings);

    if (settings.enabled) {
      await notificationService.rescheduleNotificationsForSettings(settings.id);
    }

    toast({
      title: 'Zeit hinzugefugt',
      description: `Benachrichtigung um ${newTimeValue} hinzugefugt.`,
    });

    setNewTimeLabel('');
    setNewTimeValue('12:00');
    setShowAddTimeDialog(false);
  };

  const handleDeleteTime = async (timeId: string) => {
    if (!settings) return;

    const updatedTimes = settings.times.filter(t => t.id !== timeId);
    const updatedSettings = { ...settings, times: updatedTimes };

    await saveNotificationSettings(updatedSettings);
    setSettings(updatedSettings);

    if (settings.enabled) {
      await notificationService.rescheduleNotificationsForSettings(settings.id);
    }

    toast({
      title: 'Zeit entfernt',
      description: 'Benachrichtigungszeit wurde entfernt.',
    });
  };

  const handleTestNotification = async () => {
    if (permissionStatus !== 'granted') {
      await requestPermission();
      if (notificationService.getPermissionStatus() !== 'granted') {
        return;
      }
    }

    await notificationService.testNotification();
    toast({
      title: 'Test-Benachrichtigung gesendet',
      description: 'Prufen Sie, ob die Benachrichtigung angezeigt wird.',
    });
  };

  if (isLoading) {
    return <div className="text-center py-4">Laden...</div>;
  }

  if (!settings) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Keine Einstellungen verfugbar. Bitte fugen Sie zuerst eine Wohnung hinzu.
      </div>
    );
  }

  if (permissionStatus === 'unsupported') {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Benachrichtigungen werden von Ihrem Browser nicht unterstutzt.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {settings.enabled ? (
              <Bell className="w-5 h-5 text-primary" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
            <p className="text-sm font-medium">Erinnerungen aktivieren</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Erhalten Sie Benachrichtigungen zu den konfigurierten Zeiten.
          </p>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={handleGlobalToggle}
          disabled={permissionStatus === 'denied'}
        />
      </div>

      {permissionStatus === 'denied' && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
          Benachrichtigungen wurden blockiert. Bitte aktivieren Sie diese in den
          Browsereinstellungen.
        </div>
      )}

      {permissionStatus === 'default' && (
        <div className="bg-muted text-muted-foreground text-sm p-3 rounded-lg">
          Klicken Sie auf den Schalter, um Benachrichtigungen zu aktivieren.
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Benachrichtigungszeiten</h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddTimeDialog(true)}
            disabled={!settings.enabled}
          >
            <Plus className="w-4 h-4 mr-2" />
            Zeit hinzufugen
          </Button>
        </div>

        <div className="space-y-2">
          {settings.times.map(time => (
            <div
              key={time.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1">
                <Switch
                  checked={time.enabled}
                  onCheckedChange={enabled => handleTimeToggle(time.id, enabled)}
                  disabled={!settings.enabled}
                />
                <div>
                  <p className="font-medium">{time.label}</p>
                  <p className="text-sm text-muted-foreground">{time.time} Uhr</p>
                </div>
              </div>
              {time.id.startsWith('time-custom') && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDeleteTime(time.id)}
                  disabled={!settings.enabled}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={handleTestNotification}
          className="w-full"
        >
          <TestTube className="w-4 h-4 mr-2" />
          Test-Benachrichtigung senden
        </Button>
      </div>

      <AlertDialog open={showAddTimeDialog} onOpenChange={setShowAddTimeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Neue Benachrichtigungszeit</AlertDialogTitle>
            <AlertDialogDescription>
              Fugen Sie eine benutzerdefinierte Benachrichtigungszeit hinzu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="time-label">Bezeichnung</Label>
              <Input
                id="time-label"
                placeholder="z.B. Vormittags"
                value={newTimeLabel}
                onChange={e => setNewTimeLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time-value">Uhrzeit</Label>
              <Input
                id="time-value"
                type="time"
                value={newTimeValue}
                onChange={e => setNewTimeValue(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddTime}>Hinzufugen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
