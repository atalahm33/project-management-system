import React, { useState, useEffect } from 'react'
import { X, Calendar, Edit2, DollarSign, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { updateContract } from '../api/contractsApi'

const CURRENCIES = [
  { code: 'EGP', name: 'جنيه مصري', symbol: 'ج.م' },
  { code: 'USD', name: 'دولار أمريكي', symbol: '$' },
  { code: 'EUR', name: 'يورو', symbol: '€' },
  { code: 'GBP', name: 'جنيه إسترليني', symbol: '£' },
]

export default function EditContractModal({ contract, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    contractorName: '',
    description: '',
    startDate: '',
    startDateDescription: '',
    endDate: '',
    endDateDescription: ''
  })
  const [currenciesData, setCurrenciesData] = useState([])

  useEffect(() => {
    if (contract) {
      setFormData({
        contractorName: contract.contractorName || '',
        description: contract.description || '',
        startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '',
        startDateDescription: contract.startDateDescription || '',
        endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : '',
        endDateDescription: contract.endDateDescription || ''
      })
      
      const values = contract.values || {}
      if (Object.keys(values).length > 0) {
        const initialCurrencies = Object.keys(values).map(curr => ({
          currency: curr,
          contractValue: values[curr] || 0
        }))
        setCurrenciesData(initialCurrencies)
      } else {
        setCurrenciesData([{ currency: 'EGP', contractValue: contract.contractValue || 0 }])
      }
    }
  }, [contract])

  const handleCurrencyChange = (index, field, value) => {
    const newCurrencies = [...currenciesData]
    if (field === 'contractValue') {
      newCurrencies[index][field] = Number(value)
    } else {
      newCurrencies[index][field] = value
    }
    setCurrenciesData(newCurrencies)
  }

  const addCurrency = () => {
    const available = CURRENCIES.find(c => !currenciesData.some(cd => cd.currency === c.code))
    if (available) {
      setCurrenciesData([...currenciesData, { currency: available.code, contractValue: 0 }])
    } else {
      toast.error('تمت إضافة جميع العملات المتاحة')
    }
  }

  const removeCurrency = (index) => {
    if (currenciesData.length > 1) {
      setCurrenciesData(currenciesData.filter((_, i) => i !== index))
    } else {
      toast.error('يجب أن يحتوي العقد على عملة واحدة على الأقل')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = new FormData()
      payload.append('contractorName', formData.contractorName)
      payload.append('description', formData.description)
      if (formData.startDate) payload.append('startDate', formData.startDate)
      if (formData.startDateDescription) payload.append('startDateDescription', formData.startDateDescription)
      if (formData.endDate) payload.append('endDate', formData.endDate)
      if (formData.endDateDescription) payload.append('endDateDescription', formData.endDateDescription)

      const valuesMap = {}
      currenciesData.forEach(c => {
        if (c.contractValue > 0) {
          valuesMap[c.currency] = c.contractValue
        }
      })
      payload.append('values', JSON.stringify(valuesMap))

      // Keep original paid amounts if not modified
      if (contract.paidAmounts) {
         payload.append('paidAmounts', JSON.stringify(contract.paidAmounts))
      }

      await updateContract(contract._id, payload)
      toast.success('تم تحديث العقد بنجاح')
      onSuccess()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'خطأ في تحديث العقد')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
          <div className="flex items-center gap-2 text-indigo-700">
            <Edit2 size={20} />
            <h3 className="font-bold text-lg">تعديل بيانات العقد</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="editContractForm" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المقاول / الجهة</label>
                <input
                  type="text"
                  required
                  className="input-field w-full"
                  value={formData.contractorName}
                  onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">وصف العقد</label>
                <textarea
                  className="input-field w-full min-h-[100px]"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar size={16} className="text-primary" /> تاريخ بداية العقد
                  </label>
                  <input
                    type="date"
                    className="input-field w-full mb-3"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="وصف تاريخ البداية (اختياري)"
                    className="input-field w-full text-xs"
                    value={formData.startDateDescription}
                    onChange={(e) => setFormData({ ...formData, startDateDescription: e.target.value })}
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar size={16} className="text-primary" /> تاريخ نهاية العقد
                  </label>
                  <input
                    type="date"
                    className="input-field w-full mb-3"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="وصف تاريخ النهاية (اختياري)"
                    className="input-field w-full text-xs"
                    value={formData.endDateDescription}
                    onChange={(e) => setFormData({ ...formData, endDateDescription: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-6 border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    <DollarSign size={18} className="text-primary" /> القيم المالية للعقد
                  </h4>
                  <button type="button" onClick={addCurrency} className="text-xs text-primary font-bold hover:underline">
                    + إضافة عملة أخرى
                  </button>
                </div>
                
                {currenciesData.map((cd, idx) => (
                  <div key={idx} className="flex flex-wrap items-end gap-3 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100 relative">
                    {currenciesData.length > 1 && (
                      <button type="button" onClick={() => removeCurrency(idx)} className="absolute top-2 left-2 text-red-500 hover:text-red-700">
                        <X size={14} />
                      </button>
                    )}
                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-xs font-bold text-gray-700 mb-1">العملة</label>
                      <select
                        className="input-field w-full text-sm"
                        value={cd.currency}
                        onChange={(e) => handleCurrencyChange(idx, 'currency', e.target.value)}
                      >
                        {CURRENCIES.map(c => (
                          <option key={c.code} value={c.code} disabled={currenciesData.some((existing, i) => i !== idx && existing.currency === c.code)}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-xs font-bold text-gray-700 mb-1">قيمة العقد</label>
                      <input
                        type="number"
                        min="0"
                        required
                        className="input-field w-full font-mono text-sm"
                        value={cd.contractValue}
                        onChange={(e) => handleCurrencyChange(idx, 'contractValue', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </form>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost" disabled={loading}>
            إلغاء
          </button>
          <button type="submit" form="editContractForm" className="btn-primary flex items-center gap-2" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            حفظ التعديلات
          </button>
        </div>
      </div>
    </div>
  )
}
