export interface Claim {
  id: number;

  item: {
    id: number;
    title: string;
  };

  status:
    | 'PENDING'
    | 'ACCEPTED'
    | 'REJECTED'
    | 'COMPLETED';

  proofText: string;

  createdAt: string;
}