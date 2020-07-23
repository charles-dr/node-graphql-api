const uuid = require('uuid/v4');
const path = require('path');

const { baseURL, query: { getPurchaseOrderForEmail, getProduct, getSaleOrderForEmail } } = require(path.resolve('config'));
const { request, gql } = require('graphql-request');

const repository = require(path.resolve('src/repository'));

const invoiceTemplate = require(path.resolve('src/view/invoiceTemplate'));
const packingTemplate = require(path.resolve('src/view/packingTemplate'));

const AWS = require('aws-sdk');

const { aws, cdn } = require(path.resolve('config'));
const s3 = new AWS.S3();

module.exports.InvoiceService = {
  async getOrderDetails(orderID) {
    const orderQuery = gql`${getPurchaseOrderForEmail}`;

    const variables = {
      orderID,
    };

    const itemsDetail = await request(`${baseURL}graphql`, orderQuery, variables);
    const user = itemsDetail.purchaseOrder.buyer;
    const orderDate = itemsDetail.purchaseOrder.createdAt;
    let items = [];
    let shippingAddress = { id: '' };
    let billingAddress = { id: '' };
    const orderDetails = [];
    const newOrder = {
      orderDate,
      orderID,
      price_summary: {
        items: itemsDetail.purchaseOrder.price,
        tax: itemsDetail.purchaseOrder.tax,
        shipping: itemsDetail.purchaseOrder.deliveryPrice,
        total: itemsDetail.purchaseOrder.total,
      },
    };


    await Promise.all(itemsDetail.purchaseOrder.items.map(async (item) => {
      const orderItem = await repository.orderItem.getById(item.id);
      const product = await request(`${baseURL}graphql`,
        gql`${getProduct}`,
        {
          ID: orderItem.product,
        });
      const image = product.product.assets.length > 0 ? product.product.assets[0].url : '';

      if (shippingAddress.id !== item.deliveryOrder.deliveryAddress.id
         || billingAddress.id !== item.billingAddress.id) {
        if (items.length > 0) {
          orderDetails.push({
            shipping_address: {
              client_name: user.name,
              street: shippingAddress.street,
              city: shippingAddress.city,
              state: shippingAddress.name,
              country: shippingAddress.name,
              phone: user.phone,
              email: user.email,
            },
            payment_info: {
              payment_method: itemsDetail.purchaseOrder.paymentInfo,
              billing_address: {
                name: user.name,
                street: billingAddress.street,
                city: billingAddress.city,
                state: billingAddress.region.name,
                country: billingAddress.country.name,
                phone: user.phone,
                email: user.email,
              },
            },
            items,
          });
        }

        shippingAddress = item.deliveryOrder.deliveryAddress;
        billingAddress = item.billingAddress;
        items = [{ ...item, image }];
      } else {
        items.push({ ...item, image });
      }
    }));

    orderDetails.push({
      shipping_address: {
        client_name: user.name,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.region.name,
        country: shippingAddress.country.name,
        phone: user.phone,
        email: user.email,
      },
      payment_info: {
        payment_method: itemsDetail.purchaseOrder.paymentInfo,
        billing_address: {
          name: user.name,
          street: billingAddress.street,
          city: billingAddress.city,
          state: billingAddress.region.name,
          country: billingAddress.country.name,
          phone: user.phone,
          email: user.email,
        },
      },
      items,
    });

    return {
      ...newOrder,
      orderDetails,
    };
  },

  async createInvoicePDF(orderDetails) {
    const html = await invoiceTemplate(orderDetails);
    const id = uuid();
    const key = `invoicepdf/${id}.pdf`;
    await Promise.all([s3.putObject({
      Bucket: aws.app_bucket,
      Key: key,
      Body: html,
      // ContentType: 'application/pdf',
    }).promise(),
    repository.purchaseOrder.addInovicePDF(orderDetails.orderID, `${cdn.appAssets}/${key}`),
    ])
      .then(() => `${cdn.appAssets}/${key}`)
      .catch(async (error) => {
        await repository.purchaseOrder.addInovicePDF(orderDetails.orderID, null);
        throw new Error(error);
      });
    return `${cdn.appAssets}/${key}`;
  },

  async createPackingSlip(orderDetails) {
    const html = await packingTemplate(orderDetails);
    const id = uuid();
    const key = `packingSlip/${id}.pdf`;
    await Promise.all([s3.putObject({
      Bucket: aws.app_bucket,
      Key: key,
      Body: html,
    }).promise(),
    repository.saleOrder.addPackingSlip(orderDetails.saleOrderID, `${cdn.appAssets}/${key}`),
    ])
      .then(() => `${cdn.appAssets}/${key}`)
      .catch(async (error) => {
        await repository.saleOrder.addPackingSlip(orderDetails.saleOrderID, null);
        throw new Error(error);
      });
    return `${cdn.appAssets}/${key}`;
  },
  async getSalesOrderDetails(orderID) {
    const saleOrderQuery = gql`${getSaleOrderForEmail}`;
    const variables = {
      orderID,
    };

    const saleOrder = await request(`${baseURL}graphql`, saleOrderQuery, variables);
    const orderDate = saleOrder.saleOrder.purchaseOrder.createdAt;
    const shippingFrom = {
      name: saleOrder.saleOrder.items[0].seller.name,
      phone: saleOrder.saleOrder.items[0].seller.phone,
      email: saleOrder.saleOrder.items[0].seller.email,
      street: saleOrder.saleOrder.items[0].seller.organization.address.street,
      city: saleOrder.saleOrder.items[0].seller.organization.address.city,
      state: saleOrder.saleOrder.items[0].seller.organization.address.region.name,
      country: saleOrder.saleOrder.items[0].seller.organization.address.country.name,
    };


    const orderDetails = [];
    const newOrder = {
      ID: saleOrder.saleOrder.purchaseOrder.id,
      orderDate,
      saleOrderID: orderID,
      shippingFrom,
    };
    const { buyer } = saleOrder.saleOrder;

    let items = [];
    let shippingTo = { id: '' };
    let sameItems = 0;

    await Promise.all(saleOrder.saleOrder.items.map(async (item) => {
      sameItems++;

      if (shippingTo.id !== item.deliveryOrder.deliveryAddress.id) {
        if (items.length > 0) {
          orderDetails.push({
            quantity: sameItems,
            shippingTo: {
              name: buyer.name,
              phone: buyer.phone,
              email: buyer.email,
              street: item.deliveryOrder.deliveryAddress.street,
              city: item.deliveryOrder.deliveryAddress.city,
              state: item.deliveryOrder.deliveryAddress.region.name,
              country: item.deliveryOrder.deliveryAddress.country.name,
            },
            items,
          });
        }

        sameItems = 0;
        shippingTo = item.deliveryOrder.deliveryAddress;
        items = [item];
      } else {
        items.push(item);
      }
    }));

    orderDetails.push({
      quantity: items.length > 1 ? sameItems : items.length,
      shippingTo: {
        name: buyer.name,
        phone: buyer.phone,
        email: buyer.email,
        street: shippingTo.street,
        city: shippingTo.city,
        state: shippingTo.region.name,
        country: shippingTo.country.name,
      },
      items,
    });

    return {
      ...newOrder,
      orderDetails,
    };
  },
};
