// 由 supabase gen types 生成的精简版（手写以解锁早期开发）
export type AvatarColor = 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6' | 'c7' | 'c8';
export type Mood =
  | '开心' | '兴奋' | '有灵感' | '被治愈' | '想聊'
  | '摸鱼' | '发呆' | 'emo' | '加班' | '想吐槽';
export type ReplyMood =
  | '同感' | '抱抱' | '陪你' | '听着' | '打气' | '路过' | '冒泡' | '辛苦';

export interface UserRow {
  id: string;
  email: string;
  bottle_no: string;
  avatar_color: AvatarColor;
  created_at: string;
  banned_at: string | null;
}

export interface BottleRow {
  id: string;
  user_id: string;
  content: string;
  mood: Mood;
  created_at: string;
  status: 'active' | 'taken' | 'reported' | 'deleted';
  picked_by: string | null;
  picked_at: string | null;
}

export interface ConversationRow {
  id: string;
  bottle_id: string;
  user_a: string;
  user_b: string;
  status: 'active' | 'ended';
  created_at: string;
  ended_at: string | null;
  ended_by: string | null;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  reply_mood: ReplyMood | null;
  created_at: string;
}

export interface BlockRow {
  id: string;
  blocker: string;
  blocked: string;
  created_at: string;
}

export interface ReportRow {
  id: string;
  reporter: string;
  bottle_id: string | null;
  message_id: string | null;
  reason: 'harass' | 'sensitive' | 'porn' | 'spam' | 'leak' | 'other';
  created_at: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export interface QuotaRow {
  user_id: string;
  date: string;
  thrown: number;
  picked: number;
}

export interface Database {
  public: {
    Tables: {
      users: { Row: UserRow; Insert: Partial<UserRow> & { id: string; email: string }; Update: Partial<UserRow> };
      bottles: { Row: BottleRow; Insert: Omit<BottleRow, 'id' | 'created_at' | 'status' | 'picked_by' | 'picked_at'>; Update: Partial<BottleRow> };
      conversations: { Row: ConversationRow; Insert: Omit<ConversationRow, 'id' | 'created_at' | 'status' | 'ended_at' | 'ended_by'>; Update: Partial<ConversationRow> };
      messages: { Row: MessageRow; Insert: Omit<MessageRow, 'id' | 'created_at'>; Update: Partial<MessageRow> };
      blocks: { Row: BlockRow; Insert: Omit<BlockRow, 'id' | 'created_at'>; Update: never };
      reports: { Row: ReportRow; Insert: Omit<ReportRow, 'id' | 'created_at' | 'status'>; Update: Partial<ReportRow> };
      quotas: { Row: QuotaRow; Insert: QuotaRow; Update: Partial<QuotaRow> };
    };
  };
}
