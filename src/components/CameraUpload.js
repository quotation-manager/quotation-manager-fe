import React, { useState, useRef, useCallback } from 'react';
import { Upload, Button, Modal, message, Space, Row, Col } from 'antd';
import {
  UploadOutlined,
  CameraOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { FILE_UPLOAD } from '../constants';

const CameraUpload = ({
  fileList,
  onChange,
  beforeUpload,
  onPreview,
  maxCount = 1,
  accept = FILE_UPLOAD.ALLOWED_IMAGE_EXTENSIONS.join(','),
  disabled = false,
}) => {
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment', // Use back camera on mobile
        },
        audio: false,
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      message.error('Unable to access camera. Please check permissions.');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  // Handle camera modal open
  const handleCameraOpen = useCallback(async () => {
    // Check if camera is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      message.error('Camera is not supported in your browser.');
      return;
    }

    setCameraModalVisible(true);
    await startCamera();
  }, [startCamera]);

  // Handle camera modal close
  const handleCameraClose = useCallback(() => {
    stopCamera();
    setCameraModalVisible(false);
    setCapturing(false);
  }, [stopCamera]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(
      blob => {
        if (!blob) {
          message.error('Failed to capture image');
          return;
        }

        // Create file object from blob
        const timestamp = new Date().getTime();
        const file = new File([blob], `camera-capture-${timestamp}.jpg`, {
          type: 'image/jpeg',
          lastModified: timestamp,
        });

        // Validate file
        const isImage = FILE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.type);
        if (!isImage) {
          message.error('Invalid image format');
          return;
        }

        const isLt5M = file.size <= FILE_UPLOAD.MAX_SIZE;
        if (!isLt5M) {
          message.error('Image must be smaller than 5MB!');
          return;
        }

        // Create file list item
        const newFileItem = {
          uid: `camera-${timestamp}`,
          name: file.name,
          status: 'done',
          originFileObj: file,
          url: URL.createObjectURL(file),
        };

        // Update file list
        const newFileList =
          maxCount === 1 ? [newFileItem] : [...fileList, newFileItem];

        if (onChange) {
          onChange({ fileList: newFileList });
        }

        // Close camera modal
        handleCameraClose();
        message.success('Photo captured successfully!');
      },
      'image/jpeg',
      0.8 // Quality
    );
  }, [fileList, maxCount, onChange, handleCameraClose]);

  // Custom upload button
  const uploadButton = (
    <div>
      <Space direction="vertical" align="center">
        <Space>
          <UploadOutlined />
          <span>Upload</span>
        </Space>
        <Space>
          <CameraOutlined />
          <span>Camera</span>
        </Space>
      </Space>
    </div>
  );

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* File Upload */}
        <Upload
          listType="picture-card"
          fileList={fileList}
          onChange={onChange}
          beforeUpload={beforeUpload}
          onPreview={onPreview}
          showUploadList={{
            showPreviewIcon: true,
            showRemoveIcon: true,
          }}
          maxCount={maxCount}
          accept={accept}
          disabled={disabled}
        >
          {fileList.length < maxCount && !disabled ? (
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Upload File</div>
            </div>
          ) : null}
        </Upload>

        {/* Camera Button */}
        {fileList.length < maxCount && !disabled && (
          <Button
            type="dashed"
            icon={<CameraOutlined />}
            onClick={handleCameraOpen}
            style={{
              height: '102px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ marginTop: 8 }}>Take Photo</div>
          </Button>
        )}
      </div>

      {/* Camera Modal */}
      <Modal
        title="Take Photo"
        open={cameraModalVisible}
        onCancel={handleCameraClose}
        width="95%"
        style={{ maxWidth: '800px' }}
        footer={[
          <Button key="cancel" onClick={handleCameraClose}>
            Cancel
          </Button>,
          <Button
            key="capture"
            type="primary"
            icon={<CameraOutlined />}
            onClick={capturePhoto}
            disabled={!cameraStream}
          >
            Capture Photo
          </Button>,
        ]}
        destroyOnClose
        centered
      >
        <div style={{ textAlign: 'center', padding: '0 8px' }}>
          <Row justify="center">
            <Col xs={24} sm={22} md={20} lg={18}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '600px',
                  margin: '0 auto',
                  backgroundColor: '#000',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  aspectRatio: '16/9',
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    objectFit: 'cover',
                  }}
                />

                {/* Camera overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '60%',
                    maxWidth: '200px',
                    height: '60%',
                    maxHeight: '200px',
                    border: '2px solid rgba(255, 255, 255, 0.7)',
                    borderRadius: '8px',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </Col>
          </Row>

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {!cameraStream && (
            <div style={{ marginTop: '16px', color: '#666' }}>
              Starting camera...
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default CameraUpload;
