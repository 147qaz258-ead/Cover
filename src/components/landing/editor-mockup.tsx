"use client";

import { motion } from "framer-motion";
import { Type, Image as ImageIcon, Palette, Layout, MousePointer2, Settings } from "lucide-react";

export function EditorMockup() {
  return (
    <div className="w-full aspect-[4/3] flex flex-col">
      {/* Top toolbar */}
      <div className="h-12 border-b border-slate-200 flex items-center px-4 gap-2 bg-slate-50">
        {[
          { icon: MousePointer2, label: "Select" },
          { icon: Type, label: "Text" },
          { icon: ImageIcon, label: "Image" },
          { icon: Palette, label: "Color" },
          { icon: Layout, label: "Layout" },
          { icon: Settings, label: "Settings" },
        ].map((tool, index) => (
          <motion.button
            key={tool.label}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            className="p-2 hover:bg-white rounded-lg transition-colors group"
            title={tool.label}
          >
            <tool.icon className="w-4 h-4 text-slate-500 group-hover:text-slate-900" />
          </motion.button>
        ))}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex">
        {/* Canvas area */}
        <div className="flex-1 bg-slate-100 p-8 relative overflow-hidden">
          {/* Grid background */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: `
                linear-gradient(to right, #cbd5e1 1px, transparent 1px),
                linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }} />
          </div>

          {/* Mock cover card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="relative mx-auto max-w-sm aspect-square bg-white rounded-lg shadow-lg overflow-hidden"
          >
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500" />

            {/* Content overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-xl"
              >
                <p className="text-xs font-medium text-yellow-600 mb-2 uppercase tracking-wider">
                  Featured
                </p>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  10个提高效率的方法
                </h3>
                <p className="text-sm text-slate-600">
                  让你的工作事半功倍
                </p>
              </motion.div>
            </div>

            {/* Floating elements animation */}
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur rounded-lg shadow-lg flex items-center justify-center"
            >
              <div className="w-4 h-4 bg-red-500 rounded-full" />
            </motion.div>

            <motion.div
              animate={{
                y: [0, 10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-4 left-4 w-16 h-2 bg-white/80 backdrop-blur rounded-full"
            />
          </motion.div>
        </div>

        {/* Right sidebar */}
        <div className="w-48 border-l border-slate-200 bg-white p-4 space-y-4">
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Properties
            </p>

            {/* Property items */}
            <div className="space-y-3">
              {[
                { label: "Width", value: "1080px" },
                { label: "Height", value: "1080px" },
                { label: "Background", value: "Gradient" },
              ].map((prop, index) => (
                <motion.div
                  key={prop.label}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.75 + index * 0.05 }}
                  className="space-y-1"
                >
                  <p className="text-xs text-slate-500">{prop.label}</p>
                  <div className="h-8 bg-slate-100 rounded-md flex items-center px-3">
                    <span className="text-xs text-slate-700">{prop.value}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
