'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout';
import { Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button, Input, Modal } from '@/components/ui';
import { api, endpoints } from '@/lib/api';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { useUIStore } from '@/store';
import { Package, Truck, Clock, CheckCircle, AlertCircle, RefreshCw, Eye, Send, X } from 'lucide-react';

interface DispensingOrder {
  id: number;
  order_number: string;
  prescription: number;
  patient_name: string;
  pharmacy_name: string;
  pharmacy_type: string;
  status: string;
  status_display: string;
  medicine_cost: string;
  processing_fee: string;
  delivery_fee: string;
  total_cost: string;
  tracking_number: string;
  created_at: string;
  updated_at: string;
}

export default function DispensingOrdersPage() {
  const { addNotification } = useUIStore();
  const [orders, setOrders] = useState<DispensingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<DispensingOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get(endpoints.dispensingOrders.list);
      setOrders(response.data?.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery || 
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.pharmacy_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => ['sent', 'processing'].includes(o.status)).length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  const openDetailModal = (order: DispensingOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">外部訂單管理</h1>
          <p className="text-gray-600">管理外送配藥房和煎藥房的訂單</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">待發送</p>
                <p className="text-xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Package className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">配藥中</p>
                <p className="text-xl font-bold">{stats.processing}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">已發貨</p>
                <p className="text-xl font-bold">{stats.shipped}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">已完成</p>
                <p className="text-xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <Input
              placeholder="搜尋訂單 (訂單號、病患、配藥房)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">全部狀態</option>
              <option value="pending">待發送</option>
              <option value="sent">已發送</option>
              <option value="processing">配藥中</option>
              <option value="shipped">已發貨</option>
              <option value="completed">已完成</option>
              <option value="failed">失敗</option>
            </select>
            <Button variant="outline" onClick={fetchOrders}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </div>
        </Card>

        {/* Orders Table */}
        <Card>
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">訂單列表</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>訂單號</TableHead>
                <TableHead>病患</TableHead>
                <TableHead>配藥房</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>總費用</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>建立時間</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">載入中...</p>
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>目前沒有外部訂單</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-medium">
                      {order.order_number}
                    </TableCell>
                    <TableCell>{order.patient_name}</TableCell>
                    <TableCell>{order.pharmacy_name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.pharmacy_type === 'decoction' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {order.pharmacy_type === 'decoction' ? '煎藥' : '濃縮'}
                      </span>
                    </TableCell>
                    <TableCell>{formatCurrency(parseFloat(order.total_cost || '0'))}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status_display}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {formatDateTime(order.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailModal(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="訂單詳情"
        >
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">訂單號</label>
                  <p className="font-mono font-medium">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">狀態</label>
                  <p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      {selectedOrder.status_display}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">病患</label>
                  <p>{selectedOrder.patient_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">配藥房</label>
                  <p>{selectedOrder.pharmacy_name}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">費用明細</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">藥費</span>
                    <span>{formatCurrency(parseFloat(selectedOrder.medicine_cost || '0'))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">加工費</span>
                    <span>{formatCurrency(parseFloat(selectedOrder.processing_fee || '0'))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">運送費</span>
                    <span>{formatCurrency(parseFloat(selectedOrder.delivery_fee || '0'))}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>總計</span>
                    <span>{formatCurrency(parseFloat(selectedOrder.total_cost || '0'))}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.tracking_number && (
                <div className="border-t pt-4">
                  <label className="text-sm text-gray-600">運單號碼</label>
                  <p className="font-mono">{selectedOrder.tracking_number}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-600">建立時間</label>
                    <p>{formatDateTime(selectedOrder.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-gray-600">更新時間</label>
                    <p>{formatDateTime(selectedOrder.updated_at)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  關閉
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
}
