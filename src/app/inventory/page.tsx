/**
 * Inventory Management Page
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
  Plus,
  Search,
  Package,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  Edit,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useNotificationStore } from '@/store';
import api, { endpoints } from '@/lib/api';

interface Medicine {
  id: number;
  code: string;
  name: string;
  pinyin: string;
  category: string;
  unit: string;
  cost_price?: string;
  selling_price: string;
  current_stock: number;
  safety_stock: number;
  is_active: boolean;
}

interface InventoryTransaction {
  id: number;
  medicine_name: string;
  transaction_type: string;
  quantity: number;
  unit_price: number;
  reference: string;
  created_at: string;
}

export default function InventoryPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [adjustReason, setAdjustReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    fetchMedicines();
  }, [showLowStock]);

  const fetchMedicines = async () => {
    try {
      const endpoint = showLowStock ? endpoints.inventory.lowStock : endpoints.medicines.list;
      const response = await api.get(endpoint);
      setMedicines(response.data?.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProcessing(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      code: formData.get('code'),
      name: formData.get('name'),
      pinyin: formData.get('pinyin') || '',
      medicine_type: formData.get('medicine_type'),
      unit: formData.get('unit'),
      cost_price: formData.get('cost_price') || null,
      selling_price: formData.get('selling_price'),
      current_stock: parseInt(formData.get('initial_stock') as string) || 0,
      safety_stock: parseInt(formData.get('safety_stock') as string) || 100,
      is_active: true,
    };
    
    try {
      await api.post(endpoints.medicines.list, data);
      addNotification({
        type: 'success',
        title: '新增成功',
        message: `藥品 ${data.name} 已成功新增`,
      });
      setShowAddModal(false);
      fetchMedicines();
    } catch (error) {
      console.error('Failed to add medicine:', error);
      addNotification({
        type: 'error',
        title: '新增失敗',
        message: '無法新增藥品，請稍後再試',
      });
    } finally {
      setProcessing(false);
    }
  };

  const searchMedicines = async () => {
    if (!searchQuery.trim()) {
      fetchMedicines();
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(endpoints.medicines.search, {
        params: { q: searchQuery },
      });
      setMedicines(response.data?.results || response.data || []);
    } catch (error) {
      console.error('Failed to search medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAdjustModal = (medicine: Medicine, type: 'in' | 'out') => {
    setSelectedMedicine(medicine);
    setAdjustType(type);
    setAdjustQuantity('');
    setAdjustReason('');
    setShowAdjustModal(true);
  };

  const handleAdjust = async () => {
    if (!selectedMedicine) return;

    const quantity = parseFloat(adjustQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      addNotification({
        type: 'error',
        title: '請輸入有效數量',
      });
      return;
    }

    setProcessing(true);
    try {
      await api.post(endpoints.inventory.adjust(selectedMedicine.id), {
        quantity: adjustType === 'out' ? -quantity : quantity,
        reason: adjustReason,
      });
      addNotification({
        type: 'success',
        title: '庫存調整成功',
      });
      setShowAdjustModal(false);
      fetchMedicines();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      addNotification({
        type: 'error',
        title: '調整失敗',
        message: err.response?.data?.detail || '請稍後再試',
      });
    } finally {
      setProcessing(false);
    }
  };

  const lowStockCount = medicines.filter(
    (m) => m.current_stock <= m.safety_stock
  ).length;

  const filteredMedicines = medicines.filter(
    (m) =>
      m.name.includes(searchQuery) ||
      m.code.includes(searchQuery) ||
      m.pinyin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">庫存管理</h1>
            <p className="text-gray-500">管理藥品庫存與進出貨</p>
          </div>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAddModal(true)}
          >
            新增藥品
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">藥品總數</p>
                  <p className="text-xl font-bold">{medicines.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={cn(
              'cursor-pointer transition-colors',
              showLowStock && 'ring-2 ring-red-500'
            )}
            onClick={() => setShowLowStock(!showLowStock)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">低庫存警報</p>
                  <p className="text-xl font-bold text-red-600">{lowStockCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ArrowUpCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">本月進貨</p>
                  <p className="text-xl font-bold">-</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="py-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜尋藥品 (代碼、名稱、拼音)..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchMedicines()}
                />
              </div>
              <Button onClick={searchMedicines}>搜尋</Button>
            </div>
          </CardContent>
        </Card>

        {/* Medicines Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {showLowStock ? '低庫存藥品' : '藥品列表'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>代碼</TableHead>
                  <TableHead>藥品名稱</TableHead>
                  <TableHead>分類</TableHead>
                  <TableHead>單位</TableHead>
                  <TableHead className="text-right">成本價</TableHead>
                  <TableHead className="text-right">售價</TableHead>
                  <TableHead className="text-right">庫存</TableHead>
                  <TableHead className="text-right">安全庫存</TableHead>
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
                ) : filteredMedicines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>目前沒有藥品資料</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMedicines.map((medicine) => (
                    <TableRow key={medicine.id}>
                      <TableCell className="font-mono text-sm">
                        {medicine.code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{medicine.name}</p>
                          <p className="text-xs text-gray-500">{medicine.pinyin}</p>
                        </div>
                      </TableCell>
                      <TableCell>{medicine.category || '-'}</TableCell>
                      <TableCell>{medicine.unit}</TableCell>
                      <TableCell className="text-right">
                        {medicine.cost_price ? formatCurrency(parseFloat(medicine.cost_price)) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(parseFloat(medicine.selling_price))}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            'font-medium',
                            medicine.current_stock <= medicine.safety_stock
                              ? 'text-red-600'
                              : 'text-gray-900'
                          )}
                        >
                          {medicine.current_stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-gray-500">
                        {medicine.safety_stock}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<ArrowUpCircle className="h-4 w-4 text-green-600" />}
                            onClick={() => openAdjustModal(medicine, 'in')}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<ArrowDownCircle className="h-4 w-4 text-red-600" />}
                            onClick={() => openAdjustModal(medicine, 'out')}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Edit className="h-4 w-4" />}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add Medicine Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="新增藥品"
        size="lg"
      >
        <form onSubmit={handleAddMedicine} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="藥品代碼 *"
              name="code"
              placeholder="例如：HB011"
              required
            />
            <Input
              label="藥品名稱 *"
              name="name"
              placeholder="例如：枸杞子"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="拼音"
              name="pinyin"
              placeholder="例如：gouqizi"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">藥品類型 *</label>
              <select
                name="medicine_type"
                className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="herb">單味藥</option>
                <option value="concentrate">濃縮中藥</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="單位 *"
              name="unit"
              placeholder="例如：g"
              defaultValue="g"
              required
            />
            <Input
              label="成本價"
              name="cost_price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
            <Input
              label="售價 *"
              name="selling_price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="初始庫存"
              name="initial_stock"
              type="number"
              min="0"
              defaultValue="0"
            />
            <Input
              label="安全庫存量"
              name="safety_stock"
              type="number"
              min="0"
              defaultValue="100"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
              取消
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? '新增中...' : '新增藥品'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        title={adjustType === 'in' ? '入庫' : '出庫'}
        size="md"
      >
        {selectedMedicine && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">{selectedMedicine.name}</p>
              <p className="text-sm text-gray-500">
                代碼: {selectedMedicine.code} | 目前庫存: {selectedMedicine.current_stock} {selectedMedicine.unit}
              </p>
            </div>

            <Input
              label={adjustType === 'in' ? '入庫數量' : '出庫數量'}
              type="number"
              min="0.1"
              step="0.1"
              value={adjustQuantity}
              onChange={(e) => setAdjustQuantity(e.target.value)}
              rightIcon={<span className="text-gray-500">{selectedMedicine.unit}</span>}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                原因/備註
              </label>
              <textarea
                className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="請輸入調整原因..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowAdjustModal(false)}
                disabled={processing}
              >
                取消
              </Button>
              <Button
                variant={adjustType === 'in' ? 'success' : 'danger'}
                onClick={handleAdjust}
                loading={processing}
              >
                確認{adjustType === 'in' ? '入庫' : '出庫'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
