import { useEffect } from "react";
import { Gift } from "lucide-react";

interface DonationCelebrationProps {
  isVisible: boolean;
  amount: number;
  message: string;
}

export default function DonationCelebration({ 
  isVisible, 
  amount, 
  message 
}: DonationCelebrationProps) {
  // For accessibility, hide from screen readers when not visible
  useEffect(() => {
    const celebrationElement = document.getElementById('donation-celebration');
    if (celebrationElement) {
      celebrationElement.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
    }
  }, [isVisible]);
  
  if (!isVisible) return null;
  
  return (
    <div 
      id="donation-celebration" 
      className="fixed inset-0 pointer-events-none flex items-center justify-center z-40"
      aria-live="polite"
    >
      <div className="donation-animation bg-gold bg-opacity-20 backdrop-blur-sm p-6 rounded-lg border-2 border-gold max-w-lg w-full text-center">
        <Gift className="h-12 w-12 text-gold mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gold mb-2">
          Thank you for your ${amount} donation!
        </h2>
        <p className="text-white text-lg">
          {message || 'Your support helps keep the stream going!'}
        </p>
      </div>
    </div>
  );
}
