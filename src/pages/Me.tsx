import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AppNav from '../components/AppNav';
import Avatar from '../components/Avatar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';
import { useIsNarrow } from '../lib/useIsNarrow';

export default function Me() {
  const { profile, signOut, user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const isNarrow = useIsNarrow();
  const [stats, setStats] = useState({ thrown: 0, picked: 0, friends: 0 });
  const [sheet, setSheet] = useState<'privacy' | 'block' | 'logout' | 'delete' | null>(null);
  const [blockList, setBlockList] = useState<{ id: string; bottleNo: string; createdAt: string }[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setReady(true);
    let cancelled = false;
    (async () => {
      try {
        // 优先走 get_my_stats RPC（绕过 bottles RLS 限制，能拿到「捞起的瓶子」真实数）
        const { data: statsRow, error: statsErr } = await supabase.rpc('get_my_stats' as any);
        if (cancelled) return;
        if (!statsErr && statsRow) {
          const row = Array.isArray(statsRow) ? statsRow[0] : statsRow;
          if (row) {
            setStats({
              thrown: Number(row.thrown) || 0,
              picked: Number(row.picked) || 0,
              friends: Number(row.friends) || 0,
            });
          }
        } else {
          // 兜底：旧逻辑
          const [throwRes, pickRes, friendRes] = await Promise.all([
            supabase.from('bottles').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
            supabase.from('bottles').select('id', { count: 'exact', head: true }).eq('picked_by', profile.id),
            supabase.from('conversations').select('id', { count: 'exact', head: true })
              .or(`user_a.eq.${profile.id},user_b.eq.${profile.id}`),
          ]);
          if (cancelled) return;
          setStats({
            thrown: throwRes.count ?? 0,
            picked: pickRes.count ?? 0,
            friends: friendRes.count ?? 0,
          });
        }

        // 拉黑列表
        const { data: blocks } = await supabase
          .from('blocks')
          .select('id, blocked, created_at')
          .eq('blocker', profile.id)
          .order('created_at', { ascending: false });
        if (blocks && blocks.length > 0) {
          const { data: users, error: rpcErr } = await supabase.rpc('get_blocked_profiles' as any);
          if (rpcErr) {
            console.warn('[me] get_blocked_profiles error:', rpcErr.message);
          }
          const userMap = new Map<string, string>((users ?? []).map((u: any) => [u.id as string, u.bottle_no as string]));
          if (cancelled) return;
          setBlockList((blocks as any[]).map(b => ({
            id: b.id as string,
            bottleNo: userMap.get(b.blocked) ?? '----',
            createdAt: relativeTime(b.created_at) + '拉黑',
          })));
        }
      } catch (e: any) {
        console.warn('[me] load error:', e?.message ?? e);
      }
    })();
    return () => { cancelled = true; };
  }, [profile]);

  async function unblock(blockId: string) {
    try {
      const { error } = await supabase.from('blocks').delete().eq('id', blockId);
      if (error) { toast.error('解除拉黑失败：' + error.message); return; }
      setBlockList(list => list.filter(b => b.id !== blockId));
      toast.success('已解除拉黑');
    } catch (e: any) {
      toast.error('网络异常，请稍后重试');
    }
  }

  const emailMasked = (user?.email ?? '').replace(/^(.{2}).*?(@.+)$/, '$1****$2');

  return (
    <>
      <AppNav />
      <main style={{
        position: 'relative', zIndex: 1, minHeight: '100vh',
        padding: isNarrow ? '90px 18px 60px' : '130px 56px 80px',
        maxWidth: 720, margin: '0 auto',
      }}>
        {!ready ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '50vh',
            color: 'rgba(255,255,255,0.5)',
          }}>
            <div style={{
              width: 24, height: 24,
              border: '1.5px solid rgba(255,255,255,0.15)',
              borderTopColor: 'rgba(255,255,255,0.6)',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
              marginBottom: 14,
            }} />
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, letterSpacing: 4, opacity: 0.6 }}>
              loading…
            </div>
          </div>
        ) : (
        <>
        <div style={{ textAlign: 'center', marginBottom: isNarrow ? 36 : 60 }}>
          {profile && <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}><Avatar color={profile.avatar_color} size={isNarrow ? 64 : 80} /></div>}
          <div style={{ fontSize: isNarrow ? 22 : 26, color: '#fff', letterSpacing: isNarrow ? 2 : 4, marginBottom: 6, textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>
            No. <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>{profile?.bottle_no ?? '----'}</em>
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: isNarrow ? 12 : 14, color: 'rgba(255,255,255,0.55)' }}>{emailMasked}</div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: isNarrow ? 8 : 12,
          marginBottom: isNarrow ? 36 : 56,
          background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
          border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 16,
          padding: isNarrow ? '20px 8px' : '28px 12px',
        }}>
          {[
            ['扔出的瓶子', stats.thrown],
            ['捞起的瓶子', stats.picked],
            ['瓶友', stats.friends],
          ].map(([label, n]) => (
            <div key={String(label)} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: isNarrow ? 28 : 38,
                color: '#fff',
                fontWeight: 300,
                letterSpacing: 0.5,
                fontVariantNumeric: 'lining-nums tabular-nums',
              }}>{n as number}</div>
              <div style={{ fontSize: isNarrow ? 11 : 13, color: 'rgba(255,255,255,0.6)', letterSpacing: isNarrow ? 2 : 4, marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <MenuRow label="关于非鹅勿扰漂流瓶" onClick={() => nav('/?about=1')} narrow={isNarrow} />
          <MenuRow label="隐私说明" onClick={() => setSheet('privacy')} narrow={isNarrow} />
          <MenuRow label="拉黑列表" onClick={() => setSheet('block')} narrow={isNarrow} />
          <MenuRow label="退出登录" onClick={() => setSheet('logout')} narrow={isNarrow} />
        </div>

        <div style={{ textAlign: 'center', paddingTop: 36, marginTop: isNarrow ? 36 : 56, borderTop: '0.5px solid rgba(255,255,255,0.12)' }}>
          <a onClick={() => setSheet('delete')} style={{ fontSize: isNarrow ? 13 : 14, color: 'rgba(220,120,120,0.85)', letterSpacing: isNarrow ? 2 : 4, cursor: 'pointer' }}>注销账号</a>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginTop: 8 }}>all data permanently deleted</div>
        </div>
        </>
        )}
      </main>

      {sheet && (
        <Sheet onClose={() => setSheet(null)}>
          {sheet === 'privacy' && <PrivacyContent />}
          {sheet === 'block' && <BlockListContent items={blockList} onUnblock={unblock} />}
          {sheet === 'logout' && <LogoutContent onConfirm={async () => { await signOut(); nav('/'); }} onCancel={() => setSheet(null)} />}
          {sheet === 'delete' && <DeleteContent onConfirm={async () => {
            if (profile) {
              try {
                const { error } = await supabase.from('users').update({ banned_at: new Date().toISOString() }).eq('id', profile.id);
                if (error) { toast.error('注销失败：' + error.message); return; }
              } catch (e: any) {
                toast.error('网络异常，请稍后重试');
                return;
              }
            }
            await signOut();
            nav('/');
          }} onCancel={() => setSheet(null)} />}
        </Sheet>
      )}
    </>
  );
}

function MenuRow({ label, onClick, narrow }: { label: string; onClick: () => void; narrow?: boolean }) {
  return (
    <a onClick={onClick} style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: narrow ? '14px 18px' : '18px 24px',
      background: 'rgba(255,255,255,0.05)',
      border: '0.5px solid rgba(255,255,255,0.1)',
      borderRadius: 10, color: 'rgba(255,255,255,0.88)',
      fontSize: narrow ? 14 : 15, letterSpacing: narrow ? 2 : 3, cursor: 'pointer',
    }}>
      <span>{label}</span>
      <span style={{ fontFamily: "'Cormorant Garamond', serif", color: 'rgba(255,255,255,0.4)' }}>›</span>
    </a>
  );
}

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(12px, 4vw, 32px)',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'rgba(20,28,40,0.95)', backdropFilter: 'blur(32px)',
        border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: 16,
        padding: 'clamp(24px, 5vw, 36px) clamp(20px, 5vw, 40px)',
        maxWidth: 540, width: '100%', maxHeight: '80vh', overflowY: 'auto',
        color: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        position: 'relative',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 20, background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 13, letterSpacing: 2, cursor: 'pointer', padding: 6 }}>关闭</button>
        {children}
      </div>
    </div>
  );
}

function PrivacyContent() {
  return (
    <>
      <div style={{ fontSize: 20, letterSpacing: 4, marginBottom: 22, paddingBottom: 14, borderBottom: '0.5px solid rgba(255,255,255,0.18)' }}>隐私说明</div>
      <ul style={{ listStyle: 'none', padding: 0, fontSize: 14.5, lineHeight: 1.95 }}>
        {[
          ['身份不公开', '邮箱仅用于登录，不与你扔出的瓶子关联。其他人看不到你是谁。'],
          ['不存真名照片', '无昵称、无照片，编号和颜色由系统随机分配。'],
          ['聊天加密', '瓶友之间的对话加密存储，未经你本人操作不会被任何人看到。'],
          ['会拦截不当内容', '扔瓶时会自动拦截违规、恶意内容；收到不舒服的瓶子可以一键举报。'],
          ['会处置滥用账号', '多次被举报会被限制使用，必要时封禁。'],
          ['注销即清空', '注销后所有瓶子、瓶友、聊天记录永久删除，不可恢复。'],
        ].map(([n, d]) => (
          <li key={n} style={{ padding: '10px 0 10px 16px', position: 'relative', borderBottom: '0.5px solid rgba(255,255,255,0.1)' }}>
            <span style={{ position: 'absolute', left: 0, top: 8, fontSize: 18, color: 'rgba(255,255,255,0.6)' }}>·</span>
            <strong style={{ marginRight: 6 }}>{n}　</strong>{d}
          </li>
        ))}
      </ul>
    </>
  );
}

function BlockListContent({ items, onUnblock }: { items: any[]; onUnblock: (id: string) => void }) {
  return (
    <>
      <div style={{ fontSize: 20, letterSpacing: 4, marginBottom: 22, paddingBottom: 14, borderBottom: '0.5px solid rgba(255,255,255,0.18)' }}>拉黑列表</div>
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.5)' }}>还没有拉黑过任何人</div>
      ) : (
        <div>
          {items.map(it => {
            const gone = !it.bottleNo || it.bottleNo === '----';
            return (
              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '0.5px solid rgba(255,255,255,0.12)', opacity: gone ? 0.55 : 1 }}>
                <div>
                  <div style={{ fontSize: 15, letterSpacing: 2 }}>
                    {gone ? <span style={{ color: 'rgba(255,255,255,0.6)' }}>该用户已离开</span> :
                      <>No. <em style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>{it.bottleNo}</em></>}
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{it.createdAt}</div>
                </div>
                <button
                  onClick={() => onUnblock(it.id)}
                  disabled={gone}
                  style={{
                    background: 'transparent',
                    border: '0.5px solid rgba(255,255,255,0.4)',
                    color: gone ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)',
                    padding: '6px 14px', borderRadius: 999, fontSize: 12, letterSpacing: 2,
                    cursor: gone ? 'not-allowed' : 'pointer',
                  }}
                >解除</button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function LogoutContent({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div style={{ fontSize: 17, letterSpacing: 4, marginBottom: 12, textAlign: 'center' }}>退出登录？</div>
      <div style={{ opacity: 0.75, textAlign: 'center', marginBottom: 24 }}>下次仍可用同一邮箱回到这里，瓶友与对话都会保留。</div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button onClick={onCancel} style={btnGhostStyle}>取消</button>
        <button onClick={onConfirm} style={{ ...btnGhostStyle, background: 'rgba(255,255,255,0.94)', color: '#1a4456', borderColor: '#fff' }}>确认退出</button>
      </div>
    </>
  );
}

function DeleteContent({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div style={{ fontSize: 17, letterSpacing: 4, marginBottom: 12, color: 'rgba(220,130,130,0.95)', textAlign: 'center' }}>注销账号</div>
      <div style={{ opacity: 0.85, marginBottom: 12 }}>这会永久删除你的<strong>所有瓶子、瓶友、聊天记录</strong>，且无法恢复。同一邮箱在 30 天内不能再次注册。</div>
      <div style={{ opacity: 0.85, marginBottom: 24 }}>确定要继续吗？</div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button onClick={onCancel} style={btnGhostStyle}>再想想</button>
        <button onClick={onConfirm} style={{ ...btnGhostStyle, background: 'rgba(170, 60, 60, 0.95)', color: '#fff', borderColor: 'rgba(170, 60, 60, 0.95)' }}>确认注销</button>
      </div>
    </>
  );
}

const btnGhostStyle: React.CSSProperties = {
  background: 'transparent',
  border: '0.5px solid rgba(255,255,255,0.4)',
  color: 'rgba(255,255,255,0.85)',
  padding: '6px 14px',
  borderRadius: 999,
  fontSize: 13,
  letterSpacing: 2,
  cursor: 'pointer',
};

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} 天前`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w} 周前`;
  return `${Math.floor(d / 30)} 个月前`;
}
