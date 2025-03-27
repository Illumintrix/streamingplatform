import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { type ClientUser } from "@shared/schema";

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamId: number;
  streamer?: ClientUser;
  userId: number;
  onDonationComplete: (amount: number, message: string) => void;
}

export default function DonationModal({
  isOpen,
  onClose,
  streamId,
  streamer,
  userId,
  onDonationComplete
}: DonationModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedAmount(null);
      setCustomAmount('');
      setMessage('');
      setShowCustomAmount(false);
    }
  }, [isOpen]);
  
  // Donation amounts
  const donationAmounts = [5, 10, 20, 50, 100];
  
  const handleAmountSelect = (amount: number | 'custom') => {
    if (amount === 'custom') {
      setShowCustomAmount(true);
      setSelectedAmount(null);
    } else {
      setShowCustomAmount(false);
      setSelectedAmount(amount);
    }
  };
  
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);
    if (value && !isNaN(Number(value))) {
      setSelectedAmount(Number(value));
    } else {
      setSelectedAmount(null);
    }
  };
  
  // Donation mutation
  const donation = useMutation({
    mutationFn: async ({ streamId, userId, amount, message }: { 
      streamId: number;
      userId: number;
      amount: number;
      message: string;
    }) => {
      const res = await apiRequest("POST", `/api/streams/${streamId}/donations`, {
        userId,
        amount,
        message
      });
      return res.json();
    },
    onSuccess: () => {
      const finalAmount = selectedAmount || 0;
      onDonationComplete(finalAmount, message);
    }
  });
  
  const handleDonate = () => {
    if (!selectedAmount) return;
    
    donation.mutate({
      streamId,
      userId,
      amount: selectedAmount,
      message
    });
  };
  
  // Preview text
  const previewAmount = selectedAmount || 0;
  const previewText = `You donated $${previewAmount}!`;
  const previewMessage = message || 'Your message will appear here.';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-darkgray text-light sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-light">Support the Streamer</DialogTitle>
          <Button 
            variant="ghost" 
            className="absolute top-3 right-3 text-gray-400 hover:text-white" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <DialogDescription>
          <p className="text-gray-300 mb-4">
            Choose an amount to donate to {streamer?.displayName || 'the streamer'}:
          </p>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            {donationAmounts.map(amount => (
              <Button
                key={amount}
                type="button"
                variant={selectedAmount === amount ? "default" : "secondary"}
                className={selectedAmount === amount ? "bg-primary" : "bg-secondary hover:bg-primary"}
                onClick={() => handleAmountSelect(amount)}
              >
                ${amount}
              </Button>
            ))}
            <Button
              type="button"
              variant={showCustomAmount ? "default" : "secondary"}
              className={showCustomAmount ? "bg-primary" : "bg-secondary hover:bg-primary"}
              onClick={() => handleAmountSelect('custom')}
            >
              Custom
            </Button>
          </div>
          
          {showCustomAmount && (
            <div className="mb-4">
              <Label htmlFor="custom-amount" className="block text-sm text-gray-300 mb-1">
                Enter custom amount:
              </Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-secondary border border-r-0 border-lightgray rounded-l-md text-gray-300">
                  $
                </span>
                <Input
                  id="custom-amount"
                  type="number"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  className="bg-secondary border border-lightgray rounded-r-md py-2 px-3 text-light text-sm focus:outline-none focus:ring-1 focus:ring-primary flex-grow"
                />
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <Label htmlFor="donation-message" className="block text-sm text-gray-300 mb-1">
              Add a message (optional):
            </Label>
            <Textarea
              id="donation-message"
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-secondary border border-lightgray rounded-md py-2 px-3 text-light text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Say something nice..."
            />
          </div>
          
          <div className="bg-secondary rounded-md p-3 mb-4">
            <h3 className="font-medium text-light mb-2">Donation will appear as:</h3>
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage 
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" 
                  alt="Your avatar" 
                />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-gold font-bold">{previewText}</div>
                <p className="text-light text-sm">{previewMessage}</p>
              </div>
            </div>
          </div>
        </DialogDescription>
        
        <DialogFooter className="flex justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-accent hover:bg-teal-600 text-white"
            disabled={!selectedAmount || selectedAmount <= 0 || donation.isPending}
            onClick={handleDonate}
          >
            {donation.isPending ? 'Processing...' : 'Donate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
