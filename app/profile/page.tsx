"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useIsPro } from "@/lib/useIsPro";

// Supabaseクライアントをコンポーネント外で一度だけ生成（Multiple instances警告を防ぐ）
const supabase = createClient();

const DEFAULT_AVATARS = ["🐻", "🐼", "🦊", "🐸", "🐧", "🦁", "🐯", "🐨", "🐮", "🦄", "🐙", "🦋"];

type Profile = {
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  default_avatar: string;
  theme: string;
};

const THEMES = [
  {
    id: 'dark',
    label: 'ダーク',
    preview: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    textColor: '#fff',
  },
  {
    id: 'light',
    label: 'ライト',
    preview: '#f8f9fa',
    textColor: '#1a1a1a',
    border: '1px solid #ddd',
  },
  {
    id: 'gradient-blue',
    label: '青紫',
    preview: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
    textColor: '#fff',
  },
  {
    id: 'gradient-pink',
    label: 'ピンク',
    preview: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
    textColor: '#fff',
  },
  {
    id: 'natural',
    label: 'ナチュラル',
    preview: 'linear-gradient(135deg, #fef9ef 0%, #d1fae5 100%)',
    textColor: '#1a1a1a',
    border: '1px solid #ddd',
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>({
    username: "",
    display_name: "",
    bio: "",
    avatar_url: "",
    default_avatar: DEFAULT_AVATARS[0],
    theme: "dark",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [usernameError, setUsernameError] = useState("");
  const isPro = useIsPro();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile({
          username: data.username || "",
          display_name: data.display_name || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || "",
          default_avatar: data.default_avatar || DEFAULT_AVATARS[0],
          theme: data.theme || "dark",
        });
      }
      setLoading(false);
    };
    init();
  }, []);

  // ブラウザのデフォルトドロップ動作を無効化
  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();
    document.addEventListener("dragover", prevent);
    document.addEventListener("drop", prevent);
    return () => {
      document.removeEventListener("dragover", prevent);
      document.removeEventListener("drop", prevent);
    };
  }, []);

  // ドロップゾーン専用
  useEffect(() => {
    const zone = dropZoneRef.current;
    if (!zone) return;
    const onDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const onDragLeave = (e: DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const onDrop = (e: DragEvent) => {
      e.preventDefault(); e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer?.files[0];
      if (file) handleImageUpload(file);
    };
    zone.addEventListener("dragover", onDragOver);
    zone.addEventListener("dragleave", onDragLeave);
    zone.addEventListener("drop", onDrop);
    return () => {
      zone.removeEventListener("dragover", onDragOver);
      zone.removeEventListener("dragleave", onDragLeave);
      zone.removeEventListener("drop", onDrop);
    };
  }, [userId]);

  const handleImageUpload = async (file: File) => {
    if (!userId) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "画像ファイルを選択してください" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "5MB以下の画像を選択してください" });
      return;
    }

    setUploading(true);
    setMessage(null);

    // APIルート経由でサーバーサイドアップロード
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setMessage({ type: "error", text: "セッションが切れています。再ログインしてください。" });
      setUploading(false);
      return;
    }

    const form = new FormData();
    form.append("file", file);

    const uploadRes = await fetch("/api/upload-avatar", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: form,
    });

    if (!uploadRes.ok) {
      const errJson = await uploadRes.json().catch(() => ({ error: "不明なエラー" }));
      console.error("Upload error:", errJson);
      setMessage({ type: "error", text: "アップロードに失敗しました: " + errJson.error });
      setUploading(false);
      return;
    }

    const { publicUrl } = await uploadRes.json();
    setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
    setUploading(false);
    setMessage({ type: "success", text: "画像をアップロードしました！" });
  };

  const validateUsername = (value: string) => {
    if (!value) return "ユーザー名は必須です";
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return "英数字・アンダースコア・ハイフンのみ使用できます";
    if (value.length < 3) return "3文字以上で入力してください";
    if (value.length > 30) return "30文字以内で入力してください";
    return "";
  };

  const handleSave = async () => {
    const error = validateUsername(profile.username);
    if (error) { setUsernameError(error); return; }
    if (!userId) return;

    setSaving(true);
    setMessage(null);

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: userId,
      username: profile.username.toLowerCase(),
      display_name: profile.display_name || null,
      bio: profile.bio || null,
      avatar_url: profile.avatar_url || null,
      default_avatar: profile.default_avatar,
      theme: profile.theme,
    });

    if (upsertError) {
      if (upsertError.code === "23505") {
        setUsernameError("このユーザー名はすでに使用されています");
      } else {
        setMessage({ type: "error", text: "保存に失敗しました: " + upsertError.message });
      }
    } else {
      setMessage({ type: "success", text: "プロフィールを保存しました！" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" }}>
        <div style={{ color: "#888" }}>読み込み中...</div>
      </div>
    );
  }

  const avatarPreview = profile.avatar_url ? (
    <img src={profile.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
  ) : (
    <span style={{ fontSize: "40px" }}>{profile.default_avatar}</span>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <div style={{ background: "#fff", borderBottom: "0.5px solid rgba(0,0,0,0.08)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: "13px" }}>← ダッシュボード</button>
          <span style={{ fontSize: "15px", fontWeight: "500", color: "#1a1a1a" }}>プロフィール設定</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
            style={{ background: "none", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", color: "#888", cursor: "pointer" }}
          >
            ログアウト
          </button>
        <button onClick={handleSave} disabled={saving || !!usernameError}
          style={{ background: saving || usernameError ? "#ccc" : "#1D9E75", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 20px", fontSize: "13px", fontWeight: "500", cursor: saving || usernameError ? "not-allowed" : "pointer" }}>
          {saving ? "保存中..." : "保存"}
        </button>
        </div>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {message && (
          <div style={{ padding: "12px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "500", background: message.type === "success" ? "#E1F5EE" : "#FEE2E2", color: message.type === "success" ? "#085041" : "#991B1B" }}>
            {message.text}
          </div>
        )}

        {/* カスタムURL */}
        <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a" }}>カスタムURL</div>
            {isPro === false && <span style={{ fontSize: "10px", fontWeight: "700", background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: "4px" }}>Pro限定</span>}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginBottom: "16px" }}>あなたの公開ページのURLになります</div>
          {isPro === false ? (
            <div style={{ background: "#f9f9f9", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px 14px", fontSize: "12px", color: "#888" }}>
              🔒 カスタムURLはProプランでご利用いただけます
            </div>
          ) : (
            <>
              <div style={{ display: "flex", border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}>
                <span style={{ background: "#f5f5f5", color: "#888", fontSize: "13px", padding: "10px 14px", borderRight: "1px solid #ddd", whiteSpace: "nowrap" }}>/links/</span>
                <input type="text" value={profile.username}
                  onChange={(e) => { setProfile(prev => ({ ...prev, username: e.target.value.toLowerCase() })); setUsernameError(validateUsername(e.target.value)); }}
                  placeholder="yourname"
                  style={{ flex: 1, padding: "10px 14px", fontSize: "13px", border: "none", outline: "none" }} />
              </div>
              {usernameError && <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px" }}>{usernameError}</div>}
              {profile.username && !usernameError && (
                <div style={{ color: "#1D9E75", fontSize: "12px", marginTop: "6px" }}>公開URL: affiliater-tool.vercel.app/links/{profile.username}</div>
              )}
            </>
          )}
        </div>

        {/* アバター */}
        <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px", padding: "24px" }}>
          <div style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a", marginBottom: "4px" }}>アバター画像</div>
          <div style={{ fontSize: "12px", color: "#888", marginBottom: "20px" }}>画像をアップロードするか、デフォルトアイコンを選んでください</div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "2px solid #eee", flexShrink: 0 }}>
              {avatarPreview}
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "500", color: "#1a1a1a", marginBottom: "4px" }}>
                {profile.avatar_url ? "カスタム画像を使用中" : `デフォルトアイコン：${profile.default_avatar}`}
              </div>
              {profile.avatar_url && (
                <button onClick={() => setProfile(prev => ({ ...prev, avatar_url: "" }))}
                  style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", cursor: "pointer", padding: 0 }}>
                  画像を削除してデフォルトに戻す
                </button>
              )}
            </div>
          </div>

          <div ref={dropZoneRef} onClick={() => fileInputRef.current?.click()}
            style={{ border: `2px dashed ${isDragging ? "#1D9E75" : "#ddd"}`, borderRadius: "10px", padding: "24px", textAlign: "center", cursor: "pointer", background: isDragging ? "#E1F5EE" : "#fafafa", transition: "all 0.2s", marginBottom: "20px" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>🖼️</div>
            <div style={{ fontSize: "13px", fontWeight: "500", color: "#555", marginBottom: "4px" }}>
              {uploading ? "アップロード中..." : "クリックまたはドラッグ&ドロップ"}
            </div>
            <div style={{ fontSize: "12px", color: "#aaa" }}>JPG・PNG・GIF・WEBP（5MB以内）</div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file); }} />
          </div>

          {!profile.avatar_url && (
            <div>
              <div style={{ fontSize: "12px", fontWeight: "500", color: "#555", marginBottom: "10px" }}>デフォルトアイコンを選ぶ</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {DEFAULT_AVATARS.map((emoji) => (
                  <button key={emoji} onClick={() => setProfile(prev => ({ ...prev, default_avatar: emoji }))}
                    style={{ width: "44px", height: "44px", borderRadius: "50%", border: profile.default_avatar === emoji ? "2px solid #1D9E75" : "2px solid transparent", background: profile.default_avatar === emoji ? "#E1F5EE" : "#f0f0f0", fontSize: "22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* プロフィール情報 */}
        <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px", padding: "24px" }}>
          <div style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a", marginBottom: "20px" }}>プロフィール情報</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#555", marginBottom: "6px" }}>表示名</label>
              <input type="text" value={profile.display_name}
                onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="山田太郎"
                style={{ width: "100%", border: "1px solid #ddd", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#555", marginBottom: "6px" }}>自己紹介</label>
              <textarea value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="フリーランスエンジニア。ガジェット好き。"
                rows={3}
                style={{ width: "100%", border: "1px solid #ddd", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", outline: "none", resize: "none", boxSizing: "border-box" }} />
            </div>
          </div>
        </div>

        {/* テーマ選択 */}
        <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a" }}>公開ページのテーマ</div>
            {isPro === false && <span style={{ fontSize: "10px", fontWeight: "700", background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: "4px" }}>Pro限定（4種）</span>}
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginBottom: "20px" }}>bioリンクページの背景デザインを選べます</div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {THEMES.map((t, idx) => {
              const locked = isPro === false && idx > 0
              return (
                <button
                  key={t.id}
                  onClick={() => { if (!locked) setProfile(prev => ({ ...prev, theme: t.id })) }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: locked ? "not-allowed" : "pointer", padding: 0, opacity: locked ? 0.45 : 1 }}
                >
                  <div style={{
                    width: "72px", height: "52px", borderRadius: "10px",
                    background: t.preview,
                    border: profile.theme === t.id ? "2.5px solid #1D9E75" : t.border || "2.5px solid transparent",
                    boxShadow: profile.theme === t.id ? "0 0 0 3px rgba(29,158,117,0.2)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                    position: "relative",
                  }}>
                    {locked ? (
                      <span style={{ fontSize: "16px" }}>🔒</span>
                    ) : profile.theme === t.id && (
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "#fff", fontSize: "11px", fontWeight: "700" }}>✓</span>
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: "11px", color: profile.theme === t.id ? "#1D9E75" : "#888", fontWeight: profile.theme === t.id ? "500" : "400" }}>
                    {t.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {profile.username && !usernameError && (
          <div style={{ background: "#E1F5EE", border: "1px solid #A7F3D0", borderRadius: "12px", padding: "16px 20px" }}>
            <div style={{ fontSize: "13px", fontWeight: "500", color: "#085041", marginBottom: "6px" }}>📎 あなたの公開ページ</div>
            <a href={`/links/${profile.username}`} target="_blank" rel="noopener noreferrer" style={{ color: "#1D9E75", fontSize: "13px" }}>
              /links/{profile.username}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
