-- =============================================
-- seed-004 · 全自动种子瓶投放系统
-- =============================================
-- 前提：seed-001/002/003 已应用 + 8 个种子账号都已建好
-- 机制：
--   1) seed_bottle_queue 存 240 条预排好的瓶子（day_idx 0-9 / slot_idx 0-2 / identity / content / mood）
--   2) 启动时调 seed_auto_start(start_at) 设置基准时间（默认明早 0 点）
--   3) pg_cron 每 10 分钟跑 seed_auto_dispatch_due()：把"应扔时间 <= now 且未扔"的瓶子全部 INSERT 到 bottles
--   4) 10 天 240 条扔完自动停（队列空了 dispatch 不做事）
--   5) 任何时候可调 seed_auto_pause()/seed_auto_resume()/seed_auto_status()
-- =============================================

-- 0) 启用 pg_cron（如已启用会跳过）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1) 队列表
CREATE TABLE IF NOT EXISTS public.seed_bottle_queue (
  id bigserial PRIMARY KEY,
  day_idx int NOT NULL,                  -- 第几天（0 = 启动当天 / 1 = 明天 ...）
  slot_time time NOT NULL,               -- 时段的"基准时间"（如 09:00）
  jitter interval NOT NULL,              -- ±15 分钟的随机抖动
  identity_label text NOT NULL,          -- 'seed_accounts.label'
  content text NOT NULL,
  mood text NOT NULL,
  scheduled_at timestamptz,              -- 启动后计算出来的绝对时间
  dispatched_at timestamptz,             -- 已投放时刻
  bottle_id uuid,                        -- 实际写入的 bottle id
  error text                             -- 投放失败的错误
);

CREATE INDEX IF NOT EXISTS idx_queue_due ON public.seed_bottle_queue (scheduled_at) WHERE dispatched_at IS NULL;

-- 2) 配置表（只一行：基准时间 + 暂停开关）
CREATE TABLE IF NOT EXISTS public.seed_auto_config (
  id int PRIMARY KEY DEFAULT 1,
  base_at timestamptz,                   -- "day 0 的 0 点"基准
  paused boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  CHECK (id = 1)
);
INSERT INTO public.seed_auto_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 3) 清空旧队列，重新灌 240 条
TRUNCATE public.seed_bottle_queue;

INSERT INTO public.seed_bottle_queue (day_idx, slot_time, jitter, identity_label, content, mood) VALUES
  (0, '09:00'::time, INTERVAL '-354 seconds', '随想者', '想换个新发型，又怕第二天上班被组里的人围观', '想聊'),
  (0, '09:00'::time, INTERVAL '-574 seconds', '职场人', '我的工位最近多了一个小风扇，效率反而提升了', '想吐槽'),
  (0, '09:00'::time, INTERVAL '712 seconds', '感性派', '看到地铁广告里写「家是治愈一切的地方」，我笑了一下', '被治愈'),
  (0, '09:00'::time, INTERVAL '536 seconds', '乐天派', '谁说成年人的世界没有童话？我下午吃到了原味奥利奥就是', '开心'),
  (0, '09:00'::time, INTERVAL '-679 seconds', '文艺派', '上一次在地铁上看完一整本书是什么时候，已经想不起来了', '想聊'),
  (0, '09:00'::time, INTERVAL '-117 seconds', '焦虑党', '朋友问我下个月要不要一起出去玩，我居然查了三天日历才回', 'emo'),
  (0, '09:00'::time, INTERVAL '886 seconds', '旁观者', '财务那位姐姐每天 6 点准时下班，我一直挺羡慕她', '发呆'),
  (0, '09:00'::time, INTERVAL '-821 seconds', '浪漫派', '加班加到 11 点，路过公园听到有人在拉小提琴，整个人都安静了', '被治愈'),
  (0, '13:00'::time, INTERVAL '858 seconds', '随想者', '有时候觉得加班到很晚走出大楼那一刻，挺像放学的', '有灵感'),
  (0, '13:00'::time, INTERVAL '63 seconds', '职场人', '同组那个新来的小朋友比我更早下班，我酸了', '加班'),
  (0, '13:00'::time, INTERVAL '-445 seconds', '感性派', '一个人吃晚饭的时候特别想跟人说话，但又不知道找谁', 'emo'),
  (0, '13:00'::time, INTERVAL '-492 seconds', '乐天派', '在工位偷偷吃了一颗薄荷糖，假装这是我的下午茶', '被治愈'),
  (0, '13:00'::time, INTERVAL '772 seconds', '文艺派', '又重读了一遍《秋园》，每次翻到的句子都不一样', '想聊'),
  (0, '13:00'::time, INTERVAL '42 seconds', '焦虑党', '工作群里没人回我的时候，我会怀疑是不是我说错了什么', 'emo'),
  (0, '13:00'::time, INTERVAL '-184 seconds', '旁观者', '隔壁工位的人今天换了鼠标垫，不知道是不是要换组的预兆', '有灵感'),
  (0, '13:00'::time, INTERVAL '-275 seconds', '浪漫派', '加班到很晚出门，发现夜里居然有点风，是夏天最好的部分', '开心'),
  (0, '21:30'::time, INTERVAL '780 seconds', '随想者', '坐电梯的时候盯着楼层数字看，会觉得时间好像变慢了', '发呆'),
  (0, '21:30'::time, INTERVAL '728 seconds', '职场人', '老板说「这个不急」，意味着他下周会问三次', '加班'),
  (0, '21:30'::time, INTERVAL '884 seconds', '感性派', '长大后才明白，「没事」这两个字真的是最难说的', '被治愈'),
  (0, '21:30'::time, INTERVAL '-434 seconds', '乐天派', '周三了！熬过这天就一切好起来！我先给自己加个油', '被治愈'),
  (0, '21:30'::time, INTERVAL '-444 seconds', '文艺派', '看《南京照相馆》之前以为自己撑得住，看完才发现没撑住', '想聊'),
  (0, '21:30'::time, INTERVAL '-852 seconds', '焦虑党', '想转岗，但写了三页 pros and cons 之后还是没动', '想聊'),
  (0, '21:30'::time, INTERVAL '451 seconds', '旁观者', '滨海大厦走廊里，凡是低头疾走又自言自语的，多半是产品', '摸鱼'),
  (0, '21:30'::time, INTERVAL '-505 seconds', '浪漫派', '今天太阳虽然大，但风一吹连衬衫的褶皱都很温柔', '开心'),
  (1, '09:00'::time, INTERVAL '-84 seconds', '随想者', '你们有没有发现一件事，emoji 用多了反而不会表达情绪了', '发呆'),
  (1, '09:00'::time, INTERVAL '-228 seconds', '职场人', '周一早上的状态总让我怀疑自己周末是不是没睡过', '加班'),
  (1, '09:00'::time, INTERVAL '-330 seconds', '感性派', '上一次毫无理由地开心是什么时候，我已经想不起来了', '被治愈'),
  (1, '09:00'::time, INTERVAL '870 seconds', '乐天派', '给楼下保安大叔点了头，他笑得特别灿烂，今天就有动力了', '被治愈'),
  (1, '09:00'::time, INTERVAL '-758 seconds', '文艺派', '看了《我，许可》后跟我妈打了一个特别长的电话', '发呆'),
  (1, '09:00'::time, INTERVAL '683 seconds', '焦虑党', '体检前一周比体检后一周还焦虑', '想吐槽'),
  (1, '09:00'::time, INTERVAL '-329 seconds', '旁观者', '周五下午的工位空席率比周一早上高得多', '摸鱼'),
  (1, '09:00'::time, INTERVAL '-181 seconds', '浪漫派', '今天没空调的会议室里，居然有人带了纸扇，年代感扑面', '被治愈'),
  (1, '13:00'::time, INTERVAL '413 seconds', '随想者', '「下周再说」这句话我已经用了三个月', '想聊'),
  (1, '13:00'::time, INTERVAL '143 seconds', '职场人', '周会完了一身疲惫，谁来聊聊怎么搞需求优先级', '摸鱼'),
  (1, '13:00'::time, INTERVAL '-82 seconds', '感性派', '今天晚上的月亮特别大，我盯着看了很久很久', 'emo'),
  (1, '13:00'::time, INTERVAL '491 seconds', '乐天派', '今天的微风刚好把我吹回了大学', '开心'),
  (1, '13:00'::time, INTERVAL '827 seconds', '文艺派', '公司楼下那家书店要关门了，今天去抱了一摞书回来，心里挺不是滋味', '发呆'),
  (1, '13:00'::time, INTERVAL '198 seconds', '焦虑党', '我会因为一句话翻来覆去想三个晚上，对方可能根本没记得说过', '想聊'),
  (1, '13:00'::time, INTERVAL '-222 seconds', '旁观者', '同组那个新人今天换了第三次鼠标，他可能是个完美主义者', '有灵感'),
  (1, '13:00'::time, INTERVAL '-844 seconds', '浪漫派', '早上挤地铁的时候有人帮我扶住了门，今天就格外顺', '被治愈'),
  (1, '21:30'::time, INTERVAL '-664 seconds', '随想者', '今天突然意识到，我已经记不起刚入职那个夏天的感觉了', '有灵感'),
  (1, '21:30'::time, INTERVAL '896 seconds', '职场人', '项目复盘会最大的收获就是知道下次该怪谁', '摸鱼'),
  (1, '21:30'::time, INTERVAL '-366 seconds', '感性派', '长大之后哭都开始克制，怕第二天眼睛肿', '被治愈'),
  (1, '21:30'::time, INTERVAL '-535 seconds', '乐天派', '公司绿植角的多肉竟然开花了，我蹲下来看了半天', '被治愈'),
  (1, '21:30'::time, INTERVAL '289 seconds', '文艺派', '突然觉得 b 站读书博主推荐的书我都买了但都没读', '有灵感'),
  (1, '21:30'::time, INTERVAL '-357 seconds', '焦虑党', '别人随口的一句评价，我能琢磨一整周', '想聊'),
  (1, '21:30'::time, INTERVAL '-822 seconds', '旁观者', '老板今天说话语速比平时快 30%，估计有大事', '摸鱼'),
  (1, '21:30'::time, INTERVAL '-678 seconds', '浪漫派', '路过 711 顺手买了根光明冰砖，吃完心情就回血了', '开心'),
  (2, '09:00'::time, INTERVAL '321 seconds', '随想者', '公司茶水间的咖啡机其实没那么难喝，是我心情不好的时候喝什么都难喝', '有灵感'),
  (2, '09:00'::time, INTERVAL '-11 seconds', '职场人', '写完 OKR 之后觉得自己是个完美的人，写完周报又觉得啥也没干', '摸鱼'),
  (2, '09:00'::time, INTERVAL '-193 seconds', '感性派', '突然好想给一个很久没联系的人发消息，但想了半天还是没发', '被治愈'),
  (2, '09:00'::time, INTERVAL '592 seconds', '乐天派', '老板今天没找我，已经是巨大的胜利了', '兴奋'),
  (2, '09:00'::time, INTERVAL '710 seconds', '文艺派', '喜欢的书会反复读三遍以上，第一遍故事，第二遍人物，第三遍语言', '想聊'),
  (2, '09:00'::time, INTERVAL '-258 seconds', '焦虑党', '我朋友说她活得很轻松，我都不敢问她是怎么做到的', 'emo'),
  (2, '09:00'::time, INTERVAL '-7 seconds', '旁观者', '通勤地铁同一节车厢，永远是同一批面孔，没人打招呼', '摸鱼'),
  (2, '09:00'::time, INTERVAL '341 seconds', '浪漫派', '中午顶着大太阳出去吃饭，回到办公室那一阵冷气，太治愈了', '被治愈'),
  (2, '13:00'::time, INTERVAL '147 seconds', '随想者', '听同事讨论装修房子，我突然意识到大家真的在认真过生活', '有灵感'),
  (2, '13:00'::time, INTERVAL '-664 seconds', '职场人', '我手上有 5 个文档名都叫「最终版」', '想吐槽'),
  (2, '13:00'::time, INTERVAL '-112 seconds', '感性派', '我朋友说她要结婚了，我笑着说真好，挂电话之后发了好久呆', '想聊'),
  (2, '13:00'::time, INTERVAL '280 seconds', '乐天派', '今天工位的同事请我喝奶茶了！这种小幸福真的很救命', '兴奋'),
  (2, '13:00'::time, INTERVAL '-511 seconds', '文艺派', '昨天去深圳书城，发现纸质书的味道还是没变', '有灵感'),
  (2, '13:00'::time, INTERVAL '-379 seconds', '焦虑党', '同事不回我消息超过两小时我就开始脑补自己哪里得罪人了', 'emo'),
  (2, '13:00'::time, INTERVAL '-810 seconds', '旁观者', '园区门口的那个保安大叔记得我的工卡照片，比我自己看得还多', '摸鱼'),
  (2, '13:00'::time, INTERVAL '551 seconds', '浪漫派', '楼下那家咖啡店今天放了一首老歌，我多坐了 10 分钟', '开心'),
  (2, '21:30'::time, INTERVAL '-7 seconds', '随想者', '工位的绿植养死了第三盆，可能我就不该养任何活的东西', '发呆'),
  (2, '21:30'::time, INTERVAL '-897 seconds', '职场人', '今天的 drama：A 部门和 B 部门为了一行数据吵了 40 分钟', '摸鱼'),
  (2, '21:30'::time, INTERVAL '164 seconds', '感性派', '加班到很晚回家，路过桥的时候看了一会儿水', '被治愈'),
  (2, '21:30'::time, INTERVAL '751 seconds', '乐天派', '今天决定不再想太多，开心是最重要的', '被治愈'),
  (2, '21:30'::time, INTERVAL '202 seconds', '文艺派', '看完《给阿嬷的情书》出来的时候，整个影厅都没人说话', '发呆'),
  (2, '21:30'::time, INTERVAL '506 seconds', '焦虑党', '想离职的念头每周冒一次，又每周说服自己再撑一下', '想聊'),
  (2, '21:30'::time, INTERVAL '573 seconds', '旁观者', '食堂阿姨今天给我多打了一勺肉，可能是因为我穿了件新衣服', '发呆'),
  (2, '21:30'::time, INTERVAL '619 seconds', '浪漫派', '突然下雨了，同事递了一把伞过来，简单几个字，整天的疲惫都没了', '发呆'),
  (3, '09:00'::time, INTERVAL '609 seconds', '随想者', '路过会议室看到里面在用我做过的 PPT 模板，居然有点感动', '发呆'),
  (3, '09:00'::time, INTERVAL '473 seconds', '职场人', '在工位偷偷点了一杯瑞幸，果然瑞幸比奶茶治愈', '加班'),
  (3, '09:00'::time, INTERVAL '-497 seconds', '感性派', '有人说成年人的崩溃是悄无声息的，我觉得是真的', '想聊'),
  (3, '09:00'::time, INTERVAL '-155 seconds', '乐天派', '推荐！冷藏过的西红柿沾点白糖，夏天的快乐', '被治愈'),
  (3, '09:00'::time, INTERVAL '-17 seconds', '文艺派', '又看了一遍《再见爱人 4》的麦琳片段，开始自我审视', '发呆'),
  (3, '09:00'::time, INTERVAL '-757 seconds', '焦虑党', '有没有人也是必须把待办全划掉才能睡，但今天又划不完了', 'emo'),
  (3, '09:00'::time, INTERVAL '460 seconds', '旁观者', '食堂阿姨打饭的手速跟她对你的态度是成反比的', '摸鱼'),
  (3, '09:00'::time, INTERVAL '-224 seconds', '浪漫派', '园区里那只跑得飞快的小狗，是我每天通勤路上的彩蛋', '开心'),
  (3, '13:00'::time, INTERVAL '376 seconds', '随想者', '你们有没有那种一个想法明明很重要，但写下来之后就消失了的感觉', '有灵感'),
  (3, '13:00'::time, INTERVAL '-258 seconds', '职场人', '「同步一下」是这家公司最常用也最没意义的两个字', '想吐槽'),
  (3, '13:00'::time, INTERVAL '458 seconds', '感性派', '凌晨一点发现自己还在工位，外面下着雨，居然很安静', 'emo'),
  (3, '13:00'::time, INTERVAL '836 seconds', '乐天派', '谁说星期三不能给自己点个外卖犒劳一下，我现在就在点', '兴奋'),
  (3, '13:00'::time, INTERVAL '-645 seconds', '文艺派', '想找人推荐书，最近看的几本都没耐心读完', '发呆'),
  (3, '13:00'::time, INTERVAL '574 seconds', '焦虑党', '今天又因为发错一个表情包反思了 20 分钟', 'emo'),
  (3, '13:00'::time, INTERVAL '-285 seconds', '旁观者', '我们工位的打印机有自己的情绪，越急越卡纸', '摸鱼'),
  (3, '13:00'::time, INTERVAL '138 seconds', '浪漫派', '今晚月亮好亮，回家路上抬头看了三次', '发呆'),
  (3, '21:30'::time, INTERVAL '-267 seconds', '随想者', '总觉得每年六月份是一年里时间过最快的', '发呆'),
  (3, '21:30'::time, INTERVAL '465 seconds', '职场人', '我这周的最大成就是把 30 封邮件标记成已读', '想吐槽'),
  (3, '21:30'::time, INTERVAL '-64 seconds', '感性派', '那种「明明很多人但没人懂自己」的感觉，今晚又来了', '想聊'),
  (3, '21:30'::time, INTERVAL '-232 seconds', '乐天派', '摸鱼刷到这条的你，今天辛苦了，奖励自己一杯咖啡吧', '兴奋'),
  (3, '21:30'::time, INTERVAL '-76 seconds', '文艺派', '我觉得「文学性」这个词被用滥了，很多东西并没有那么深', '发呆'),
  (3, '21:30'::time, INTERVAL '527 seconds', '焦虑党', '今天买东西退货纠结了 40 分钟，最后还是没退', 'emo'),
  (3, '21:30'::time, INTERVAL '-295 seconds', '旁观者', '公司茶水间最近有人偷偷换了好喝的咖啡豆，没有人承认', '有灵感'),
  (3, '21:30'::time, INTERVAL '235 seconds', '浪漫派', '鹅厂便利店今天上了新口味的冰棒，我尝了一根，决定明天再来一根', '开心'),
  (4, '09:00'::time, INTERVAL '-640 seconds', '随想者', '我开始怀念以前那种没那么多群消息要回的日子', '发呆'),
  (4, '09:00'::time, INTERVAL '-508 seconds', '职场人', '老板问我「最近怎么样」，我永远说「都还好」', '想吐槽'),
  (4, '09:00'::time, INTERVAL '-39 seconds', '感性派', '深夜听歌总会想起一些事，不知道是不是只有我这样', '想聊'),
  (4, '09:00'::time, INTERVAL '461 seconds', '乐天派', '今天午休出去溜达发现路边开了家新的便利店，比上班还兴奋', '被治愈'),
  (4, '09:00'::time, INTERVAL '-124 seconds', '文艺派', '想找一首适合在深夜地铁上听的歌，纯粹的那种', '想聊'),
  (4, '09:00'::time, INTERVAL '487 seconds', '焦虑党', '我朋友说我太敏感，可是我已经很努力假装不在意了', '想聊'),
  (4, '09:00'::time, INTERVAL '632 seconds', '旁观者', '园区里抽烟区是信息流通最快的地方', '摸鱼'),
  (4, '09:00'::time, INTERVAL '-544 seconds', '浪漫派', '早上下电梯遇到一只狗，它对我摇尾巴，整天都好像变好了', '被治愈'),
  (4, '13:00'::time, INTERVAL '360 seconds', '随想者', '加班的好处大概就是公司报销的晚饭真的有肉', '有灵感'),
  (4, '13:00'::time, INTERVAL '265 seconds', '职场人', '一边喝着公司发的奶茶，一边回着「老板这个我马上改」', '加班'),
  (4, '13:00'::time, INTERVAL '-284 seconds', '感性派', '想换个工作，又怕换了之后还是一样', 'emo'),
  (4, '13:00'::time, INTERVAL '-69 seconds', '乐天派', '我决定从今天开始每天给自己写一句鼓励的话，今天的是「你已经很棒了」', '兴奋'),
  (4, '13:00'::time, INTERVAL '222 seconds', '文艺派', '最近在试着写日记，写到第三天就开始流水账了', '有灵感'),
  (4, '13:00'::time, INTERVAL '807 seconds', '焦虑党', '收到 HR 私聊的瞬间心跳加速，看完只是发问卷的时候松了一口气', 'emo'),
  (4, '13:00'::time, INTERVAL '-900 seconds', '旁观者', '食堂二楼的那张靠窗位置，几乎每天都被同一个人占着', '发呆'),
  (4, '13:00'::time, INTERVAL '-278 seconds', '浪漫派', '园区里有只野猫在草丛里睡午觉，我蹲了三分钟没敢吵它', '发呆'),
  (4, '21:30'::time, INTERVAL '-313 seconds', '随想者', '我一直分不清自己是真的喜欢这份工作，还是只是习惯了', '发呆'),
  (4, '21:30'::time, INTERVAL '-470 seconds', '职场人', '又一次在 9 点收到老板的微信：在吗', '加班'),
  (4, '21:30'::time, INTERVAL '-20 seconds', '感性派', '有时候觉得在这个城市待了这么久，还是有点孤单', '想聊'),
  (4, '21:30'::time, INTERVAL '709 seconds', '乐天派', '跟陌生人对了一下眼神，互相笑了笑，挺好的', '开心'),
  (4, '21:30'::time, INTERVAL '287 seconds', '文艺派', '重读双雪涛的短篇集，比电影厚得多', '发呆'),
  (4, '21:30'::time, INTERVAL '342 seconds', '焦虑党', '「再等等」是我最常用的自我安慰，也是最无效的', '想聊'),
  (4, '21:30'::time, INTERVAL '440 seconds', '旁观者', '同事桌上摆着的东西能反映他工作的紧绷程度', '发呆'),
  (4, '21:30'::time, INTERVAL '-241 seconds', '浪漫派', '今天的云特别像棉花糖，下班路上一直抬头看', '被治愈'),
  (5, '09:00'::time, INTERVAL '52 seconds', '随想者', '今天看到天上有飞机划过的痕迹，发了五分钟呆', '有灵感'),
  (5, '09:00'::time, INTERVAL '4 seconds', '职场人', '周五下午的需求评审，是这周最后的考验', '加班'),
  (5, '09:00'::time, INTERVAL '5 seconds', '感性派', '我一直以为自己已经放下了，结果今天看到一首歌还是哭了', 'emo'),
  (5, '09:00'::time, INTERVAL '483 seconds', '乐天派', '有时候快乐真的不需要太多，比如现在空调温度刚刚好', '开心'),
  (5, '09:00'::time, INTERVAL '-463 seconds', '文艺派', '一个人去看话剧的感觉很奇妙，像是参加了一场私人仪式', '有灵感'),
  (5, '09:00'::time, INTERVAL '146 seconds', '焦虑党', '焦虑到没办法做事的时候，我就开始整理桌面，至少有件事是受控的', 'emo'),
  (5, '09:00'::time, INTERVAL '69 seconds', '旁观者', '地铁上对面那个小哥从上车睡到下车，估计加了好几天班', '有灵感'),
  (5, '09:00'::time, INTERVAL '725 seconds', '浪漫派', '路过同事工位看到他养的小绿萝长出新叶子，跟着开心了一下', '发呆'),
  (5, '13:00'::time, INTERVAL '730 seconds', '随想者', '下雨天最适合发呆了，你们呢', '有灵感'),
  (5, '13:00'::time, INTERVAL '607 seconds', '职场人', '跨部门合作最难的不是做事，是搞清楚到底是谁拍板', '想吐槽'),
  (5, '13:00'::time, INTERVAL '-553 seconds', '感性派', '想着妈妈这周给我寄的水果，眼眶有点热', '被治愈'),
  (5, '13:00'::time, INTERVAL '449 seconds', '乐天派', '提醒看到这条的人：今天记得喝水，别吃太咸', '开心'),
  (5, '13:00'::time, INTERVAL '-727 seconds', '文艺派', '整理书架是我最喜欢的家务，没有之一', '发呆'),
  (5, '13:00'::time, INTERVAL '-319 seconds', '焦虑党', '每次打开企业微信都先深吸一口气', '想吐槽'),
  (5, '13:00'::time, INTERVAL '155 seconds', '旁观者', '我们组 leader 每次说「这个很简单」就意味着要做两周', '发呆'),
  (5, '13:00'::time, INTERVAL '459 seconds', '浪漫派', '上班路上看到一对老夫妻牵着手散步，今天就不焦虑了', '发呆'),
  (5, '21:30'::time, INTERVAL '396 seconds', '随想者', '今天午休跑下楼吹空气，发现外面比想象的热得多', '想聊'),
  (5, '21:30'::time, INTERVAL '368 seconds', '职场人', '上班八小时，开会三小时，回消息两小时，剩下三小时是真的在干活吗', '想吐槽'),
  (5, '21:30'::time, INTERVAL '-214 seconds', '感性派', '今天看到地铁里一个女生哭得很认真，没人去打扰她', '被治愈'),
  (5, '21:30'::time, INTERVAL '-709 seconds', '乐天派', '今天没什么特别的，但能好好吃饭好好睡觉就是好日子', '开心'),
  (5, '21:30'::time, INTERVAL '776 seconds', '文艺派', '突然很想念上学时大段大段读小说的下午', '有灵感'),
  (5, '21:30'::time, INTERVAL '638 seconds', '焦虑党', '有时候做完一个决定立刻就开始后悔，但下一次还是这样', 'emo'),
  (5, '21:30'::time, INTERVAL '-419 seconds', '旁观者', '鹅厂里的「老师」称呼传染性极强，我现在见谁都想叫老师', '发呆'),
  (5, '21:30'::time, INTERVAL '477 seconds', '浪漫派', '楼下绿豆汤摊位的阿姨今天送了我一勺多的料', '开心'),
  (6, '09:00'::time, INTERVAL '-265 seconds', '随想者', '今天发呆的时候想起小学同桌，我居然连她的全名都记不清了', '有灵感'),
  (6, '09:00'::time, INTERVAL '-440 seconds', '职场人', '突然想起来今天该交的东西还没交，但已经下班了', '摸鱼'),
  (6, '09:00'::time, INTERVAL '751 seconds', '感性派', '我一直在等一个人，但其实我已经忘了在等什么', '想聊'),
  (6, '09:00'::time, INTERVAL '-493 seconds', '乐天派', '今天的天气热得像被微波炉转过，但我心情还行', '兴奋'),
  (6, '09:00'::time, INTERVAL '-599 seconds', '文艺派', '我有个习惯，每次看完一本书会写一句话总结，最长不超过 20 字', '有灵感'),
  (6, '09:00'::time, INTERVAL '-850 seconds', '焦虑党', '老板发「？」我能盯着这个标点想十分钟', '想聊'),
  (6, '09:00'::time, INTERVAL '-806 seconds', '旁观者', '鹅厂楼下那家便利店的老板娘记得每个常客的口味', '摸鱼'),
  (6, '09:00'::time, INTERVAL '-399 seconds', '浪漫派', '今天下班看到了完整的晚霞，粉色那种，差点哭出来', '开心'),
  (6, '13:00'::time, INTERVAL '73 seconds', '随想者', '有时候坐在工位上半天，回过神来才发现刚刚走了三趟厕所', '发呆'),
  (6, '13:00'::time, INTERVAL '351 seconds', '职场人', '团建报名表发出来 24 小时了，没人填', '摸鱼'),
  (6, '13:00'::time, INTERVAL '840 seconds', '感性派', '想起小时候放学路上的那只小狗，不知道它后来怎么样了', '被治愈'),
  (6, '13:00'::time, INTERVAL '673 seconds', '乐天派', '早上洗澡的时候唱跑调了，但是声音很大很爽', '开心'),
  (6, '13:00'::time, INTERVAL '-751 seconds', '文艺派', '写不出东西的时候就抄一段喜欢的句子，假装自己也懂', '发呆'),
  (6, '13:00'::time, INTERVAL '32 seconds', '焦虑党', '「这个决定你不会后悔」是我最害怕的鼓励', 'emo'),
  (6, '13:00'::time, INTERVAL '-52 seconds', '旁观者', '食堂排队的时候发现，吃面的人普遍不爱说话', '摸鱼'),
  (6, '13:00'::time, INTERVAL '389 seconds', '浪漫派', '晚上 9 点出公司，发现风带着一点点凉意，是夏天最难得的瞬间', '开心'),
  (6, '21:30'::time, INTERVAL '278 seconds', '随想者', '你们点外卖会反复确认地址吗，我每次都怕送错', '想聊'),
  (6, '21:30'::time, INTERVAL '-502 seconds', '职场人', '同样的问题被三个不同的人问了三遍，我答得越来越敷衍', '加班'),
  (6, '21:30'::time, INTERVAL '571 seconds', '感性派', '今晚的风有点凉，让我突然想起家里', 'emo'),
  (6, '21:30'::time, INTERVAL '526 seconds', '乐天派', '今天给自己买了束花，五块钱，开心了一整天', '被治愈'),
  (6, '21:30'::time, INTERVAL '-114 seconds', '文艺派', '总有几本书你买回来很久都没翻，但放在书架上就觉得心安', '发呆'),
  (6, '21:30'::time, INTERVAL '112 seconds', '焦虑党', '凌晨三点，又开始反复回想白天那句话是不是说错了', '想聊'),
  (6, '21:30'::time, INTERVAL '-82 seconds', '旁观者', '园区里那只橘猫又胖了，应该是被太多人投喂了', '发呆'),
  (6, '21:30'::time, INTERVAL '-401 seconds', '浪漫派', '等地铁的时候听到旁边小朋友说「妈妈我们去吃西瓜」，会心一笑', '开心'),
  (7, '09:00'::time, INTERVAL '-598 seconds', '随想者', '同事说我看起来很冷静，其实我只是已经累得没表情了', '有灵感'),
  (7, '09:00'::time, INTERVAL '443 seconds', '职场人', '我加班的原因从来不是工作多，是白天没空干活', '想吐槽'),
  (7, '09:00'::time, INTERVAL '508 seconds', '感性派', '想买只猫，又怕自己照顾不好它', '被治愈'),
  (7, '09:00'::time, INTERVAL '-889 seconds', '乐天派', '早上来公司路上买了第一根冰淇淋，给夏天交了一份学费', '被治愈'),
  (7, '09:00'::time, INTERVAL '637 seconds', '文艺派', '项飙说「把自己作为方法」，我开始尝试每天写一段自己的事', '有灵感'),
  (7, '09:00'::time, INTERVAL '862 seconds', '焦虑党', '失眠到天快亮的时候，会有一种「干脆别睡了」的怪诡平静', '想聊'),
  (7, '09:00'::time, INTERVAL '677 seconds', '旁观者', '注意到一件小事：有些人按电梯总是要按好几次', '有灵感'),
  (7, '09:00'::time, INTERVAL '-682 seconds', '浪漫派', '周末窝在家吹空调看完一部老电影，是这个夏天最舒服的下午', '被治愈'),
  (7, '13:00'::time, INTERVAL '694 seconds', '随想者', '早高峰挤地铁的时候我都在想，到底是为什么要起这么早', '想聊'),
  (7, '13:00'::time, INTERVAL '-30 seconds', '职场人', '今天被拉了三个对齐会，一个结论都没对齐', '摸鱼'),
  (7, '13:00'::time, INTERVAL '-452 seconds', '感性派', '鹅厂大厦的灯光晚上看挺好看，但我每次抬头都有点想哭', 'emo'),
  (7, '13:00'::time, INTERVAL '-540 seconds', '乐天派', '突然想到，能在工位发呆也是一种幸福', '开心'),
  (7, '13:00'::time, INTERVAL '746 seconds', '文艺派', '最近开始抄诗，发现手写真的能让脑子安静下来', '想聊'),
  (7, '13:00'::time, INTERVAL '525 seconds', '焦虑党', '我知道焦虑没用，但「知道」和「不焦虑」之间有十万光年', 'emo'),
  (7, '13:00'::time, INTERVAL '160 seconds', '旁观者', '同事手机壳坏了一个月，他到现在还没换，应该是没空', '有灵感'),
  (7, '13:00'::time, INTERVAL '51 seconds', '浪漫派', '空调房里裹着外套敲键盘的感觉，意外地有安全感', '开心'),
  (7, '21:30'::time, INTERVAL '-798 seconds', '随想者', '一直想买的东西放在购物车里两年了，今天终于删了', '发呆'),
  (7, '21:30'::time, INTERVAL '241 seconds', '职场人', '「你帮我评估一下」八个字毁掉我整个下午', '加班'),
  (7, '21:30'::time, INTERVAL '-390 seconds', '感性派', '加班结束打车回家，司机师傅说「姑娘别太拼」，我没说话', '被治愈'),
  (7, '21:30'::time, INTERVAL '837 seconds', '乐天派', '今天食堂居然有糖醋排骨！快乐就是这么简单', '被治愈'),
  (7, '21:30'::time, INTERVAL '-652 seconds', '文艺派', '文字的厉害之处在于，二十年前写的句子今天读还能让你哭', '发呆'),
  (7, '21:30'::time, INTERVAL '34 seconds', '焦虑党', '同样一件事我能想 8 个版本，每个版本都觉得自己输了', '想聊'),
  (7, '21:30'::time, INTERVAL '-627 seconds', '旁观者', '路过会议室总能听到不同的方言在吵架，鹅厂真大', '摸鱼'),
  (7, '21:30'::time, INTERVAL '741 seconds', '浪漫派', '第一口冰美式下肚的瞬间，觉得这天热得也值了', '开心'),
  (8, '09:00'::time, INTERVAL '51 seconds', '随想者', '一直觉得自己挺擅长独处的，直到周末连续两天没和人说一句话', '有灵感'),
  (8, '09:00'::time, INTERVAL '467 seconds', '职场人', '同事悄悄跟我说她在面试，我假装没听见', '加班'),
  (8, '09:00'::time, INTERVAL '187 seconds', '感性派', '你们有没有那种突然不想说话也不想笑的瞬间', '想聊'),
  (8, '09:00'::time, INTERVAL '244 seconds', '乐天派', '早上下楼遇到了一只小奶猫，整个人都软了', '开心'),
  (8, '09:00'::time, INTERVAL '319 seconds', '文艺派', '最近在听《文化有限》播客，结果听睡着了三次', '发呆'),
  (8, '09:00'::time, INTERVAL '-251 seconds', '焦虑党', '明天要做 review，我已经预演了三遍听众笑场的画面', 'emo'),
  (8, '09:00'::time, INTERVAL '646 seconds', '旁观者', '鹅厂电梯里的告示牌每周都换，但好像没人真的看', '发呆'),
  (8, '09:00'::time, INTERVAL '6 seconds', '浪漫派', '暴雨突然停了，整个园区都是被水洗过的青草味', '发呆'),
  (8, '13:00'::time, INTERVAL '354 seconds', '随想者', '「再观察一下」是我和老板都挺爱说的一句话，但意思完全不一样', '发呆'),
  (8, '13:00'::time, INTERVAL '769 seconds', '职场人', '真心觉得「这个会其实可以是邮件」是新一代职场人的良心呼吁', '摸鱼'),
  (8, '13:00'::time, INTERVAL '573 seconds', '感性派', '今天朋友问我最近怎么样，我说挺好，但挂了之后哭了一下', '被治愈'),
  (8, '13:00'::time, INTERVAL '133 seconds', '乐天派', '同事帮我接了一杯水，我感动得想哭', '开心'),
  (8, '13:00'::time, INTERVAL '-27 seconds', '文艺派', '一个朋友说我太爱用「好像」「也许」「大概」，他说这是不愿意承担的语气', '想聊'),
  (8, '13:00'::time, INTERVAL '801 seconds', '焦虑党', '决定一件小事可以拖三天，决定一件大事直接逃避一周', '想吐槽'),
  (8, '13:00'::time, INTERVAL '222 seconds', '旁观者', '茶水间里站着开会的人，永远比坐着开会的人效率高', '摸鱼'),
  (8, '13:00'::time, INTERVAL '13 seconds', '浪漫派', '同事带来的桃子分了我两个，我吃了一个就开始计划明天怎么礼尚往来', '被治愈'),
  (8, '21:30'::time, INTERVAL '-575 seconds', '随想者', '突然想到楼下保安大叔好像每天都笑得比我开心', '想聊'),
  (8, '21:30'::time, INTERVAL '623 seconds', '职场人', '升职述职的 PPT 改了 7 版，比我做产品方案还认真', '加班'),
  (8, '21:30'::time, INTERVAL '864 seconds', '感性派', '楼下便利店的关东煮今晚煮得特别香，我居然舍不得吃完', '被治愈'),
  (8, '21:30'::time, INTERVAL '72 seconds', '乐天派', '鹅厂楼下花坛里有一只蜗牛在散步，我跟它一起静止了 1 分钟', '开心'),
  (8, '21:30'::time, INTERVAL '21 seconds', '文艺派', '在豆瓣标了想看的电影有 372 部，看过的只有 89 部', '想聊'),
  (8, '21:30'::time, INTERVAL '-370 seconds', '焦虑党', '上周老板说「下周聊聊你」，我这周一直在做最坏的心理建设', '想聊'),
  (8, '21:30'::time, INTERVAL '639 seconds', '旁观者', '周一早上电梯里所有人都低头看手机，没有一个例外', '有灵感'),
  (8, '21:30'::time, INTERVAL '-394 seconds', '浪漫派', '雨后的深圳天空蓝得像 PS 过的', '被治愈'),
  (9, '09:00'::time, INTERVAL '820 seconds', '随想者', '刚在食堂吃饭，旁边两个人在聊竞品方案，突然觉得自己是不是也该想想这些', '有灵感'),
  (9, '09:00'::time, INTERVAL '405 seconds', '职场人', '「锁个会议室」这个动作本身就够让人疲惫的', '想吐槽'),
  (9, '09:00'::time, INTERVAL '-333 seconds', '感性派', '好像很久没有人问过我「你今天累不累」了', '被治愈'),
  (9, '09:00'::time, INTERVAL '668 seconds', '乐天派', '今天遇到了 7 个红绿灯都是绿灯的奇迹，决定去买彩票', '被治愈'),
  (9, '09:00'::time, INTERVAL '692 seconds', '文艺派', '最近发现自己看不进去长片了，一坐下就想刷手机，不知道是注意力的问题还是片不够好', '发呆'),
  (9, '09:00'::time, INTERVAL '167 seconds', '焦虑党', '凌晨两点睡不着的时候，整个手机屏幕都是我焦虑的来源', '想聊'),
  (9, '09:00'::time, INTERVAL '92 seconds', '旁观者', '发现一个规律：周三周四的会议最多，周一反而很闲', '发呆'),
  (9, '09:00'::time, INTERVAL '383 seconds', '浪漫派', '早上路过大厦门口的玉兰树，有种奇怪的清香', '发呆'),
  (9, '13:00'::time, INTERVAL '-411 seconds', '随想者', '突然想到一个问题：地铁里玩手机的人那么多，他们都在看什么', '想聊'),
  (9, '13:00'::time, INTERVAL '-338 seconds', '职场人', '鹅厂工卡掉了第三次了，这次连着公交卡一起', '加班'),
  (9, '13:00'::time, INTERVAL '0 seconds', '感性派', '同事走得早，我留下来收拾，看着空空的办公室突然鼻酸', 'emo'),
  (9, '13:00'::time, INTERVAL '-742 seconds', '乐天派', '上班路上看到一只大金毛对我吐舌头，电量直接 +50%', '被治愈'),
  (9, '13:00'::time, INTERVAL '561 seconds', '文艺派', '终于补完了《漫长的季节》，缓了好几天才能正常上班', '发呆'),
  (9, '13:00'::time, INTERVAL '-315 seconds', '焦虑党', '三十岁前要不要换城市这件事，我从二十六岁开始想到现在', '想聊'),
  (9, '13:00'::time, INTERVAL '-420 seconds', '旁观者', '今天在电梯里听到两个陌生人在讨论 OKR，听起来很专业', '摸鱼'),
  (9, '13:00'::time, INTERVAL '-344 seconds', '浪漫派', '鹅厂楼下的紫薇又开花了，每年这个时候都开', '发呆'),
  (9, '21:30'::time, INTERVAL '-213 seconds', '随想者', '每次看到有人 OKR 写得特别长，就开始怀疑自己是不是太懒', '想聊'),
  (9, '21:30'::time, INTERVAL '-246 seconds', '职场人', '今天的 1on1 被推迟到下周，谢天谢地', '想吐槽'),
  (9, '21:30'::time, INTERVAL '206 seconds', '感性派', '一个人的时候喜欢的歌全是慢的，热闹的时候反而都不想听', 'emo'),
  (9, '21:30'::time, INTERVAL '-735 seconds', '乐天派', '今天会议提前 5 分钟结束，就这一刻我已经赢麻了', '开心'),
  (9, '21:30'::time, INTERVAL '-617 seconds', '文艺派', '你们看电影会等到字幕滚完吗？我会一直坐到最后一行字消失', '发呆'),
  (9, '21:30'::time, INTERVAL '-592 seconds', '焦虑党', '「不要内耗」这种话听了一百遍，脑子从来没听进去过', '想聊'),
  (9, '21:30'::time, INTERVAL '-427 seconds', '旁观者', '早上 9 点 30 的滨海大厦，比晚上 9 点 30 还热闹', '摸鱼'),
  (9, '21:30'::time, INTERVAL '-116 seconds', '浪漫派', '晚上下班看到一个小姑娘在路边喂流浪猫，那一刻觉得世界还行', '开心');

-- 4) 启动：把 base_at 设为"明天 0 点"，并算 scheduled_at
-- 注意：不做 is_admin 校验，因为 Supabase SQL Editor 默认 role 没有 auth.uid()
CREATE OR REPLACE FUNCTION public.seed_auto_start(p_base_at timestamptz DEFAULT NULL)
RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  base_val timestamptz;
BEGIN
  base_val := COALESCE(p_base_at, (date_trunc('day', now() AT TIME ZONE 'Asia/Shanghai') + INTERVAL '1 day') AT TIME ZONE 'Asia/Shanghai');

  UPDATE seed_auto_config SET base_at = base_val, paused = false, updated_at = now() WHERE id = 1;

  UPDATE seed_bottle_queue SET
    scheduled_at = (base_val + (day_idx || ' days')::interval + slot_time::interval + jitter),
    dispatched_at = NULL, bottle_id = NULL, error = NULL;

  RETURN base_val;
END;
$$;
GRANT EXECUTE ON FUNCTION public.seed_auto_start(timestamptz) TO authenticated;

-- 5) 暂停/恢复
CREATE OR REPLACE FUNCTION public.seed_auto_pause()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE seed_auto_config SET paused = true, updated_at = now() WHERE id = 1;
END;
$$;
GRANT EXECUTE ON FUNCTION public.seed_auto_pause() TO authenticated;

CREATE OR REPLACE FUNCTION public.seed_auto_resume()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE seed_auto_config SET paused = false, updated_at = now() WHERE id = 1;
END;
$$;
GRANT EXECUTE ON FUNCTION public.seed_auto_resume() TO authenticated;

-- 6) 主投放函数：扫"到点且未扔"的，按 identity_label 找到种子账号 user_id，INSERT bottles
CREATE OR REPLACE FUNCTION public.seed_auto_dispatch_due()
RETURNS TABLE (queue_id bigint, bottle_id uuid, identity_label text, status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  cfg RECORD;
  q RECORD;
  uid uuid;
  new_bottle_id uuid;
BEGIN
  SELECT * INTO cfg FROM seed_auto_config WHERE id = 1;
  IF cfg.paused OR cfg.base_at IS NULL THEN RETURN; END IF;

  FOR q IN
    SELECT * FROM seed_bottle_queue
    WHERE dispatched_at IS NULL AND scheduled_at IS NOT NULL AND scheduled_at <= now()
    ORDER BY scheduled_at ASC LIMIT 50
  LOOP
    -- 找种子账号
    SELECT s.user_id INTO uid FROM seed_accounts s WHERE s.label = q.identity_label LIMIT 1;
    IF uid IS NULL THEN
      UPDATE seed_bottle_queue SET error = 'identity not found: ' || q.identity_label, dispatched_at = now() WHERE id = q.id;
      queue_id := q.id; bottle_id := NULL; identity_label := q.identity_label; status := 'no-identity';
      RETURN NEXT;
      CONTINUE;
    END IF;

    -- INSERT bottle（绕开每日 3 条 quota，自动调度系统自己控）
    BEGIN
      INSERT INTO bottles (user_id, content, mood) VALUES (uid, q.content, q.mood) RETURNING id INTO new_bottle_id;
      UPDATE seed_bottle_queue SET dispatched_at = now(), bottle_id = new_bottle_id WHERE id = q.id;
      queue_id := q.id; bottle_id := new_bottle_id; identity_label := q.identity_label; status := 'ok';
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      UPDATE seed_bottle_queue SET error = SQLERRM, dispatched_at = now() WHERE id = q.id;
      queue_id := q.id; bottle_id := NULL; identity_label := q.identity_label; status := 'error: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION public.seed_auto_dispatch_due() TO authenticated;

-- 7) 状态查询
CREATE OR REPLACE FUNCTION public.seed_auto_status()
RETURNS TABLE (
  base_at timestamptz, paused boolean,
  total int, dispatched int, pending int, error_count int,
  next_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT
    c.base_at, c.paused,
    (SELECT count(*)::int FROM seed_bottle_queue),
    (SELECT count(*)::int FROM seed_bottle_queue WHERE dispatched_at IS NOT NULL AND error IS NULL),
    (SELECT count(*)::int FROM seed_bottle_queue WHERE dispatched_at IS NULL),
    (SELECT count(*)::int FROM seed_bottle_queue WHERE error IS NOT NULL),
    (SELECT min(scheduled_at) FROM seed_bottle_queue WHERE dispatched_at IS NULL)
  FROM seed_auto_config c WHERE c.id = 1;
END;
$$;
GRANT EXECUTE ON FUNCTION public.seed_auto_status() TO authenticated;

-- 8) 注册 cron job（每 10 分钟一次）
SELECT cron.unschedule('seed-auto-dispatch') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'seed-auto-dispatch');
SELECT cron.schedule('seed-auto-dispatch', '*/10 * * * *', 'SELECT public.seed_auto_dispatch_due();');

-- 9) 立即启动（base_at = 今天 0 点，让今天已过的 9 点 / 13 点时段也能立刻补发）
SELECT public.seed_auto_start(date_trunc('day', now() AT TIME ZONE 'Asia/Shanghai') AT TIME ZONE 'Asia/Shanghai') AS start_base_at;

-- 10) 立刻触发一次投放（把今天 9 点和 13 点这两波 16 条扔出去）
SELECT count(*) AS dispatched_now FROM public.seed_auto_dispatch_due();

-- 11) 完成
SELECT '✅ seed-004 applied: 自动投放系统已上线' AS status;
