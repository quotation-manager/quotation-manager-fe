import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Popconfirm,
  Modal,
  Form,
  notification,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { locationService } from '../services/locationService';
import { useSelector } from 'react-redux';
import {
  PAGINATION,
  USER_ROLES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  TIMEOUTS,
  getErrorMessage,
} from '../constants';
import './Locations.css';

const Locations = () => {
  const [api, contextHolder] = notification.useNotification();
  const { user: currentUser } = useSelector(state => state.auth);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    current: PAGINATION.DEFAULT_PAGE,
    pageSize: PAGINATION.DEFAULT_LIMIT,
    total: 0,
  });

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
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
      fetchLocations(1, pagination.pageSize, value);
    }, TIMEOUTS.DEBOUNCE),
    [pagination.pageSize]
  );

  // Handle search input change
  const handleSearchChange = e => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  // Fetch locations
  const fetchLocations = async (
    page = 1,
    limit = PAGINATION.DEFAULT_LIMIT,
    name = ''
  ) => {
    try {
      setLoading(true);
      const response = await locationService.getLocations({
        page,
        limit,
        name,
      });

      if (response.data.success) {
        setLocations(response.data.data.locations || []);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: response.data.data.pagination?.total || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      api.error({
        message: 'Error',
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchLocations();
  }, []);

  // Handle table pagination change
  const handleTableChange = paginationInfo => {
    const { current, pageSize } = paginationInfo;
    setPagination(prev => ({ ...prev, current, pageSize }));
    fetchLocations(current, pageSize, searchTerm);
  };

  // Handle add location
  const handleAddLocation = () => {
    setEditingLocation(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Handle edit location
  const handleEditLocation = record => {
    setEditingLocation(record);
    form.setFieldsValue({
      name: record.name,
    });
    setIsModalVisible(true);
  };

  // Handle delete location
  const handleDeleteLocation = async id => {
    try {
      setLoading(true);
      const response = await locationService.deleteLocation(id);

      if (response.data.success) {
        api.success({
          message: 'Success',
          description: SUCCESS_MESSAGES.LOCATION_DELETED,
        });

        // Refresh the list
        const currentPage = pagination.current;
        const currentData = locations.length;

        // If deleting the last item on a page (and not the first page), go to previous page
        if (currentData === 1 && currentPage > 1) {
          fetchLocations(currentPage - 1, pagination.pageSize, searchTerm);
        } else {
          fetchLocations(currentPage, pagination.pageSize, searchTerm);
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

      const requestData = {
        name: values.name,
      };

      let response;

      if (editingLocation) {
        response = await locationService.updateLocation(
          editingLocation.id,
          requestData
        );
      } else {
        response = await locationService.createLocation(requestData);
      }

      if (response.data.success) {
        api.success({
          message: 'Success',
          description: editingLocation
            ? SUCCESS_MESSAGES.LOCATION_UPDATED
            : SUCCESS_MESSAGES.LOCATION_CREATED,
        });

        setIsModalVisible(false);
        form.resetFields();
        setEditingLocation(null);

        // Refresh the list
        fetchLocations(pagination.current, pagination.pageSize, searchTerm);
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
    setEditingLocation(null);
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
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditLocation(record)}
            />
          </Tooltip>
          {isAdmin && (
            <Tooltip title="Delete">
              <Popconfirm
                title="Are you sure you want to delete this location?"
                onConfirm={() => handleDeleteLocation(record.id)}
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
        <div className="locations-header">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddLocation}
            className="add-location-btn"
          >
            Add Location
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
          dataSource={locations}
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
          title={editingLocation ? 'Edit Location' : 'Add Location'}
          open={isModalVisible}
          onCancel={handleModalCancel}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
            <Form.Item
              label="Name"
              name="name"
              rules={[
                { required: true, message: 'Please enter location name' },
                { max: 100, message: 'Name cannot exceed 100 characters' },
              ]}
            >
              <Input placeholder="Enter location name" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <Space style={{ float: 'right' }}>
                <Button onClick={handleModalCancel}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingLocation ? 'Update' : 'Create'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default Locations;
