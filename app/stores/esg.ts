import { defineStore } from "pinia"

export const useEsgStore = defineStore("esg", {
  state: () => ({
    score: 0,
    metrics: [] as Array<{ category: string; value: number; unit: string }>,
    loading: false
  }),
  actions: {
    async fetchData() {
      this.loading = true
      try {
        const data = await $fetch("/api/esg/data")
        this.score = data.score
        this.metrics = data.metrics
      } catch (error) {
        console.error("Failed to fetch ESG data", error)
      } finally {
        this.loading = false
      }
    }
  }
})
