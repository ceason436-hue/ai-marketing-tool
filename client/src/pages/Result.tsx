import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getLoginUrl } from "@/const";
import { useParams, Link } from "wouter";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  FileText, 
  Video, 
  Image,
  Download,
  Edit3,
  Save,
  Loader2,
  ArrowLeft,
  Share2,
  RefreshCw,
  CheckCircle2
} from "lucide-react";

interface ProspectusContent {
  title: string;
  sections: Array<{ subtitle: string; text: string }>;
}

interface VideoScriptContent {
  title: string;
  totalDuration: number;
  scenes: Array<{
    sceneNumber: number;
    duration: number;
    visuals: string;
    voiceover: string;
    bgmSuggestion: string;
  }>;
}

interface PosterElements {
  mainHeadline: string;
  subHeadline: string;
  bodyText: string;
  callToAction: string;
}

const PLATFORM_OPTIONS = [
  { value: "微信公众号", label: "微信公众号" },
  { value: "小红书", label: "小红书" },
  { value: "抖音", label: "抖音" },
  { value: "微博", label: "微博" },
  { value: "知乎", label: "知乎" },
] as const;

export default function Result() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProspectus, setEditedProspectus] = useState<ProspectusContent | null>(null);
  const [editedVideoScript, setEditedVideoScript] = useState<VideoScriptContent | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const { data: history, isLoading, refetch } = trpc.history.get.useQuery(
    { id: parseInt(id || "0") },
    { enabled: !!id && isAuthenticated }
  );

  const updateMutation = trpc.history.update.useMutation({
    onSuccess: () => {
      toast.success("内容已保存");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`保存失败: ${error.message}`);
    },
  });

  const posterMutation = trpc.generate.poster.useMutation({
    onSuccess: () => {
      toast.success("海报生成成功！");
      refetch();
    },
    onError: (error) => {
      toast.error(`海报生成失败: ${error.message}`);
    },
  });

  const platformMutation = trpc.generate.platformContent.useMutation({
    onSuccess: () => {
      toast.success("多平台内容生成成功！");
      refetch();
    },
    onError: (error) => {
      toast.error(`生成失败: ${error.message}`);
    },
  });

  useEffect(() => {
    if (history) {
      setEditedProspectus(history.prospectusContent as ProspectusContent);
      setEditedVideoScript(history.videoScriptContent as VideoScriptContent);
    }
  }, [history]);

  const handleSave = () => {
    if (!id) return;
    updateMutation.mutate({
      id: parseInt(id),
      prospectusContent: editedProspectus,
      videoScriptContent: editedVideoScript,
    });
  };

  const handleGeneratePoster = () => {
    if (!id || !history) return;
    const posterElements = history.posterElements as PosterElements;
    posterMutation.mutate({
      historyId: parseInt(id),
      mainHeadline: posterElements.mainHeadline,
      subHeadline: posterElements.subHeadline,
      bodyText: posterElements.bodyText,
      style: history.style as any,
    });
  };

  const handleGeneratePlatformContent = () => {
    if (!id || !history || selectedPlatforms.length === 0) {
      toast.error("请选择至少一个平台");
      return;
    }
    const prospectus = history.prospectusContent as ProspectusContent;
    const originalContent = prospectus.sections.map(s => `${s.subtitle}\n${s.text}`).join("\n\n");
    platformMutation.mutate({
      historyId: parseInt(id),
      originalContent,
      platforms: selectedPlatforms as any,
      style: history.style as any,
    });
  };

  const exportAsText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportProspectus = () => {
    if (!editedProspectus) return;
    const content = `${editedProspectus.title}\n\n${editedProspectus.sections.map(s => `${s.subtitle}\n${s.text}`).join("\n\n")}`;
    exportAsText(content, "招商文案.txt");
  };

  const exportVideoScript = () => {
    if (!editedVideoScript) return;
    const content = `${editedVideoScript.title}\n总时长: ${editedVideoScript.totalDuration}秒\n\n${editedVideoScript.scenes.map(s => 
      `场景${s.sceneNumber} (${s.duration}秒)\n画面: ${s.visuals}\n旁白: ${s.voiceover}\nBGM: ${s.bgmSuggestion}`
    ).join("\n\n")}`;
    exportAsText(content, "短视频脚本.txt");
  };

  if (authLoading || isLoading) {
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
              <CardDescription>登录后查看生成结果</CardDescription>
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

  if (!history) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <CardTitle>未找到内容</CardTitle>
              <CardDescription>该生成记录不存在或已被删除</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Link href="/generate">
                <Button>返回生成页面</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const prospectus = editedProspectus || (history.prospectusContent as ProspectusContent);
  const videoScript = editedVideoScript || (history.videoScriptContent as VideoScriptContent);
  const posterElements = history.posterElements as PosterElements;
  const platformContents = history.platformContents as Record<string, any> | null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/generate">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">生成结果</h1>
                <p className="text-muted-foreground text-sm">
                  {history.prompt.slice(0, 50)}...
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    取消
                  </Button>
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    保存
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  编辑
                </Button>
              )}
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="prospectus" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="prospectus" className="gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">招商文案</span>
              </TabsTrigger>
              <TabsTrigger value="video" className="gap-2">
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">视频脚本</span>
              </TabsTrigger>
              <TabsTrigger value="poster" className="gap-2">
                <Image className="w-4 h-4" />
                <span className="hidden sm:inline">宣传海报</span>
              </TabsTrigger>
              <TabsTrigger value="platform" className="gap-2">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">多平台</span>
              </TabsTrigger>
            </TabsList>

            {/* Prospectus Tab */}
            <TabsContent value="prospectus">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>招商文案</CardTitle>
                    <CardDescription>结构完整的招商引资文案</CardDescription>
                  </div>
                  <Button variant="outline" onClick={exportProspectus}>
                    <Download className="w-4 h-4 mr-2" />
                    导出
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label>标题</Label>
                        <Input
                          value={editedProspectus?.title || ""}
                          onChange={(e) => setEditedProspectus(prev => prev ? { ...prev, title: e.target.value } : null)}
                        />
                      </div>
                      {editedProspectus?.sections.map((section, index) => (
                        <div key={index} className="space-y-2">
                          <Label>{section.subtitle}</Label>
                          <Textarea
                            value={section.text}
                            onChange={(e) => {
                              const newSections = [...(editedProspectus?.sections || [])];
                              newSections[index] = { ...section, text: e.target.value };
                              setEditedProspectus(prev => prev ? { ...prev, sections: newSections } : null);
                            }}
                            className="min-h-[100px]"
                          />
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold">{prospectus?.title}</h2>
                      {prospectus?.sections.map((section, index) => (
                        <div key={index} className="space-y-2">
                          <h3 className="text-lg font-semibold text-primary">{section.subtitle}</h3>
                          <p className="text-muted-foreground whitespace-pre-wrap">{section.text}</p>
                        </div>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Video Script Tab */}
            <TabsContent value="video">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>短视频脚本</CardTitle>
                    <CardDescription>
                      总时长: {videoScript?.totalDuration}秒 | {videoScript?.scenes.length}个场景
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={exportVideoScript}>
                    <Download className="w-4 h-4 mr-2" />
                    导出
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <h2 className="text-xl font-bold">{videoScript?.title}</h2>
                  {videoScript?.scenes.map((scene, index) => (
                    <Card key={index} className="bg-muted/30">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">场景 {scene.sceneNumber}</span>
                          <span className="text-sm text-muted-foreground">{scene.duration}秒</span>
                        </div>
                        {isEditing ? (
                          <>
                            <div className="space-y-1">
                              <Label className="text-xs">画面描述</Label>
                              <Textarea
                                value={scene.visuals}
                                onChange={(e) => {
                                  const newScenes = [...(editedVideoScript?.scenes || [])];
                                  newScenes[index] = { ...scene, visuals: e.target.value };
                                  setEditedVideoScript(prev => prev ? { ...prev, scenes: newScenes } : null);
                                }}
                                className="min-h-[60px]"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">旁白/台词</Label>
                              <Textarea
                                value={scene.voiceover}
                                onChange={(e) => {
                                  const newScenes = [...(editedVideoScript?.scenes || [])];
                                  newScenes[index] = { ...scene, voiceover: e.target.value };
                                  setEditedVideoScript(prev => prev ? { ...prev, scenes: newScenes } : null);
                                }}
                                className="min-h-[60px]"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <span className="text-xs text-muted-foreground">画面描述</span>
                              <p className="text-sm">{scene.visuals}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">旁白/台词</span>
                              <p className="text-sm">{scene.voiceover}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">BGM建议</span>
                              <p className="text-sm text-primary">{scene.bgmSuggestion}</p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Poster Tab */}
            <TabsContent value="poster">
              <Card>
                <CardHeader>
                  <CardTitle>宣传海报</CardTitle>
                  <CardDescription>AI生成的宣传海报图片</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Poster Elements */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">海报文案元素</h3>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">主标题</Label>
                          <p className="font-bold text-lg">{posterElements?.mainHeadline}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">副标题</Label>
                          <p>{posterElements?.subHeadline}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">正文</Label>
                          <p className="text-sm">{posterElements?.bodyText}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">行动号召</Label>
                          <p className="text-primary font-medium">{posterElements?.callToAction}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={handleGeneratePoster} 
                        disabled={posterMutation.isPending}
                        className="w-full"
                      >
                        {posterMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            生成中...
                          </>
                        ) : history.posterUrl ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            重新生成海报
                          </>
                        ) : (
                          <>
                            <Image className="w-4 h-4 mr-2" />
                            生成海报图片
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Poster Preview */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">海报预览</h3>
                      {history.posterUrl ? (
                        <div className="space-y-3">
                          <img 
                            src={history.posterUrl} 
                            alt="宣传海报" 
                            className="w-full rounded-lg border shadow-sm"
                          />
                          <Button variant="outline" className="w-full" asChild>
                            <a href={history.posterUrl} download="宣传海报.png" target="_blank">
                              <Download className="w-4 h-4 mr-2" />
                              下载海报
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>点击左侧按钮生成海报</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Platform Tab */}
            <TabsContent value="platform">
              <Card>
                <CardHeader>
                  <CardTitle>多平台内容适配</CardTitle>
                  <CardDescription>一键生成适配不同平台的内容版本</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Platform Selection */}
                  <div className="space-y-3">
                    <Label>选择目标平台</Label>
                    <div className="flex flex-wrap gap-4">
                      {PLATFORM_OPTIONS.map((platform) => (
                        <div key={platform.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={platform.value}
                            checked={selectedPlatforms.includes(platform.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPlatforms([...selectedPlatforms, platform.value]);
                              } else {
                                setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.value));
                              }
                            }}
                          />
                          <label htmlFor={platform.value} className="text-sm cursor-pointer">
                            {platform.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <Button 
                      onClick={handleGeneratePlatformContent}
                      disabled={platformMutation.isPending || selectedPlatforms.length === 0}
                    >
                      {platformMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4 mr-2" />
                          生成平台内容
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Platform Contents */}
                  {platformContents?.platforms && (
                    <div className="space-y-4">
                      <h3 className="font-semibold">已生成的平台内容</h3>
                      <div className="grid gap-4">
                        {Object.entries(platformContents.platforms).map(([platform, content]: [string, any]) => (
                          <Card key={platform} className="bg-muted/30">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  {platform}
                                </CardTitle>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    const text = `${content.title}\n\n${content.content}\n\n${content.hashtags?.map((t: string) => `#${t}`).join(" ") || ""}`;
                                    exportAsText(text, `${platform}文案.txt`);
                                  }}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <h4 className="font-medium">{content.title}</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {content.content}
                              </p>
                              {content.hashtags && content.hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {content.hashtags.map((tag: string, i: number) => (
                                    <span key={i} className="text-xs text-primary">#{tag}</span>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
