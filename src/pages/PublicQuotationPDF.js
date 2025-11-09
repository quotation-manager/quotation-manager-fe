import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card, Spin, Alert, Button, Typography, Space } from 'antd';
import {
  FilePdfOutlined,
  DownloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { quotationService } from '../services/quotationService';
import { ASSET_BASE_URL } from '../constants';

const { Title, Text } = Typography;

const PublicQuotationPDF = () => {
  const { id } = useParams();
  const auth = useSelector(state => state.auth);
  const isAuthenticated = !!auth?.isAuthenticated;
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Detect if user is on mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = [
        'android',
        'iphone',
        'ipad',
        'ipod',
        'blackberry',
        'windows phone',
      ];
      const isMobileDevice = mobileKeywords.some(keyword =>
        userAgent.includes(keyword)
      );
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchPublic = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await quotationService.getPublicQuotationById(id);
      const success = response.data?.success || response.success;
      const payload = response.data?.data || response.data;
      if (!success) throw new Error(payload?.message || 'Failed to fetch');
      const rel = payload?.quotation?.pdf_path || payload?.pdf_path || '';
      if (!rel) throw new Error('PDF not available for this quotation');
      const full = rel.startsWith('http') ? rel : `${ASSET_BASE_URL}/${rel}`;
      setPdfUrl(full);
    } catch (e) {
      setError(e.message || 'Something went wrong while fetching quotation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If quotation was passed via state (from authenticated app), prefer that and avoid network call
    const stateQuotation = location.state?.quotation;
    if (stateQuotation?.pdf_path) {
      const rel = stateQuotation.pdf_path;
      const full = rel.startsWith('http') ? rel : `${ASSET_BASE_URL}/${rel}`;
      setPdfUrl(full);
      setLoading(false);
      return;
    }

    if (!isAuthenticated) {
      fetchPublic();
    } else {
      // If authenticated but no state provided, attempt to fetch public as fallback
      fetchPublic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, location.state]);

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3} style={{ margin: 0 }}>
          Quotation PDF
        </Title>

        {loading && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Spin size="large" />
          </div>
        )}

        {!loading && error && (
          <Alert
            type="error"
            message="Unable to load quotation PDF"
            description={error}
            showIcon
            style={{ marginTop: 16 }}
          />
        )}

        {!loading && !error && pdfUrl && (
          <div style={{ marginTop: 16 }}>
            {isMobile ? (
              // Mobile-friendly PDF viewing
              <div style={{ textAlign: 'center', padding: 24 }}>
                <FilePdfOutlined
                  style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }}
                />
                <Title level={4} style={{ marginBottom: 8 }}>
                  Quotation PDF Ready
                </Title>
                <Text
                  type="secondary"
                  style={{ display: 'block', marginBottom: 24 }}
                >
                  Tap below to view or download the PDF file
                </Text>
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: '100%' }}
                >
                  <Button
                    type="primary"
                    size="large"
                    icon={<EyeOutlined />}
                    href={pdfUrl}
                    target="_blank"
                    style={{ width: '100%', maxWidth: 300 }}
                  >
                    View PDF
                  </Button>
                  <Button
                    size="large"
                    icon={<DownloadOutlined />}
                    href={pdfUrl}
                    download
                    style={{ width: '100%', maxWidth: 300 }}
                  >
                    Download PDF
                  </Button>
                </Space>
                <div style={{ marginTop: 16, fontSize: '12px', color: '#999' }}>
                  <Text type="secondary">
                    If the PDF doesn't open, try downloading it first
                  </Text>
                </div>
              </div>
            ) : (
              // Desktop PDF embedding with fallback
              <>
                <div
                  style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  <object
                    data={pdfUrl}
                    type="application/pdf"
                    width="100%"
                    height="800px"
                    style={{ display: 'block' }}
                  >
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <FilePdfOutlined
                        style={{
                          fontSize: 48,
                          color: '#1890ff',
                          marginBottom: 16,
                        }}
                      />
                      <Title level={4} style={{ marginBottom: 8 }}>
                        PDF Preview Not Available
                      </Title>
                      <Text
                        type="secondary"
                        style={{ display: 'block', marginBottom: 24 }}
                      >
                        Your browser doesn't support PDF preview. Use the
                        buttons below to view or download the file.
                      </Text>
                      <Space>
                        <Button
                          type="primary"
                          icon={<EyeOutlined />}
                          href={pdfUrl}
                          target="_blank"
                        >
                          Open PDF
                        </Button>
                        <Button
                          icon={<DownloadOutlined />}
                          href={pdfUrl}
                          download
                        >
                          Download PDF
                        </Button>
                      </Space>
                    </div>
                  </object>
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PublicQuotationPDF;
