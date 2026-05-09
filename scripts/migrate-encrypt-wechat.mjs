/**
 * 一次性迁移脚本：把 users 表里明文的 wechat_id 加密回写
 *
 * 用法（在 feiewuraoo 目录下）：
 *   node --env-file=.env.production scripts/migrate-encrypt-wechat.mjs --dry   # 预演
 *   node --env-file=.env.production scripts/migrate-encrypt-wechat.mjs         # 正式跑
 *
 * 判定「明文 vs 密文」：尝试 decrypt()，若能成功解出 → 已是密文；否则视为明文，encrypt() 回写。
 */
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey() {
  const k = process.env.ENCRYPTION_KEY;
  if (!k) throw new Error('ENCRYPTION_KEY 未设置');
  return Buffer.from(k, 'hex');
}

function encrypt(plaintext) {
  if (!plaintext) return '';
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, enc, tag]).toString('base64');
}

// 返回解密后的明文；如果看起来不像密文或解密失败，返回 null 表示"这就是明文"
function tryDecrypt(value) {
  if (!value) return null;
  // 长度/字符集快速排除：AES-GCM 密文最短也有 28 字节 → base64 后约 40 字符
  if (value.length < 40) return null;
  if (!/^[A-Za-z0-9+/=]+$/.test(value)) return null;
  try {
    const key = getKey();
    const combined = Buffer.from(value, 'base64');
    if (combined.length < IV_LENGTH + TAG_LENGTH) return null;
    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(combined.length - TAG_LENGTH);
    const ct = combined.subarray(IV_LENGTH, combined.length - TAG_LENGTH);
    const dec = crypto.createDecipheriv(ALGORITHM, key, iv);
    dec.setAuthTag(tag);
    return dec.update(ct, undefined, 'utf8') + dec.final('utf8');
  } catch {
    return null;
  }
}

const DRY = process.argv.includes('--dry');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  console.log(`\n=== 微信号加密迁移 ${DRY ? '[DRY RUN]' : '[LIVE]'} ===\n`);

  const { data, error } = await supabase
    .from('users')
    .select('id, nickname, wechat_id');
  if (error) throw error;

  console.log(`总用户数：${data.length}`);

  const stats = { plaintext: 0, ciphertext: 0, empty: 0, failed: 0 };
  const toUpdate = [];

  for (const u of data) {
    if (!u.wechat_id) { stats.empty++; continue; }
    const decrypted = tryDecrypt(u.wechat_id);
    if (decrypted !== null) {
      // 已经是密文
      stats.ciphertext++;
    } else {
      // 明文，需要加密
      stats.plaintext++;
      toUpdate.push({ id: u.id, nickname: u.nickname, old: u.wechat_id, new: encrypt(u.wechat_id) });
    }
  }

  console.log(`  密文（跳过）：${stats.ciphertext}`);
  console.log(`  明文（待加密）：${stats.plaintext}`);
  console.log(`  空值：${stats.empty}`);
  console.log('');

  if (toUpdate.length === 0) {
    console.log('没有需要迁移的记录，退出。');
    return;
  }

  // 展示前 3 条样本（脱敏明文）
  console.log('样本（前 3 条）：');
  for (const r of toUpdate.slice(0, 3)) {
    const masked = r.old.length <= 2 ? '***' : r.old[0] + '***' + r.old.slice(-1);
    console.log(`  [${r.nickname}] ${masked} → ${r.new.slice(0, 20)}...`);
  }
  console.log('');

  if (DRY) {
    console.log('DRY RUN：不实际写库。加 --live 或去掉 --dry 跑正式迁移。');
    return;
  }

  // 逐条 update（users 表没那么大，顺序写即可）
  let ok = 0;
  for (const r of toUpdate) {
    const { error: e } = await supabase
      .from('users')
      .update({ wechat_id: r.new })
      .eq('id', r.id);
    if (e) {
      console.error(`  ✗ [${r.nickname}] ${r.id}: ${e.message}`);
      stats.failed++;
    } else {
      ok++;
    }
  }

  console.log(`\n完成：成功 ${ok}，失败 ${stats.failed}`);
}

main().catch(err => {
  console.error('迁移失败：', err);
  process.exit(1);
});
