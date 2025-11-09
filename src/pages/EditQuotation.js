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
  Spin,
  Image,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { customerService } from '../services/customerService';
import { quotationService } from '../services/quotationService';
import ItemModal from '../components/ItemModal';
import {
  SUCCESS_MESSAGES,
  getErrorMessage,
  TIMEOUTS,
  PRICE_TYPE_OPTIONS,
  ASSET_BASE_URL,
} from '../constants';
import dayjs from 'dayjs';
import './AddQuotation.css';

const { Option } = Select;
const { Title } = Typography;
const { TextArea } = Input;

const EditQuotation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();

  // State management
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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

  // Fetch quotation data
  const fetchQuotation = useCallback(async () => {
    try {
      setInitialLoading(true);
      const response = await quotationService.getQuotationById(id);

      if (response.data?.success || response.success) {
        const payload = response.data?.data || response.data;
        const quotation = payload.quotation || payload;

        // Set form values
        form.setFieldsValue({
          quotation_date: dayjs(quotation.quotation_date),
          customer_id: quotation.customer_id,
          price_type: quotation.price_type || undefined,
          remarks: quotation.remarks,
        });

        // Set items
        setItems(
          (quotation.items || []).map(it => ({
            ...it,
            product_name: it.product_name || it.product?.name || '',
          }))
        );

        // Add customer to customers list if not already there
        if (quotation.customer) {
          setCustomers(prev => {
            const exists = prev.find(c => c.id === quotation.customer.id);
            if (!exists) {
              return [quotation.customer, ...prev];
            }
            return prev;
          });
        }
      }
    } catch (error) {
      api.error({
        message: 'Error',
        description: getErrorMessage(error),
      });
      navigate('/dashboard/quotations');
    } finally {
      setInitialLoading(false);
    }
  }, [id, api, form, navigate]);

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
            setCustomers(prev => {
              const existingIds = new Set(prev.map(c => c.id));
              const uniqueNewCustomers = newCustomers.filter(
                c => !existingIds.has(c.id)
              );
              return [...prev, ...uniqueNewCustomers];
            });
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

  // Helper function to fetch existing image from S3 as actual File object
  const fetchImageFromS3AsFile = async (imagePath, filename = 'image.jpg') => {
    try {
      // Construct the full S3 URL
      const imageUrl = imagePath.startsWith('http')
        ? imagePath
        : `${ASSET_BASE_URL}/${imagePath}`;

      console.log(`Fetching image from S3: ${imageUrl}`);

      // Fetch the actual file from S3
      const response = await fetch(imageUrl, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Create actual File object with proper metadata (same as AddQuotation)
      const file = new File([blob], filename, {
        type: blob.type || 'image/jpeg',
        lastModified: Date.now(),
      });

      console.log(`Successfully fetched image as File:`, {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      return file;
    } catch (error) {
      console.error('Error fetching image from S3:', error);
      throw new Error(`Failed to fetch image from S3: ${error.message}`);
    }
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

      const formData = new FormData();
      formData.append(
        'quotation_date',
        values.quotation_date.format('YYYY-MM-DD')
      );
      formData.append('customer_id', values.customer_id);
      if (values.price_type) formData.append('price_type', values.price_type);
      if (values.remarks) formData.append('remarks', values.remarks);

      // Items JSON without file blobs (matching AddQuotation approach)
      const itemsJson = items.map(item => {
        const {
          image, // File (if user uploaded) - exclude from JSON
          images, // array from API - exclude from JSON
          image_url, // exclude from JSON
          image_removed, // exclude from JSON
          ...rest
        } = item;
        return rest;
      });
      formData.append('items', JSON.stringify(itemsJson));

      // Handle images - fetch existing ones as File objects and add new ones
      for (let index = 0; index < items.length; index++) {
        const item = items[index];

        if (item.image_removed) {
          // User explicitly removed the image - don't add any file
          continue;
        } else if (item.image instanceof File) {
          // New image uploaded
          formData.append(`items[${index}][images]`, item.image);
        } else if (item.image_url) {
          // Existing image from ItemModal editing - fetch actual File from S3
          const imageFile = await fetchImageFromS3AsFile(
            item.image_url,
            `item_${index}_image.jpg`
          );
          if (imageFile) {
            formData.append(`items[${index}][images]`, imageFile);
          }
        } else if (item.images && item.images.length > 0) {
          // Original existing images - fetch actual File from S3
          const imagePath = item.images[0];
          const imageFile = await fetchImageFromS3AsFile(
            imagePath,
            `item_${index}_image.jpg`
          );
          if (imageFile) {
            formData.append(`items[${index}][images]`, imageFile);
          }
        }
      }

      const response = await quotationService.updateQuotation(id, formData);

      if (response.data?.success || response.success) {
        api.success({
          message: 'Success',
          description: SUCCESS_MESSAGES.QUOTATION_UPDATED,
        });
        navigate(`/dashboard/quotations/view/${id}`);
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
        const rel = record.images?.[0] || record.image_url;
        if (rel) {
          const src = rel.startsWith('http') ? rel : `${ASSET_BASE_URL}/${rel}`;
          return (
            <Image
              width={50}
              height={50}
              src={src}
              preview={{ src }}
              style={{ objectFit: 'cover' }}
            />
          );
        } else if (record.image) {
          const imageUrl = URL.createObjectURL(record.image);
          return (
            <Image
              width={50}
              height={50}
              src={imageUrl}
              preview={{ src: imageUrl }}
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

  // Load quotation data on component mount
  useEffect(() => {
    fetchQuotation();
  }, [fetchQuotation]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  if (initialLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

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
          <Breadcrumb.Item>Edit Quotation</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Card>
        <Title level={3}>Edit Quotation</Title>

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
                rules={[
                  { required: true, message: 'Please select quotation date' },
                ]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  disabledDate={current =>
                    current && current.isAfter(dayjs(), 'day')
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
              <Form.Item label="Price Type" name="price_type" rules={[]}>
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
                  Update Quotation
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

export default EditQuotation;
