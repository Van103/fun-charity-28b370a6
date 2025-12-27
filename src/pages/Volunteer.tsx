import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Navbar } from '@/components/layout/Navbar';
import { 
  Heart, 
  Users, 
  Clock, 
  MapPin, 
  Star, 
  Award, 
  CheckCircle, 
  Calendar,
  Search,
  Filter,
  Briefcase,
  GraduationCap,
  Stethoscope,
  Leaf,
  Home,
  BookOpen,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Target,
  HandHeart,
  Plus,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Helmet } from 'react-helmet-async';

// Skill categories
const skillCategories = [
  { id: 'education', nameVi: 'Giáo dục', nameEn: 'Education', icon: GraduationCap, color: 'from-blue-500 to-cyan-500' },
  { id: 'healthcare', nameVi: 'Y tế', nameEn: 'Healthcare', icon: Stethoscope, color: 'from-red-500 to-pink-500' },
  { id: 'environment', nameVi: 'Môi trường', nameEn: 'Environment', icon: Leaf, color: 'from-green-500 to-emerald-500' },
  { id: 'community', nameVi: 'Cộng đồng', nameEn: 'Community', icon: Home, color: 'from-purple-500 to-violet-500' },
  { id: 'mentoring', nameVi: 'Hướng dẫn', nameEn: 'Mentoring', icon: BookOpen, color: 'from-orange-500 to-amber-500' },
  { id: 'technology', nameVi: 'Công nghệ', nameEn: 'Technology', icon: Briefcase, color: 'from-indigo-500 to-blue-500' },
];

// Sample volunteer tasks
const sampleTasks = [
  {
    id: '1',
    title: 'Dạy học miễn phí cho trẻ em vùng cao',
    titleEn: 'Free tutoring for highland children',
    description: 'Hỗ trợ dạy học cho các em nhỏ vùng cao trong dịp hè',
    descriptionEn: 'Support teaching for children in highland areas during summer',
    category: 'education',
    location: 'Hà Giang, Việt Nam',
    duration: '2 tuần',
    durationEn: '2 weeks',
    volunteers_needed: 10,
    volunteers_registered: 7,
    urgency: 'high',
    skills_required: ['Teaching', 'Vietnamese', 'Patience'],
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
    posted_at: '2024-01-15',
  },
  {
    id: '2',
    title: 'Chiến dịch trồng cây xanh',
    titleEn: 'Tree planting campaign',
    description: 'Tham gia trồng 1000 cây xanh tại các vùng đồi trọc',
    descriptionEn: 'Join planting 1000 trees in deforested areas',
    category: 'environment',
    location: 'Đà Lạt, Việt Nam',
    duration: '1 ngày',
    durationEn: '1 day',
    volunteers_needed: 50,
    volunteers_registered: 35,
    urgency: 'medium',
    skills_required: ['Physical fitness', 'Teamwork'],
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
    posted_at: '2024-01-10',
  },
  {
    id: '3',
    title: 'Khám bệnh miễn phí cho người nghèo',
    titleEn: 'Free medical checkup for the poor',
    description: 'Tổ chức đoàn y tế khám chữa bệnh miễn phí',
    descriptionEn: 'Organize medical team for free health checkups',
    category: 'healthcare',
    location: 'Cần Thơ, Việt Nam',
    duration: '3 ngày',
    durationEn: '3 days',
    volunteers_needed: 20,
    volunteers_registered: 18,
    urgency: 'critical',
    skills_required: ['Medical', 'First Aid', 'Communication'],
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400',
    posted_at: '2024-01-20',
  },
  {
    id: '4',
    title: 'Xây nhà tình thương',
    titleEn: 'Build charity houses',
    description: 'Cùng xây dựng những ngôi nhà cho người nghèo',
    descriptionEn: 'Build houses for the poor together',
    category: 'community',
    location: 'Nghệ An, Việt Nam',
    duration: '1 tuần',
    durationEn: '1 week',
    volunteers_needed: 30,
    volunteers_registered: 12,
    urgency: 'medium',
    skills_required: ['Construction', 'Physical fitness', 'Teamwork'],
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400',
    posted_at: '2024-01-08',
  },
  {
    id: '5',
    title: 'Hướng dẫn kỹ năng mềm cho sinh viên',
    titleEn: 'Soft skills mentoring for students',
    description: 'Chia sẻ kinh nghiệm và kỹ năng mềm cho sinh viên',
    descriptionEn: 'Share experience and soft skills with students',
    category: 'mentoring',
    location: 'Online',
    duration: '2 giờ/tuần',
    durationEn: '2 hours/week',
    volunteers_needed: 15,
    volunteers_registered: 8,
    urgency: 'low',
    skills_required: ['Communication', 'Leadership', 'Mentoring'],
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400',
    posted_at: '2024-01-18',
  },
  {
    id: '6',
    title: 'Hỗ trợ IT cho các tổ chức từ thiện',
    titleEn: 'IT support for charities',
    description: 'Cung cấp hỗ trợ kỹ thuật cho các tổ chức phi lợi nhuận',
    descriptionEn: 'Provide technical support for non-profit organizations',
    category: 'technology',
    location: 'TP. Hồ Chí Minh, Việt Nam',
    duration: 'Linh hoạt',
    durationEn: 'Flexible',
    volunteers_needed: 5,
    volunteers_registered: 3,
    urgency: 'low',
    skills_required: ['Programming', 'Web Development', 'Problem Solving'],
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400',
    posted_at: '2024-01-12',
  },
];

const Volunteer = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [userSkills, setUserSkills] = useState<string[]>(['Teaching', 'Communication', 'Leadership']);

  // User stats (mock data)
  const volunteerStats = {
    hoursCompleted: 48,
    tasksCompleted: 12,
    impactScore: 850,
    rank: 'Tình nguyện viên Vàng',
    rankEn: 'Gold Volunteer',
    nextRankPoints: 1000,
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const filteredTasks = sampleTasks.filter(task => {
    const matchesSearch = 
      (language === 'vi' ? task.title : task.titleEn).toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || task.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getUrgencyBadge = (urgency: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      critical: { label: language === 'vi' ? 'Khẩn cấp' : 'Critical', variant: 'destructive' },
      high: { label: language === 'vi' ? 'Cao' : 'High', variant: 'default' },
      medium: { label: language === 'vi' ? 'Trung bình' : 'Medium', variant: 'secondary' },
      low: { label: language === 'vi' ? 'Thấp' : 'Low', variant: 'secondary' },
    };
    const { label, variant } = config[urgency] || config.medium;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getCategoryInfo = (categoryId: string) => {
    return skillCategories.find(c => c.id === categoryId);
  };

  const handleRegister = (taskId: string) => {
    if (!user) {
      toast({
        title: language === 'vi' ? 'Vui lòng đăng nhập' : 'Please login',
        description: language === 'vi' 
          ? 'Bạn cần đăng nhập để đăng ký tình nguyện' 
          : 'You need to login to register as a volunteer',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    toast({
      title: language === 'vi' ? 'Đăng ký thành công!' : 'Registration successful!',
      description: language === 'vi' 
        ? 'Bạn đã đăng ký tham gia nhiệm vụ này' 
        : 'You have registered for this task',
    });
  };

  return (
    <>
      <Helmet>
        <title>{language === 'vi' ? 'Trung tâm Tình nguyện' : 'Volunteer Hub'}</title>
        <meta name="description" content={language === 'vi' ? 'Tham gia các hoạt động tình nguyện và đóng góp cho cộng đồng' : 'Join volunteer activities and contribute to the community'} />
      </Helmet>

      <Navbar />

      <div className="min-h-screen bg-background pt-20 pb-10">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-purple-600 p-8 mb-8 text-white"
          >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200')] opacity-20 bg-cover bg-center" />
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      <HandHeart className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold">
                      {language === 'vi' ? 'Trung tâm Tình nguyện' : 'Volunteer Hub'}
                    </h1>
                  </div>
                  <p className="text-white/80 text-lg max-w-xl">
                    {language === 'vi' 
                      ? 'Kết nối những tấm lòng, lan tỏa yêu thương. Tham gia các hoạt động tình nguyện và tạo nên sự khác biệt.' 
                      : 'Connect hearts, spread love. Join volunteer activities and make a difference.'}
                  </p>
                </div>
                
                {user && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/10 backdrop-blur-md rounded-xl p-4 min-w-[280px]"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-12 h-12 border-2 border-white/30">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback className="bg-white/20">
                          <User className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{profile?.full_name || 'Volunteer'}</p>
                        <div className="flex items-center gap-1 text-sm text-white/70">
                          <Award className="w-4 h-4" />
                          <span>{language === 'vi' ? volunteerStats.rank : volunteerStats.rankEn}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">{language === 'vi' ? 'Điểm đóng góp' : 'Impact Score'}</span>
                        <span className="font-semibold">{volunteerStats.impactScore}/{volunteerStats.nextRankPoints}</span>
                      </div>
                      <Progress value={(volunteerStats.impactScore / volunteerStats.nextRankPoints) * 100} className="h-2 bg-white/20" />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          {user && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{volunteerStats.hoursCompleted}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'vi' ? 'Giờ tình nguyện' : 'Hours volunteered'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{volunteerStats.tasksCompleted}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'vi' ? 'Nhiệm vụ hoàn thành' : 'Tasks completed'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 text-white">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{volunteerStats.impactScore}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'vi' ? 'Điểm đóng góp' : 'Impact score'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">Top 5%</p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'vi' ? 'Xếp hạng' : 'Ranking'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-card/50 backdrop-blur-sm border border-border/50 p-1">
              <TabsTrigger value="tasks" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Target className="w-4 h-4" />
                {language === 'vi' ? 'Nhiệm vụ' : 'Tasks'}
              </TabsTrigger>
              <TabsTrigger value="skills" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Sparkles className="w-4 h-4" />
                {language === 'vi' ? 'Kỹ năng' : 'Skills'}
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Award className="w-4 h-4" />
                {language === 'vi' ? 'Bảng xếp hạng' : 'Leaderboard'}
              </TabsTrigger>
            </TabsList>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-6">
              {/* Search & Filter */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder={language === 'vi' ? 'Tìm kiếm nhiệm vụ...' : 'Search tasks...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-card/50 border-border/50"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="whitespace-nowrap"
                  >
                    {language === 'vi' ? 'Tất cả' : 'All'}
                  </Button>
                  {skillCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className="gap-1 whitespace-nowrap"
                      >
                        <Icon className="w-4 h-4" />
                        {language === 'vi' ? category.nameVi : category.nameEn}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Tasks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredTasks.map((task, index) => {
                    const categoryInfo = getCategoryInfo(task.category);
                    const CategoryIcon = categoryInfo?.icon || Heart;
                    const progressPercent = (task.volunteers_registered / task.volunteers_needed) * 100;

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-xl hover:border-primary/30 transition-all duration-300 group h-full flex flex-col">
                          {/* Image */}
                          <div className="relative h-48 overflow-hidden">
                            <img 
                              src={task.image} 
                              alt={language === 'vi' ? task.title : task.titleEn}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute top-3 left-3 flex items-center gap-2">
                              <div className={`p-2 rounded-lg bg-gradient-to-br ${categoryInfo?.color} text-white`}>
                                <CategoryIcon className="w-4 h-4" />
                              </div>
                              {getUrgencyBadge(task.urgency)}
                            </div>
                            <div className="absolute bottom-3 left-3 right-3">
                              <h3 className="font-bold text-white text-lg line-clamp-2">
                                {language === 'vi' ? task.title : task.titleEn}
                              </h3>
                            </div>
                          </div>

                          {/* Content */}
                          <CardContent className="p-4 flex-1 flex flex-col">
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                              {language === 'vi' ? task.description : task.descriptionEn}
                            </p>

                            <div className="space-y-3 mb-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span>{task.location}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4 text-primary" />
                                <span>{language === 'vi' ? task.duration : task.durationEn}</span>
                              </div>
                            </div>

                            {/* Skills */}
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {task.skills_required.slice(0, 3).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>

                            {/* Progress */}
                            <div className="mt-auto space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {task.volunteers_registered}/{task.volunteers_needed}
                                </span>
                                <span className="font-medium text-primary">{Math.round(progressPercent)}%</span>
                              </div>
                              <Progress value={progressPercent} className="h-2" />
                            </div>

                            {/* Actions */}
                            <Button 
                              className="w-full mt-4 gap-2 group/btn"
                              onClick={() => handleRegister(task.id)}
                            >
                              <Plus className="w-4 h-4" />
                              {language === 'vi' ? 'Đăng ký tham gia' : 'Register now'}
                              <ChevronRight className="w-4 h-4 opacity-0 -ml-2 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all" />
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* My Skills */}
                <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      {language === 'vi' ? 'Kỹ năng của tôi' : 'My Skills'}
                    </CardTitle>
                    <CardDescription>
                      {language === 'vi' 
                        ? 'Các kỹ năng bạn có thể đóng góp' 
                        : 'Skills you can contribute'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {userSkills.map((skill) => (
                        <Badge key={skill} variant="default" className="px-4 py-2 text-sm">
                          {skill}
                        </Badge>
                      ))}
                      <Button variant="outline" size="sm" className="gap-1">
                        <Plus className="w-4 h-4" />
                        {language === 'vi' ? 'Thêm kỹ năng' : 'Add skill'}
                      </Button>
                    </div>

                    <h4 className="font-semibold mb-4">
                      {language === 'vi' ? 'Lĩnh vực chuyên môn' : 'Expertise Areas'}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {skillCategories.map((category) => {
                        const Icon = category.icon;
                        return (
                          <motion.div
                            key={category.id}
                            whileHover={{ scale: 1.02 }}
                            className={`p-4 rounded-xl bg-gradient-to-br ${category.color} text-white cursor-pointer hover:shadow-lg transition-shadow`}
                          >
                            <Icon className="w-8 h-8 mb-2" />
                            <p className="font-semibold">
                              {language === 'vi' ? category.nameVi : category.nameEn}
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Achievements */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" />
                      {language === 'vi' ? 'Thành tựu' : 'Achievements'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { icon: Star, name: language === 'vi' ? 'Ngôi sao mới nổi' : 'Rising Star', earned: true },
                      { icon: Heart, name: language === 'vi' ? 'Trái tim vàng' : 'Golden Heart', earned: true },
                      { icon: Users, name: language === 'vi' ? 'Lãnh đạo đội nhóm' : 'Team Leader', earned: false },
                      { icon: Target, name: language === 'vi' ? 'Hoàn thành 50 nhiệm vụ' : '50 Tasks Complete', earned: false },
                    ].map((badge, index) => {
                      const Icon = badge.icon;
                      return (
                        <div 
                          key={index}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            badge.earned 
                              ? 'bg-primary/10 border border-primary/20' 
                              : 'bg-muted/50 opacity-60'
                          }`}
                        >
                          <div className={`p-2 rounded-full ${badge.earned ? 'bg-primary text-white' : 'bg-muted'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className={badge.earned ? 'font-medium' : 'text-muted-foreground'}>
                            {badge.name}
                          </span>
                          {badge.earned && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard" className="space-y-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    {language === 'vi' ? 'Bảng xếp hạng tình nguyện viên' : 'Volunteer Leaderboard'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'vi' 
                      ? 'Những người đóng góp nhiều nhất trong tháng này' 
                      : 'Top contributors this month'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {[
                        { rank: 1, name: 'Nguyễn Văn An', score: 1250, avatar: 'https://i.pravatar.cc/150?img=1', hours: 65 },
                        { rank: 2, name: 'Trần Thị Bình', score: 1180, avatar: 'https://i.pravatar.cc/150?img=2', hours: 58 },
                        { rank: 3, name: 'Lê Hoàng Cường', score: 1050, avatar: 'https://i.pravatar.cc/150?img=3', hours: 52 },
                        { rank: 4, name: 'Phạm Minh Đức', score: 980, avatar: 'https://i.pravatar.cc/150?img=4', hours: 48 },
                        { rank: 5, name: 'Hoàng Thu Hà', score: 920, avatar: 'https://i.pravatar.cc/150?img=5', hours: 45 },
                        { rank: 6, name: 'Võ Văn Hùng', score: 850, avatar: 'https://i.pravatar.cc/150?img=6', hours: 42 },
                        { rank: 7, name: 'Đỗ Thị Lan', score: 780, avatar: 'https://i.pravatar.cc/150?img=7', hours: 38 },
                        { rank: 8, name: 'Bùi Quang Minh', score: 720, avatar: 'https://i.pravatar.cc/150?img=8', hours: 35 },
                      ].map((person) => (
                        <motion.div
                          key={person.rank}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: person.rank * 0.05 }}
                          className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                            person.rank <= 3 
                              ? 'bg-gradient-to-r from-primary/10 to-transparent border border-primary/20' 
                              : 'bg-background/50 hover:bg-background/80'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            person.rank === 1 ? 'bg-amber-500 text-white' :
                            person.rank === 2 ? 'bg-gray-400 text-white' :
                            person.rank === 3 ? 'bg-amber-700 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {person.rank}
                          </div>
                          <Avatar className="w-12 h-12 border-2 border-primary/20">
                            <AvatarImage src={person.avatar} />
                            <AvatarFallback>{person.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{person.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {person.hours} {language === 'vi' ? 'giờ' : 'hours'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{person.score}</p>
                            <p className="text-xs text-muted-foreground">
                              {language === 'vi' ? 'điểm' : 'points'}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Volunteer;
