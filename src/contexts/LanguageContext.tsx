import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "vi";

interface Translations {
  [key: string]: {
    en: string;
    vi: string;
  };
}

// Core translations - expandable
export const translations: Translations = {
  // Navigation
  "nav.home": { en: "Home", vi: "Trang chủ" },
  "nav.campaigns": { en: "Campaigns", vi: "Chiến dịch" },
  "nav.needsMap": { en: "Needs Map", vi: "Bản đồ nhu cầu" },
  "nav.overview": { en: "Overview", vi: "Tổng quan" },
  "nav.platform": { en: "Platform", vi: "Nền tảng" },
  "nav.reviews": { en: "Reviews", vi: "Đánh giá" },
  "nav.profiles": { en: "Profiles", vi: "Hồ sơ" },
  "nav.communityProfiles": { en: "Community Profiles", vi: "Hồ sơ cộng đồng" },
  "nav.search": { en: "Search on FUN Charity", vi: "Tìm kiếm trên FUN Charity" },
  
  // Left Sidebar
  "sidebar.ecosystem": { en: "F.U. Ecosystem Platforms", vi: "Các Platform F.U. Ecosystem" },
  "sidebar.comingSoon": { en: "Coming soon", vi: "Sắp ra mắt" },
  "sidebar.shortcuts": { en: "Your shortcuts", vi: "Lối tắt của bạn" },
  "sidebar.edit": { en: "Edit", vi: "Chỉnh sửa" },
  "sidebar.users": { en: "Users", vi: "Người dùng" },
  
  // Menu items
  "menu.profile": { en: "Fun Profile", vi: "Fun Profile" },
  "menu.farm": { en: "Fun Farm", vi: "Fun Farm" },
  "menu.planet": { en: "Fun Planet", vi: "Fun Planet" },
  "menu.play": { en: "Fun Play", vi: "Fun Play" },
  "menu.chat": { en: "Fun Chat", vi: "Fun Chat" },
  "menu.academy": { en: "Fun Academy", vi: "Fun Academy" },
  "menu.trading": { en: "Fun Trading", vi: "Fun Trading" },
  "menu.investment": { en: "Fun Investment", vi: "Fun Investment" },
  "menu.life": { en: "Fun Life", vi: "Fun Life" },
  "menu.legal": { en: "Fun Legal", vi: "Fun Legal" },
  
  // Right Sidebar - Honor Board
  "honor.title": { en: "HONOR BOARD", vi: "BẢNG VINH DANH" },
  "honor.topProfile": { en: "Top Profile", vi: "Hồ Sơ Nổi Bật" },
  "honor.earnings": { en: "Earnings", vi: "Thu Nhập" },
  "honor.posts": { en: "Posts", vi: "Bài Viết" },
  "honor.friendsVideos": { en: "Friends' Videos", vi: "Video Bạn Bè" },
  "honor.nftCount": { en: "NFT Count", vi: "Số Lượng NFT" },
  "ranking.title": { en: "TOP RANKING", vi: "XẾP HẠNG" },
  "birthday.title": { en: "Birthdays", vi: "Sinh nhật" },
  "birthday.today": { en: "Today is the birthday of", vi: "Hôm nay là sinh nhật của" },
  "birthday.others": { en: "others", vi: "người khác" },
  "contacts.title": { en: "Contacts", vi: "Người liên hệ" },
  "groups.title": { en: "Group Chats", vi: "Cuộc trò chuyện nhóm" },
  "groups.add": { en: "Add new group", vi: "Thêm nhóm mới" },
  "groups.earth": { en: "Mother Earth Service Group", vi: "Nhóm Phụng Sự Mẹ Trái Đất" },
  
  // Create Post
  "post.thinking": { en: "What's on your mind?", vi: "Bạn đang nghĩ gì?" },
  "post.photo": { en: "Photo", vi: "Ảnh" },
  "post.video": { en: "Video", vi: "Video" },
  "post.ai": { en: "AI", vi: "AI" },
  "post.submit": { en: "POST", vi: "ĐĂNG" },
  "post.comment": { en: "Comment", vi: "Bình luận" },
  "post.comments": { en: "comments", vi: "bình luận" },
  "post.people": { en: "people", vi: "người" },
  "post.shares": { en: "shares", vi: "chia sẻ" },
  "post.at": { en: "at", vi: "tại" },
  
  // AI Content Generation
  "ai.title": { en: "Enjoy AI - Auto Generate Content", vi: "Enjoy AI - Tạo nội dung tự động" },
  "ai.topic": { en: "Topic you want to write about (optional)", vi: "Chủ đề bạn muốn viết về (tùy chọn)" },
  "ai.placeholder": { en: "e.g., Help highland children, protect the environment...", vi: "Ví dụ: Giúp đỡ trẻ em vùng cao, bảo vệ môi trường..." },
  "ai.empty": { en: "Leave empty for AI to create charity content", vi: "Để trống để AI tự tạo nội dung về hoạt động từ thiện" },
  "ai.generate": { en: "Generate with AI", vi: "Tạo nội dung với AI" },
  "ai.generating": { en: "Generating content...", vi: "Đang tạo nội dung..." },
  "ai.retry": { en: "Retry", vi: "Thử lại" },
  "ai.success": { en: "Content created successfully!", vi: "Tạo nội dung thành công!" },
  "ai.successDesc": { en: "AI has created content for you. You can edit before posting.", vi: "AI đã tạo nội dung cho bạn. Bạn có thể chỉnh sửa trước khi đăng." },
  "ai.successWithImage": { en: "AI has created content and image for you. You can edit before posting.", vi: "AI đã tạo nội dung và hình ảnh cho bạn. Bạn có thể chỉnh sửa trước khi đăng." },
  "ai.error": { en: "Content generation error", vi: "Lỗi tạo nội dung" },
  "ai.errorGeneric": { en: "Could not generate content. Please try again.", vi: "Không thể tạo nội dung. Vui lòng thử lại." },
  "ai.errorRateLimit": { en: "Too many requests. Please wait a moment and try again.", vi: "Quá nhiều yêu cầu. Vui lòng đợi một lát và thử lại." },
  "ai.errorPayment": { en: "Need to add more credits to use AI.", vi: "Cần nạp thêm credits để sử dụng AI." },
  "ai.errorServer": { en: "Server error. Please try again later.", vi: "Lỗi máy chủ. Vui lòng thử lại sau." },
  
  // Search
  "search.searching": { en: "Searching...", vi: "Đang tìm kiếm..." },
  "search.noResults": { en: "No results found", vi: "Không tìm thấy kết quả" },
  "search.user": { en: "User", vi: "Người dùng" },
  
  // Common
  "common.loading": { en: "Loading...", vi: "Đang tải..." },
  "common.error": { en: "Error", vi: "Lỗi" },
  "common.cancel": { en: "Cancel", vi: "Hủy" },
  "common.save": { en: "Save", vi: "Lưu" },
  "common.delete": { en: "Delete", vi: "Xóa" },
  "common.edit": { en: "Edit", vi: "Chỉnh sửa" },
  "common.close": { en: "Close", vi: "Đóng" },
  "common.settings": { en: "Interface Settings", vi: "Cài đặt giao diện" },
  "common.login": { en: "Login", vi: "Đăng Nhập" },
  "common.donate": { en: "Donate", vi: "Quyên Góp" },
  "common.connectWallet": { en: "Connect Wallet", vi: "Kết nối ví" },
  "common.walletPrefix": { en: "Wallet:", vi: "Ví:" },
  
  // User menu
  "user.profile": { en: "Personal Profile", vi: "Hồ sơ cá nhân" },
  "user.wallet": { en: "Show Wallet", vi: "Thể hiện ví" },
  "user.logout": { en: "Logout", vi: "Đăng xuất" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem("app-language");
    return (stored as Language) || "vi";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
