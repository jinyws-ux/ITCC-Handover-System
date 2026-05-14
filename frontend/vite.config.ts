import { defineConfig } from 'vite'
// 确保已安装@vitejs/plugin-react依赖，可执行npm install @vitejs/plugin-react或yarn add @vitejs/plugin-react来解决模块找不到的问题
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:5000'
    }
  }
})
