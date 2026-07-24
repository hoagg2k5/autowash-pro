import crypto from 'crypto';

export function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

export function generateSignature(params, secretKey) {
  const sortedParams = sortObject(params);
  const signData = Object.keys(sortedParams)
    .map(key => `${key}=${sortedParams[key]}`)
    .join('&');
  const hmac = crypto.createHmac("sha512", secretKey);
  return hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
}

export function verifyResponse(queryParams, secretKey) {
  const vnp_SecureHash = queryParams['vnp_SecureHash'];
  
  const params = { ...queryParams };
  delete params['vnp_SecureHash'];
  delete params['vnp_SecureHashType'];
  
  const checkHash = generateSignature(params, secretKey);
  return checkHash === vnp_SecureHash;
}

export function createPaymentUrl(bookingId, amount, req) {
  const tmnCode = process.env.VNP_TMN_CODE || '2QXUIOJ7';
  const secretKey = process.env.VNP_HASH_SECRET || 'UZDGBNCOWVHUXWDVJPRWUXZFTJYZXMXP';
  const vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const returnUrl = process.env.VNP_RETURN_URL || 'http://localhost:5173/payment-result';

  const date = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const createDate = date.getFullYear().toString() + 
                     (date.getMonth() + 1).toString().padStart(2, '0') + 
                     date.getDate().toString().padStart(2, '0') + 
                     date.getHours().toString().padStart(2, '0') + 
                     date.getMinutes().toString().padStart(2, '0') + 
                     date.getSeconds().toString().padStart(2, '0');

  let ipAddr = req.headers['x-forwarded-for'] ||
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress ||
               req.connection?.socket?.remoteAddress ||
               '127.0.0.1';
               
  if (ipAddr.includes('::ffff:')) {
    ipAddr = ipAddr.replace('::ffff:', '');
  }

  const vnpParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: bookingId,
    vnp_OrderInfo: `Thanh toan lich dat xe ${bookingId}`,
    vnp_OrderType: 'other',
    vnp_Amount: amount * 100, // Amount * 100 for VNPay
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate
  };

  const secureHash = generateSignature(vnpParams, secretKey);
  
  const sortedParams = sortObject(vnpParams);
  const queryString = Object.keys(sortedParams)
    .map(key => `${key}=${sortedParams[key]}`)
    .join('&');
    
  return `${vnpUrl}?${queryString}&vnp_SecureHash=${secureHash}`;
}

export async function callRefundApi(booking, adminUser, req) {
  const tmnCode = process.env.VNP_TMN_CODE || '2QXUIOJ7';
  const secretKey = process.env.VNP_HASH_SECRET || 'UZDGBNCOWVHUXWDVJPRWUXZFTJYZXMXP';
  const vnpApiUrl = process.env.VNP_API || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';

  const date = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const createDate = date.getFullYear().toString() + 
                     (date.getMonth() + 1).toString().padStart(2, '0') + 
                     date.getDate().toString().padStart(2, '0') + 
                     date.getHours().toString().padStart(2, '0') + 
                     date.getMinutes().toString().padStart(2, '0') + 
                     date.getSeconds().toString().padStart(2, '0');

  const requestId = 'req-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
  
  let ipAddr = req.headers['x-forwarded-for'] ||
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress ||
               req.connection?.socket?.remoteAddress ||
               '127.0.0.1';
  if (ipAddr.includes('::ffff:')) {
    ipAddr = ipAddr.replace('::ffff:', '');
  }

  // Fields for refund API signature (pipe-separated list in v2.1.0 refund API)
  const vnp_RequestId = requestId;
  const vnp_Version = '2.1.0';
  const vnp_Command = 'refund';
  const vnp_TmnCode = tmnCode;
  const vnp_TransactionType = '02'; // Full refund
  const vnp_TxnRef = booking.id;
  const vnp_Amount = booking.totalPaid * 100;
  const vnp_TransactionNo = booking.vnpTransactionNo || '0';
  const vnp_TransactionDate = booking.vnpPayDate || createDate;
  const vnp_CreateBy = adminUser?.email || adminUser?.id || 'admin';
  const vnp_CreateDate = createDate;
  const vnp_IpAddr = ipAddr;
  const vnp_OrderInfo = `Hoan tien lich dat xe ${booking.id}`;

  const hashData = `${vnp_RequestId}|${vnp_Version}|${vnp_Command}|${vnp_TmnCode}|${vnp_TransactionType}|${vnp_TxnRef}|${vnp_Amount}|${vnp_TransactionNo}|${vnp_TransactionDate}|${vnp_CreateBy}|${vnp_CreateDate}|${vnp_IpAddr}|${vnp_OrderInfo}`;

  const hmac = crypto.createHmac("sha512", secretKey);
  const secureHash = hmac.update(Buffer.from(hashData, 'utf-8')).digest("hex");

  const requestBody = {
    vnp_RequestId,
    vnp_Version,
    vnp_Command,
    vnp_TmnCode,
    vnp_TransactionType,
    vnp_TxnRef,
    vnp_Amount,
    vnp_TransactionNo,
    vnp_TransactionDate,
    vnp_CreateBy,
    vnp_CreateDate,
    vnp_IpAddr,
    vnp_OrderInfo,
    vnp_SecureHash: secureHash
  };

  try {
    const response = await fetch(vnpApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (err) {
    console.error("Error making VNPAY Refund API call:", err);
    throw err;
  }
}
