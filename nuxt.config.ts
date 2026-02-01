// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/image", "@nuxt/ui", "@nuxt/eslint", "@pinia/nuxt"],
  imports: {
    dirs: ["stores"]
  },
  fonts: { provider: "none" },
  css: ["~/assets/css/main.css"],

  // ESG Dashboard - Organic Biophilic Theme Configuration
  colorMode: {
    preference: "light"
  },
  app: {
    // 页面过渡动画配置
    pageTransition: {
      name: "page",
      mode: "out-in"
    },
    layoutTransition: {
      name: "layout",
      mode: "out-in"
    },
    head: {
      title: "ESG 可持续发展管理平台",
      meta: [
        { name: "description", content: "Environmental, Social, and Governance Dashboard" },
        { name: "theme-color", content: "#059669" }
      ],
      link: [
        {
          rel: "preconnect",
          href: "https://fonts.googleapis.com"
        },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: ""
        }
      ]
    }
  }
})
