const path = require('path');
const { request, gql } = require('graphql-request');

const { baseURL, email, query: { getSaleOrderForEmail, getPurchaseOrderForEmail } } = require(path.resolve('config'));
const { VerificationEmailTemplate } = require(path.resolve('src/lib/Enums'));
const { InvoiceService } = require(path.resolve('src/lib/InvoiceService'));
const AbstractEmailService = require('./AbstractEmailService');

const repository = require(path.resolve('src/repository'));

class EmailService extends AbstractEmailService {
  sendWelcome(data) {
    const template = this.getTemplate(VerificationEmailTemplate.WELCOME);

    const params = this.getParams({ template, user: data.user });

    return this.send(params);
  }

  sendRecoverPasswordCode(data) {
    const template = this.getTemplate(VerificationEmailTemplate.RESET_PASSWORD);

    const params = this.getParams({ template, user: data.user, code: data.code });

    return this.send(params);
  }
  sendVerificationCode(data) {
    console.log("sendVerificationCode",data)
    const template = this.getTemplate(VerificationEmailTemplate.SIGNUP);

    const params = this.getParams({ template,user: data.user, code: data.code });

    return this.send(params);
  }
  sendPasswordChanged(data) {
    const template = this.getTemplate(VerificationEmailTemplate.PASSWORD_CHANGED);

    const params = this.getParams({ template, user: data.user });

    return this.send(params);
  }

  sendPurchasedInfo(data, type) {
    const template = ( type == "invoice" ) 
      ? this.getTemplate(VerificationEmailTemplate.INVOICE)
      : this.getTemplate(VerificationEmailTemplate.PACKINGSLIP);

    const params = this.getParams({ template, user: data.user, data });

    return this.send(params);
  }

  async sendInvoicePDFs(data) {
    const buyer = await repository.user.getById(data.buyer);
    await repository.purchaseOrder.getInvoicePDF(data.id)
      .then((pdf) => {
        if (pdf && pdf.length > 0) {
          return pdf;
        }

        return InvoiceService.getOrderDetails(data.id)
          .then((orderDetails) => InvoiceService.createInvoicePDF(orderDetails))
          .catch((err) => {
            throw new Error(err.message);
          });
      })
      .then(async (invoicePdf) => {
        const orderQuery = gql`${getPurchaseOrderForEmail}`;
        const variables = {
          orderID: data.id,
        };
        const itemsDetail = await request(`${baseURL}graphql`, orderQuery, variables);
        buyer.type = 'buyer';
        await this.sendPurchasedInfo({
          user: buyer,
          orderId: itemsDetail.purchaseOrder.id,
          invoicePdf,
          createdAt: itemsDetail.purchaseOrder.createdAt,
          orderItems: itemsDetail.purchaseOrder.items
        }, "invoice");
      })
      .catch((err) => {
          throw new Error(err.message);
      });
  }

  async sendPackingSlipPDFs(data) {
    const saleOrders = await repository.saleOrder.get({
      filter: { purchaseOrder: data.id },
      page: {
        limit: 0,
        skip: 0
      },
      user: null,
    });

    await Promise.all(saleOrders.map(async (saleOrder) => repository.saleOrder.getPackingSlip(saleOrder.id)
        .then((orders) => {
            if (orders && orders.length > 0) { return orders; }

            return InvoiceService.getSalesOrderDetails(saleOrder.id)
              .then(async (orderDetails) => InvoiceService.createPackingSlip(orderDetails))
              .catch((err) => {
                throw new Error(err.message);
              });
        })
        .then(async (invoicePdf) => {
          const saleOrderQuery = gql`${getSaleOrderForEmail}`;
          const variables = {
            orderID: saleOrder.id,
          };
          const itemsDetail = await request(`${baseURL}graphql`, saleOrderQuery, variables);
          const seller = itemsDetail.saleOrder.seller;
          seller.type = 'seller';
          await this.sendPurchasedInfo({
              user: seller,
              orderId: itemsDetail.saleOrder.id,
              invoicePdf,
              createdAt: itemsDetail.saleOrder.createdAt,
              orderItems: itemsDetail.saleOrder.items
          }, "packingSlip")
        })
        .catch((err) => {
            throw new Error(err.message);
        }),
    ))
  }

  async notifyNewIssue(issue) {
    const category = await repository.issueCategory.getById(issue.category);
    const emails = category && category.notifyEmails.length ? category.notifyEmails : [email.supportEmail];
    const template = this.getTemplate(VerificationEmailTemplate.NEW_ISSUE);
    return Promise.all(emails.map((email) => {
      const params = this.getParams({ template, issue, category, user: { email }, data: true });
      this.send(params)
    }));
  }
}
module.exports.EmailService = new EmailService();
