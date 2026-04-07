"use client";

import { use, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { QRCodeCanvas } from "qrcode.react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Link = {
  id: string;
  title: string;
  url: string;
  is_active: boolean;
  display_order: number;
};

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  default_avatar: string | null;
  theme: string | null;
};

type ThemeStyle = {
  bg: string;
  text: string;
  subText: string;
  bioText: string;
  linkBg: string;
  linkBgHover: string;
  linkBorder: string;
  linkText: string;
  footer: string;
  qrBtnColor: string;
  qrBtnBorder: string;
  avatarRing: string;
};

const THEME_STYLES: Record<string, ThemeStyle> = {
  dark: {
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    text: '#ffffff',
    subText: '#94a3b8',
    bioText: '#cbd5e1',
    linkBg: 'rgba(255,255,255,0.1)',
    linkBgHover: 'rgba(255,255,255,0.2)',
    linkBorder: 'rgba(255,255,255,0.1)',
    linkText: '#ffffff',
    footer: '#475569',
    qrBtnColor: '#94a3b8',
    qrBtnBorder: '#475569',
    avatarRing: 'rgba(255,255,255,0.2)',
  },
  light: {
    bg: '#f8f9fa',
    text: '#1a1a1a',
    subText: '#888888',
    bioText: '#555555',
    linkBg: '#ffffff',
    linkBgHover: '#f0f0f0',
    linkBorder: 'rgba(0,0,0,0.08)',
    linkText: '#1a1a1a',
    footer: '#cccccc',
    qrBtnColor: '#888888',
    qrBtnBorder: '#dddddd',
    avatarRing: 'rgba(0,0,0,0.1)',
  },
  'gradient-blue': {
    bg: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
    text: '#ffffff',
    subText: 'rgba(255,255,255,0.7)',
    bioText: 'rgba(255,255,255,0.85)',
    linkBg: 'rgba(255,255,255,0.15)',
    linkBgHover: 'rgba(255,255,255,0.25)',
    linkBorder: 'rgba(255,255,255,0.2)',
    linkText: '#ffffff',
    footer: 'rgba(255,255,255,0.4)',
    qrBtnColor: 'rgba(255,255,255,0.7)',
    qrBtnBorder: 'rgba(255,255,255,0.3)',
    avatarRing: 'rgba(255,255,255,0.3)',
  },
  'gradient-pink': {
    bg: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
    text: '#ffffff',
    subText: 'rgba(255,255,255,0.7)',
    bioText: 'rgba(255,255,255,0.85)',
    linkBg: 'rgba(255,255,255,0.15)',
    linkBgHover: 'rgba(255,255,255,0.25)',
    linkBorder: 'rgba(255,255,255,0.2)',
    linkText: '#ffffff',
    footer: 'rgba(255,255,255,0.4)',
    qrBtnColor: 'rgba(255,255,255,0.7)',
    qrBtnBorder: 'rgba(255,255,255,0.3)',
    avatarRing: 'rgba(255,255,255,0.3)',
  },
  natural: {
    bg: 'linear-gradient(135deg, #fef9ef 0%, #d1fae5 100%)',
    text: '#1a1a1a',
    subText: '#6b7280',
    bioText: '#374151',
    linkBg: 'rgba(255,255,255,0.8)',
    linkBgHover: '#ffffff',
    linkBorder: 'rgba(0,0,0,0.08)',
    linkText: '#1a1a1a',
    footer: '#9ca3af',
    qrBtnColor: '#9ca3af',
    qrBtnBorder: '#d1d5db',
    avatarRing: 'rgba(0,0,0,0.08)',
  },
};

export default function PublicLinksPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const [links, setLinks] = useState<Link[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", userId)
        .single();

      let resolvedUserId = userId;

      if (profileData) {
        setProfile(profileData);
        resolvedUserId = profileData.id;
        setOwnerId(profileData.id);
      } else {
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "get_links_by_slug",
          { slug: userId }
        );

        if (rpcError || !rpcData || rpcData.length === 0) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        resolvedUserId = rpcData[0].user_id;

        const { data: profileByUUID } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", resolvedUserId)
          .single();

        if (profileByUUID) setProfile(profileByUUID);
        setOwnerId(resolvedUserId);
      }

      const { data: linksData, error: linksError } = await supabase
        .from("bio_links")
        .select("*")
        .eq("user_id", resolvedUserId)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (linksError || !linksData) {
        setNotFound(true);
      } else {
        setLinks(linksData);
      }

      setLoading(false);
    };

    fetchData();
  }, [userId]);

  const handleLinkClick = (link: Link, e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (ownerId) {
      const now = new Date();
      supabase.from("link_clicks").insert({
        link_id: link.id,
        user_id: ownerId,
        clicked_at: now.toISOString(),
        day_of_week: now.getDay(),
        hour_of_day: now.getHours(),
        referrer: document.referrer || null,
      });
    }
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  const t = THEME_STYLES[profile?.theme ?? 'dark'] ?? THEME_STYLES.dark;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: THEME_STYLES.dark.bg }}>
        <div style={{ color: "#fff", fontSize: "16px" }}>読み込み中...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: THEME_STYLES.dark.bg }}>
        <div style={{ color: "#fff", fontSize: "36px", marginBottom: "16px" }}>404</div>
        <div style={{ color: "#94a3b8", fontSize: "16px" }}>このページは存在しません</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: t.bg, padding: "64px 16px" }}>
      <div style={{ maxWidth: "448px", margin: "0 auto" }}>
        {/* プロフィールヘッダー */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || profile.username}
              style={{ width: "96px", height: "96px", borderRadius: "50%", margin: "0 auto 16px", objectFit: "cover", display: "block", boxShadow: `0 0 0 4px ${t.avatarRing}` }}
            />
          ) : (
            <div style={{ width: "96px", height: "96px", borderRadius: "50%", margin: "0 auto 16px", background: "linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 4px ${t.avatarRing}` }}>
              {profile?.default_avatar ? (
                <span style={{ fontSize: "40px" }}>{profile.default_avatar}</span>
              ) : (
                <span style={{ color: "#fff", fontSize: "32px", fontWeight: "700" }}>
                  {(profile?.display_name || profile?.username || userId).charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          )}

          <h1 style={{ color: t.text, fontSize: "22px", fontWeight: "700", margin: "0 0 4px" }}>
            {profile?.display_name || profile?.username || userId}
          </h1>

          {profile?.username && (
            <p style={{ color: t.subText, fontSize: "13px", margin: "0 0 8px" }}>@{profile.username}</p>
          )}

          {profile?.bio && (
            <p style={{ color: t.bioText, fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
              {profile.bio}
            </p>
          )}
        </div>

        {/* リンク一覧 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {links.length === 0 ? (
            <p style={{ textAlign: "center", color: t.subText, fontSize: "14px" }}>
              まだリンクがありません
            </p>
          ) : (
            links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                onClick={(e) => handleLinkClick(link, e)}
                onMouseEnter={() => setHoveredLinkId(link.id)}
                onMouseLeave={() => setHoveredLinkId(null)}
                style={{
                  display: "block", width: "100%", textAlign: "center",
                  background: hoveredLinkId === link.id ? t.linkBgHover : t.linkBg,
                  border: `1px solid ${t.linkBorder}`,
                  borderRadius: "16px", padding: "16px 24px",
                  color: t.linkText, fontWeight: "600", fontSize: "15px",
                  textDecoration: "none",
                  transform: hoveredLinkId === link.id ? "scale(1.02)" : "scale(1)",
                  transition: "all 0.2s",
                  backdropFilter: "blur(8px)",
                  boxSizing: "border-box",
                }}
              >
                {link.title}
              </a>
            ))
          )}
        </div>

        {/* QRコードボタン */}
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <button
            onClick={() => setShowQR(true)}
            style={{ color: t.qrBtnColor, fontSize: "12px", border: `1px solid ${t.qrBtnBorder}`, borderRadius: "9999px", padding: "8px 16px", background: "transparent", cursor: "pointer" }}
          >
            QRコードを表示
          </button>
        </div>

        {/* フッター */}
        <p style={{ textAlign: "center", color: t.footer, fontSize: "11px", marginTop: "24px" }}>
          Powered by Affiliater Tool
        </p>

        {/* QRモーダル */}
        {showQR && (
          <div
            style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, background: "rgba(0,0,0,0.7)" }}
            onClick={() => setShowQR(false)}
          >
            <div
              style={{ background: "#fff", borderRadius: "16px", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", maxWidth: "320px", width: "90%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ color: "#1a1a1a", fontWeight: "600", fontSize: "14px" }}>QRコード</div>
              <QRCodeCanvas
                ref={qrRef}
                value={typeof window !== "undefined" ? window.location.href : ""}
                size={200}
                marginSize={2}
                level="M"
              />
              <p style={{ color: "#9ca3af", fontSize: "11px", textAlign: "center", wordBreak: "break-all", margin: 0 }}>
                {typeof window !== "undefined" ? window.location.href : ""}
              </p>
              <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                <button
                  onClick={() => {
                    const canvas = qrRef.current;
                    if (!canvas) return;
                    const link = document.createElement("a");
                    link.download = "qrcode.png";
                    link.href = canvas.toDataURL("image/png");
                    link.click();
                  }}
                  style={{ flex: 1, background: "#1a1a1a", color: "#fff", fontSize: "13px", fontWeight: "500", padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer" }}
                >
                  ダウンロード
                </button>
                <button
                  onClick={() => setShowQR(false)}
                  style={{ flex: 1, background: "#fff", color: "#6b7280", fontSize: "13px", padding: "10px", borderRadius: "8px", border: "1px solid #e5e7eb", cursor: "pointer" }}
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
