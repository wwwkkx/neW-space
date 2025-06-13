"use client"
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Upload, BarChart3, CheckCircle, Brain, Zap, Shield } from "lucide-react";

export default function DesktopHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">智能笔记助手</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              AI驱动的笔记和文档管理平台，自动分析、分类、总结您的内容，并同步到Notion
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-3" onClick={() => (window.location.href = "/auth")}> <Sparkles className="w-5 h-5 mr-2" /> 开始使用 </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3"> 了解更多 </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Features */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">核心功能</h2>
            <p className="text-xl text-gray-600">让AI成为您的智能助手</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">智能笔记</h3>
                <p className="text-gray-600">随手记录想法，AI自动生成标题、摘要、分类和标签</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">文档分析</h3>
                <p className="text-gray-600">上传文档，AI自动提取要点、总结内容并智能分类</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">月度报告</h3>
                <p className="text-gray-600">一键生成月度总结报告，深度分析您的学习和工作情况</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Notion同步</h3>
                <p className="text-gray-600">自动同步到Notion数据库，无缝集成您的工作流</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">智能分类</h3>
                <p className="text-gray-600">按日常、工作、学习等维度自动分类，便于管理和查找</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">快速高效</h3>
                <p className="text-gray-600">秒级处理，让您专注于创作，而不是整理</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* How it works */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">使用流程</h2>
            <p className="text-xl text-gray-600">三步开启智能笔记之旅</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">记录内容</h3>
              <p className="text-gray-600">写下您的想法或上传文档，支持多种格式</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI分析</h3>
              <p className="text-gray-600">AI自动分析内容，生成标题、摘要、分类和标签</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">自动同步</h3>
              <p className="text-gray-600">结构化内容自动保存到Notion，便于后续管理</p>
            </div>
          </div>
        </div>
      </div>
      {/* CTA Section */}
      <div className="py-24 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">开始您的智能笔记之旅</h2>
          <p className="text-xl text-blue-100 mb-8">让AI帮您整理思路，提升工作和学习效率</p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-3"
            onClick={() => (window.location.href = "/auth")}
          >
            <Shield className="w-5 h-5 mr-2" />
            免费注册
          </Button>
        </div>
      </div>
    </div>
  );
} 