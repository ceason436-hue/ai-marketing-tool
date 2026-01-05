import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Sparkles, 
  Loader2, 
  FileText, 
  Video, 
  Image,
  Lightbulb
} from "lucide-react";

const STYLE_OPTIONS = [
  { value: "专业稳重", label: "专业稳重", desc: "适合招商、企业宣传" },
  { value: "活泼创意", label: "活泼创意", desc: "适合年轻化品牌、促销活动" },
  { value: "科技感", label: "科技感", desc: "适合科技产品、创新项目" },
  { value: "简约大气", label: "简约大气", desc: "适合高端品牌、精品推广" },
  { value: "温馨亲切", label: "温馨亲切", desc: "适合生活服务、社区活动" },
] as const;

const EXAMPLE_PROMPTS = [
  "为XX高新科技产业园撰写招商推文，重点突出区位优势、政策扶持和完善的配套设施",
  "为即将发布的智能家居助手X1产品生成宣传物料，强调AI语音交互和全屋智能联动功能",
  "围绕五一劳动节主题，为在线教育课程策划促销活动，主打知识充电概念",
  "为新开业的健身房生成开业宣传内容，突出专业教练团队和先进设备",
];

export default function Generate() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<string>("专业稳重");

  const generateMutation = trpc.generate.content.useMutation({
    onSuccess: (data) => {
      toast.success("内容生成成功！");
      setLocation(`/result/${data.id}`);
    },
    onError: (error) => {
      toast.error(`生成失败: ${error.message}`);
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("请输入营销需求描述");
      return;
    }
    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }
    generateMutation.mutate({ 
      prompt: prompt.trim(), 
      style: style as typeof STYLE_OPTIONS[number]["value"]
    });
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <CardTitle>请先登录</CardTitle>
              <CardDescription>登录后即可使用AI内容生成功能</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild>
                <a href={getLoginUrl()}>立即登录</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold">
              AI营销内容生成
            </h1>
            <p className="text-muted-foreground text-lg">
              输入您的营销需求，一键生成招商文案、短视频脚本和宣传海报
            </p>
          </div>

          {/* Main Input Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                描述您的营销需求
              </CardTitle>
              <CardDescription>
                用1-2句话描述您想要生成的营销内容，越具体效果越好
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Prompt Input */}
              <div className="space-y-2">
                <Label htmlFor="prompt">营销需求描述</Label>
                <Textarea
                  id="prompt"
                  placeholder="例如：为XX高新科技产业园撰写招商推文，重点突出区位优势、政策扶持和完善的配套设施"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                  maxLength={2000}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {prompt.length}/2000
                </div>
              </div>

              {/* Style Selection */}
              <div className="space-y-2">
                <Label htmlFor="style">内容风格</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger id="style">
                    <SelectValue placeholder="选择内容风格" />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerate} 
                disabled={generateMutation.isPending || !prompt.trim()}
                className="w-full gap-2 gradient-primary text-white border-0"
                size="lg"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    正在生成...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    一键生成
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Example Prompts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                示例提示词
              </CardTitle>
              <CardDescription>
                点击下方示例快速开始
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {EXAMPLE_PROMPTS.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Output Preview Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-muted/30">
              <CardContent className="p-6 text-center">
                <FileText className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">招商文案</h3>
                <p className="text-sm text-muted-foreground">
                  结构完整的招商引资文案
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-6 text-center">
                <Video className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">短视频脚本</h3>
                <p className="text-sm text-muted-foreground">
                  场景、台词、BGM建议
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-6 text-center">
                <Image className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">宣传海报</h3>
                <p className="text-sm text-muted-foreground">
                  AI生成精美海报图片
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
