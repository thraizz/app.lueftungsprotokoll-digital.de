import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VentilationRecommendation as Recommendation } from "@/lib/ventilation-recommendations";
import { AlertCircle, AlertTriangle, CheckCircle, ChevronDown, Info, Wind } from "lucide-react";
import { useState } from "react";

interface VentilationRecommendationCardProps {
  recommendation: Recommendation;
  onAction?: () => void;
  actionLabel?: string;
  showDINInfo?: boolean;
}

export const VentilationRecommendationCard = ({
  recommendation,
  onAction,
  actionLabel = "Jetzt lüften",
  showDINInfo = false,
}: VentilationRecommendationCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getUrgencyIcon = () => {
    switch (recommendation.urgency) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
  };

  const getUrgencyColor = () => {
    switch (recommendation.urgency) {
      case "critical":
        return "border-destructive";
      case "warning":
        return "border-yellow-500";
      default:
        return "border-green-500";
    }
  };

  return (
    <Card className={`${getUrgencyColor()} border-l-4`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            {getUrgencyIcon()}
            <div>
              <CardTitle className="text-lg">Lüftungsempfehlung</CardTitle>
              <CardDescription className="mt-1">{recommendation.message}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="cursor-help">
                  <Wind className="h-3 w-3 mr-1" />
                  {recommendation.ventilationType}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium mb-1">{recommendation.ventilationType}</p>
                {recommendation.ventilationType === "Stoßlüften" && (
                  <p className="text-sm">
                    Fenster komplett öffnen für kurze Zeit. Effizient und energiesparend.
                  </p>
                )}
                {recommendation.ventilationType === "Querlüften" && (
                  <p className="text-sm">
                    Gegenüberliegende Fenster öffnen für optimalen Luftaustausch.
                  </p>
                )}
                {recommendation.ventilationType === "Kipplüften" && (
                  <p className="text-sm">
                    Fenster auf Kipp stellen. Weniger effizient, höherer Energieverlust.
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Badge variant="outline">{recommendation.duration} Minuten</Badge>
          <Badge variant="outline">{recommendation.frequency}x täglich</Badge>
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              <Info className="h-4 w-4 mr-2" />
              {isOpen ? "Weniger Details" : "Mehr Details"}
              <ChevronDown
                className={`h-4 w-4 ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <div className="text-sm space-y-1">
              <p className="font-medium">Begründung:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {recommendation.reasoning.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>

            {showDINInfo && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                <p className="font-medium mb-1">DIN 1946-6 Konformität</p>
                <p>
                  Diese Empfehlungen basieren auf DIN 1946-6 (Lüftung von Wohnungen) und
                  allgemeinen Richtlinien zur Vermeidung von Feuchteschäden.
                </p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {onAction && (
          <Button onClick={onAction} className="w-full" variant={recommendation.urgency === "critical" ? "destructive" : "default"}>
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

interface HumidityIndicatorProps {
  humidity: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export const HumidityIndicator = ({
  humidity,
  showLabel = true,
  size = "md",
}: HumidityIndicatorProps) => {
  const getColor = () => {
    if (humidity > 70) return "text-destructive bg-destructive/10 border-destructive";
    if (humidity > 60) return "text-yellow-600 bg-yellow-50 border-yellow-500";
    return "text-green-600 bg-green-50 border-green-500";
  };

  const getIcon = () => {
    if (humidity > 70) return <AlertCircle className="h-4 w-4" />;
    if (humidity > 60) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getLabel = () => {
    if (humidity > 70) return "Kritisch";
    if (humidity > 60) return "Grenzwertig";
    return "Normal";
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-md border ${getColor()} ${sizeClasses[size]}`}>
      {getIcon()}
      <span className="font-medium">{humidity}%</span>
      {showLabel && <span className="text-xs opacity-80">({getLabel()})</span>}
    </div>
  );
};

interface CriticalAlertProps {
  humidity: number;
  temp?: number;
  onAction?: () => void;
}

export const CriticalAlert = ({ humidity, temp, onAction }: CriticalAlertProps) => {
  const alert = humidity > 60 ? {
    level: humidity > 70 ? "critical" as const : "warning" as const,
    title: humidity > 70 ? "WARNUNG: Kritische Luftfeuchtigkeit!" : "Erhöhte Luftfeuchtigkeit",
    message: humidity > 70
      ? `Luftfeuchtigkeit bei ${humidity}% - Akute Schimmelgefahr!`
      : `Luftfeuchtigkeit bei ${humidity}% liegt im Grenzbereich.`,
    action: humidity > 70
      ? "Sofort 15-20 Min Querlüften und regelmäßig wiederholen"
      : "Längeres Lüften empfohlen (15 Min)",
  } : null;

  if (!alert) return null;

  return (
    <Alert variant={alert.level === "critical" ? "destructive" : "default"} className={alert.level === "warning" ? "border-yellow-500 text-yellow-900" : ""}>
      {alert.level === "critical" ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <AlertTriangle className="h-4 w-4" />
      )}
      <AlertTitle>{alert.title}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{alert.message}</p>
        <p className="font-medium">{alert.action}</p>
        {onAction && (
          <Button
            onClick={onAction}
            size="sm"
            variant={alert.level === "critical" ? "destructive" : "default"}
            className="mt-2"
          >
            Jetzt lüften
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
