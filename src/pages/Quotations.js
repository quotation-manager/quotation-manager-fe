import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Card,
  Table,
  Button,
  Space,
  Tooltip,
  Popconfirm,
  notification,
  DatePicker,
  Select,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { quotationService } from '../services/quotationService';
import { customerService } from '../services/customerService';
import { referenceService } from '../services/referenceService';
import {
  SUCCESS_MESSAGES,
  getErrorMessage,
  PAGINATION,
  USER_ROLES,
  TIMEOUTS,
  formatDate,
} from '../constants';
import './Quotations.css';

const { RangePicker } = DatePicker;
const { Option } = Select;
// No Title used here

const Quotations = () => {
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const { user } = useSelector(state => state.auth);
  const isAdmin = user?.role === USER_ROLES.ADMIN;

  // State management
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: PAGINATION.DEFAULT_PAGE,
    pageSize: PAGINATION.DEFAULT_LIMIT,
    total: 0,
    showSizeChanger: PAGINATION.SHOW_SIZE_CHANGER,
    showQuickJumper: PAGINATION.SHOW_QUICK_JUMPER,
    pageSizeOptions: PAGINATION.PAGE_SIZE_OPTIONS,
  });

  // Filter states
  const [dateRange, setDateRange] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(undefined);
  const [customers, setCustomers] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [hasMoreCustomers, setHasMoreCustomers] = useState(true);
  const [customerCurrentPage, setCustomerCurrentPage] = useState(1);
  const [initialCustomersLoaded, setInitialCustomersLoaded] = useState(false);

  // Debounce timer for customer search
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);

  // Reference filtering states
  const [selectedReference, setSelectedReference] = useState(undefined);
  const [references, setReferences] = useState([]);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [hasMoreReferences, setHasMoreReferences] = useState(true);
  const [referenceCurrentPage, setReferenceCurrentPage] = useState(1);
  const [initialReferencesLoaded, setInitialReferencesLoaded] = useState(false);

  // Debounce timer for reference search
  const [referenceSearchTerm, setReferenceSearchTerm] = useState('');
  const [referenceSearchDebounceTimer, setReferenceSearchDebounceTimer] =
    useState(null);

  // Fetch quotations
  const fetchQuotations = useCallback(
    async (
      page = 1,
      limit = 20,
      start_date = '',
      end_date = '',
      customer_id = '',
      reference_id = ''
    ) => {
      try {
        setLoading(true);
        const params = {
          page,
          limit,
        };

        if (start_date) params.start_date = start_date;
        if (end_date) params.end_date = end_date;
        if (customer_id) params.customer_id = customer_id;
        if (reference_id) params.reference_id = reference_id;

        const response = await quotationService.getQuotations(params);

        // Align with API structure used elsewhere: response.data.data
        const success = response.data?.success || response.success;
        const payload = response.data?.data || response.data;

        if (success) {
          setQuotations(payload.quotations || payload.items || []);
          setPagination(prev => ({
            ...prev,
            current: page,
            total: payload.pagination?.total || 0,
          }));
        }
      } catch (error) {
        api.error({
          message: 'Error',
          description: getErrorMessage(error),
        });
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  // Fetch customers for filter dropdown with infinite scroll
  const fetchCustomers = useCallback(
    async (page = 1, search = '', resetList = false) => {
      try {
        setCustomerLoading(true);

        const params = {
          page,
          limit: 10, // Smaller limit for dropdown
        };

        if (search) {
          params.search = search;
        }

        const response = await customerService.getCustomers(params);

        if (response.success) {
          const newCustomers = response.data.customers || [];

          if (resetList) {
            setCustomers(newCustomers);
            setCustomerCurrentPage(1);
          } else {
            setCustomers(prev => [...prev, ...newCustomers]);
          }

          setHasMoreCustomers(
            newCustomers.length === 10 &&
              response.data.pagination?.hasNext !== false
          );

          if (!resetList) {
            setCustomerCurrentPage(page);
          }
        }
      } catch (error) {
        // Error fetching customers - silently handle
      } finally {
        setCustomerLoading(false);
      }
    },
    []
  );

  // Fetch references for filter dropdown with infinite scroll
  const fetchReferences = useCallback(
    async (page = 1, search = '', resetList = false) => {
      try {
        setReferenceLoading(true);

        const params = {
          page,
          limit: 10, // Smaller limit for dropdown
        };

        if (search) {
          params.search = search;
        }

        const response = await referenceService.getReferences(params);

        if (response.success) {
          const newReferences = response.data.references || [];

          if (resetList) {
            setReferences(newReferences);
            setReferenceCurrentPage(1);
          } else {
            setReferences(prev => [...prev, ...newReferences]);
          }

          setHasMoreReferences(
            newReferences.length === 10 &&
              response.data.pagination?.hasNext !== false
          );

          if (!resetList) {
            setReferenceCurrentPage(page);
          }
        }
      } catch (error) {
        // Error fetching references - silently handle
      } finally {
        setReferenceLoading(false);
      }
    },
    []
  );

  // Preload initial customers when dropdown opens
  const preloadInitialCustomers = useCallback(async () => {
    if (initialCustomersLoaded) return;

    setCustomers([]);
    setCustomerCurrentPage(1);
    setHasMoreCustomers(true);

    // Load first 5 pages (50 customers total with limit 10)
    for (let page = 1; page <= 5; page++) {
      await fetchCustomers(page, customerSearchTerm, page === 1);
      if (!hasMoreCustomers) break;
    }

    setInitialCustomersLoaded(true);
  }, [
    fetchCustomers,
    customerSearchTerm,
    hasMoreCustomers,
    initialCustomersLoaded,
  ]);

  // Preload initial references when dropdown opens
  const preloadInitialReferences = useCallback(async () => {
    if (initialReferencesLoaded) return;

    setReferences([]);
    setReferenceCurrentPage(1);
    setHasMoreReferences(true);

    // Load first 5 pages (50 references total with limit 10)
    for (let page = 1; page <= 5; page++) {
      await fetchReferences(page, referenceSearchTerm, page === 1);
      if (!hasMoreReferences) break;
    }

    setInitialReferencesLoaded(true);
  }, [
    fetchReferences,
    referenceSearchTerm,
    hasMoreReferences,
    initialReferencesLoaded,
  ]);

  // Handle customer dropdown scroll
  const handleCustomerDropdownScroll = e => {
    const { target } = e;
    if (
      target.scrollTop + target.offsetHeight === target.scrollHeight &&
      hasMoreCustomers &&
      !customerLoading
    ) {
      fetchCustomers(customerCurrentPage + 1, customerSearchTerm);
    }
  };

  // Handle reference dropdown scroll
  const handleReferenceDropdownScroll = e => {
    const { target } = e;
    if (
      target.scrollTop + target.offsetHeight === target.scrollHeight &&
      hasMoreReferences &&
      !referenceLoading
    ) {
      fetchReferences(referenceCurrentPage + 1, referenceSearchTerm);
    }
  };

  // Handle customer search with debouncing
  const handleCustomersSearch = value => {
    setCustomerSearchTerm(value);

    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    const timer = setTimeout(() => {
      setCustomers([]);
      setCustomerCurrentPage(1);
      setHasMoreCustomers(true);
      setInitialCustomersLoaded(false);
      fetchCustomers(1, value, true);
    }, TIMEOUTS.DEBOUNCE);

    setSearchDebounceTimer(timer);
  };

  // Handle reference search with debouncing
  const handleReferencesSearch = value => {
    setReferenceSearchTerm(value);

    if (referenceSearchDebounceTimer) {
      clearTimeout(referenceSearchDebounceTimer);
    }

    const timer = setTimeout(() => {
      setReferences([]);
      setReferenceCurrentPage(1);
      setHasMoreReferences(true);
      setInitialReferencesLoaded(false);
      fetchReferences(1, value, true);
    }, TIMEOUTS.DEBOUNCE);

    setReferenceSearchDebounceTimer(timer);
  };

  // Handle customer filter change
  const handleCustomerChange = value => {
    setSelectedCustomer(value || undefined);

    if (!value) {
      setCustomerSearchTerm('');
      setCustomers([]);
      setCustomerCurrentPage(1);
      setHasMoreCustomers(true);
      setInitialCustomersLoaded(false);
    }

    // Re-fetch quotations with new filter
    const startDate = dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : '';
    const endDate = dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : '';
    fetchQuotations(
      1,
      pagination.pageSize,
      startDate,
      endDate,
      value || '',
      selectedReference
    );
  };

  // Handle reference filter change
  const handleReferenceChange = value => {
    setSelectedReference(value || undefined);

    if (!value) {
      setReferenceSearchTerm('');
      setReferences([]);
      setReferenceCurrentPage(1);
      setHasMoreReferences(true);
      setInitialReferencesLoaded(false);
    }

    // Re-fetch quotations with new filter
    const startDate = dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : '';
    const endDate = dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : '';
    fetchQuotations(
      1,
      pagination.pageSize,
      startDate,
      endDate,
      selectedCustomer,
      value || ''
    );
  };

  // Handle date range change
  const handleDateRangeChange = dates => {
    setDateRange(dates || []);

    const startDate = dates?.[0] ? dates[0].format('YYYY-MM-DD') : '';
    const endDate = dates?.[1] ? dates[1].format('YYYY-MM-DD') : '';

    fetchQuotations(
      1,
      pagination.pageSize,
      startDate,
      endDate,
      selectedCustomer,
      selectedReference
    );
  };

  // Handle table pagination change
  const handleTableChange = pagination => {
    const startDate = dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : '';
    const endDate = dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : '';
    fetchQuotations(
      pagination.current,
      pagination.pageSize,
      startDate,
      endDate,
      selectedCustomer,
      selectedReference
    );
  };

  // Handle delete quotation
  const handleDeleteQuotation = async id => {
    try {
      const response = await quotationService.deleteQuotation(id);
      const success = response.data?.success || response.success;

      if (success) {
        api.success({
          message: 'Success',
          description: SUCCESS_MESSAGES.QUOTATION_DELETED,
        });

        // Refresh the list - check if we need to go to previous page
        const startDate = dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : '';
        const endDate = dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : '';

        // If we're deleting the last item on a page (and not on page 1), go to previous page
        const currentPageStartIndex =
          (pagination.current - 1) * pagination.pageSize;
        const isLastItemOnPage = quotations.length === 1;
        const shouldGoToPreviousPage =
          isLastItemOnPage && pagination.current > 1;
        const targetPage = shouldGoToPreviousPage
          ? pagination.current - 1
          : pagination.current;

        fetchQuotations(
          targetPage,
          pagination.pageSize,
          startDate,
          endDate,
          selectedCustomer,
          selectedReference
        );
      }
    } catch (error) {
      api.error({
        message: 'Error',
        description: getErrorMessage(error),
      });
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Quotation Date',
      dataIndex: 'quotation_date',
      key: 'quotation_date',
      render: date => formatDate(date),
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      render: customer => customer?.name || 'N/A',
    },
    {
      title: 'Items Count',
      dataIndex: 'items',
      key: 'items_count',
      render: items => items?.length || 0,
    },
    {
      title: 'Price Type',
      dataIndex: 'price_type',
      key: 'price_type',
      render: priceType => priceType || 'N/A',
    },
    {
      title: 'Created By',
      dataIndex: 'creator',
      key: 'created_by',
      render: creator => creator?.user_name || 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() =>
                navigate(`/dashboard/quotations/view/${record.id}`)
              }
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() =>
                navigate(`/dashboard/quotations/edit/${record.id}`)
              }
            />
          </Tooltip>
          {isAdmin && (
            <Tooltip title="Delete">
              <Popconfirm
                title="Are you sure you want to delete this quotation?"
                onConfirm={() => handleDeleteQuotation(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="text" icon={<DeleteOutlined />} danger />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Initial load
  useEffect(() => {
    fetchQuotations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
      if (referenceSearchDebounceTimer) {
        clearTimeout(referenceSearchDebounceTimer);
      }
    };
  }, [searchDebounceTimer, referenceSearchDebounceTimer]);

  return (
    <div style={{ padding: '24px' }}>
      {contextHolder}

      <Card>
        <div className="quotations-header">
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} sm={24} md={24} lg={6} xl={6}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/dashboard/quotations/add')}
                size="large"
                style={{ width: '100%' }}
              >
                Add Quotation
              </Button>
            </Col>
            <Col xs={24} sm={24} md={24} lg={18} xl={18}>
              <Row gutter={[16, 16]} justify="end">
                <Col xs={24} sm={24} md={24} lg={8} xl={8}>
                  <RangePicker
                    placeholder={['Start Date', 'End Date']}
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    format="DD-MM-YYYY"
                    disabledDate={current =>
                      current && current.isAfter(dayjs(), 'day')
                    }
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col xs={24} sm={24} md={24} lg={8} xl={8}>
                  <Select
                    placeholder="Search or select customer"
                    value={selectedCustomer}
                    onChange={handleCustomerChange}
                    allowClear
                    showSearch
                    filterOption={false}
                    onSearch={handleCustomersSearch}
                    onDropdownVisibleChange={visible => {
                      if (visible) {
                        preloadInitialCustomers();
                      }
                    }}
                    onPopupScroll={handleCustomerDropdownScroll}
                    loading={customerLoading}
                    style={{ width: '100%' }}
                  >
                    {customers.map(customer => (
                      <Option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.mobile_no}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={24} md={24} lg={8} xl={8}>
                  <Select
                    placeholder="Search or select reference"
                    value={selectedReference}
                    onChange={handleReferenceChange}
                    allowClear
                    showSearch
                    filterOption={false}
                    onSearch={handleReferencesSearch}
                    onDropdownVisibleChange={visible => {
                      if (visible) {
                        preloadInitialReferences();
                      }
                    }}
                    onPopupScroll={handleReferenceDropdownScroll}
                    loading={referenceLoading}
                    style={{ width: '100%' }}
                  >
                    {references.map(reference => (
                      <Option key={reference.id} value={reference.id}>
                        {reference.name}
                        {reference.mobile_no ? ` - ${reference.mobile_no}` : ''}
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={quotations}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
            showQuickJumper: false,
          }}
          onChange={handleTableChange}
          rowKey="id"
          style={{ marginTop: '16px' }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};

export default Quotations;
