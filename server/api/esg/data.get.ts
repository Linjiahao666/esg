export default defineEventHandler((event) => {
  // 模拟从数据库获取数据的过程
  return {
    score: 85,
    metrics: [
      { category: "环境 (Environmental)", value: 450, unit: "tCO2e", status: "good" },
      { category: "社会 (Social)", value: 92, unit: "Employees Satisfaction", status: "excellent" },
      { category: "治理 (Governance)", value: 100, unit: "Compliance Rate", status: "perfect" }
    ],
    updatedAt: new Date().toISOString()
  }
})
