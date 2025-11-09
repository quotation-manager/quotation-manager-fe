import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Table,
  Space,
  Breadcrumb,
  notification,
  Tooltip,
  Popconfirm,
  Row,
  Col,
  Typography,
  Image,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../services/customerService';
import dayjs from 'dayjs';
import { quotationService } from '../services/quotationService';
import ItemModal from '../components/ItemModal';
import {
  SUCCESS_MESSAGES,
  getErrorMessage,
  TIMEOUTS,
  PRICE_TYPE_OPTIONS,
} from '../constants';
import './AddQuotation.css';

const { Option } = Select;
const { Title } = Typography;
const { TextArea } = Input;

const AddQuotation = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();

  // State management
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [hasMoreCustomers, setHasMoreCustomers] = useState(true);
  const [customerCurrentPage, setCustomerCurrentPage] = useState(1);
  const [initialCustomersLoaded, setInitialCustomersLoaded] = useState(false);

  // Items management
  const [items, setItems] = useState([]);
  const [isItemModalVisible, setIsItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Customer search
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);

  // Fetch customers for dropdown with infinite scroll
  const fetchCustomers = useCallback(
    async (page = 1, search = '', resetList = false) => {
      try {
        setCustomerLoading(true);

        const params = {
          page,
          limit: 10,
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

  // Preload initial customers
  const preloadInitialCustomers = useCallback(async () => {
    if (initialCustomersLoaded) return;

    setCustomers([]);
    setCustomerCurrentPage(1);
    setHasMoreCustomers(true);

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

  // Handle customer change
  const handleCustomerChange = value => {
    if (!value) {
      setCustomerSearchTerm('');
      setCustomers([]);
      setCustomerCurrentPage(1);
      setHasMoreCustomers(true);
      setInitialCustomersLoaded(false);
    }
  };

  // Handle add item
  const handleAddItem = () => {
    setEditingItem(null);
    setIsItemModalVisible(true);
  };

  // Handle edit item
  const handleEditItem = item => {
    setEditingItem(item);
    setIsItemModalVisible(true);
  };

  // Handle delete item
  const handleDeleteItem = index => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Handle item modal success
  const handleItemSuccess = newItem => {
    if (editingItem) {
      // Update existing item
      const updatedItems = items.map((item, index) =>
        index === editingItem.index ? newItem : item
      );
      setItems(updatedItems);
    } else {
      // Add new item
      setItems(prev => [...prev, newItem]);
    }
    setIsItemModalVisible(false);
    setEditingItem(null);
  };

  // Handle form submit
  const handleFormSubmit = async values => {
    if (items.length === 0) {
      api.error({
        message: 'Error',
        description: 'Please add at least one item to the quotation.',
      });
      return;
    }

    try {
      setLoading(true);

      // Build multipart/form-data payload matching backend expectation
      const formData = new FormData();
      formData.append(
        'quotation_date',
        values.quotation_date.format('YYYY-MM-DD')
      );
      formData.append('customer_id', values.customer_id);
      if (values.price_type) formData.append('price_type', values.price_type);
      if (values.remarks) formData.append('remarks', values.remarks);

      // Items JSON without file blobs
      const itemsJson = items.map(item => {
        const {
          image, // File (if user uploaded)
          images, // array from API (ignore here for create)
          image_url, // ignore for create
          ...rest
        } = item;
        return rest;
      });
      formData.append('items', JSON.stringify(itemsJson));

      // Attach images per item as items[index][images]
      items.forEach((item, index) => {
        if (item.image instanceof File) {
          formData.append(`items[${index}][images]`, item.image);
        }
      });

      const response = await quotationService.createQuotation(formData);

      if (response.data?.success || response.success) {
        api.success({
          message: 'Success',
          description: SUCCESS_MESSAGES.QUOTATION_CREATED,
        });
        navigate('/dashboard/quotations');
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

  // Items table columns
  const itemColumns = [
    {
      title: 'Sr. no.',
      key: 'sr_no',
      render: (_, record, index) => index + 1,
      width: 80,
    },
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (name, record) => name || record.product_id || 'N/A',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: description => (
        <div
          style={{
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            maxWidth: '200px',
            lineHeight: '1.4',
          }}
        >
          {description || '-'}
        </div>
      ),
    },
    {
      title: 'Image',
      key: 'image',
      render: (_, record) => {
        if (record.image_url) {
          return (
            <Image
              width={50}
              height={50}
              src={record.image_url}
              placeholder={true}
              style={{ objectFit: 'cover' }}
            />
          );
        } else if (record.image) {
          // For new files, create object URL
          const imageUrl = URL.createObjectURL(record.image);
          return (
            <Image
              width={50}
              height={50}
              src={imageUrl}
              placeholder={true}
              style={{ objectFit: 'cover' }}
            />
          );
        }
        return 'No Image';
      },
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
      render: rate => `₹${rate}`,
    },
    {
      title: 'Discount',
      dataIndex: 'discount',
      key: 'discount',
      render: discount => {
        if (
          discount === undefined ||
          discount === null ||
          Number(discount) === 0
        ) {
          return '-';
        }
        return `${discount}%`;
      },
    },
    {
      title: 'Discount Type',
      dataIndex: 'discount_type',
      key: 'discount_type',
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record, index) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditItem({ ...record, index })}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Are you sure you want to delete this item?"
              onConfirm={() => handleDeleteItem(index)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  return (
    <div style={{ padding: '24px' }}>
      {contextHolder}

      {/* Breadcrumbs */}
      <div className="quotation-breadcrumb">
        <Breadcrumb>
          <Breadcrumb.Item>
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/dashboard/quotations')}
            >
              Quotations
            </Button>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Add Quotation</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Card>
        <Title level={3}>Add New Quotation</Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          style={{ marginTop: '24px' }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Quotation Date"
                name="quotation_date"
                initialValue={dayjs()}
                rules={[
                  { required: true, message: 'Please select quotation date' },
                ]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  disabledDate={current =>
                    current && current > dayjs().endOf('day')
                  }
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Customer"
                name="customer_id"
                rules={[
                  { required: true, message: 'Please select a customer' },
                ]}
              >
                <Select
                  placeholder="Select customer"
                  showSearch
                  filterOption={false}
                  onSearch={handleCustomersSearch}
                  onChange={handleCustomerChange}
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
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Price Type"
                name="price_type"
                rules={[
                  { required: true, message: 'Please select price type' },
                ]}
              >
                <Select
                  placeholder="Select price type"
                  style={{ width: '100%' }}
                >
                  {PRICE_TYPE_OPTIONS.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Remarks"
            name="remarks"
            style={{ marginTop: '16px' }}
          >
            <TextArea placeholder="Enter any remarks (optional)" rows={3} />
          </Form.Item>

          {/* Items Section */}
          <div style={{ marginTop: '32px' }}>
            <Row
              justify="space-between"
              align="middle"
              style={{ marginBottom: '16px' }}
            >
              <Col>
                <Title level={4}>Items</Title>
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddItem}
                >
                  Add Item
                </Button>
              </Col>
            </Row>

            <Table
              columns={itemColumns}
              dataSource={items}
              pagination={false}
              rowKey={(_, index) => index}
              scroll={{ x: 'max-content' }}
              locale={{
                emptyText:
                  'No items added yet. Click "Add Item" to get started.',
              }}
            />
          </div>

          {/* Form Actions */}
          <Row justify="end" style={{ marginTop: '32px' }}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Space
                size="middle"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Button
                  onClick={() => navigate('/dashboard/quotations')}
                  style={{ minWidth: '100px' }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                  style={{ minWidth: '140px' }}
                >
                  Create Quotation
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Item Modal */}
      <ItemModal
        visible={isItemModalVisible}
        onCancel={() => setIsItemModalVisible(false)}
        onSuccess={handleItemSuccess}
        editingItem={editingItem}
        title={editingItem ? 'Edit Item' : 'Add Item'}
      />
    </div>
  );
};

export default AddQuotation;
