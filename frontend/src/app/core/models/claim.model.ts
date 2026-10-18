export type ClaimStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
export type ItemType = 'LOST' | 'FOUND';
export type ItemStatus = 'ACTIVE' | 'CLAIMED' | 'RETURNED' | 'CLOSED';

export interface ClaimItem {
  id: number;
  title: string;
  type: ItemType;
  status: ItemStatus;
  verificationQuestion?: string | null;
}

export interface Claim {
  id: number;
  item: {
    id: number;
    title: string;
    type: ItemType;
    status: ItemStatus;
    verificationQuestion?: string | null;
  };
  status: ClaimStatus;
  proofText: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface ReceivedClaim extends Claim {
  answer?: string | null;
  claimant: {
    id: number;
    name: string;
    email: string;
  };
}
