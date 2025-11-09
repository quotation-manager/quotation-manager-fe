import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Space, notification } from 'antd';
import { referenceService } from '../services/referenceService';
import { SUCCESS_MESSAGES, getErrorMessage } from '../constants';

const { Option } = Select;

const AddReferenceModal = ({
  visible,
  onCancel,
  onSuccess,
  title = 'Add Reference',
}) => {
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await referenceService.getCategories();
      if (response.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Load categories when modal opens
  useEffect(() => {
    if (visible && categories.length === 0) {
      fetchCategories();
    }
  }, [visible, categories.length]);

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

      const response = await referenceService.createReference(requestData);

      const successFlag = response.data?.success || response.success;
      if (successFlag) {
        api.success({
          message: 'Success',
          description: SUCCESS_MESSAGES.REFERENCE_CREATED,
        });

        form.resetFields();

        // Call the success callback with the new reference
        if (onSuccess) {
          const newRef =
            response.data?.data?.reference ||
            response.data?.reference ||
            response.reference;
          onSuccess(newRef);
        }

        // Close the modal
        onCancel();
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
  const handleCancel = () => {
    form.resetFields();
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
        zIndex={1050}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter reference name' },
              { max: 100, message: 'Name cannot exceed 100 characters' },
            ]}
          >
            <Input placeholder="Enter reference name" />
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select placeholder="Select category" showSearch>
              {categories.map((category, index) => (
                <Option key={index} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Mobile Number"
            name="mobile_no"
            rules={[
              {
                max: 15,
                message: 'Mobile number cannot exceed 15 characters',
              },
            ]}
          >
            <Input placeholder="Enter mobile number (optional)" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ float: 'right' }}>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AddReferenceModal;
