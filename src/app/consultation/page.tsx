/**
 * Consultation Workbench Page
 * 診療工作台 - 完整版
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  User,
  FileText,
  Pill,
  Save,
  Clock,
  ChevronRight,
  Plus,
  Trash2,
  Search,
  BookOpen,
  AlertTriangle,
  Printer,
  History,
  Package,
  Truck,
  Building2,
  Check,
  X,
  RefreshCw,
  Image as ImageIcon,
  FileCheck,
  Edit,
  Copy,
} from 'lucide-react';
import { cn, formatDate, calculateAge, getGenderDisplay, formatCurrency } from '@/lib/utils';
import { useConsultationStore, useNotificationStore } from '@/store';
import api, { endpoints } from '@/lib/api';

interface QueuePatient {
  id: number;
  queue_number: number;
  patient: {
    id: number;
    name: string;
    chart_number: string;
    gender: string;
    birth_date: string;
    phone?: string;
    allergies?: string;
  };
  visit_type: string;
  status: string;
  doctor_name?: string;
}

interface PrescriptionItem {
  id?: number;
  medicine_id: number;
  medicine_name: string;
  medicine_code: string;
  dosage: number;
  unit: string;
  unit_price: number;
  subtotal: number;
  stock_quantity?: number;
  is_compound?: boolean;
}

interface ExperienceFormula {
  id: number;
  name: string;
  description: string;
  items: Array<{
    medicine_id: number;
    medicine_name: string;
    medicine_code: string;
    dosage: number;
    unit: string;
  }>;
}

interface HistoryRecord {
  id: number;
  date: string;
  chief_complaint: string;
  tcm_diagnosis: string;
  prescription_count: number;
}

interface ExternalPharmacy {
  id: number;
  name: string;
  type: 'decoction' | 'concentrated';
  processing_fee: number;
  delivery_fee: number;
}

type DispensingMethod = 'internal' | 'external_decoction' | 'external_concentrated';

export default function ConsultationPage() {
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'prescription' | 'history'>('diagnosis');
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [medicineSearch, setMedicineSearch] = useState('');
  const [medicineResults, setMedicineResults] = useState<Array<{
    id: number;
    code: string;
    name: string;
    unit: string;
    selling_price: string;
    current_stock: number;
    is_compound: boolean;
  }>>([]);

  // Dispensing method
  const [dispensingMethod, setDispensingMethod] = useState<DispensingMethod>('internal');
  const [externalPharmacies, setExternalPharmacies] = useState<ExternalPharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<number | null>(null);

  // Prescription settings
  const [prescriptionSettings, setPrescriptionSettings] = useState({
    total_doses: 7,
    doses_per_day: 3,
    days: 7,
    name: '處方',
  });

  // Experience formulas
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [experienceFormulas, setExperienceFormulas] = useState<ExperienceFormula[]>([]);
  const [formulaSearch, setFormulaSearch] = useState('');

  // History records
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Allergy warning
  const [showAllergyWarning, setShowAllergyWarning] = useState(false);
  const [allergyMessage, setAllergyMessage] = useState('');

  // Additional charges
  const [additionalCharges, setAdditionalCharges] = useState<Array<{
    name: string;
    amount: number;
  }>>([]);

  // Consultation form state
  const [consultationForm, setConsultationForm] = useState({
    chief_complaint: '',
    present_illness: '',
    inspection: '',
    tongue_appearance: '',
    pulse: '',
    tcm_diagnosis: '',
    syndrome_differentiation: '',
    treatment_principle: '',
    advice: '',
  });

  const {
    currentPatient,
    currentRegistrationId,
    setCurrentPatient,
    setCurrentRegistration,
    clearConsultation,
  } = useConsultationStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    fetchQueue();
    fetchExternalPharmacies();
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await api.get(endpoints.registrations.queue);
      // API returns { waiting: [], in_consultation: [], completed: [], summary: {} }
      const waitingList = response.data?.waiting || [];
      const inConsultationList = response.data?.in_consultation || [];
      setQueue([...waitingList, ...inConsultationList]);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExternalPharmacies = async () => {
    try {
      const response = await api.get(endpoints.externalPharmacies?.list || '/billing/external-pharmacies/');
      setExternalPharmacies(response.data?.results || []);
    } catch (error) {
      console.error('Failed to fetch external pharmacies:', error);
    }
  };

  const fetchExperienceFormulas = async (search: string = '') => {
    try {
      const response = await api.get(endpoints.experienceFormulas?.list || '/api/v1/experience-formulas/', {
        params: { search },
      });
      setExperienceFormulas(response.data?.results || []);
    } catch (error) {
      console.error('Failed to fetch experience formulas:', error);
    }
  };

  const fetchPatientHistory = async (patientId: number) => {
    setLoadingHistory(true);
    try {
      const response = await api.get(endpoints.consultations.list, {
        params: { patient: patientId, limit: 10 },
      });
      setHistoryRecords(response.data?.results || []);
    } catch (error) {
      console.error('Failed to fetch patient history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const selectPatient = (patient: QueuePatient) => {
    // Check for allergies
    if (patient.patient.allergies) {
      setAllergyMessage(patient.patient.allergies);
      setShowAllergyWarning(true);
    }

    setCurrentPatient({
      id: patient.patient.id,
      name: patient.patient.name,
      chart_number: patient.patient.chart_number,
      gender: patient.patient.gender,
      birth_date: patient.patient.birth_date,
      registration_id: patient.id,
      allergies: patient.patient.allergies,
    });
    setCurrentRegistration(patient.id);
    setPrescriptionItems([]);
    setAdditionalCharges([]);
    setDispensingMethod('internal');
    setSelectedPharmacy(null);
    setConsultationForm({
      chief_complaint: '',
      present_illness: '',
      inspection: '',
      tongue_appearance: '',
      pulse: '',
      tcm_diagnosis: '',
      syndrome_differentiation: '',
      treatment_principle: '',
      advice: '',
    });

    // Fetch patient history
    fetchPatientHistory(patient.patient.id);
  };

  const searchMedicine = async (query: string) => {
    setMedicineSearch(query);
    if (query.length < 1) {
      setMedicineResults([]);
      return;
    }

    try {
      const response = await api.get(endpoints.medicines.search, {
        params: { q: query },
      });
      setMedicineResults(response.data || []);
    } catch (error) {
      console.error('Failed to search medicine:', error);
    }
  };

  const addMedicine = (medicine: typeof medicineResults[0]) => {
    const existing = prescriptionItems.find((item) => item.medicine_id === medicine.id);
    if (existing) {
      addNotification({
        type: 'warning',
        title: '藥品已存在',
        message: '請直接修改劑量',
      });
      return;
    }

    // Check stock for internal dispensing
    if (dispensingMethod === 'internal' && medicine.current_stock <= 0) {
      addNotification({
        type: 'error',
        title: '庫存不足',
        message: `${medicine.name} 庫存不足，無法開立`,
      });
      return;
    }

    // Check for allergy
    if (currentPatient?.allergies) {
      const allergies = currentPatient.allergies.toLowerCase();
      if (allergies.includes(medicine.name.toLowerCase())) {
        setAllergyMessage(`警告：病患對 ${medicine.name} 過敏！`);
        setShowAllergyWarning(true);
      }
    }

    setPrescriptionItems([
      ...prescriptionItems,
      {
        medicine_id: medicine.id,
        medicine_name: medicine.name,
        medicine_code: medicine.code,
        dosage: 1,
        unit: medicine.unit,
        unit_price: parseFloat(medicine.selling_price) || 0,
        subtotal: parseFloat(medicine.selling_price) || 0,
        stock_quantity: medicine.current_stock,
        is_compound: medicine.is_compound,
      },
    ]);
    setMedicineSearch('');
    setMedicineResults([]);
  };

  const updateDosage = (index: number, dosage: number) => {
    const updated = [...prescriptionItems];
    updated[index].dosage = dosage;
    updated[index].subtotal = dosage * updated[index].unit_price;
    setPrescriptionItems(updated);
  };

  const removeMedicine = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const applyExperienceFormula = (formula: ExperienceFormula) => {
    const newItems: PrescriptionItem[] = formula.items.map((item) => ({
      medicine_id: item.medicine_id,
      medicine_name: item.medicine_name,
      medicine_code: item.medicine_code,
      dosage: item.dosage,
      unit: item.unit,
      unit_price: 0, // Will be fetched from medicine data
      subtotal: 0,
    }));

    setPrescriptionItems([...prescriptionItems, ...newItems]);
    setShowFormulaModal(false);
    addNotification({
      type: 'success',
      title: '經驗方已套用',
      message: `已套用「${formula.name}」`,
    });
  };

  const saveAsExperienceFormula = async () => {
    if (prescriptionItems.length === 0) {
      addNotification({
        type: 'error',
        title: '無法儲存',
        message: '請先添加藥品',
      });
      return;
    }

    const name = prompt('請輸入經驗方名稱：');
    if (!name) return;

    try {
      await api.post(endpoints.experienceFormulas?.list || '/api/v1/experience-formulas/', {
        name,
        description: consultationForm.tcm_diagnosis,
        items: prescriptionItems.map((item) => ({
          medicine: item.medicine_id,
          dosage: item.dosage,
          unit: item.unit,
        })),
      });
      addNotification({
        type: 'success',
        title: '經驗方已儲存',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '儲存失敗',
      });
    }
  };

  const addAdditionalCharge = () => {
    const name = prompt('請輸入收費項目名稱：');
    if (!name) return;
    const amountStr = prompt('請輸入金額 (HKD)：');
    const amount = parseFloat(amountStr || '0');
    if (amount <= 0) return;

    setAdditionalCharges([...additionalCharges, { name, amount }]);
  };

  const removeAdditionalCharge = (index: number) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index));
  };

  const saveConsultation = async () => {
    if (!currentRegistrationId) {
      addNotification({
        type: 'error',
        title: '請先選擇病患',
      });
      return;
    }

    setSaving(true);
    try {
      // Create consultation
      const consultationRes = await api.post(endpoints.consultations.list, {
        registration: currentRegistrationId,
        ...consultationForm,
      });

      // Create prescription if there are items
      if (prescriptionItems.length > 0) {
        const prescriptionData: Record<string, unknown> = {
          consultation: consultationRes.data.id,
          name: prescriptionSettings.name,
          total_doses: prescriptionSettings.total_doses,
          doses_per_day: prescriptionSettings.doses_per_day,
          days: prescriptionSettings.days,
          dispensing_method: dispensingMethod,
          items: prescriptionItems.map((item) => ({
            medicine: item.medicine_id,
            dosage: item.dosage,
            unit: item.unit,
            unit_price: item.unit_price,
          })),
        };

        if (dispensingMethod !== 'internal' && selectedPharmacy) {
          prescriptionData.external_pharmacy = selectedPharmacy;
        }

        await api.post(endpoints.prescriptions.list, prescriptionData);
      }

      // Complete registration
      await api.post(endpoints.registrations.complete(currentRegistrationId));

      addNotification({
        type: 'success',
        title: '診療記錄已儲存',
        message: '病患已完成診療',
      });

      // Clear and refresh
      clearConsultation();
      setPrescriptionItems([]);
      setAdditionalCharges([]);
      setHistoryRecords([]);
      fetchQueue();
    } catch (error) {
      addNotification({
        type: 'error',
        title: '儲存失敗',
        message: '請檢查資料後重試',
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculate totals
  const medicineTotal = prescriptionItems.reduce((sum, item) => sum + item.subtotal, 0);
  const additionalTotal = additionalCharges.reduce((sum, item) => sum + item.amount, 0);
  const selectedPharmacyData = externalPharmacies.find((p) => p.id === selectedPharmacy);
  const processingFee = dispensingMethod !== 'internal' && selectedPharmacyData ? selectedPharmacyData.processing_fee : 0;
  const deliveryFee = dispensingMethod !== 'internal' && selectedPharmacyData ? selectedPharmacyData.delivery_fee : 0;
  const totalAmount = medicineTotal + additionalTotal + processingFee + deliveryFee;

  return (
    <MainLayout>
      <div className="flex gap-6 h-[calc(100vh-7rem)]">
        {/* Left Panel - Queue */}
        <div className="w-72 flex-shrink-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">候診名單</CardTitle>
              <Button variant="ghost" size="sm" onClick={fetchQueue}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
              {loading ? (
                <div className="p-4 text-center text-gray-500">載入中...</div>
              ) : queue.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>目前沒有候診病患</p>
                </div>
              ) : (
                <div className="divide-y">
                  {queue.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => selectPatient(patient)}
                      className={cn(
                        'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3',
                        currentRegistrationId === patient.id && 'bg-blue-50 border-l-4 border-blue-500'
                      )}
                    >
                      <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                        {patient.queue_number}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {patient.patient.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {patient.patient.chart_number} · {patient.visit_type === 'first' ? '初診' : '覆診'}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Patient Info Bar */}
          {currentPatient ? (
            <Card className="mb-4">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900">
                          {currentPatient.name}
                        </h2>
                        <span className="text-sm text-gray-500">
                          {getGenderDisplay(currentPatient.gender)} /{' '}
                          {calculateAge(currentPatient.birth_date)}歲
                        </span>
                        {currentPatient.allergies && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            過敏
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        病歷號: {currentPatient.chart_number} | 生日:{' '}
                        {formatDate(currentPatient.birth_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      影像
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileCheck className="h-4 w-4 mr-1" />
                      證明書
                    </Button>
                    <Button
                      onClick={saveConsultation}
                      loading={saving}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      存檔完診
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-4">
              <CardContent className="py-8 text-center text-gray-500">
                <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>請從左側候診名單選擇病患</p>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('diagnosis')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === 'diagnosis'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              四診記錄
            </button>
            <button
              onClick={() => setActiveTab('prescription')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === 'prescription'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Pill className="h-4 w-4 inline mr-2" />
              處方開立
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === 'history'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <History className="h-4 w-4 inline mr-2" />
              歷史記錄
            </button>
          </div>

          {/* Tab Content */}
          <Card className="flex-1 overflow-auto">
            <CardContent className="p-6">
              {activeTab === 'diagnosis' && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      主訴
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="病患主要症狀..."
                      value={consultationForm.chief_complaint}
                      onChange={(e) =>
                        setConsultationForm({
                          ...consultationForm,
                          chief_complaint: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      現病史
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="症狀發展過程..."
                      value={consultationForm.present_illness}
                      onChange={(e) =>
                        setConsultationForm({
                          ...consultationForm,
                          present_illness: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      望診
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="神色、形態..."
                      value={consultationForm.inspection}
                      onChange={(e) =>
                        setConsultationForm({
                          ...consultationForm,
                          inspection: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      舌象
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="舌質、舌苔..."
                      value={consultationForm.tongue_appearance}
                      onChange={(e) =>
                        setConsultationForm({
                          ...consultationForm,
                          tongue_appearance: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      脈象
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="脈象描述..."
                      value={consultationForm.pulse}
                      onChange={(e) =>
                        setConsultationForm({
                          ...consultationForm,
                          pulse: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      中醫診斷
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="診斷結果..."
                      value={consultationForm.tcm_diagnosis}
                      onChange={(e) =>
                        setConsultationForm({
                          ...consultationForm,
                          tcm_diagnosis: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      辨證
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="證型分析..."
                      value={consultationForm.syndrome_differentiation}
                      onChange={(e) =>
                        setConsultationForm({
                          ...consultationForm,
                          syndrome_differentiation: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      治則
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="治療原則..."
                      value={consultationForm.treatment_principle}
                      onChange={(e) =>
                        setConsultationForm({
                          ...consultationForm,
                          treatment_principle: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      醫囑
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="注意事項、飲食禁忌..."
                      value={consultationForm.advice}
                      onChange={(e) =>
                        setConsultationForm({
                          ...consultationForm,
                          advice: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {activeTab === 'prescription' && (
                <div className="space-y-6">
                  {/* Dispensing Method Selection */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">執藥方式</h3>
                    <div className="flex gap-4">
                      <label className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors',
                        dispensingMethod === 'internal' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      )}>
                        <input
                          type="radio"
                          name="dispensingMethod"
                          value="internal"
                          checked={dispensingMethod === 'internal'}
                          onChange={() => setDispensingMethod('internal')}
                          className="sr-only"
                        />
                        <Package className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">內部配藥</span>
                      </label>
                      <label className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors',
                        dispensingMethod === 'external_decoction' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      )}>
                        <input
                          type="radio"
                          name="dispensingMethod"
                          value="external_decoction"
                          checked={dispensingMethod === 'external_decoction'}
                          onChange={() => setDispensingMethod('external_decoction')}
                          className="sr-only"
                        />
                        <Truck className="h-5 w-5 text-orange-600" />
                        <span className="font-medium">外送煎藥</span>
                      </label>
                      <label className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors',
                        dispensingMethod === 'external_concentrated' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      )}>
                        <input
                          type="radio"
                          name="dispensingMethod"
                          value="external_concentrated"
                          checked={dispensingMethod === 'external_concentrated'}
                          onChange={() => setDispensingMethod('external_concentrated')}
                          className="sr-only"
                        />
                        <Building2 className="h-5 w-5 text-green-600" />
                        <span className="font-medium">外送濃縮</span>
                      </label>
                    </div>

                    {/* External Pharmacy Selection */}
                    {dispensingMethod !== 'internal' && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          選擇配藥房
                        </label>
                        <select
                          value={selectedPharmacy || ''}
                          onChange={(e) => setSelectedPharmacy(Number(e.target.value) || null)}
                          className="w-full border border-gray-300 rounded-md p-2 text-sm"
                        >
                          <option value="">請選擇配藥房...</option>
                          {externalPharmacies
                            .filter((p) => 
                              (dispensingMethod === 'external_decoction' && p.type === 'decoction') ||
                              (dispensingMethod === 'external_concentrated' && p.type === 'concentrated')
                            )
                            .map((pharmacy) => (
                              <option key={pharmacy.id} value={pharmacy.id}>
                                {pharmacy.name} (加工費: ${pharmacy.processing_fee}, 運費: ${pharmacy.delivery_fee})
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Prescription Settings */}
                  <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">處方名稱</label>
                      <Input
                        value={prescriptionSettings.name}
                        onChange={(e) => setPrescriptionSettings({ ...prescriptionSettings, name: e.target.value })}
                        className="w-32"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">總帖數</label>
                      <Input
                        type="number"
                        value={prescriptionSettings.total_doses}
                        onChange={(e) => setPrescriptionSettings({ ...prescriptionSettings, total_doses: parseInt(e.target.value) || 1 })}
                        className="w-20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">每日帖數</label>
                      <Input
                        type="number"
                        value={prescriptionSettings.doses_per_day}
                        onChange={(e) => setPrescriptionSettings({ ...prescriptionSettings, doses_per_day: parseInt(e.target.value) || 1 })}
                        className="w-20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">天數</label>
                      <Input
                        type="number"
                        value={prescriptionSettings.days}
                        onChange={(e) => setPrescriptionSettings({ ...prescriptionSettings, days: parseInt(e.target.value) || 1 })}
                        className="w-20"
                      />
                    </div>
                    <div className="flex-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        fetchExperienceFormulas();
                        setShowFormulaModal(true);
                      }}
                    >
                      <BookOpen className="h-4 w-4 mr-1" />
                      調用經驗方
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={saveAsExperienceFormula}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      存為經驗方
                    </Button>
                  </div>

                  {/* Medicine Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="搜尋藥品 (代碼、名稱、拼音)..."
                      className="pl-10"
                      value={medicineSearch}
                      onChange={(e) => searchMedicine(e.target.value)}
                    />
                    {medicineResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-auto">
                        {medicineResults.map((medicine) => (
                          <button
                            key={medicine.id}
                            onClick={() => addMedicine(medicine)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{medicine.name}</span>
                              <span className="text-gray-500 text-sm">
                                ({medicine.code})
                              </span>
                              {medicine.is_compound && (
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                                  複方
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className={cn(
                                medicine.current_stock <= 0 ? 'text-red-500' : 'text-gray-500'
                              )}>
                                庫存: {medicine.current_stock}
                              </span>
                              <span className="text-gray-500">
                                ${medicine.selling_price}/{medicine.unit}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Prescription Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>代碼</TableHead>
                        <TableHead>藥品名稱</TableHead>
                        <TableHead className="w-24">劑量</TableHead>
                        <TableHead>單位</TableHead>
                        <TableHead className="text-right">單價</TableHead>
                        <TableHead className="text-right">小計</TableHead>
                        <TableHead className="w-20">庫存</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prescriptionItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                            <Pill className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>尚未添加藥品，請搜尋藥品或調用經驗方</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        prescriptionItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-sm">
                              {item.medicine_code}
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {item.medicine_name}
                                {item.is_compound && (
                                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                                    複方
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={item.dosage}
                                onChange={(e) =>
                                  updateDosage(index, parseFloat(e.target.value) || 0)
                                }
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell className="text-right">
                              ${item.unit_price || 0}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${(item.subtotal || 0).toFixed(0)}
                            </TableCell>
                            <TableCell className={cn(
                              'text-center',
                              (item.stock_quantity || 0) <= 0 ? 'text-red-500' : 'text-gray-500'
                            )}>
                              {item.stock_quantity ?? '-'}
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() => removeMedicine(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {/* Additional Charges */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">其他收費項目</h4>
                      <Button variant="ghost" size="sm" onClick={addAdditionalCharge}>
                        <Plus className="h-4 w-4 mr-1" />
                        新增項目
                      </Button>
                    </div>
                    {additionalCharges.length > 0 && (
                      <div className="space-y-2">
                        {additionalCharges.map((charge, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded">
                            <span>{charge.name}</span>
                            <div className="flex items-center gap-4">
                              <span className="font-medium">${charge.amount}</span>
                              <button
                                onClick={() => removeAdditionalCharge(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Total Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">藥費小計:</span>
                        <span>${medicineTotal.toFixed(0)}</span>
                      </div>
                      {additionalTotal > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">其他收費:</span>
                          <span>${additionalTotal.toFixed(0)}</span>
                        </div>
                      )}
                      {processingFee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">加工費:</span>
                          <span>${processingFee.toFixed(0)}</span>
                        </div>
                      )}
                      {deliveryFee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">運送費:</span>
                          <span>${deliveryFee.toFixed(0)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between">
                        <span className="font-medium text-gray-900">總計:</span>
                        <span className="text-2xl font-bold text-blue-600">
                          ${totalAmount.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  {!currentPatient ? (
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>請先選擇病患以查看歷史記錄</p>
                    </div>
                  ) : loadingHistory ? (
                    <div className="text-center py-8 text-gray-500">載入中...</div>
                  ) : historyRecords.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>此病患尚無歷史診療記錄</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {historyRecords.map((record) => (
                        <div
                          key={record.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">
                              {formatDate(record.date)}
                            </span>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {record.prescription_count} 張處方
                            </span>
                          </div>
                          <p className="font-medium text-gray-900 mb-1">
                            主訴: {record.chief_complaint || '-'}
                          </p>
                          <p className="text-sm text-gray-600">
                            診斷: {record.tcm_diagnosis || '-'}
                          </p>
                          <div className="mt-2 flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Copy className="h-4 w-4 mr-1" />
                              複製處方
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Allergy Warning Modal */}
      {showAllergyWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">過敏警告</h3>
                <p className="text-sm text-gray-500">請注意病患過敏資訊</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{allergyMessage}</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowAllergyWarning(false)}>
                我已了解
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Experience Formula Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">調用經驗方</h3>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-4">
              <Input
                placeholder="搜尋經驗方..."
                value={formulaSearch}
                onChange={(e) => {
                  setFormulaSearch(e.target.value);
                  fetchExperienceFormulas(e.target.value);
                }}
              />
            </div>
            <div className="space-y-2">
              {experienceFormulas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>尚無經驗方記錄</p>
                </div>
              ) : (
                experienceFormulas.map((formula) => (
                  <div
                    key={formula.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => applyExperienceFormula(formula)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{formula.name}</h4>
                        <p className="text-sm text-gray-500">{formula.description}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {formula.items.length} 味藥
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
