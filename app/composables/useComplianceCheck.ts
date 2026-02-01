/**
 * ESG 合规检查 Composable
 *
 * 提供前端合规检查功能，包括：
 * - 单条数据实时检查
 * - 批量数据提交前检查
 * - 检查结果管理
 */

import type { Ref } from 'vue'

// 检查结果类型
export interface ComplianceCheckResult {
  passed: boolean
  status: 'pass' | 'fail' | 'warning' | 'skipped'
  ruleCode: string
  ruleName: string
  severity: 'error' | 'warning' | 'info'
  message: string
  suggestion?: string
  metricCode?: string
  checkedValue?: any
  expectedValue?: any
  details?: Record<string, any>
}

// 批量检查摘要
export interface ComplianceCheckSummary {
  total: number
  passed: number
  failed: number
  warnings: number
  skipped: number
  passRate: string
}

// 批量检查响应
export interface BatchCheckResponse {
  success: boolean
  summary: ComplianceCheckSummary
  errors: ComplianceCheckResult[]
  warnings: ComplianceCheckResult[]
}

// 指标字段的合规状态
export interface MetricComplianceState {
  status: 'unchecked' | 'checking' | 'pass' | 'warning' | 'error'
  messages: string[]
  suggestions: string[]
}

export function useComplianceCheck(period: Ref<string>) {
  // 各指标的合规状态
  const complianceStates = ref<Map<string, MetricComplianceState>>(new Map())

  // 全局检查状态
  const isChecking = ref(false)

  // 最近一次批量检查结果
  const lastBatchResult = ref<BatchCheckResponse | null>(null)

  // 是否有阻断性错误
  const hasBlockingErrors = computed(() => {
    return lastBatchResult.value?.errors.some((e) => e.severity === 'error') ?? false
  })

  // 是否有警告
  const hasWarnings = computed(() => {
    return (lastBatchResult.value?.warnings.length ?? 0) > 0
  })

  /**
   * 获取指标的合规状态
   */
  function getMetricState(metricCode: string): MetricComplianceState {
    return (
      complianceStates.value.get(metricCode) || {
        status: 'unchecked',
        messages: [],
        suggestions: [],
      }
    )
  }

  /**
   * 设置指标的合规状态
   */
  function setMetricState(metricCode: string, state: MetricComplianceState) {
    complianceStates.value.set(metricCode, state)
  }

  /**
   * 清除指标的合规状态
   */
  function clearMetricState(metricCode: string) {
    complianceStates.value.delete(metricCode)
  }

  /**
   * 清除所有合规状态
   */
  function clearAllStates() {
    complianceStates.value.clear()
    lastBatchResult.value = null
  }

  /**
   * 检查单条指标数据（实时检查）
   */
  async function checkSingle(
    metricCode: string,
    value: any,
    valueNumber?: number | null,
    valueText?: string | null
  ): Promise<ComplianceCheckResult[]> {
    setMetricState(metricCode, {
      status: 'checking',
      messages: [],
      suggestions: [],
    })

    try {
      const response = await $fetch<{ success: boolean; data: BatchCheckResponse }>(
        '/api/esg/compliance/check',
        {
          method: 'POST',
          body: {
            mode: 'single',
            period: period.value,
            triggerOn: 'realtime',
            metricCode,
            value,
            valueNumber,
            valueText,
          },
        }
      )

      if (response.success) {
        const { errors, warnings } = response.data
        const allIssues = [...errors, ...warnings]

        if (errors.length > 0) {
          setMetricState(metricCode, {
            status: 'error',
            messages: errors.map((e) => e.message),
            suggestions: errors.map((e) => e.suggestion).filter(Boolean) as string[],
          })
        } else if (warnings.length > 0) {
          setMetricState(metricCode, {
            status: 'warning',
            messages: warnings.map((w) => w.message),
            suggestions: warnings.map((w) => w.suggestion).filter(Boolean) as string[],
          })
        } else {
          setMetricState(metricCode, {
            status: 'pass',
            messages: [],
            suggestions: [],
          })
        }

        return allIssues
      }

      return []
    } catch (error: any) {
      setMetricState(metricCode, {
        status: 'error',
        messages: [error.message || '合规检查失败'],
        suggestions: [],
      })
      return []
    }
  }

  /**
   * 批量检查数据（提交前检查）
   */
  async function checkBatch(
    records: Array<{
      metricCode: string
      value: any
      valueNumber?: number | null
      valueText?: string | null
      valueJson?: any
    }>
  ): Promise<BatchCheckResponse> {
    isChecking.value = true

    // 清除之前的状态
    clearAllStates()

    try {
      const response = await $fetch<{ success: boolean; data: BatchCheckResponse }>(
        '/api/esg/compliance/check',
        {
          method: 'POST',
          body: {
            mode: 'batch',
            period: period.value,
            triggerOn: 'submit',
            records,
          },
        }
      )

      if (response.success) {
        lastBatchResult.value = response.data

        // 更新各指标的状态
        for (const error of response.data.errors) {
          if (error.metricCode) {
            const currentState = getMetricState(error.metricCode)
            setMetricState(error.metricCode, {
              status: 'error',
              messages: [...currentState.messages, error.message],
              suggestions: [
                ...currentState.suggestions,
                ...(error.suggestion ? [error.suggestion] : []),
              ],
            })
          }
        }

        for (const warning of response.data.warnings) {
          if (warning.metricCode) {
            const currentState = getMetricState(warning.metricCode)
            if (currentState.status !== 'error') {
              setMetricState(warning.metricCode, {
                status: 'warning',
                messages: [...currentState.messages, warning.message],
                suggestions: [
                  ...currentState.suggestions,
                  ...(warning.suggestion ? [warning.suggestion] : []),
                ],
              })
            }
          }
        }

        // 标记通过检查的指标
        for (const record of records) {
          if (!complianceStates.value.has(record.metricCode)) {
            setMetricState(record.metricCode, {
              status: 'pass',
              messages: [],
              suggestions: [],
            })
          }
        }

        return response.data
      }

      throw new Error('检查请求失败')
    } catch (error: any) {
      lastBatchResult.value = {
        success: false,
        summary: {
          total: records.length,
          passed: 0,
          failed: records.length,
          warnings: 0,
          skipped: 0,
          passRate: '0%',
        },
        errors: [
          {
            passed: false,
            status: 'fail',
            ruleCode: 'SYSTEM',
            ruleName: '系统错误',
            severity: 'error',
            message: error.message || '合规检查请求失败',
          },
        ],
        warnings: [],
      }

      return lastBatchResult.value
    } finally {
      isChecking.value = false
    }
  }

  /**
   * 检查整个周期的数据
   */
  async function checkPeriod(
    options: {
      subModuleCodes?: string[]
      metricCodes?: string[]
      saveResults?: boolean
    } = {}
  ): Promise<BatchCheckResponse> {
    isChecking.value = true
    clearAllStates()

    try {
      const response = await $fetch<{ success: boolean; data: BatchCheckResponse }>(
        '/api/esg/compliance/check',
        {
          method: 'POST',
          body: {
            mode: 'period',
            period: period.value,
            triggerOn: 'batch',
            ...options,
          },
        }
      )

      if (response.success) {
        lastBatchResult.value = response.data
        return response.data
      }

      throw new Error('检查请求失败')
    } catch (error: any) {
      const errorResult: BatchCheckResponse = {
        success: false,
        summary: {
          total: 0,
          passed: 0,
          failed: 0,
          warnings: 0,
          skipped: 0,
          passRate: '0%',
        },
        errors: [
          {
            passed: false,
            status: 'fail',
            ruleCode: 'SYSTEM',
            ruleName: '系统错误',
            severity: 'error',
            message: error.message || '合规检查请求失败',
          },
        ],
        warnings: [],
      }
      lastBatchResult.value = errorResult
      return errorResult
    } finally {
      isChecking.value = false
    }
  }

  /**
   * 判断是否可以提交（没有阻断性错误）
   */
  function canSubmit(): boolean {
    if (!lastBatchResult.value) return true
    return !hasBlockingErrors.value
  }

  /**
   * 获取错误消息列表
   */
  function getErrorMessages(): string[] {
    return lastBatchResult.value?.errors.map((e) => e.message) ?? []
  }

  /**
   * 获取警告消息列表
   */
  function getWarningMessages(): string[] {
    return lastBatchResult.value?.warnings.map((w) => w.message) ?? []
  }

  return {
    // 状态
    complianceStates: readonly(complianceStates),
    isChecking: readonly(isChecking),
    lastBatchResult: readonly(lastBatchResult),
    hasBlockingErrors,
    hasWarnings,

    // 方法
    getMetricState,
    setMetricState,
    clearMetricState,
    clearAllStates,
    checkSingle,
    checkBatch,
    checkPeriod,
    canSubmit,
    getErrorMessages,
    getWarningMessages,
  }
}
