import { questions, type Question } from '../data/questions';

// ========== Types ==========
export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  password: string;
  gender: 'male' | 'female';
  baseCity: string;
  wechatId: string;
  avatarColor: string;
  prefGender: 'male' | 'female';
  prefBaseCities: string[];
  createdAt: string;
  dayCount: number;
}

export interface Answer {
  questionId: number;
  content: string;
  answeredDate: string;
}

export interface GuestCard {
  id: string;
  nickname: string;
  avatarColor: string;
  answers: { questionId: number; content: string }[];
  lightStatus: 'on' | 'off' | null;
  hasLitForYou?: boolean; // secret: this guest already lit for user (higher match chance)
}

export interface LightRecord {
  id: string;
  fromUser: { nickname: string; avatarColor: string; answers: { questionId: number; content: string }[] };
  status: 'pending' | 'matched' | 'ignored' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface MatchRecord {
  id: string;
  user: { nickname: string; avatarColor: string };
  wechatId: string;
  matchedAt: string;
}

// ========== State ==========
export type AppPhase =
  | 'landing'
  | 'sorry'
  | 'onboarding'
  | 'verify'
  | 'verify-sent'
  | 'register-info'
  | 'register-pref'
  | 'welcome'
  | 'login'
  | 'daily-questions'
  | 'daily-guests'
  | 'daily-complete'
  | 'match-success'
  | 'profile'
  | 'notifications'
  | 'notification-detail'
  | 'admin';

// ========== Mock Data Generator ==========
const MOCK_NICKNAMES = ['星河', '晚风', '橘子海', '白噪音', '云朵', '鲸落', '山茶', '微光', 'Cosmos', 'Echo', 'Luna', 'Atlas', 'Nova', '浮生', '清欢'];
const MOCK_COLORS = ['#F4A261', '#E76F51', '#2A9D8F', '#264653', '#E9C46A', '#A8DADC', '#B5838D', '#6D6875'];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const MOCK_ANSWERS_POOL: Record<number, string[]> = {
  1: [
    '我会选苏格拉底，想听他亲口说那些哲学问题',
    '选我已经去世的爷爷，他走的时候我还小，很多事来不及问',
    '可能是 Elon Musk，想聊聊他的火星计划到底靠不靠谱',
    '我妈吧，虽然经常见，但从没认真坐下来吃过一顿饭',
    '村上春树，想问他那些故事里的人最后都怎么样了',
  ],
  2: [
    '不太想出名，我享受安静的生活',
    '想做一个被少数人深深记住的作家',
    '如果出名的话，希望是因为做了对社会有用的事',
    '出名太累了，做个快乐的普通人不好吗',
    '想以音乐出名，但只是想想而已哈哈',
  ],
  3: [
    '一定会排练！不排练会紧张到结巴',
    '完全不会，即兴发挥选手，排练了反而不自然',
    '要看打给谁，如果是很重要的人会先在脑子里过一遍',
    '我甚至会写一个提纲放在旁边看着打...',
    '以前会，后来发现打电话的机会越来越少了，都发微信了',
  ],
  4: [
    '睡到自然醒，阳光照进来，慢慢做个早餐，下午去爬山',
    '和喜欢的人在海边走一整天，什么都不想，只看日落',
    '早起跑步，然后在咖啡馆写代码写一天，效率超高的那种',
    '完美的一天大概是：什么事都不做，也不觉得焦虑',
    '和朋友们去露营，白天划船晚上烧烤看星星',
  ],
  5: [
    '上周洗澡的时候唱了！对别人唱…大概是KTV三年前',
    '昨天开车的时候就唱了，对别人唱歌？从来不敢',
    '我几乎每天都在唱，耳机一戴就是我的演唱会',
    '好像很久没唱歌了，突然有点想去KTV',
    '经常自己哼，但很少对别人唱，觉得不好意思',
  ],
  9: [
    '感恩我的家人，一直无条件支持我',
    '感恩大学时遇到的那群朋友，让我变得开朗了很多',
    '最感恩的是自己还算健康，可以追求想做的事',
    '感恩每一个低谷后的反弹，让我知道自己比想象中坚强',
    '感恩能在这个时代活着，有太多可能性了',
  ],
  12: [
    '希望拥有超强的记忆力，什么都记得住',
    '想要永远不焦虑的能力，纯粹的inner peace',
    '想瞬间精通所有语言，可以和全世界的人交流',
    '我想要读心术，太好奇别人在想什么了',
    '想要时间管理的能力，总觉得时间不够用',
  ],
  37: [
    '最喜欢去咖啡馆待着，看书或者发呆',
    '约朋友吃饭然后逛街，社交充电型选手',
    '周末必须运动！跑步或者打羽毛球',
    '在家看剧打游戏，宅到地老天荒',
    '去公园遛弯，或者找个新的餐厅探店',
  ],
  38: [
    '最近在看《百年孤独》，每次读都有新感受',
    '在追一个冷门播客，讲宇宙和哲学的',
    '沉迷原神，开放世界太治愈了',
    '在学吉他，目前只会三个和弦哈哈',
    '在看《繁花》，上海话太有味道了',
  ],
  43: [
    '有趣的灵魂是对世界永远保持好奇心的人',
    '能在日常中发现乐趣的人，不需要多有钱多聪明',
    '可以认真也可以搞怪，切换自如的人',
    '有自己坚持的爱好，并且能讲得很生动的人',
    '不随波逐流，有自己思考和判断的人',
  ],
  52: [
    '尊重。一切好的关系都建立在尊重之上',
    '沟通，两个人愿意说出来而不是冷战',
    '节奏合拍，不需要完全一样但要互相适应',
    '信任和安全感，让彼此都能做自己',
    '开心吧，如果在一起不开心那在一起干嘛',
  ],
};

function getMockAnswer(questionId: number): string {
  const pool = MOCK_ANSWERS_POOL[questionId];
  if (pool) return pool[randomBetween(0, pool.length - 1)];
  // Fallback generic answers
  const generic = [
    '这是一个很有意思的问题，让我想了很久...',
    '说实话，我从来没认真思考过，但如果非要回答...',
    '这个问题我和朋友聊过，我觉得...',
    '每个人可能都有不同的答案吧，我的想法是...',
    '哈哈这个问题好难回答，但是我会说...',
  ];
  return generic[randomBetween(0, generic.length - 1)];
}

export function generateMockGuests(questionIds: number[], count: number = 5): GuestCard[] {
  const usedNames = new Set<string>();
  const guests: GuestCard[] = [];
  // Randomly 1-2 guests have "already lit for you" (prioritized)
  const priorityCount = randomBetween(0, Math.min(2, count));
  
  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      name = MOCK_NICKNAMES[randomBetween(0, MOCK_NICKNAMES.length - 1)];
    } while (usedNames.has(name));
    usedNames.add(name);
    
    guests.push({
      id: `guest-${Date.now()}-${i}`,
      nickname: name,
      avatarColor: MOCK_COLORS[randomBetween(0, MOCK_COLORS.length - 1)],
      answers: questionIds.map(qId => ({
        questionId: qId,
        content: getMockAnswer(qId),
      })),
      lightStatus: 'on',
      hasLitForYou: i < priorityCount, // secret flag: this guest already lit for user
    });
  }
  return guests;
}

export function generateMockLightNotifications(): LightRecord[] {
  const names = pickRandom(MOCK_NICKNAMES, 3);
  const now = new Date();
  return names.map((name, i) => {
    const created = new Date(now.getTime() - randomBetween(1, 5) * 86400000);
    const expires = new Date(created.getTime() + 7 * 86400000);
    const sampleQIds = pickRandom([1, 4, 9, 12, 37, 38, 43, 52], 4);
    return {
      id: `light-${i}`,
      fromUser: {
        nickname: name,
        avatarColor: MOCK_COLORS[randomBetween(0, MOCK_COLORS.length - 1)],
        answers: sampleQIds.map(qId => ({ questionId: qId, content: getMockAnswer(qId) })),
      },
      status: 'pending' as const,
      createdAt: created.toISOString(),
      expiresAt: expires.toISOString(),
    };
  });
}

export function generateMockMatches(): MatchRecord[] {
  return [
    {
      id: 'match-1',
      user: { nickname: '晚安曲', avatarColor: '#B5838D' },
      wechatId: 'wanAnQu_2026',
      matchedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ];
}

export function getTodayQuestions(answeredIds: number[]): Question[] {
  const unanswered = questions.filter(q => !answeredIds.includes(q.id));
  
  if (unanswered.length >= 4) {
    // Try to get one from each category
    const categories: Array<Question['category']> = ['shallow', 'medium', 'deep', 'life'];
    const selected: Question[] = [];
    
    for (const cat of categories) {
      const pool = unanswered.filter(q => q.category === cat && !selected.includes(q));
      if (pool.length > 0) {
        selected.push(pool[randomBetween(0, pool.length - 1)]);
      }
    }
    
    // Fill remaining slots
    while (selected.length < 4) {
      const remaining = unanswered.filter(q => !selected.includes(q));
      if (remaining.length === 0) break;
      selected.push(remaining[randomBetween(0, remaining.length - 1)]);
    }
    
    return selected;
  }
  
  // All answered, pick random 4
  return pickRandom(questions, 4);
}
