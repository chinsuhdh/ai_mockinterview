import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api';

export function useAdminPackages() {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        loadPackages();
    }, []);

    const loadPackages = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/Admin/plans');
            const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
            
            const mappedData = data.map(item => ({
                id: item.id,
                name: item.planName || '',
                price: item.price || 0,
                features: item.description || '',
                credits: item.maxInterviewsPerMonth || 0,
                status: 'active'
            }));
            setPackages(mappedData);
        } catch (err) {
            const message = err.response?.data?.message || 'Lỗi tải dữ liệu gói!';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const deletePackage = async (id) => {
        try {
            await apiClient.delete(`/api/Admin/plans/${id}`);
            setPackages((prev) => prev.filter((p) => p.id !== id));
            toast.success('Đã xóa gói thành công!');
        } catch (err) {
            const message = err.response?.data?.message || 'Xóa thất bại!';
            toast.error(message);
        }
    };

    const savePackage = async (pkg) => {
        try {
            const payload = {
                planName: pkg.name,
                price: pkg.price,
                description: pkg.features,
                maxInterviewsPerMonth: pkg.credits
            };

            if (pkg.id) {
                await apiClient.put(`/api/Admin/plans/${pkg.id}`, payload);
                setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, ...pkg } : p)));
            } else {
                const response = await apiClient.post('/api/Admin/plans', payload);
                const savedItem = response.data?.data || response.data;
                const newPkg = {
                    id: savedItem.id,
                    name: savedItem.planName || pkg.name,
                    price: savedItem.price || pkg.price,
                    features: savedItem.description || pkg.features,
                    credits: savedItem.maxInterviewsPerMonth || pkg.credits,
                    status: 'active'
                };
                setPackages((prev) => [...prev, newPkg]);
            }
            toast.success(pkg.id ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
            return true;
        } catch (err) {
            const message = err.response?.data?.message || 'Lưu thất bại!';
            toast.error(message);
            return false;
        }
    };

    const filteredAndSorted = useMemo(() => {
        let result = packages.filter((p) => {
            const packageName = p.name || '';
            const searchTerm = search || '';
            return packageName.toLowerCase().includes(searchTerm.toLowerCase()) &&
                   (statusFilter === 'all' || p.status === statusFilter);
        });
        
        result.sort((a, b) => (sortOrder === 'asc' ? a.price - b.price : b.price - a.price));
        return result;
    }, [packages, search, statusFilter, sortOrder]);

    const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage) || 1;
    
    const paginatedData = useMemo(() => {
        if (currentPage > totalPages) {
            setCurrentPage(1);
        }
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAndSorted.slice(start, start + itemsPerPage);
    }, [filteredAndSorted, currentPage, totalPages]);

    return {
        packages: paginatedData,
        loading,
        search, setSearch,
        statusFilter, setStatusFilter,
        sortOrder, setSortOrder,
        currentPage, setCurrentPage,
        totalPages,
        deletePackage,
        savePackage,
        loadPackages,
    };
}