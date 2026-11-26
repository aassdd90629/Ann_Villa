import { ref } from 'vue'

export function useBookingLookup() {
  const isLoading = ref(false)
  const isReporting = ref(false)
  const isCancelling = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')
  const bookings = ref([])
  const currentCredentials = ref({
    phone: '',
    email: '',
    bookingId: ''
  })

  /**
   * 查詢旅客訂單
   */
  const lookupBookings = async ({ phone, email, bookingId = '' }) => {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    currentCredentials.value = {
      phone: String(phone).trim(),
      email: String(email).trim(),
      bookingId: String(bookingId).trim()
    }

    try {
      const res = await fetch('/api/bookings/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentCredentials.value)
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || '查詢訂單失敗，請檢查資料後重試。')
      }

      bookings.value = data.bookings || []
      if (bookings.value.length === 0) {
        errorMessage.value = '查無相符的預訂資料，請確認手機號碼與電子信箱是否與送出訂單時一致。'
      }
      return data.bookings
    } catch (err) {
      errorMessage.value = err.message || '連線逾時，請稍後再試。'
      bookings.value = []
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 旅客線上回報匯款末五碼
   */
  const reportPayment = async ({ bookingId, phone, email, bankLast5, paymentNote = '' }) => {
    isReporting.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const res = await fetch('/api/bookings/report-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: String(bookingId).trim(),
          phone: String(phone).trim(),
          email: String(email).trim(),
          bankLast5: String(bankLast5).trim(),
          paymentNote: String(paymentNote).trim()
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || '回報失敗，請確認資料後重試。')
      }

      successMessage.value = data.message || '匯款末五碼回報成功！'

      // 即時更新本地訂單資料狀態
      const target = bookings.value.find(b => b.id === bookingId)
      if (target) {
        target.bank_last_5 = data.bankLast5 || String(bankLast5).trim()
        target.payment_reported_at = data.reportedAt || new Date().toISOString()
        target.payment_note = paymentNote
      }

      return data
    } catch (err) {
      errorMessage.value = err.message || '回報末五碼失敗'
      throw err
    } finally {
      isReporting.value = false
    }
  }

  /**
   * 旅客線上申請取消預訂
   */
  const cancelBooking = async (payload) => {
    isCancelling.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || '取消預訂失敗，請確認資料後重試。')
      }

      successMessage.value = data.message || '預訂已成功取消。'

      // 即時更新本地訂單狀態
      const target = bookings.value.find(b => b.id === payload.bookingId)
      if (target) {
        target.status = 'CANCELLED'
        target.cancelled_by = 'GUEST'
        target.cancelled_at = new Date().toISOString()
        target.refund_status = data.refundStatus || 'NONE'
        target.refund_amount = data.refundAmount || 0
      }

      return data
    } catch (err) {
      errorMessage.value = err.message || '取消預訂失敗'
      throw err
    } finally {
      isCancelling.value = false
    }
  }

  return {
    isLoading,
    isReporting,
    isCancelling,
    errorMessage,
    successMessage,
    bookings,
    currentCredentials,
    lookupBookings,
    reportPayment,
    cancelBooking
  }
}
