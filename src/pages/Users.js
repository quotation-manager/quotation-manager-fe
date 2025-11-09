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
import { userService } from '../services/userService';
import { useSelector } from 'react-redux';
import {
  PAGINATION,
  USER_ROLES,
  USER_ROLE_LABELS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  LIMITS,
  TIMEOUTS,
  getErrorMessage,
  formatDate,
} from '../constants';
import './Users.css';

const { Option } = Select;

const Users = () => {
  const [api, contextHolder] = notification.useNotification();
  const { user: currentUser } = useSelector(state => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    current: PAGINATION.DEFAULT_PAGE,
    pageSize: PAGINATION.DEFAULT_LIMIT,
    total: 0,
  });

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  // Fetch users
  const fetchUsers = async (
    page = pagination.current,
    limit = pagination.pageSize,
    name = searchTerm
  ) => {
    try {
      setLoading(true);
      const response = await userService.getUsers({
        page,
        limit,
        name,
      });

      if (response.success) {
        setUsers(response.data.users);
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

  useEffect(() => {
    fetchUsers();
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(value => {
      setSearchTerm(value);
      setPagination(prev => ({ ...prev, current: 1 }));
      fetchUsers(1, pagination.pageSize, value);
    }, TIMEOUTS.DEBOUNCE),
    [pagination.pageSize]
  );

  // Handle search input change
  const handleSearchChange = e => {
    const value = e.target.value;
    debouncedSearch(value);
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
    fetchUsers(paginationInfo.current, paginationInfo.pageSize, searchTerm);
  };

  // Handle add user
  const handleAddUser = () => {
    setEditingUser(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  // Handle edit user
  const handleEditUser = user => {
    setEditingUser(user);
    setIsModalVisible(true);
    form.setFieldsValue({
      email: user.email,
      user_name: user.user_name,
      role: user.role,
    });
  };

  // Handle delete user
  const handleDeleteUser = async userId => {
    try {
      const response = await userService.deleteUser(userId);
      if (response.success) {
        api.success({
          message: 'Success',
          description: SUCCESS_MESSAGES.USER_DELETED,
        });
        fetchUsers();
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
      let response;

      if (editingUser) {
        response = await userService.updateUser(editingUser.id, values);
      } else {
        response = await userService.createUser(values);
      }

      if (response.success) {
        api.success({
          message: 'Success',
          description: editingUser
            ? SUCCESS_MESSAGES.USER_UPDATED
            : SUCCESS_MESSAGES.USER_CREATED,
        });
        setIsModalVisible(false);
        form.resetFields();
        fetchUsers();
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
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'User Name',
      dataIndex: 'user_name',
      key: 'user_name',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: role => (
        <Tag color={role === USER_ROLES.ADMIN ? 'red' : 'blue'}>
          {USER_ROLE_LABELS[role]}
        </Tag>
      ),
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
      render: (_, record) => {
        // Check if this is the current logged-in user
        const isCurrentUser = currentUser?.email === record.email;

        if (isCurrentUser) {
          return <Tag color="green">Current User</Tag>;
        }

        return (
          <Space size="middle">
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEditUser(record)}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Popconfirm
                title="Are you sure you want to delete this user?"
                onConfirm={() => handleDeleteUser(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {contextHolder}
      <Card>
        {/* Header with Add Button and Search */}
        <div className="users-header">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddUser}
            className="add-user-btn"
          >
            Add User
          </Button>
          <Input
            placeholder="Search by username"
            allowClear
            prefix={<SearchOutlined />}
            className="search-input"
            onChange={handleSearchChange}
          />
        </div>

        {/* Users Table */}
        <Table
          columns={columns}
          dataSource={users}
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

        {/* Add/Edit User Modal */}
        <Modal
          title={editingUser ? 'Edit User' : 'Add User'}
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
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please enter email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <Input placeholder="Enter email" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: !editingUser, message: 'Please enter password!' },
                { min: 6, message: 'Password must be at least 6 characters!' },
              ]}
            >
              <Input.Password
                placeholder={
                  editingUser
                    ? 'Leave blank to keep current password'
                    : 'Enter password'
                }
              />
            </Form.Item>

            <Form.Item
              label="User Name"
              name="user_name"
              rules={[
                { required: true, message: 'Please enter user name!' },
                { min: 2, message: 'User name must be at least 2 characters!' },
              ]}
            >
              <Input placeholder="Enter user name" />
            </Form.Item>

            <Form.Item
              label="Role"
              name="role"
              rules={[{ required: true, message: 'Please select a role!' }]}
            >
              <Select placeholder="Select role">
                <Option value={USER_ROLES.ADMIN}>Admin</Option>
                <Option value={USER_ROLES.EMPLOYEE}>Employee</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingUser ? 'Update' : 'Create'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default Users;
