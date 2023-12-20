const lodashTemplate = require('lodash/template');

const _btoa = function (str) {
  return Buffer.from(str).toString('base64');
};

const getTemplateFields = (templateString = '') => {
  const regex = /<%=\s*(\w+)\s*%>/g;
  const matches = templateString?.matchAll(regex) || [];
  const results = [];
  for (const match of matches) {
    const variableName = match[1];
    results.push(variableName);
  }
  return results;
};

const defaultValueFromTemplate = (templateString = '') => {
  const fields = getTemplateFields(templateString);
  const result = {};
  fields.forEach((field) => {
    result[field] = '';
  });
  return result;
};

const compliedTemplate = (template, data, typeSend = 'ZALO') => {
  const compliedObj = defaultValueFromTemplate(template);
  const compiled = lodashTemplate(template);
  if (template.includes('<%= FULLNAME %>')) {
    compliedObj['FULLNAME'] = data?.full_name || '';
  }
  if (template.includes('<%= EMAIL %>')) {
    compliedObj['EMAIL'] = data?.email || '';
  }
  if (template.includes('<%= PHONENUMBER %>')) {
    compliedObj['PHONENUMBER'] = data?.phone_number || '';
  }
  if (template.includes('<%= BIRTHDAY %>')) {
    compliedObj['BIRTHDAY'] = data?.birthday || '';
  }
  if (template.includes(`<%= INTERESTID %>`)) {
    compliedObj['INTERESTID'] = _btoa(`${typeSend}_${data?.customer_code}`);
  }
  if (template.includes('<%= ORDERNO %>')) {
    compliedObj['ORDERNO'] = data?.order_no || data?.order_code || '';
  }
  if (template.includes('<%= PRODUCTNAME %>')) {
    compliedObj['PRODUCTNAME'] = data?.product_name_list || '';
  }
  if (template.includes('<%= COUPONCODE %>')) {
    compliedObj['COUPONCODE'] = data?.coupon_code || 'ABCDEF';
  }
  if (template.includes('<%= PREORDERID %>')) {
    compliedObj['PREORDERID'] = data?.pre_order_id || '';
  }
  if (template.includes('<%= PREORDERNO %>')) {
    compliedObj['PREORDERNO'] = data?.pre_order_no || '';
  }
  if (template.includes('<%= RECEIVEADDRESS %>')) {
    compliedObj['RECEIVEADDRESS'] = data?.receive_address || data.address_detail || '';
  }
  if (template.includes('<%= SHORTRECEIVEADDRESS %>')) {
    compliedObj['SHORTRECEIVEADDRESS'] = data?.short_receive_address || data?.short_address_detail || '';
  }
  if (template.includes('<%= ADDRESSDETAIL %>')) {
    compliedObj['ADDRESSDETAIL'] = data?.address_detail || data?.receive_address || '';
  }
  if (template.includes('<%= SHORTADDRESSDETAIL %>')) {
    compliedObj['SHORTADDRESSDETAIL'] = data?.short_address_detail || data?.short_receive_address || '';
  }
  if (template.includes('<%= PREPRODUCTIMAGEURL %>')) {
    compliedObj['PREPRODUCTIMAGEURL'] = data?.pre_product_image_url || '';
  }
  if (template.includes('<%= PREPRODUCTPRICE %>')) {
    compliedObj['PREPRODUCTPRICE'] = data?.pre_product_price || '';
  }
  if (template.includes('<%= PREPRODUCTLISTEDPRICE %>')) {
    compliedObj['PREPRODUCTLISTEDPRICE'] = data?.pre_product_listed_price || '';
  }
  if (template.includes('<%= TOTALPAID %>')) {
    compliedObj['TOTALPAID'] = data?.total_paid || '';
  }
  if (template.includes('<%= PAYMENTTYPE %>')) {
    compliedObj['PAYMENTTYPE'] = data?.payment_type || '';
  }
  if (template.includes('<%= TOTALMONEY %>')) {
    compliedObj['TOTALMONEY'] = data?.total_money || '';
  }
  const compliedResult = compiled(compliedObj);
  return compliedResult;
};


module.exports = {
  getTemplateFields,
  defaultValueFromTemplate,
  compliedTemplate,
};
