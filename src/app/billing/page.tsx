/**
 * Billing Page - 完整版
 * 收款作業 - 包含付款、退款、欠款管理功能
 */

'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Receipt,
  Printer,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Wallet,
  Ban,
  Edit,
  Eye,
  FileText,
  Package,
  Truck,
  Building2,
  History,
  Plus,
  Minus,
  X,
} from 'lucide-react';
import {
  cn,
  formatDate,
  formatDateTime,
  formatCurrency,
  getBillStatusDisplay,
  getPaymentMethodDisplay,
  getDispensingMethodDisplay,
} from '@/lib/utils';
import { useNotificationStore } from '@/store';
import api, { endpoints } from '@/lib/api';

interface Bill {
  id: number;
  bill_number: string;
  registration: number;
  patient: number;
  patient_name: string;
  patient_chart_number: string;
  bill_date: string;
  status: string;
  status_display: string;
  subtotal: string;
  discount: string;
  total_amount: string;
  paid_amount: string;
  balance_due: string;
  payment_method: string;
  payment_method_display: string;
  paid_at: string | null;
  notes: string;
  items: BillItem[];
  created_at: string;
  updated_at: string;
  // Computed properties for UI
  balance?: number;
  consultation_fee?: number;
  medicine_fee?: number;
  processing_fee?: number;
  delivery_fee?: number;
  other_fees?: number;
  dispensing_method?: string;
  payments?: Payment[];
}

interface BillItem {
  id: number;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  type: 'medicine' | 'fee' | 'other';
}

interface Payment {
  id: number;
  amount: number;
  payment_method: string;
  reference_number?: string;
  created_at: string;
  created_by: string;
}

interface Debt {
  id: number;
  patient: number;
  patient_name: string;
  patient_chart_number: string;
  bill: number;
  bill_number: string;
  original_amount: string;
  remaining_amount: string;
  status: string;
  status_display: string;
  due_date?: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export default function BillingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [activeView, setActiveView] = useState<'bills' | 'debts'>('bills');
  
  // Selected bill for operations
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showBillDetail, setShowBillDetail] = useState(false);
  
  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Refund modal
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  
  // Edit bill modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDiscount, setEditDiscount] = useState('');
  const [editOtherFees, setEditOtherFees] = useState<Array<{ name: string; amount: number }>>([]);
  
  // Credit to account modal
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (activeView === 'bills') {
      fetchBills();
    } else {
      fetchDebts();
    }
  }, [statusFilter, dateFilter, activeView]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (dateFilter === 'today') {
        params.date = new Date().toISOString().split('T')[0];
      }
      const response = await api.get(endpoints.bills.list, { params });
      setBills(response.data?.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch bills:', error);
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDebts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/billing/debts/');
      setDebts(response.data?.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch debts:', error);
      setDebts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillDetail = async (billId: number) => {
    try {
      const response = await api.get(`/api/v1/bills/${billId}/`);
      setSelectedBill(response.data);
      setShowBillDetail(true);
    } catch (error) {
      console.error('Failed to fetch bill detail:', error);
    }
  };

  const openPaymentModal = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentAmount(parseFloat(bill.balance_due || "0").toString());
    setPaymentMethod('cash');
    setPaymentReference('');
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!selectedBill) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      addNotification({
        type: 'error',
        title: '請輸入有效金額',
      });
      return;
    }

    if (amount > parseFloat(selectedBill.balance_due || "0")) {
      addNotification({
        type: 'error',
        title: '金額超過待付餘額',
        message: `最多可收款 ${formatCurrency(parseFloat(selectedBill.balance_due || "0"))}`,
      });
      return;
    }

    setProcessing(true);
    try {
      await api.post(endpoints.bills.pay(selectedBill.id), {
        amount,
        payment_method: paymentMethod,
        reference_number: paymentReference || undefined,
      });
      addNotification({
        type: 'success',
        title: '付款成功',
        message: `已收款 ${formatCurrency(amount)}`,
      });
      setShowPaymentModal(false);
      setSelectedBill(null);
      fetchBills();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      addNotification({
        type: 'error',
        title: '付款失敗',
        message: err.response?.data?.detail || '請稍後再試',
      });
    } finally {
      setProcessing(false);
    }
  };

  const openRefundModal = (bill: Bill) => {
    if (parseFloat(bill.paid_amount || "0") <= 0) {
      addNotification({
        type: 'error',
        title: '無法退款',
        message: '此帳單尚未付款',
      });
      return;
    }
    setSelectedBill(bill);
    setRefundReason('');
    setShowRefundModal(true);
  };

  const handleRefund = async () => {
    if (!selectedBill) return;

    if (!refundReason.trim()) {
      addNotification({
        type: 'error',
        title: '請輸入退款原因',
      });
      return;
    }

    setProcessing(true);
    try {
      await api.post(`/api/v1/bills/${selectedBill.id}/refund/`, {
        reason: refundReason,
      });
      addNotification({
        type: 'success',
        title: '退款成功',
        message: `已退款 ${formatCurrency(parseFloat(selectedBill.paid_amount || "0"))}`,
      });
      setShowRefundModal(false);
      setSelectedBill(null);
      fetchBills();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      addNotification({
        type: 'error',
        title: '退款失敗',
        message: err.response?.data?.detail || '無法退款（可能已配藥）',
      });
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (bill: Bill) => {
    setSelectedBill(bill);
    setEditDiscount(bill.discount.toString());
    setEditOtherFees([]);
    setShowEditModal(true);
  };

  const handleEditBill = async () => {
    if (!selectedBill) return;

    setProcessing(true);
    try {
      const discount = parseFloat(editDiscount) || 0;
      const otherFeesTotal = editOtherFees.reduce((sum, f) => sum + f.amount, 0);
      
      await api.patch(`/api/v1/bills/${selectedBill.id}/`, {
        discount,
        other_fees: (selectedBill.other_fees || 0) + otherFeesTotal,
        additional_items: editOtherFees,
      });
      addNotification({
        type: 'success',
        title: '帳單已更新',
      });
      setShowEditModal(false);
      setSelectedBill(null);
      fetchBills();
    } catch (error) {
      addNotification({
        type: 'error',
        title: '更新失敗',
      });
    } finally {
      setProcessing(false);
    }
  };

  const openCreditModal = (bill: Bill) => {
    if (parseFloat(bill.paid_amount || "0") <= 0) {
      addNotification({
        type: 'error',
        title: '無法轉存',
        message: '此帳單尚未付款',
      });
      return;
    }
    setSelectedBill(bill);
    setCreditAmount(parseFloat(bill.paid_amount || "0").toString());
    setShowCreditModal(true);
  };

  const handleCreditToAccount = async () => {
    if (!selectedBill) return;

    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0 || amount > parseFloat(selectedBill.paid_amount || "0")) {
      addNotification({
        type: 'error',
        title: '請輸入有效金額',
      });
      return;
    }

    setProcessing(true);
    try {
      await api.post(`/api/v1/bills/${selectedBill.id}/credit-to-account/`, {
        amount,
      });
      addNotification({
        type: 'success',
        title: '已轉存至病患帳戶',
        message: `${formatCurrency(amount)} 已存入病患帳戶`,
      });
      setShowCreditModal(false);
      setSelectedBill(null);
      fetchBills();
    } catch (error) {
      addNotification({
        type: 'error',
        title: '轉存失敗',
      });
    } finally {
      setProcessing(false);
    }
  };

  const printReceipt = (bill: Bill) => {
    // In a real implementation, this would open a print dialog
    addNotification({
      type: 'info',
      title: '列印收據',
      message: `正在列印帳單 ${bill.bill_number}`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDispensingIcon = (method: string) => {
    switch (method) {
      case 'internal':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'external_decoction':
        return <Truck className="h-4 w-4 text-orange-600" />;
      case 'external_concentrated':
        return <Building2 className="h-4 w-4 text-green-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-400" />;
    }
  };

  const filteredBills = bills.filter(
    (bill) =>
      bill.patient?.name?.includes(searchQuery) ||
      bill.patient?.chart_number?.includes(searchQuery) ||
      bill.bill_number?.includes(searchQuery)
  );

  // Stats
  const pendingCount = bills.filter((b) => b.status === 'pending' || b.status === 'partial').length;
  const todayRevenue = bills
    .filter((b) => b.status === 'paid' || b.status === 'partial')
    .reduce((sum, b) => sum + b.paid_amount, 0);
  const pendingAmount = bills
    .filter((b) => b.status === 'pending' || b.status === 'partial')
    .reduce((sum, b) => sum + b.balance, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">收款作業</h1>
            <p className="text-gray-500">管理帳單與收款</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeView === 'bills' ? 'primary' : 'outline'}
              onClick={() => setActiveView('bills')}
            >
              <Receipt className="h-4 w-4 mr-1" />
              帳單列表
            </Button>
            <Button
              variant={activeView === 'debts' ? 'primary' : 'outline'}
              onClick={() => setActiveView('debts')}
            >
              <Wallet className="h-4 w-4 mr-1" />
              欠款管理
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">待付款帳單</p>
                  <p className="text-xl font-bold">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">今日收款</p>
                  <p className="text-xl font-bold">{formatCurrency(todayRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">待收金額</p>
                  <p className="text-xl font-bold">{formatCurrency(pendingAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {activeView === 'bills' ? (
          <>
            {/* Filters */}
            <Card>
              <CardContent className="py-4">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="搜尋帳單 (病患姓名、病歷號、帳單號)..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <option value="today">今日</option>
                    <option value="all">全部日期</option>
                  </select>
                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">全部狀態</option>
                    <option value="pending">待付款</option>
                    <option value="partial">部分付款</option>
                    <option value="paid">已付款</option>
                    <option value="refunded">已退款</option>
                  </select>
                  <Button variant="outline" onClick={fetchBills}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bills Table */}
            <Card>
              <CardHeader>
                <CardTitle>帳單列表</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>帳單號</TableHead>
                      <TableHead>病患</TableHead>
                      <TableHead>執藥方式</TableHead>
                      <TableHead className="text-right">總金額</TableHead>
                      <TableHead className="text-right">已付</TableHead>
                      <TableHead className="text-right">餘額</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>日期</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          載入中...
                        </TableCell>
                      </TableRow>
                    ) : filteredBills.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>目前沒有帳單記錄</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBills.map((bill) => (
                        <TableRow key={bill.id} className="hover:bg-gray-50">
                          <TableCell className="font-mono text-sm">
                            {bill.bill_number}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{bill.patient_name}</p>
                              <p className="text-xs text-gray-500">
                                {bill.patient_chart_number}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getDispensingIcon(bill.dispensing_method)}
                              <span className="text-sm">
                                {getDispensingMethodDisplay(bill.dispensing_method)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(parseFloat(bill.total_amount || "0"))}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(parseFloat(bill.paid_amount || "0"))}
                          </TableCell>
                          <TableCell className="text-right">
                            {parseFloat(bill.balance_due || "0") > 0 ? (
                              <span className="text-red-600 font-medium">
                                {formatCurrency(parseFloat(bill.balance_due || "0"))}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'px-2 py-1 rounded text-xs font-medium',
                                getStatusColor(bill.status)
                              )}
                            >
                              {getBillStatusDisplay(bill.status)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(bill.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => fetchBillDetail(bill.id)}
                                title="查看詳情"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(bill.status === 'pending' || bill.status === 'partial') && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openEditModal(bill)}
                                    title="編輯帳單"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => openPaymentModal(bill)}
                                    title="收款"
                                  >
                                    <CreditCard className="h-4 w-4 mr-1" />
                                    收款
                                  </Button>
                                </>
                              )}
                              {bill.status === 'paid' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openRefundModal(bill)}
                                    title="退款"
                                  >
                                    <ArrowLeft className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openCreditModal(bill)}
                                    title="轉存帳戶"
                                  >
                                    <Wallet className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => printReceipt(bill)}
                                title="列印收據"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Debts View */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                欠款病患列表
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>病患</TableHead>
                    <TableHead>病歷號</TableHead>
                    <TableHead>聯絡電話</TableHead>
                    <TableHead className="text-right">欠款總額</TableHead>
                    <TableHead>未付帳單數</TableHead>
                    <TableHead>最後付款日</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        載入中...
                      </TableCell>
                    </TableRow>
                  ) : debts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-300" />
                        <p>目前沒有欠款記錄</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    debts.map((debt) => (
                      <TableRow key={debt.id}>
                        <TableCell className="font-medium">{debt.patient_name}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {debt.patient_chart_number}
                        </TableCell>
                        <TableCell>{debt.patient_chart_number || '-'}</TableCell>
                        <TableCell className="text-right">
                          <span className="text-red-600 font-bold">
                            {formatCurrency(parseFloat(debt.remaining_amount))}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                            {1} 張
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {debt.updated_at ? formatDate(debt.updated_at) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline">
                            <History className="h-4 w-4 mr-1" />
                            查看帳單
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bill Detail Modal */}
      <Modal
        isOpen={showBillDetail}
        onClose={() => setShowBillDetail(false)}
        title="帳單詳情"
        size="lg"
      >
        {selectedBill && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">帳單號</p>
                <p className="font-mono text-lg font-bold">{selectedBill.bill_number}</p>
              </div>
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  getStatusColor(selectedBill.status)
                )}
              >
                {getBillStatusDisplay(selectedBill.status)}
              </span>
            </div>

            {/* Patient & Consultation Info */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">病患</p>
                <p className="font-medium">{selectedBill.patient.name}</p>
                <p className="text-sm text-gray-500">{selectedBill.patient.chart_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">執藥方式</p>
                <div className="flex items-center gap-2">
                  {getDispensingIcon(selectedBill.dispensing_method)}
                  <span>{getDispensingMethodDisplay(selectedBill.dispensing_method)}</span>
                </div>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">費用明細</h4>
              <div className="border rounded-lg divide-y">
                <div className="flex justify-between px-4 py-2">
                  <span className="text-gray-600">診金</span>
                  <span>{formatCurrency(selectedBill.consultation_fee)}</span>
                </div>
                <div className="flex justify-between px-4 py-2">
                  <span className="text-gray-600">藥費</span>
                  <span>{formatCurrency(selectedBill.medicine_fee)}</span>
                </div>
                {selectedBill.processing_fee > 0 && (
                  <div className="flex justify-between px-4 py-2">
                    <span className="text-gray-600">加工費</span>
                    <span>{formatCurrency(selectedBill.processing_fee)}</span>
                  </div>
                )}
                {selectedBill.delivery_fee > 0 && (
                  <div className="flex justify-between px-4 py-2">
                    <span className="text-gray-600">運送費</span>
                    <span>{formatCurrency(selectedBill.delivery_fee)}</span>
                  </div>
                )}
                {selectedBill.other_fees > 0 && (
                  <div className="flex justify-between px-4 py-2">
                    <span className="text-gray-600">其他費用</span>
                    <span>{formatCurrency(selectedBill.other_fees)}</span>
                  </div>
                )}
                {selectedBill.discount > 0 && (
                  <div className="flex justify-between px-4 py-2 text-green-600">
                    <span>折扣</span>
                    <span>-{formatCurrency(selectedBill.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-3 bg-gray-50 font-medium">
                  <span>總計</span>
                  <span className="text-lg">{formatCurrency(parseFloat(selectedBill.total_amount || "0"))}</span>
                </div>
              </div>
            </div>

            {/* Payment History */}
            {selectedBill.payments && selectedBill.payments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">付款記錄</h4>
                <div className="border rounded-lg divide-y">
                  {selectedBill.payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center px-4 py-2">
                      <div>
                        <p className="font-medium text-green-600">
                          +{formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getPaymentMethodDisplay(payment.payment_method)}
                          {payment.reference_number && ` · ${payment.reference_number}`}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{formatDateTime(payment.created_at)}</p>
                        <p>{payment.created_by}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">已付金額</span>
                <span className="text-green-600 font-medium">
                  {formatCurrency(parseFloat(selectedBill.paid_amount || "0"))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">待付餘額</span>
                <span className={cn(
                  'text-xl font-bold',
                  parseFloat(selectedBill.balance_due || "0") > 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  {formatCurrency(parseFloat(selectedBill.balance_due || "0"))}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => printReceipt(selectedBill)}>
                <Printer className="h-4 w-4 mr-1" />
                列印收據
              </Button>
              {(selectedBill.status === 'pending' || selectedBill.status === 'partial') && (
                <Button onClick={() => {
                  setShowBillDetail(false);
                  openPaymentModal(selectedBill);
                }}>
                  <CreditCard className="h-4 w-4 mr-1" />
                  收款
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="收款"
        size="md"
      >
        {selectedBill && (
          <div className="space-y-6">
            {/* Bill Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">病患</span>
                <span className="font-medium">{selectedBill.patient.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">帳單號</span>
                <span className="font-mono text-sm">{selectedBill.bill_number}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">總金額</span>
                <span className="font-medium">
                  {formatCurrency(parseFloat(selectedBill.total_amount || "0"))}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">已付金額</span>
                <span className="text-green-600">
                  {formatCurrency(parseFloat(selectedBill.paid_amount || "0"))}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">待付餘額</span>
                <span className="text-xl font-bold text-red-600">
                  {formatCurrency(parseFloat(selectedBill.balance_due || "0"))}
                </span>
              </div>
            </div>

            {/* Payment Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  收款金額
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPaymentAmount(parseFloat(selectedBill.balance_due || "0").toString())}
                  >
                    全額 {formatCurrency(parseFloat(selectedBill.balance_due || "0"))}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPaymentAmount((parseFloat(selectedBill.balance_due || "0") / 2).toString())}
                  >
                    半額 {formatCurrency(parseFloat(selectedBill.balance_due || "0") / 2)}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  付款方式
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'cash', label: '現金', icon: DollarSign },
                    { value: 'credit_card', label: '信用卡', icon: CreditCard },
                    { value: 'mobile_pay', label: '行動支付', icon: Wallet },
                    { value: 'bank_transfer', label: '銀行轉帳', icon: Building2 },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className={cn(
                        'flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors',
                        paymentMethod === method.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <input
                        type="radio"
                        value={method.value}
                        checked={paymentMethod === method.value}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="sr-only"
                      />
                      <method.icon className="h-5 w-5 mb-1" />
                      <span className="text-xs font-medium">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {paymentMethod !== 'cash' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    參考編號 (選填)
                  </label>
                  <Input
                    placeholder="交易編號、授權碼等"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
                disabled={processing}
              >
                取消
              </Button>
              <Button
                onClick={handlePayment}
                loading={processing}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                確認收款
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Refund Modal */}
      <Modal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        title="退款"
        size="md"
      >
        {selectedBill && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">退款注意事項</p>
                  <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                    <li>若已配藥，則無法進行退款</li>
                    <li>退款後帳單狀態將變更為「已退款」</li>
                    <li>退款金額將全額退還</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">帳單號</span>
                <span className="font-mono">{selectedBill.bill_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">退款金額</span>
                <span className="text-xl font-bold text-red-600">
                  {formatCurrency(parseFloat(selectedBill.paid_amount || "0"))}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                退款原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="請輸入退款原因..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowRefundModal(false)}
                disabled={processing}
              >
                取消
              </Button>
              <Button
                variant="danger"
                onClick={handleRefund}
                loading={processing}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                確認退款
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Bill Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="編輯帳單"
        size="md"
      >
        {selectedBill && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                折扣金額
              </label>
              <div className="relative">
                <Minus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  value={editDiscount}
                  onChange={(e) => setEditDiscount(e.target.value)}
                  className="pl-10"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  其他收費項目
                </label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditOtherFees([...editOtherFees, { name: '', amount: 0 }])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  新增
                </Button>
              </div>
              {editOtherFees.map((fee, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    placeholder="項目名稱"
                    value={fee.name}
                    onChange={(e) => {
                      const updated = [...editOtherFees];
                      updated[index].name = e.target.value;
                      setEditOtherFees(updated);
                    }}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="金額"
                    value={fee.amount || ''}
                    onChange={(e) => {
                      const updated = [...editOtherFees];
                      updated[index].amount = parseFloat(e.target.value) || 0;
                      setEditOtherFees(updated);
                    }}
                    className="w-32"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditOtherFees(editOtherFees.filter((_, i) => i !== index))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                disabled={processing}
              >
                取消
              </Button>
              <Button
                onClick={handleEditBill}
                loading={processing}
              >
                儲存變更
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Credit to Account Modal */}
      <Modal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        title="轉存至病患帳戶"
        size="md"
      >
        {selectedBill && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                將已付款項轉存至病患帳戶，可用於抵扣未來的診療費用。
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">病患</span>
                <span className="font-medium">{selectedBill.patient.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">可轉存金額</span>
                <span className="font-bold">{formatCurrency(parseFloat(selectedBill.paid_amount || "0"))}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                轉存金額
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowCreditModal(false)}
                disabled={processing}
              >
                取消
              </Button>
              <Button
                onClick={handleCreditToAccount}
                loading={processing}
              >
                <Wallet className="h-4 w-4 mr-1" />
                確認轉存
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
