export interface Question {
  id: number;
  content: string;
  hint: string;
  category: 'shallow' | 'medium' | 'deep' | 'life';
}

export const questions: Question[] = [
  // 浅层 (1-12)
  { id: 1, content: '如果可以邀请世界上任何人共进晚餐，你会选谁？', hint: '可以是任何人，活着的或已故的...', category: 'shallow' },
  { id: 2, content: '你想出名吗？以什么方式出名？', hint: '名声可以有很多种形式...', category: 'shallow' },
  { id: 3, content: '打电话之前，你会先排练要说的话吗？为什么？', hint: '有些人喜欢即兴，有些人喜欢准备...', category: 'shallow' },
  { id: 4, content: '对你来说，什么是「完美的一天」？', hint: '从早到晚，你的完美一天会是怎样的...', category: 'shallow' },
  { id: 5, content: '你上一次独自唱歌是什么时候？上一次对别人唱歌呢？', hint: '唱歌有时是一种表达情绪的方式...', category: 'shallow' },
  { id: 6, content: '如果你能活到90岁，你希望后60年一直保持30岁的头脑还是30岁的身体？', hint: '这是一个关于你更看重什么的问题...', category: 'shallow' },
  { id: 7, content: '你有没有预感自己会怎样离世？', hint: '这个话题也许沉重，但每个人都有自己的想法...', category: 'shallow' },
  { id: 8, content: '说出三件你和理想伴侣可能有共同点的事情。', hint: '兴趣、习惯、价值观...', category: 'shallow' },
  { id: 9, content: '你人生中最感恩的是什么？', hint: '可以是某个人、某件事、某段经历...', category: 'shallow' },
  { id: 10, content: '如果你能改变你的成长过程中的任何一件事，那会是什么？', hint: '每个人的成长都有遗憾...', category: 'shallow' },
  { id: 11, content: '用四分钟时间，尽可能详细地讲述你的人生故事。', hint: '从你的出生地开始，到现在的你...', category: 'shallow' },
  { id: 12, content: '如果你明天一早醒来就能拥有某种能力或特质，你希望那是什么？', hint: '可以是任何超能力或者性格特质...', category: 'shallow' },

  // 中层 (13-24)
  { id: 13, content: '如果有一个水晶球能告诉你关于自己、人生、未来或其他任何事的真相，你想知道什么？', hint: '你最想知道哪个答案...', category: 'medium' },
  { id: 14, content: '有没有什么事是你梦想很久了但还没去做的？为什么没做？', hint: '梦想有时候只差一个开始...', category: 'medium' },
  { id: 15, content: '你人生中最大的成就是什么？', hint: '不一定是世俗意义上的成功...', category: 'medium' },
  { id: 16, content: '在一段友谊中，你最看重什么？', hint: '忠诚、理解、陪伴、共同成长...', category: 'medium' },
  { id: 17, content: '你最珍贵的记忆是什么？', hint: '闭上眼睛，第一个浮现的画面...', category: 'medium' },
  { id: 18, content: '你最糟糕的记忆是什么？', hint: '有些记忆虽然痛苦，但塑造了今天的你...', category: 'medium' },
  { id: 19, content: '如果你知道自己一年后会突然离世，你会改变现在的生活方式吗？为什么？', hint: '生命的有限会如何改变你的选择...', category: 'medium' },
  { id: 20, content: '友谊对你来说意味着什么？', hint: '每个人对友谊的定义都不一样...', category: 'medium' },
  { id: 21, content: '爱和感情在你的生活中扮演什么角色？', hint: '爱可以有很多种形式...', category: 'medium' },
  { id: 22, content: '分享你认为理想伴侣应该有的五个优点。', hint: '你最看重对方的什么特质...', category: 'medium' },
  { id: 23, content: '你的家庭关系亲密温暖吗？你觉得你的童年比大多数人幸福吗？', hint: '家庭塑造了我们最初的世界观...', category: 'medium' },
  { id: 24, content: '你和母亲的关系怎么样？', hint: '这段关系往往影响我们对亲密关系的理解...', category: 'medium' },

  // 深层 (25-36)
  { id: 25, content: '用「我们」造三个陈述句，描述你理想中两个人在一起的状态。', hint: '比如「我们都喜欢安静的周末」...', category: 'deep' },
  { id: 26, content: '补充这句话：「我希望有人能和我分享……」', hint: '那些你一个人时最想有人陪伴的时刻...', category: 'deep' },
  { id: 27, content: '如果你要和对方成为亲密朋友，请分享对方需要知道的重要事情。', hint: '那些真正了解你的人都会知道的事...', category: 'deep' },
  { id: 28, content: '告诉对方你喜欢TA什么——要非常诚实，说一些你不会对刚认识的人说的话。', hint: '真诚的赞美是最好的礼物...', category: 'deep' },
  { id: 29, content: '分享你人生中一个尴尬的时刻。', hint: '那些让你脸红的瞬间，现在回想可能会笑...', category: 'deep' },
  { id: 30, content: '你上一次在别人面前哭是什么时候？自己一个人哭呢？', hint: '哭泣是一种勇敢的表达...', category: 'deep' },
  { id: 31, content: '你已经喜欢上对方的什么了？', hint: '第一印象中让你心动的细节...', category: 'deep' },
  { id: 32, content: '有什么事情是你觉得太严肃不能开玩笑的？', hint: '每个人都有自己的底线和边界...', category: 'deep' },
  { id: 33, content: '如果你今晚就会死去，没有机会跟任何人说话，你最后悔没有跟谁说什么？为什么一直没说？', hint: '那些藏在心底的话...', category: 'deep' },
  { id: 34, content: '你的家着火了，你抢救出了家人和宠物。你还有时间冲进去最后一次抢救一样东西，你会救什么？为什么？', hint: '那些对你有特殊意义的物品...', category: 'deep' },
  { id: 35, content: '你家里谁去世会让你最难过？为什么？', hint: '珍惜身边的人...', category: 'deep' },
  { id: 36, content: '分享一个你个人正在面对的问题，听听对方会给你什么建议。', hint: '有时候局外人的视角会带来新的启发...', category: 'deep' },

  // 生活场景 (37-52)
  { id: 37, content: '周末不加班的时候，你最喜欢做什么？', hint: '你的理想周末是什么样的...', category: 'life' },
  { id: 38, content: '你最近在读/看/玩什么？为什么吸引你？', hint: '可以是书、剧、电影、游戏...', category: 'life' },
  { id: 39, content: '你在深夜会思考什么问题？', hint: '那些安静时刻涌上心头的念头...', category: 'life' },
  { id: 40, content: '如果可以瞬间精通一个技能，你选什么？', hint: '乐器、语言、运动、烹饪...', category: 'life' },
  { id: 41, content: '旅行时你是详细规划派还是随心所欲派？说说你印象最深的一次旅行。', hint: '那些在路上的故事...', category: 'life' },
  { id: 42, content: '你有没有什么「奇怪但坚持很久」的小习惯？', hint: '每个人都有自己的小癖好...', category: 'life' },
  { id: 43, content: '你觉得什么是「有趣的灵魂」？', hint: '你被什么样的人所吸引...', category: 'life' },
  { id: 44, content: '如果你要开一家小店，会开什么店？', hint: '把爱好变成事业...', category: 'life' },
  { id: 45, content: '最近一次让你笑到停不下来的事情是什么？', hint: '快乐的记忆最值得分享...', category: 'life' },
  { id: 46, content: '你理想中周末的早上是什么样的？', hint: '从起床的那一刻开始描述...', category: 'life' },
  { id: 47, content: '你有没有过「如果当初那样做就好了」的遗憾？', hint: '遗憾有时候也是一种成长...', category: 'life' },
  { id: 48, content: '如果不考虑收入，你最想做什么工作？', hint: '那个让你眼睛发光的事情...', category: 'life' },
  { id: 49, content: '你怎么理解「安全感」这三个字？', hint: '每个人需要的安全感都不同...', category: 'life' },
  { id: 50, content: '有什么东西是你曾经很在意，现在已经放下了的？', hint: '成长就是不断放下的过程...', category: 'life' },
  { id: 51, content: '用一部电影或一首歌来形容你目前的人生状态。', hint: '有时候艺术比语言更能表达...', category: 'life' },
  { id: 52, content: '你觉得两个人在一起，最重要的是什么？', hint: '这或许是最简单也最难回答的问题...', category: 'life' },
];

export const BASE_CITIES = [
  '深圳', '北京', '上海', '广州', '成都', '武汉',
  '长沙', '重庆', '杭州', '西安', '厦门', '合肥',
] as const;

export type BaseCity = typeof BASE_CITIES[number];

export const AVATAR_COLORS = [
  { value: '#F4A261', name: '暖橙' },
  { value: '#E76F51', name: '珊瑚红' },
  { value: '#2A9D8F', name: '薄荷绿' },
  { value: '#264653', name: '深青' },
  { value: '#E9C46A', name: '奶金' },
  { value: '#A8DADC', name: '浅蓝' },
  { value: '#B5838D', name: '玫瑰棕' },
  { value: '#6D6875', name: '灰紫' },
  { value: '#9B8EC4', name: '薰衣草' },
] as const;
