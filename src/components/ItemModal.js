import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  notification,
  Row,
  Col,
  Upload,
  message,
} from 'antd';
import { productService } from '../services/productService';
import { locationService } from '../services/locationService';
import {
  getErrorMessage,
  FILE_UPLOAD,
  PAGINATION,
  ASSET_BASE_URL,
} from '../constants';
import { UploadOutlined } from '@ant-design/icons';
import CameraUpload from './CameraUpload';

const { Option } = Select;
const { TextArea } = Input;

const ItemModal = ({
  visible,
  onCancel,
  onSuccess,
  editingItem,
  title = 'Add Item',
}) => {
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(false);

  // Products data with pagination and search
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsPagination, setProductsPagination] = useState({
    hasMore: true,
    currentPage: 1,
    totalProducts: 0,
  });
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);
  // Locations data with pagination and search
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsPagination, setLocationsPagination] = useState({
    hasMore: true,
    currentPage: 1,
    totalLocations: 0,
  });
  const [locationSearchTerm, setLocationSearchTerm] = useState('');

  // Units data (not paginated)
  const [units, setUnits] = useState([]);

  // Image upload state
  const [fileList, setFileList] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');

  const getBase64 = file =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });

  const handlePreview = async file => {
    let src = file.url;
    if (!src && file.originFileObj) {
      src = await getBase64(file.originFileObj);
    }
    if (!src && file.preview) {
      src = file.preview;
    }
    setPreviewSrc(src || '');
    setPreviewOpen(true);
  };

  // Fetch products with pagination and search
  const fetchProducts = useCallback(
    async (page = 1, searchTerm = '', resetList = false) => {
      try {
        setProductsLoading(true);
        const params = {
          page,
          limit: PAGINATION.DEFAULT_LIMIT,
        };

        if (searchTerm?.trim()) {
          params.name = searchTerm.trim();
        }

        const response = await productService.getProducts(params);

        if (response.data.success) {
          const newProducts = response.data.data.products || [];
          const totalProducts = response.data.data.pagination?.total || 0;
          const hasMore = newProducts.length === PAGINATION.DEFAULT_LIMIT;

          setProducts(prev => {
            if (resetList) {
              return newProducts;
            }
            // Prevent duplicates by filtering out existing products
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNewProducts = newProducts.filter(
              p => !existingIds.has(p.id)
            );
            return [...prev, ...uniqueNewProducts];
          });

          setProductsPagination({
            hasMore,
            currentPage: page,
            totalProducts,
          });
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setProductsLoading(false);
      }
    },
    []
  );

  // Fetch locations with pagination and search
  const fetchLocations = useCallback(
    async (page = 1, searchTerm = '', resetList = false) => {
      try {
        setLocationsLoading(true);
        const params = {
          page,
          limit: PAGINATION.DEFAULT_LIMIT,
        };

        if (searchTerm?.trim()) {
          params.name = searchTerm.trim();
        }

        const response = await locationService.getLocations(params);

        if (response.data.success) {
          const newLocations = response.data.data.locations || [];
          const totalLocations = response.data.data.pagination?.total || 0;
          const hasMore = newLocations.length === PAGINATION.DEFAULT_LIMIT;

          setLocations(prev => {
            if (resetList) {
              return newLocations;
            }
            // Prevent duplicates by filtering out existing locations
            const existingIds = new Set(prev.map(l => l.id));
            const uniqueNewLocations = newLocations.filter(
              l => !existingIds.has(l.id)
            );
            return [...prev, ...uniqueNewLocations];
          });

          setLocationsPagination({
            hasMore,
            currentPage: page,
            totalLocations,
          });
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLocationsLoading(false);
      }
    },
    []
  );

  // Fetch units
  const fetchUnits = useCallback(async () => {
    try {
      const response = await productService.getUnits();
      if (response.data.success) {
        setUnits(response.data.data.units || []);
      }
    } catch (error) {
      // Error fetching units - silently handle
    }
  }, []);

  // Load initial products
  const loadInitialProducts = useCallback(
    async (searchTerm = '') => {
      setProducts([]);
      setProductsPagination({
        hasMore: true,
        currentPage: 1,
        totalProducts: 0,
      });
      setProductSearchTerm(searchTerm);

      await fetchProducts(1, searchTerm, true);
    },
    [fetchProducts]
  );

  // Load initial locations
  const loadInitialLocations = useCallback(
    async (searchTerm = '') => {
      setLocations([]);
      setLocationsPagination({
        hasMore: true,
        currentPage: 1,
        totalLocations: 0,
      });
      setLocationSearchTerm(searchTerm);

      await fetchLocations(1, searchTerm, true);
    },
    [fetchLocations]
  );

  // Handle product dropdown scroll
  const handleProductDropdownScroll = e => {
    const { target } = e;
    if (
      target.scrollTop + target.offsetHeight === target.scrollHeight &&
      productsPagination.hasMore &&
      !productsLoading
    ) {
      fetchProducts(
        productsPagination.currentPage + 1,
        productSearchTerm,
        false
      );
    }
  };

  // Handle product search with debouncing
  const handleProductSearch = useCallback(
    value => {
      const searchTerm = value || '';
      setProductSearchTerm(searchTerm);

      // Clear existing timer
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }

      // Set new timer for debounced search
      const newTimer = setTimeout(() => {
        // Reset products and pagination for new search
        setProducts([]);
        setProductsPagination({
          hasMore: true,
          currentPage: 1,
          totalProducts: 0,
        });

        // Fetch products with search term
        fetchProducts(1, searchTerm, true);
      }, 300); // 300ms debounce

      setSearchDebounceTimer(newTimer);
    },
    [fetchProducts, searchDebounceTimer]
  );

  // Handle location dropdown scroll
  const handleLocationDropdownScroll = e => {
    const { target } = e;
    if (
      target.scrollTop + target.offsetHeight === target.scrollHeight &&
      locationsPagination.hasMore &&
      !locationsLoading
    ) {
      fetchLocations(
        locationsPagination.currentPage + 1,
        locationSearchTerm,
        false
      );
    }
  };

  // Handle location search with debouncing
  const handleLocationSearch = useCallback(
    value => {
      const searchTerm = value || '';
      setLocationSearchTerm(searchTerm);

      // Clear existing timer
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }

      // Set new timer for debounced search
      const newTimer = setTimeout(() => {
        // Reset locations and pagination for new search
        setLocations([]);
        setLocationsPagination({
          hasMore: true,
          currentPage: 1,
          totalLocations: 0,
        });

        // Fetch locations with search term
        fetchLocations(1, searchTerm, true);
      }, 300); // 300ms debounce

      setSearchDebounceTimer(newTimer);
    },
    [fetchLocations, searchDebounceTimer]
  );

  // Handle product selection to auto-select unit
  const handleProductChange = value => {
    const selectedProduct = products.find(product => product.id === value);
    if (selectedProduct && selectedProduct.unit) {
      form.setFieldsValue({ unit: selectedProduct.unit });
    }
  };

  // Load data when modal opens
  useEffect(() => {
    if (visible) {
      loadInitialProducts();
      loadInitialLocations();
      fetchUnits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Cleanup debounce timer on unmount or when modal closes
  useEffect(() => {
    if (!visible && searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
      setSearchDebounceTimer(null);
      // Also reset search terms when modal closes
      setProductSearchTerm('');
      setLocationSearchTerm('');
    }
  }, [visible, searchDebounceTimer]);

  // Pre-fill form when editing
  useEffect(() => {
    if (visible && editingItem) {
      form.setFieldsValue({
        product_id: editingItem.product_id,
        description: editingItem.description,
        rate:
          editingItem.rate === undefined || editingItem.rate === null
            ? undefined
            : Number(editingItem.rate),
        discount:
          editingItem.discount === undefined ||
          editingItem.discount === null ||
          Number(editingItem.discount) === 0
            ? undefined
            : Number(editingItem.discount),
        discount_type: editingItem.discount_type,
        unit: editingItem.unit,
        location_id: editingItem.location_id,
        quantity:
          editingItem.quantity === undefined || editingItem.quantity === null
            ? undefined
            : Number(editingItem.quantity),
      });

      // Set existing image if available
      if (editingItem.images && editingItem.images.length > 0) {
        const rel = editingItem.images[0];
        const url = rel.startsWith('http') ? rel : `${ASSET_BASE_URL}/${rel}`;
        setFileList([
          {
            uid: '-1',
            name: 'image.jpg',
            status: 'done',
            url,
          },
        ]);
      } else if (editingItem.image_url) {
        setFileList([
          {
            uid: '-1',
            name: 'image.jpg',
            status: 'done',
            url: editingItem.image_url,
          },
        ]);
      } else if (editingItem.image) {
        const previewUrl = URL.createObjectURL(editingItem.image);
        setFileList([
          {
            uid: '-1',
            name: editingItem.image.name || 'image.jpg',
            status: 'done',
            url: previewUrl,
            originFileObj: editingItem.image,
          },
        ]);
      } else {
        setFileList([]);
      }
    } else if (visible) {
      form.resetFields();
      setFileList([]);
    }
  }, [visible, editingItem, form]);

  // Handle image upload
  const handleImageUpload = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const handleImageBeforeUpload = file => {
    // Check file type
    const isImage = FILE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.type);
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }

    // Check file size
    const isLt5M = file.size <= FILE_UPLOAD.MAX_SIZE;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return false;
    }

    return false; // Prevent automatic upload
  };

  // Handle form submit
  const handleFormSubmit = async values => {
    try {
      setLoading(true);

      const itemData = {
        product_id: values.product_id,
        // keep product name for table display
        product_name:
          (products.find(product => product.id === values.product_id) || {})
            .name || '',
        description: values.description,
        rate: values.rate !== undefined ? parseFloat(values.rate) : 0,
        discount:
          values.discount !== undefined && values.discount !== null
            ? parseFloat(values.discount)
            : 0,
        discount_type: values.discount_type,
        unit: values.unit,
        location_id: values.location_id,
        quantity:
          values.quantity !== undefined ? parseInt(values.quantity, 10) : 1,
      };

      // Add image data if available
      if (fileList.length > 0) {
        const file = fileList[0];
        if (file.originFileObj) {
          itemData.image = file.originFileObj;
        } else if (file.url) {
          // When editing existing image from server, file.url is absolute; keep relative if under ASSET_BASE_URL
          const prefix = `${ASSET_BASE_URL}/`;
          itemData.image_url = file.url.startsWith(prefix)
            ? file.url.substring(prefix.length)
            : file.url;
        }
      } else if (
        editingItem &&
        (editingItem.images?.length || editingItem.image_url)
      ) {
        // If user removed image intentionally, send a flag
        itemData.image_removed = true;
      }

      if (onSuccess) {
        onSuccess(itemData);
      }

      form.resetFields();
      setFileList([]);
    } catch (error) {
      api.error({
        message: 'Error',
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    form.resetFields();
    setFileList([]);

    // Reset products search state
    setProductSearchTerm('');
    setProducts([]);
    setProductsPagination({
      hasMore: true,
      currentPage: 1,
      totalProducts: 0,
    });

    // Reset locations search state
    setLocationSearchTerm('');
    setLocations([]);
    setLocationsPagination({
      hasMore: true,
      currentPage: 1,
      totalLocations: 0,
    });

    // Clear debounce timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
      setSearchDebounceTimer(null);
    }

    onCancel();
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={title}
        open={visible}
        onCancel={handleCancel}
        footer={null}
        width={600}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          style={{ marginTop: '16px' }}
        >
          <Form.Item
            label="Product"
            name="product_id"
            rules={[{ required: true, message: 'Please select a product' }]}
          >
            <Select
              placeholder="Select product"
              showSearch
              filterOption={false}
              loading={productsLoading}
              onChange={handleProductChange}
              onSearch={handleProductSearch}
              onDropdownVisibleChange={visible => {
                if (visible && products.length === 0) {
                  loadInitialProducts();
                }
              }}
              onPopupScroll={handleProductDropdownScroll}
            >
              {products.map(product => (
                <Option key={product.id} value={product.id}>
                  {product.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { max: 500, message: 'Description cannot exceed 500 characters' },
            ]}
          >
            <TextArea placeholder="Enter item description" rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Rate"
                name="rate"
                rules={[
                  { required: true, message: 'Please enter rate' },
                  {
                    type: 'number',
                    min: 0.01,
                    message: 'Rate must be greater than 0',
                  },
                ]}
              >
                <InputNumber
                  placeholder="0.00"
                  precision={2}
                  style={{ width: '100%' }}
                  addonBefore="₹"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Discount"
                name="discount"
                dependencies={['discount_type']}
                rules={[
                  {
                    type: 'number',
                    min: 0,
                    max: 100,
                    message: 'Discount must be between 0-100%',
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const discountType = getFieldValue('discount_type');
                      if (
                        discountType &&
                        (value === undefined || value === null || value === '')
                      ) {
                        return Promise.reject(
                          new Error(
                            'Discount is required when discount type is selected'
                          )
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <InputNumber
                  placeholder="0"
                  precision={2}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Discount Type"
                name="discount_type"
                dependencies={['discount']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const discount = getFieldValue('discount');
                      if (
                        discount &&
                        (value === undefined || value === null || value === '')
                      ) {
                        return Promise.reject(
                          new Error(
                            'Discount type is required when discount is entered'
                          )
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Select placeholder="Select discount type" allowClear>
                  <Option value="PERCENTAGE">Percentage</Option>
                  <Option value="PER_PIECE">Per Piece</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Unit"
                name="unit"
                rules={[{ required: true, message: 'Please select unit' }]}
              >
                <Select placeholder="Select unit">
                  {units.map(unit => (
                    <Option key={unit} value={unit}>
                      {unit}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Location" name="location_id">
                <Select
                  placeholder="Select location"
                  showSearch
                  filterOption={false}
                  loading={locationsLoading}
                  onSearch={handleLocationSearch}
                  onDropdownVisibleChange={visible => {
                    if (visible && locations.length === 0) {
                      loadInitialLocations();
                    }
                  }}
                  onPopupScroll={handleLocationDropdownScroll}
                >
                  {locations.map(location => (
                    <Option key={location.id} value={location.id}>
                      {location.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Quantity"
                name="quantity"
                rules={[
                  {
                    type: 'number',
                    min: 1,
                    message: 'Quantity must be at least 1',
                  },
                ]}
              >
                <InputNumber
                  placeholder="1"
                  min={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Image Upload */}
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Form.Item label="Product Image">
                <CameraUpload
                  fileList={fileList}
                  onChange={handleImageUpload}
                  beforeUpload={handleImageBeforeUpload}
                  onPreview={handlePreview}
                  maxCount={1}
                  accept={FILE_UPLOAD.ALLOWED_IMAGE_EXTENSIONS.join(',')}
                />
                <div
                  style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}
                >
                  Only image files are allowed. Maximum size: 5MB. You can
                  upload a file or take a photo with your camera.
                </div>
              </Form.Item>
            </Col>
          </Row>

          {/* Preview Modal (AntD Upload uses Image preview in tables; here we control) */}
          <Modal
            open={previewOpen}
            title="Preview"
            footer={null}
            onCancel={() => setPreviewOpen(false)}
          >
            {previewSrc && (
              <img alt="Preview" style={{ width: '100%' }} src={previewSrc} />
            )}
          </Modal>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Row justify="end">
              <Col xs={24} sm={12} md={8}>
                <Space
                  size="middle"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Button onClick={handleCancel} style={{ minWidth: '80px' }}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    style={{ minWidth: '100px' }}
                  >
                    {editingItem ? 'Update' : 'Add'} Item
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ItemModal;
