import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Breadcrumb,
  Button,
  Row,
  Col,
  Typography,
  Descriptions,
  Spin,
  notification,
  Image,
  Space,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  WhatsAppOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { quotationService } from '../services/quotationService';
import { getErrorMessage, ASSET_BASE_URL, formatDate } from '../constants';
import './AddQuotation.css';
import './Quotations.css';

const { Title } = Typography;

const ViewQuotation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [api, contextHolder] = notification.useNotification();

  // State management
  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const buildPublicLink = quotationId =>
    `${window.location.origin}/public/quotations/${quotationId}`;

  const handleShareWhatsApp = useCallback(async () => {
    try {
      await quotationService.markSharedDate(id);
    } catch (e) {
      api.error({ message: 'Error', description: getErrorMessage(e) });
      return;
    }

    const customerPhone = quotation?.customer?.mobile_no || '';
    const link = buildPublicLink(id);
    const text = encodeURIComponent(
      `Thank you for your inquiry. You can download your quotation here: ${link}`
    );
    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(
      navigator.userAgent
    );
    const base = isMobile ? 'whatsapp://send' : 'https://web.whatsapp.com/send';
    const phoneParam = customerPhone
      ? `&phone=${encodeURIComponent(customerPhone)}`
      : '';
    const url = `${base}?text=${text}${phoneParam}`.replace('?&', '?');
    window.open(url, '_blank', 'noopener');
  }, [api, id, quotation]);

  const handleViewPDF = useCallback(() => {
    // Navigate directly to the PDF view with current quotation data
    navigate(`/public/quotations/${id}`, {
      state: { quotation },
    });
  }, [id, quotation, navigate]);

  const handleRegeneratePDF = useCallback(async () => {
    try {
      setPdfGenerating(true);

      // Call regenerate PDF API
      const regenerateResponse = await quotationService.regeneratePDF(id);

      if (regenerateResponse?.data?.success) {
        // Show success message
        api.success({
          message: 'Success',
          description: 'PDF has been regenerated successfully.',
        });

        // Update quotation state with new PDF path from the API response
        const newPdfPath =
          regenerateResponse?.data?.data?.quotation?.pdf_path ||
          regenerateResponse?.data?.quotation?.pdf_path ||
          regenerateResponse?.data?.pdf_path;

        if (newPdfPath && quotation) {
          setQuotation(prevQuotation => ({
            ...prevQuotation,
            pdf_path: newPdfPath,
          }));
        }
      } else {
        // If regeneration fails, show error
        api.error({
          message: 'Error',
          description: 'Failed to regenerate PDF. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error regenerating PDF:', error);
      api.error({
        message: 'Error',
        description: getErrorMessage(error),
      });
    } finally {
      setPdfGenerating(false);
    }
  }, [api, id, quotation]);

  // Fetch quotation data
  const fetchQuotation = useCallback(async () => {
    try {
      setLoading(true);
      const response = await quotationService.getQuotationById(id);
      const success = response.data?.success || response.success;
      const payload = response.data?.data || response.data;

      if (success) {
        const q = payload.quotation || payload;
        const normalizedItems = (q.items || []).map(item => ({
          ...item,
          product_name: item.product_name || item.product?.name || '',
        }));
        setQuotation({ ...q, items: normalizedItems });
      }
    } catch (error) {
      api.error({
        message: 'Error',
        description: getErrorMessage(error),
      });
      navigate('/dashboard/quotations');
    } finally {
      setLoading(false);
    }
  }, [id, api, navigate]);

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
  ];

  // Load quotation data on component mount
  useEffect(() => {
    fetchQuotation();
  }, [fetchQuotation]);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Title level={4}>Quotation not found</Title>
        <Button
          type="primary"
          onClick={() => navigate('/dashboard/quotations')}
        >
          Back to Quotations
        </Button>
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
          <Breadcrumb.Item>View Quotation</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Card>
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: '24px' }}
          gutter={[16, 16]}
        >
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Title level={3}>Quotation Details</Title>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Row
              gutter={[8, 8]}
              justify="end"
              className="quotation-actions-row"
            >
              <Col lg={6} xl={6}>
                <Button
                  type="primary"
                  icon={<WhatsAppOutlined />}
                  style={{
                    background: '#25D366',
                    borderColor: '#25D366',
                    width: '100%',
                  }}
                  onClick={handleShareWhatsApp}
                >
                  <span className="button-text">Share on WhatsApp</span>
                </Button>
              </Col>
              <Col lg={6} xl={6}>
                <Button
                  onClick={handleViewPDF}
                  style={{
                    width: '100%',
                  }}
                >
                  <span className="button-text">View PDF</span>
                </Button>
              </Col>
              <Col lg={6} xl={6}>
                <Button
                  loading={pdfGenerating}
                  icon={<ReloadOutlined />}
                  onClick={handleRegeneratePDF}
                  style={{
                    width: '100%',
                  }}
                >
                  <span className="button-text">Regenerate PDF</span>
                </Button>
              </Col>
              <Col lg={6} xl={6}>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/dashboard/quotations/edit/${id}`)}
                  style={{
                    width: '100%',
                  }}
                >
                  <span className="button-text">Edit Quotation</span>
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Quotation Information */}
        <Descriptions
          bordered
          column={{ xs: 1, sm: 1, md: 2, lg: 3 }}
          style={{ marginBottom: '32px' }}
        >
          <Descriptions.Item label="Quotation Date">
            {formatDate(quotation.quotation_date)}
          </Descriptions.Item>
          <Descriptions.Item label="Customer">
            {quotation.customer?.name || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Customer Mobile">
            {quotation.customer?.mobile_no || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Price Type">
            {quotation.price_type || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {formatDate(quotation.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Remarks" span={2}>
            {quotation.remarks || 'No remarks'}
          </Descriptions.Item>
        </Descriptions>

        {/* Items Section */}
        <div>
          <Title level={4} style={{ marginBottom: '16px' }}>
            Items ({quotation.items?.length || 0})
          </Title>

          <Table
            columns={itemColumns}
            dataSource={quotation.items || []}
            pagination={false}
            rowKey={(_, index) => index}
            scroll={{ x: 'max-content' }}
            locale={{
              emptyText: 'No items in this quotation.',
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default ViewQuotation;
