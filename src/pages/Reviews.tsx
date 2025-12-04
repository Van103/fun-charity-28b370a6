import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  ThumbsUp,
  MessageCircle,
  Award,
  Verified,
  Flag,
  Gift,
  Trophy,
  Send,
} from "lucide-react";

const reviews = [
  {
    id: 1,
    campaign: "Nước Sạch Cho Vùng Nông Thôn Việt Nam",
    reviewer: {
      name: "Sarah Nguyễn",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
      reputation: 4.9,
      verified: true,
    },
    rating: 5,
    content: "Tôi đã theo dõi chiến dịch này từ đầu và thực sự ấn tượng với sự minh bạch. Mọi chi tiêu đều có biên lai và bằng chứng on-chain. Báo cáo tác động rất chi tiết và có thể xác minh được.",
    date: "2 ngày trước",
    likes: 45,
    comments: 12,
    reward: "Huy Hiệu Vàng + 50 FUN",
    helpful: true,
  },
  {
    id: 2,
    campaign: "Giáo Dục Cho Trẻ Em Khó Khăn",
    reviewer: {
      name: "Minh Trần",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
      reputation: 4.7,
      verified: true,
    },
    rating: 4,
    content: "Chiến dịch tốt, team NGO rất phản hồi nhanh. Một số cập nhật hơi chậm nhưng tổng thể tác động rất tích cực. Khuyến nghị!",
    date: "5 ngày trước",
    likes: 28,
    comments: 5,
    reward: "Huy Hiệu Bạc + 25 FUN",
    helpful: true,
  },
  {
    id: 3,
    campaign: "Cứu Trợ Lương Thực Khẩn Cấp - Đông Phi",
    reviewer: {
      name: "Quỹ Tech4Good",
      avatar: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200",
      reputation: 5.0,
      verified: true,
    },
    rating: 5,
    content: "Là nhà tài trợ doanh nghiệp, chúng tôi đặc biệt đánh giá cao sự minh bạch trong báo cáo. Mọi việc sử dụng quỹ đều được theo dõi on-chain và có kiểm toán bên thứ ba. Đây là cách từ thiện nên được làm.",
    date: "1 tuần trước",
    likes: 89,
    comments: 23,
    reward: "Huy Hiệu Bạch Kim + 100 FUN",
    helpful: true,
  },
];

const Reviews = () => {
  const [newReview, setNewReview] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <Badge variant="gold" className="mb-4">
              <Star className="w-3.5 h-3.5 mr-1" />
              Đánh Giá Cộng Đồng
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Đánh Giá & <span className="gradient-text">Phần Thưởng</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Đánh giá công tâm, nhận phần thưởng xứng đáng. Mọi đánh giá đều đóng góp vào Hệ Thống Uy Tín.
            </p>
          </div>

          {/* Reward Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-8 luxury-border"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">Đánh Giá & Nhận Thưởng</h3>
                  <p className="text-sm text-muted-foreground">
                    Viết đánh giá chất lượng → Nhận Token Uy Tín + FUN Money
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <Badge variant="gold" className="mb-1">
                    <Trophy className="w-3 h-3 mr-1" />
                    Vàng
                  </Badge>
                  <p className="text-xs text-muted-foreground">50 FUN</p>
                </div>
                <div className="text-center">
                  <Badge variant="secondary" className="mb-1">
                    <Award className="w-3 h-3 mr-1" />
                    Bạc
                  </Badge>
                  <p className="text-xs text-muted-foreground">25 FUN</p>
                </div>
                <div className="text-center">
                  <Badge variant="muted" className="mb-1">
                    <Star className="w-3 h-3 mr-1" />
                    Đồng
                  </Badge>
                  <p className="text-xs text-muted-foreground">10 FUN</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-6">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-6 luxury-border"
                >
                  {/* Campaign */}
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="purple">{review.campaign}</Badge>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>

                  {/* Reviewer */}
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar>
                      <AvatarImage src={review.reviewer.avatar} />
                      <AvatarFallback>{review.reviewer.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.reviewer.name}</span>
                        {review.reviewer.verified && (
                          <Verified className="w-4 h-4 text-secondary" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating
                                ? "text-secondary fill-secondary"
                                : "text-muted"
                            }`}
                          />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({review.reviewer.reputation})
                        </span>
                      </div>
                    </div>
                    <div className="ml-auto">
                      <Badge variant="gold" className="text-xs">
                        <Gift className="w-3 h-3 mr-1" />
                        {review.reward}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-muted-foreground mb-4">{review.content}</p>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-secondary transition-colors">
                        <ThumbsUp className="w-4 h-4" />
                        {review.likes} Hữu ích
                      </button>
                      <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        {review.comments} Bình luận
                      </button>
                    </div>
                    <button className="text-sm text-muted-foreground hover:text-destructive transition-colors">
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Write Review */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6 luxury-border sticky top-24"
              >
                <h3 className="font-display font-semibold mb-4">Viết Đánh Giá</h3>

                {/* Rating */}
                <div className="mb-4">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Đánh Giá Của Bạn
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setSelectedRating(star)}
                        className="p-1"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            star <= selectedRating
                              ? "text-secondary fill-secondary"
                              : "text-muted hover:text-secondary"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div className="mb-4">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Nội Dung Đánh Giá
                  </label>
                  <Textarea
                    placeholder="Chia sẻ trải nghiệm của bạn với chiến dịch này..."
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>

                {/* Potential Reward */}
                <div className="bg-muted/50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-4 h-4 text-secondary" />
                    <span className="text-sm font-medium">Phần Thưởng Tiềm Năng</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Đánh giá chất lượng có thể nhận được Huy Hiệu Vàng + 50 token FUN dựa trên số phiếu hữu ích từ cộng đồng.
                  </p>
                </div>

                <Button variant="hero" className="w-full">
                  <Send className="w-4 h-4" />
                  Gửi Đánh Giá
                </Button>
              </motion.div>

              {/* Review Guidelines */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card p-6 luxury-border"
              >
                <h4 className="font-semibold mb-3">Hướng Dẫn Đánh Giá</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Verified className="w-4 h-4 text-success mt-0.5" />
                    Trung thực và xây dựng
                  </li>
                  <li className="flex items-start gap-2">
                    <Verified className="w-4 h-4 text-success mt-0.5" />
                    Tập trung vào sự thật có thể xác minh
                  </li>
                  <li className="flex items-start gap-2">
                    <Verified className="w-4 h-4 text-success mt-0.5" />
                    Đề cập tác động cụ thể nếu có
                  </li>
                  <li className="flex items-start gap-2">
                    <Verified className="w-4 h-4 text-success mt-0.5" />
                    Tôn trọng quyền riêng tư của người thụ hưởng
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default Reviews;
