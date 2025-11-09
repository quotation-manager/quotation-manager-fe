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
import './References.css';

const { Option } = Select;

const References = () => {
  const [api, contextHolder] = notification.useNotification();
  const { user: currentUser } = useSelector(state => state.auth);
  const [references, setReferences] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [pagination, setPagination] = useState({
    current: PAGINATION.DEFAULT_PAGE,
    pageSize: PAGINATION.DEFAULT_LIMIT,
    total: 0,
  });

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingReference, setEditingReference] = useState(null);
  const [form] = Form.useForm();

  // Check if current user is admin
  const isAdmin = currentUser?.role === USER_ROLES.ADMIN;

  // Fetch references
  const fetchReferences = async (
    page = pagination.current,
    limit = pagination.pageSize,
    search = searchTerm,
    category = selectedCategory
  ) => {
    try {
      setLoading(true);
      const response = await referenceService.getReferences({
        page,
        limit,
        search,
        category,
      });

      if (response.success) {
        setReferences(response.data.references);
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

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await referenceService.getCategories();
      if (response.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchReferences();
    fetchCategories();
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(value => {
      setSearchTerm(value);
      setPagination(prev => ({ ...prev, current: 1 }));
      fetchReferences(1, pagination.pageSize, value, selectedCategory);
    }, TIMEOUTS.DEBOUNCE),
    [pagination.pageSize, selectedCategory]
  );

  // Handle search input change
  const handleSearchChange = e => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  // Handle category filter change
  const handleCategoryChange = value => {
    setSelectedCategory(value || '');
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchReferences(1, pagination.pageSize, searchTerm, value || '');
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
    fetchReferences(
      paginationInfo.current,
      paginationInfo.pageSize,
      searchTerm,
      selectedCategory
    );
  };

  // Handle add reference
  const handleAddReference = () => {
    setEditingReference(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  // Handle edit reference
  const handleEditReference = reference => {
    setEditingReference(reference);
    setIsModalVisible(true);
    form.setFieldsValue({
      name: reference.name,
      mobile_no: reference.mobile_no,
      category: reference.category,
    });
  };

  // Handle delete reference (admin only)
  const handleDeleteReference = async referenceId => {
    try {
      const response = await referenceService.deleteReference(referenceId);
      if (response.success) {
        api.success({
          message: 'Success',
          description: SUCCESS_MESSAGES.REFERENCE_DELETED,
        });
        fetchReferences();
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

      // Send null for empty mobile number instead of omitting it
      const requestData = {
        name: values.name,
        category: values.category,
        mobile_no:
          values.mobile_no && values.mobile_no.trim()
            ? values.mobile_no.trim()
            : null,
      };

      let response;

      if (editingReference) {
        response = await referenceService.updateReference(
          editingReference.id,
          requestData
        );
      } else {
        response = await referenceService.createReference(requestData);
      }

      if (response.success) {
        api.success({
          message: 'Success',
          description: editingReference
            ? SUCCESS_MESSAGES.REFERENCE_UPDATED
            : SUCCESS_MESSAGES.REFERENCE_CREATED,
        });
        setIsModalVisible(false);
        form.resetFields();
        fetchReferences();
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
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: category => <Tag color="blue">{category}</Tag>,
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
              onClick={() => handleEditReference(record)}
            />
          </Tooltip>
          {isAdmin && (
            <Tooltip title="Delete">
              <Popconfirm
                title="Are you sure you want to delete this reference?"
                onConfirm={() => handleDeleteReference(record.id)}
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
        {/* Header with Add Button, Search, and Category Filter */}
        <div className="references-header">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddReference}
            className="add-reference-btn"
          >
            Add Reference
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
              placeholder="Filter by category"
              allowClear
              showSearch
              className="category-filter"
              onChange={handleCategoryChange}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {categories.map(category => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </div>
        </div>

        {/* References Table */}
        <Table
          columns={columns}
          dataSource={references}
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

        {/* Add/Edit Reference Modal */}
        <Modal
          title={editingReference ? 'Edit Reference' : 'Add Reference'}
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
                { required: true, message: 'Please enter reference name!' },
                { min: 2, message: 'Name must be at least 2 characters!' },
              ]}
            >
              <Input placeholder="Enter reference name" />
            </Form.Item>

            <Form.Item
              label="Mobile Number"
              name="mobile_no"
              rules={[
                {
                  pattern: /^[0-9]{10}$/,
                  message: 'Please enter a valid 10-digit mobile number!',
                },
              ]}
            >
              <Input placeholder="Enter mobile number (optional)" />
            </Form.Item>

            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true, message: 'Please select a category!' }]}
            >
              <Select
                placeholder="Select category"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >=
                  0
                }
              >
                {categories.map(category => (
                  <Option key={category} value={category}>
                    {category}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingReference ? 'Update' : 'Create'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default References;
