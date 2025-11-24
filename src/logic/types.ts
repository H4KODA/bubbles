export interface User {
  user_id: number;
  created_at?: string; // Optional, for simulation
  source?: string; // 'link', 'playmarket', etc.
}

export interface Friendship {
  user_id: number;
  friend_id: number;
  created_at: string;
}

export interface TreeNode {
  user_id: number;
  source: string;
  color: string;
  children: TreeNode[];
  parent_id: number | null;
}
