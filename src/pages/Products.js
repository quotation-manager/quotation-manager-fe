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
import { productService } from '../services/productService';
import { useSelector } from 'react-redux';
import {
  PAGINATION,
  USER_ROLES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  TIMEOUTS,
  getErrorMessage,
} from '../constants';
import './Products.css';

const { Option } = Select;

const Products = () => {
  const [api, contextHolder] = notification.useNotification();
  const { user: currentUser } = useSelector(state => state.auth);
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    current: PAGINATION.DEFAULT_PAGE,
    pageSize: PAGINATION.DEFAULT_LIMIT,
    total: 0,
  });

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();

  // Check if user is admin
  const isAdmin = currentUser?.role === USER_ROLES.ADMIN;

  // Debounce function
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(value => {
      setSearchTerm(value);
      setPagination(prev => ({ ...prev, current: 1 }));
      fetchProducts(1, pagination.pageSize, value);
    }, TIMEOUTS.DEBOUNCE),
    [pagination.pageSize]
  );

  // Handle search input change
  const handleSearchChange = e => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  // Fetch products
  const fetchProducts = async (
    page = 1,
    limit = PAGINATION.DEFAULT_LIMIT,
    name = ''
  ) => {
    try {
      setLoading(true);
      const response = await productService.getProducts({
        page,
        limit,
        name,
      });

      if (response.data.success) {
        setProducts(response.data.data.products || []);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: response.data.data.pagination?.total || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      api.error({
        message: 'Error',
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch units for dropdown
  const fetchUnits = async () => {
    try {
      const response = await productService.getUnits();
      if (response.data.success) {
        setUnits(response.data.data.units || []);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchProducts();
    fetchUnits();
  }, []);

  // Handle table pagination change
  const handleTableChange = paginationInfo => {
    const { current, pageSize } = paginationInfo;
    setPagination(prev => ({ ...prev, current, pageSize }));
    fetchProducts(current, pageSize, searchTerm);
  };

  // Handle add product
  const handleAddProduct = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Handle edit product
  const handleEditProduct = record => {
    setEditingProduct(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      unit: record.unit,
    });
    setIsModalVisible(true);
  };

  // Handle delete product
  const handleDeleteProduct = async id => {
    try {
      setLoading(true);
      const response = await productService.deleteProduct(id);

      if (response.data.success) {
        api.success({
          message: 'Success',
          description: SUCCESS_MESSAGES.PRODUCT_DELETED,
        });

        // Refresh the list
        const currentPage = pagination.current;
        const currentData = products.length;

        // If deleting the last item on a page (and not the first page), go to previous page
        if (currentData === 1 && currentPage > 1) {
          fetchProducts(currentPage - 1, pagination.pageSize, searchTerm);
        } else {
          fetchProducts(currentPage, pagination.pageSize, searchTerm);
        }
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

  // Handle form submit
  const handleFormSubmit = async values => {
    try {
      setLoading(true);

      // Send null for empty description instead of omitting it
      const requestData = {
        name: values.name,
        description:
          values.description && values.description.trim()
            ? values.description.trim()
            : null,
        unit: values.unit,
      };

      let response;

      if (editingProduct) {
        response = await productService.updateProduct(
          editingProduct.id,
          requestData
        );
      } else {
        response = await productService.createProduct(requestData);
      }

      if (response.data.success) {
        api.success({
          message: 'Success',
          description: editingProduct
            ? SUCCESS_MESSAGES.PRODUCT_UPDATED
            : SUCCESS_MESSAGES.PRODUCT_CREATED,
        });

        setIsModalVisible(false);
        form.resetFields();
        setEditingProduct(null);

        // Refresh the list
        fetchProducts(pagination.current, pagination.pageSize, searchTerm);
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

  // Handle modal cancel
  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingProduct(null);
  };

  // Table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: text => <span>{text}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: text => text || '-',
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      render: text => <Tag color="blue">{text}</Tag>,
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
              onClick={() => handleEditProduct(record)}
            />
          </Tooltip>
          {isAdmin && (
            <Tooltip title="Delete">
              <Popconfirm
                title="Are you sure you want to delete this product?"
                onConfirm={() => handleDeleteProduct(record.id)}
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
        <div className="products-header">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddProduct}
            className="add-product-btn"
          >
            Add Product
          </Button>
          <Input
            placeholder="Search by name"
            allowClear
            prefix={<SearchOutlined />}
            className="search-input"
            onChange={handleSearchChange}
          />
        </div>

        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: false,
            showQuickJumper: false,
            showTotal: false,
          }}
          onChange={handleTableChange}
        />

        <Modal
          title={editingProduct ? 'Edit Product' : 'Add Product'}
          open={isModalVisible}
          onCancel={handleModalCancel}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
            <Form.Item
              label="Name"
              name="name"
              rules={[
                { required: true, message: 'Please enter product name' },
                { max: 100, message: 'Name cannot exceed 100 characters' },
              ]}
            >
              <Input placeholder="Enter product name" />
            </Form.Item>

            <Form.Item
              label="Description"
              name="description"
              rules={[
                {
                  max: 500,
                  message: 'Description cannot exceed 500 characters',
                },
              ]}
            >
              <Input.TextArea
                placeholder="Enter product description (optional)"
                rows={3}
              />
            </Form.Item>

            <Form.Item
              label="Unit"
              name="unit"
              rules={[{ required: true, message: 'Please select a unit' }]}
            >
              <Select placeholder="Select unit">
                {units.map(unit => (
                  <Option key={unit} value={unit}>
                    {unit}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <Space style={{ float: 'right' }}>
                <Button onClick={handleModalCancel}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingProduct ? 'Update' : 'Create'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default Products;
