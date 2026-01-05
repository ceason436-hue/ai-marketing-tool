import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { 
  Sparkles, 
  FileText, 
  Video, 
  Image, 
  Zap, 
  Target, 
  Clock,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  const features = [
    {
      icon: FileText,
      title: "招商文案",
      description: "一键生成结构完整的招商引资文案，包含项目概览、核心优势、合作模式等要素",
    },
    {
      icon: Video,
      title: "短视频脚本",
      description: "生成包含场景、画面、台词、BGM建议的专业短视频脚本",
    },
    {
      icon: Image,
      title: "宣传海报",
      description: "AI自动设计生成包含标题、副标题、正文的精美宣传海报",
    },
    {
      icon: Zap,
      title: "多平台适配",
      description: "一键生成适配微信、小红书、抖音、微博等平台的内容版本",
    },
  ];

  const benefits = [
    { icon: Clock, text: "5分钟产出3类以上渠道内容" },
    { icon: Target, text: "内容贴合场景调性，信息传递准确" },
    { icon: Zap, text: "缩短物料制作周期80%以上" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="container py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              AI驱动的营销内容生成平台
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              让营销内容创作
              <span className="text-primary block mt-2">简单高效</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              通过1-2句提示词，快速生成招商文案、短视频脚本、宣传海报等多渠道营销物料，
              降低创作门槛，提升营销效率
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link href="/generate">
                  <Button size="lg" className="gap-2 gradient-primary text-white border-0">
                    开始创作
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Button size="lg" className="gap-2 gradient-primary text-white border-0" asChild>
                  <a 
                    href={getLoginUrl()}
                    onClick={(e) => {
                      // Force full page navigation to bypass client-side router
                      e.preventDefault();
                      window.location.href = getLoginUrl();
                    }}
                  >
                    免费开始
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </Button>
              )}
              <Link href="/generate">
                <Button size="lg" variant="outline" className="gap-2">
                  了解更多
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </section>

      {/* Benefits Section */}
      <section className="py-12 border-b">
        <div className="container">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              一站式营销内容生成
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              覆盖招商引资、产品推广、活动宣传等多种营销场景，满足全渠道内容需求
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              简单三步，完成创作
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              无需专业技能，任何人都能快速上手
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "输入需求", desc: "用1-2句话描述您的营销需求，选择内容风格" },
              { step: "02", title: "AI生成", desc: "系统自动生成招商文案、视频脚本、宣传海报" },
              { step: "03", title: "编辑导出", desc: "在线编辑微调内容，一键导出多种格式" },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full gradient-primary text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container">
          <Card className="gradient-primary text-white overflow-hidden">
            <CardContent className="p-8 md:p-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                准备好提升营销效率了吗？
              </h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                立即开始使用AI营销工具，让内容创作变得简单高效
              </p>
              {isAuthenticated ? (
                <Link href="/generate">
                  <Button size="lg" variant="secondary" className="gap-2">
                    开始创作
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Button size="lg" variant="secondary" className="gap-2" asChild>
                  <a href={getLoginUrl()}>
                    免费注册
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 AI营销赋能工具. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
