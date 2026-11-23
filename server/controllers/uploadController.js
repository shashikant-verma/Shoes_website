const path = require('path');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

/**
 * Upload helper to Cloudinary via REST API if environment credentials exist
 */
const uploadToCloudinary = (filePath, folder = 'solevibe') => {
  return new Promise((resolve, reject) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return reject(new Error('Cloudinary credentials missing'));
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const signaturePayload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const options = {
      hostname: 'api.cloudinary.com',
      port: 443,
      path: `/v1_1/${cloudName}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.secure_url) {
            resolve({
              url: parsed.secure_url,
              publicId: parsed.public_id,
              storage: 'cloudinary'
            });
          } else {
            reject(new Error(parsed.error?.message || 'Cloudinary upload failed'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (err) => reject(err));

    const fileData = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    let body = `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="timestamp"\r\n\r\n${timestamp}\r\n`;
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="folder"\r\n\r\n${folder}\r\n`;
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="api_key"\r\n\r\n${apiKey}\r\n`;
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="signature"\r\n\r\n${signature}\r\n`;
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`;
    body += `Content-Type: application/octet-stream\r\n\r\n`;

    req.write(body);
    req.write(fileData);
    req.write(`\r\n--${boundary}--\r\n`);
    req.end();
  });
};

// @desc    Upload single image
// @route   POST /api/upload/image
// @access  Authenticated
const uploadSingleImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded or file rejected by validator.'
      });
    }

    const localFilePath = req.file.path;
    const isCloudinaryConfigured = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    if (isCloudinaryConfigured) {
      try {
        const cloudinaryResult = await uploadToCloudinary(localFilePath, 'solevibe/products');
        // Delete local temp file after successful cloud upload
        try { fs.unlinkSync(localFilePath); } catch (_) {}
        return res.json({
          success: true,
          message: 'Image uploaded to Cloudinary successfully',
          data: cloudinaryResult
        });
      } catch (cloudErr) {
        console.warn('Cloudinary upload error, using local fallback:', cloudErr.message);
      }
    }

    // Local storage fallback
    const relativeUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: 'Image uploaded successfully to server storage',
      data: {
        url: relativeUrl,
        filename: req.file.filename,
        storage: 'local'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload multiple gallery images
// @route   POST /api/upload/multiple
// @access  Admin
const uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided for upload.'
      });
    }

    const uploadedUrls = [];
    const isCloudinaryConfigured = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    for (const file of req.files) {
      if (isCloudinaryConfigured) {
        try {
          const resObj = await uploadToCloudinary(file.path, 'solevibe/products');
          uploadedUrls.push(resObj.url);
          try { fs.unlinkSync(file.path); } catch (_) {}
          continue;
        } catch (err) {
          console.warn('Cloudinary multi upload item failed, using local fallback:', err.message);
        }
      }
      uploadedUrls.push(`/uploads/${file.filename}`);
    }

    res.json({
      success: true,
      count: uploadedUrls.length,
      data: uploadedUrls
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages
};
