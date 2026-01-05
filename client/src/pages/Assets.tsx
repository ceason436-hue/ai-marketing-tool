import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  FolderOpen,
  Loader2,
  Trash2,
  Upload,
  Image as ImageIcon,
  Palette,
  Plus,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type AssetType = "logo" | "color" | "image" | "font";

export default function Assets() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assetType, setAssetType] = useState<AssetType>("logo");
  const [assetName, setAssetName] = useState("");
  const [assetValue, setAssetValue] = useState("");
  const [assetDescription, setAssetDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: assets, isLoading } = trpc.assets.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const createMutation = trpc.assets.create.useMutation({
    onSuccess: () => {
      toast.success("素材添加成功");
      utils.assets.list.invalidate();
      resetForm();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  const uploadMutation = trpc.assets.upload.useMutation({
    onSuccess: () => {
      toast.success("素材上传成功");
      utils.assets.list.invalidate();
      resetForm();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`上传失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.assets.delete.useMutation({
    onSuccess: () => {
      toast.success("素材已删除");
      utils.assets.list.invalidate();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const resetForm = () => {
    setAssetName("");
    setAssetValue("");
    setAssetDescription("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setAssetType("logo");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("文件大小不能超过5MB");
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async () => {
    if (!assetName.trim()) {
      toast.error("请输入素材名称");
      return;
    }

    if (assetType === "color") {
      if (!assetValue.trim()) {
        toast.error("请输入颜色值");
        return;
      }
      createMutation.mutate({
        name: assetName,
        type: assetType,
        value: assetValue,
        description: assetDescription,
      });
    } else if ((assetType === "logo" || assetType === "image") && selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        uploadMutation.mutate({
          name: assetName,
          type: assetType,
          fileData: base64,
          mimeType: selectedFile.type,
          description: assetDescription,
        });
      };
      reader.readAsDataURL(selectedFile);
    } else {
      toast.error("请选择要上传的文件");
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "logo":
        return <ImageIcon className="w-5 h-5" />;
      case "color":
        return <Palette className="w-5 h-5" />;
      case "image":
        return <ImageIcon className="w-5 h-5" />;
      default:
        return <FolderOpen className="w-5 h-5" />;
    }
  };

  const getAssetTypeLabel = (type: string) => {
    switch (type) {
      case "logo":
        return "Logo";
      case "color":
        return "配色";
      case "image":
        return "图片";
      case "font":
        return "字体";
      default:
        return type;
    }
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
              <CardDescription>登录后管理品牌素材</CardDescription>
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

  const logos = assets?.filter(a => a.type === "logo") || [];
  const colors = assets?.filter(a => a.type === "color") || [];
  const images = assets?.filter(a => a.type === "image") || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FolderOpen className="w-6 h-6" />
                品牌素材库
              </h1>
              <p className="text-muted-foreground">
                管理您的品牌Logo、配色和常用图片素材
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  添加素材
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加品牌素材</DialogTitle>
                  <DialogDescription>
                    上传Logo、图片或添加品牌配色
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>素材类型</Label>
                    <Select value={assetType} onValueChange={(v) => setAssetType(v as AssetType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="logo">品牌Logo</SelectItem>
                        <SelectItem value="image">常用图片</SelectItem>
                        <SelectItem value="color">品牌配色</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>素材名称</Label>
                    <Input
                      value={assetName}
                      onChange={(e) => setAssetName(e.target.value)}
                      placeholder="例如：公司主Logo"
                    />
                  </div>

                  {assetType === "color" ? (
                    <div className="space-y-2">
                      <Label>颜色值</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={assetValue || "#000000"}
                          onChange={(e) => setAssetValue(e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={assetValue}
                          onChange={(e) => setAssetValue(e.target.value)}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>上传文件</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      {previewUrl ? (
                        <div className="relative">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-40 object-contain border rounded-lg bg-muted"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setSelectedFile(null);
                              setPreviewUrl(null);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            点击上传图片（最大5MB）
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>描述（可选）</Label>
                    <Textarea
                      value={assetDescription}
                      onChange={(e) => setAssetDescription(e.target.value)}
                      placeholder="素材用途说明"
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    取消
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || uploadMutation.isPending}
                  >
                    {(createMutation.isPending || uploadMutation.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    添加
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Logos Section */}
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  品牌Logo
                </h2>
                {logos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {logos.map((asset) => (
                      <Card key={asset.id} className="group relative overflow-hidden">
                        <CardContent className="p-4">
                          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                            {asset.url ? (
                              <img
                                src={asset.url}
                                alt={asset.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <ImageIcon className="w-12 h-12 text-muted-foreground" />
                            )}
                          </div>
                          <p className="font-medium text-sm truncate">{asset.name}</p>
                          {asset.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {asset.description}
                            </p>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  确定要删除素材"{asset.name}"吗？此操作无法撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate({ id: asset.id })}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-muted/30">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      暂无Logo素材
                    </CardContent>
                  </Card>
                )}
              </section>

              {/* Colors Section */}
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  品牌配色
                </h2>
                {colors.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {colors.map((asset) => (
                      <Card key={asset.id} className="group relative overflow-hidden">
                        <CardContent className="p-4">
                          <div
                            className="aspect-square rounded-lg mb-3 border"
                            style={{ backgroundColor: asset.value || "#000" }}
                          />
                          <p className="font-medium text-sm truncate">{asset.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {asset.value}
                          </p>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  确定要删除配色"{asset.name}"吗？此操作无法撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate({ id: asset.id })}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-muted/30">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      暂无品牌配色
                    </CardContent>
                  </Card>
                )}
              </section>

              {/* Images Section */}
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  常用图片
                </h2>
                {images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((asset) => (
                      <Card key={asset.id} className="group relative overflow-hidden">
                        <CardContent className="p-4">
                          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                            {asset.url ? (
                              <img
                                src={asset.url}
                                alt={asset.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-12 h-12 text-muted-foreground" />
                            )}
                          </div>
                          <p className="font-medium text-sm truncate">{asset.name}</p>
                          {asset.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {asset.description}
                            </p>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  确定要删除图片"{asset.name}"吗？此操作无法撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate({ id: asset.id })}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-muted/30">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      暂无常用图片
                    </CardContent>
                  </Card>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
