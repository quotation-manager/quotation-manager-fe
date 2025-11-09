import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Popconfirm,
  Modal,
  Form,
  Select,
  notification,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { customerService } from '../services/customerService';
import { referenceService } from '../services/referenceService';
import { useSelector } from 'react-redux';
import {
  PAGINATION,
  USER_ROLES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  TIMEOUTS,
  getErrorMessage,
  formatDate,
} from '../constants';
import AddReferenceModal from '../components/AddReferenceModal';
import './Customers.css';

const { Option } = Select;

const Customers = () => {
  const [api, contextHolder] = notification.useNotification();
  const { user: currentUser } = useSelector(state => state.auth);
  const [customers, setCustomers] = useState([]);
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReference, setSelectedReference] = useState('');

  // References dropdown state
  const [referencesLoading, setReferencesLoading] = useState(false);
  const [referencesHasMore, setReferencesHasMore] = useState(true);
  const [referencesPage, setReferencesPage] = useState(1);
  const [referencesSearchTerm, setReferencesSearchTerm] = useState('');
  const [initialReferencesLoaded, setInitialReferencesLoaded] = useState(false);
  const [pagination, setPagination] = useState({
    current: PAGINATION.DEFAULT_PAGE,
    pageSize: PAGINATION.DEFAULT_LIMIT,
    total: 0,
  });

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form] = Form.useForm();

  // Reference modal state
  const [isReferenceModalVisible, setIsReferenceModalVisible] = useState(false);

  // Check if current user is admin
  const isAdmin = currentUser?.role === USER_ROLES.ADMIN;

  // Fetch customers
  const fetchCustomers = async (
    page = pagination.current,
    limit = pagination.pageSize,
    search = searchTerm,
    reference_id = selectedReference
  ) => {
    try {
      setLoading(true);
      const response = await customerService.getCustomers({
        page,
        limit,
        search,
        reference_id,
      });

      if (response.success) {
        setCustomers(response.data.customers);
        setPagination(prev => ({
          ...prev,
          current: response.data.pagination.page,
          pageSize: response.data.pagination.limit,
          total: response.data.pagination.total,
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
  };

  // Fetch references for dropdown with infinite scrolling
  const fetchReferences = async (page = 1, search = '', resetList = false) => {
    try {
      setReferencesLoading(true);
      const response = await referenceService.getReferences({
        page,
        limit: PAGINATION.DEFAULT_LIMIT_FOR_REFERENCES,
        search,
      });

      if (response.success) {
        const newReferences = response.data.references;

        if (resetList || page === 1) {
          setReferences(newReferences);
        } else {
          setReferences(prev => [...prev, ...newReferences]);
        }

        setReferencesHasMore(response.data.pagination.hasNext);
        setReferencesPage(page);
      }
    } catch (error) {
      console.error('Error fetching references:', error);
    } finally {
      setReferencesLoading(false);
    }
  };

  // Load more references for infinite scroll
  const loadMoreReferences = () => {
    if (!referencesLoading && referencesHasMore) {
      fetchReferences(referencesPage + 1, referencesSearchTerm);
    }
  };

  // Handle references search
  const handleReferencesSearch = value => {
    setReferencesSearchTerm(value);
    setReferencesPage(1);
    setReferencesHasMore(true);
    setInitialReferencesLoaded(false);

    // If search is cleared, preload initial references
    if (!value || value.trim() === '') {
      preloadInitialReferences();
    } else {
      fetchReferences(1, value, true);
    }
  };

  // Debounced references search
  const debouncedReferencesSearch = useCallback(
    debounce(value => {
      handleReferencesSearch(value);
    }, TIMEOUTS.DEBOUNCE),
    []
  );

  // Preload initial references when dropdown opens
  const preloadInitialReferences = async () => {
    if (initialReferencesLoaded || referencesSearchTerm) return;

    try {
      setReferencesLoading(true);
      const pagesToLoad = 5; // Load first 5 pages
      const allReferences = [];

      for (let page = 1; page <= pagesToLoad; page++) {
        const response = await referenceService.getReferences({
          page,
          limit: PAGINATION.DEFAULT_LIMIT_FOR_REFERENCES,
          search: '',
        });

        if (response.success) {
          allReferences.push(...response.data.references);

          // If this page has no more data, stop loading
          if (!response.data.pagination.hasNext) {
            setReferencesHasMore(false);
            setReferencesPage(page);
            break;
          }

          // If this is the last page we're preloading
          if (page === pagesToLoad) {
            setReferencesHasMore(response.data.pagination.hasNext);
            setReferencesPage(page);
          }
        } else {
          break;
        }
      }

      setReferences(allReferences);
      setInitialReferencesLoaded(true);
    } catch (error) {
      console.error('Error preloading references:', error);
    } finally {
      setReferencesLoading(false);
    }
  };

  // Handle add reference
  const handleAddReference = () => {
    setIsReferenceModalVisible(true);
  };

  // Handle reference creation success
  const handleReferenceSuccess = newReference => {
    console.log('New reference created:', newReference);

    // Add the new reference to the references list
    setReferences(prev => [newReference, ...prev]);

    // Set the new reference as selected in the customer form
    const refId = newReference.id || newReference._id || newReference.uuid;
    form.setFieldsValue({ reference_id: refId });
  };

  // Handle reference modal cancel
  const handleReferenceModalCancel = () => {
    setIsReferenceModalVisible(false);
  };

  useEffect(() => {
    fetchCustomers();
    preloadInitialReferences();
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(value => {
      setSearchTerm(value);
      setPagination(prev => ({ ...prev, current: 1 }));
      fetchCustomers(1, pagination.pageSize, value, selectedReference);
    }, TIMEOUTS.DEBOUNCE),
    [pagination.pageSize, selectedReference]
  );

  // Handle search input change
  const handleSearchChange = e => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  // Handle reference filter change
  const handleReferenceChange = value => {
    setSelectedReference(value || '');
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchCustomers(1, pagination.pageSize, searchTerm, value || '');

    // If filter is cleared, reset references dropdown to initial state
    if (!value) {
      setReferencesSearchTerm('');
      setReferencesPage(1);
      setReferencesHasMore(true);
      setInitialReferencesLoaded(false);
      preloadInitialReferences();
    }
  };

  // Simple debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Handle pagination change
  const handleTableChange = paginationInfo => {
    setPagination(paginationInfo);
    fetchCustomers(
      paginationInfo.current,
      paginationInfo.pageSize,
      searchTerm,
      selectedReference
    );
  };

  // Handle add customer
  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  // Handle edit customer
  const handleEditCustomer = customer => {
    setEditingCustomer(customer);
    setIsModalVisible(true);
    form.setFieldsValue({
      name: customer.name,
      mobile_no: customer.mobile_no,
      address: customer.address,
      gst_number: customer.gst_number,
      reference_id: customer.reference_id,
    });
  };

  // Handle delete customer (admin only)
  const handleDeleteCustomer = async customerId => {
    try {
      const response = await customerService.deleteCustomer(customerId);
      if (response.success) {
        api.success({
          message: 'Success',
          description: SUCCESS_MESSAGES.CUSTOMER_DELETED,
        });
        fetchCustomers();
      }
    } catch (error) {
      api.error({
        message: 'Error',
        description: getErrorMessage(error),
      });
    }
  };

  // Handle form submit
  const handleFormSubmit = async values => {
    try {
      setLoading(true);

      // Send null for empty optional fields instead of omitting them
      const requestData = {
        name: values.name,
        mobile_no: values.mobile_no.trim(), // Required field, no need to check for empty
        address:
          values.address && values.address.trim()
            ? values.address.trim()
            : null,
        gst_number:
          values.gst_number && values.gst_number.trim()
            ? values.gst_number.trim()
            : null,
        reference_id: values.reference_id || null,
      };

      let response;

      if (editingCustomer) {
        response = await customerService.updateCustomer(
          editingCustomer.id,
          requestData
        );
      } else {
        response = await customerService.createCustomer(requestData);
      }

      if (response.success) {
        api.success({
          message: 'Success',
          description: editingCustomer
            ? SUCCESS_MESSAGES.CUSTOMER_UPDATED
            : SUCCESS_MESSAGES.CUSTOMER_CREATED,
        });
        setIsModalVisible(false);
        form.resetFields();

        // Clear any active filters and reload full list
        setSearchTerm('');
        setSelectedReference('');
        fetchCustomers(1, pagination.pageSize, '', '');
      }
    } catch (error) {
      api.error({
        message: 'Error',
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Mobile Number',
      dataIndex: 'mobile_no',
      key: 'mobile_no',
      render: mobile => mobile || 'N/A',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: address => address || 'N/A',
    },
    {
      title: 'GST No.',
      dataIndex: 'gst_number',
      key: 'gst_number',
      render: gstNumber => gstNumber || 'N/A',
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      render: reference => reference?.name || 'N/A',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: date => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditCustomer(record)}
            />
          </Tooltip>
          {isAdmin && (
            <Tooltip title="Delete">
              <Popconfirm
                title="Are you sure you want to delete this customer?"
                onConfirm={() => handleDeleteCustomer(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {contextHolder}
      <Card>
        {/* Header with Add Button, Search, and Reference Filter */}
        <div className="customers-header">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddCustomer}
            className="add-customer-btn"
          >
            Add Customer
          </Button>
          <div className="filters-section">
            <Input
              placeholder="Search by name or number"
              allowClear
              prefix={<SearchOutlined />}
              className="search-input"
              onChange={handleSearchChange}
            />
            <Select
              placeholder="Filter by reference"
              allowClear
              showSearch
              className="reference-filter"
              onChange={handleReferenceChange}
              onSearch={debouncedReferencesSearch}
              filterOption={false}
              loading={referencesLoading}
              onDropdownVisibleChange={open => {
                if (open && !initialReferencesLoaded && !referencesSearchTerm) {
                  preloadInitialReferences();
                }
              }}
              onPopupScroll={e => {
                const { target } = e;
                if (
                  target.scrollTop + target.offsetHeight >=
                  target.scrollHeight - 5
                ) {
                  loadMoreReferences();
                }
              }}
              notFoundContent={
                referencesLoading ? 'Loading...' : 'No references found'
              }
            >
              {references.map(reference => (
                <Option key={reference.id} value={reference.id}>
                  {reference.name}
                </Option>
              ))}
              {referencesLoading && (
                <Option key="loading" disabled>
                  Loading more...
                </Option>
              )}
            </Select>
          </div>
        </div>

        {/* Customers Table */}
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: false,
            showQuickJumper: false,
            showTotal: false,
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
        />

        {/* Add/Edit Customer Modal */}
        <Modal
          title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          footer={null}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
            autoComplete="off"
          >
            <Form.Item
              label="Name"
              name="name"
              rules={[
                { required: true, message: 'Please enter customer name!' },
                { min: 2, message: 'Name must be at least 2 characters!' },
              ]}
            >
              <Input placeholder="Enter customer name" />
            </Form.Item>

            <Form.Item
              label="Mobile Number"
              name="mobile_no"
              rules={[
                { required: true, message: 'Please enter mobile number' },
                {
                  pattern: /^[0-9]{10}$/,
                  message: 'Please enter a valid 10-digit mobile number!',
                },
              ]}
            >
              <Input placeholder="Enter mobile number" />
            </Form.Item>

            <Form.Item label="Address" name="address">
              <Input.TextArea placeholder="Enter address (optional)" rows={3} />
            </Form.Item>

            <Form.Item label="GST No." name="gst_number">
              <Input placeholder="Enter GST number (optional)" />
            </Form.Item>

            <Form.Item label="Reference" name="reference_id">
              <Select
                placeholder="Select reference (optional)"
                showSearch
                allowClear
                onSearch={debouncedReferencesSearch}
                filterOption={false}
                loading={referencesLoading}
                onDropdownVisibleChange={open => {
                  if (
                    open &&
                    !initialReferencesLoaded &&
                    !referencesSearchTerm
                  ) {
                    preloadInitialReferences();
                  }
                }}
                onPopupScroll={e => {
                  const { target } = e;
                  if (
                    target.scrollTop + target.offsetHeight >=
                    target.scrollHeight - 5
                  ) {
                    loadMoreReferences();
                  }
                }}
                notFoundContent={
                  referencesLoading ? 'Loading...' : 'No references found'
                }
                dropdownRender={menu => (
                  <>
                    <div
                      style={{
                        padding: '8px',
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        handleAddReference();
                      }}
                    >
                      <PlusOutlined style={{ color: '#1890ff' }} />
                      <span style={{ color: '#1890ff' }}>Add Reference</span>
                    </div>
                    {menu}
                  </>
                )}
              >
                {references.map(reference => (
                  <Option key={reference.id} value={reference.id}>
                    {reference.name}
                  </Option>
                ))}
                {referencesLoading && (
                  <Option key="loading-modal" disabled>
                    Loading more...
                  </Option>
                )}
              </Select>
            </Form.Item>

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingCustomer ? 'Update' : 'Create'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Add Reference Modal */}
        <AddReferenceModal
          visible={isReferenceModalVisible}
          onCancel={handleReferenceModalCancel}
          onSuccess={handleReferenceSuccess}
          title="Add Reference"
        />
      </Card>
    </div>
  );
};

export default Customers;
