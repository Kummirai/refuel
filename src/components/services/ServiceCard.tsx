// src/components/services/ServiceCard.tsx
import { Fuel, Smartphone, DollarSign, Car } from "lucide-react";

interface ServiceCardProps {
  title: string;
  icon: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function ServiceCard({
  title,
  icon,
  color,
  onClick,
  disabled,
}: ServiceCardProps) {
  const getIcon = () => {
    switch (title.toLowerCase()) {
      case "fuel":
        return <Fuel className="w-6 h-6 text-white" />;
      case "airtime":
        return <Smartphone className="w-6 h-6 text-white" />;
      case "cash":
        return <DollarSign className="w-6 h-6 text-white" />;
      case "car wash":
        return <Car className="w-6 h-6 text-white" />;
      default:
        return <span className="text-2xl">{icon}</span>;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-gradient-to-br ${color} rounded-2xl p-4 shadow-lg transform transition-all active:scale-95 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-2">{getIcon()}</div>
        <h3 className="text-white font-bold text-lg">{title}</h3>
        <p className="text-white/80 text-xs mt-1">
          {disabled ? "Verify to access" : "Tap to request"}
        </p>
      </div>
    </button>
  );
}
