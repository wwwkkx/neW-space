import { Button } from "@/components/ui/button";
import { Sparkles, FileText, Upload, NotepadText, User } from "lucide-react";

export default function MobileHome() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pink-50 via-white to-blue-50">
      {/* 顶部栏 */}
      <header className="h-14 flex items-center px-4 shadow-sm bg-white/80 backdrop-blur sticky top-0 z-10">
        <span className="text-xl font-semibold text-gray-800 tracking-wide">wspace</span>
        <span className="ml-auto text-pink-400 text-sm font-medium">温柔陪伴你的AI笔记</span>
      </header>

      {/* 欢迎语 */}
      <div className="px-6 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">你好，欢迎来到 wspace</h1>
        <p className="text-base text-gray-500 mb-6">AI帮你记录、整理、同步每一个灵感与文档</p>
        <Button size="lg" className="w-full text-lg py-3 mb-2 bg-pink-400 hover:bg-pink-500 text-white rounded-xl shadow">
          <Sparkles className="w-5 h-5 mr-2" /> 开始新笔记
        </Button>
        <Button size="lg" variant="outline" className="w-full text-lg py-3 mb-2 rounded-xl">
          <Upload className="w-5 h-5 mr-2" /> 上传文档
        </Button>
        <Button size="lg" variant="ghost" className="w-full text-lg py-3 rounded-xl">
          <FileText className="w-5 h-5 mr-2" /> 同步到Notion
        </Button>
      </div>

      {/* 主要功能入口 */}
      <div className="flex-1 px-4 pb-24">
        <div className="bg-white/80 rounded-2xl shadow p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">最近笔记</h2>
          <div className="text-gray-400 text-sm">（这里展示最近的笔记列表...）</div>
        </div>
        <div className="bg-white/80 rounded-2xl shadow p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">最近文档</h2>
          <div className="text-gray-400 text-sm">（这里展示最近上传的文档...）</div>
        </div>
      </div>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 border-t flex justify-around items-center shadow-t z-20">
        <button className="flex flex-col items-center text-pink-400">
          <NotepadText className="w-6 h-6 mb-1" />
          <span className="text-xs">笔记</span>
        </button>
        <button className="flex flex-col items-center text-blue-400">
          <Upload className="w-6 h-6 mb-1" />
          <span className="text-xs">文档</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <User className="w-6 h-6 mb-1" />
          <span className="text-xs">我的</span>
        </button>
      </nav>
    </div>
  );
} 