const puppeteer = require('puppeteer');

module.exports = async (orderDetails) => {
  let orderDetailsContent = '';
  let itemQty = 0;
  const productID = '';

  await orderDetails.orderDetails.map((orderDetail) => {
    let items = '';
    orderDetail.items.map((item) => {
      const deliveryDate = item.deliveryOrder.estimatedDeliveryDate ? item.deliveryOrder.estimatedDeliveryDate : 'N/A';
      const sku = item.product.sku ? item.product.sku : 'N/A';

      let variation = '';
      if (item.productAttribute && item.productAttribute.variation) {
        item.productAttribute.variation.map((vairationItem) => {
          variation += `${vairationItem.name} : ${vairationItem.value} `;
        });
      }

      if (item.product.id !== productID) {
        itemQty++;
      }

      items += `
                <tr>
                    <td>
                        <div class="product_name">
                            <p class="line_break"><b>${item.title}</b></p>
                            <p class="line_break">${variation}</p>
                            <p>Special Note: ${item.note ? item.note : 'N/A'}</p>
                            <p>Estimate Delivery : <span class="delivery_estimate">${deliveryDate}</span></p>
                        </div>
                    </td>
                    <td>
                        <p>SKU: ${sku}</p>
                        <p>${item.product.id}</p>
                    </td>
                    <td>${item.quantity}</td>
                    <td>${item.price.formatted}</td>
                </tr>
            `;
    });

    orderDetailsContent += `
        <div class="border_line"></div>
        <div style="display: flex;">
            <div id="shipping_address">
                <h2>Shipping To: </h2>
                <div>
                <p><b>${orderDetail.shippingTo.name}</b></p>
                <p>${orderDetail.shippingTo.street}</p>
                <p>${orderDetail.shippingTo.city}</p>
                <p>${orderDetail.shippingTo.state}</p>
                <p>${orderDetail.shippingTo.country}</p>
                <p>${orderDetail.shippingTo.phone}</p>
                <p>${orderDetail.shippingTo.email}</p>
                </div>
            </div>
            <div id="billing_address">
                <h2>Shipping From:</h2>
                <div>
                <p><b>${orderDetails.shippingFrom.name}</b></p>
                <p>${orderDetails.shippingFrom.street}</p>
                <p>${orderDetails.shippingFrom.city}</p>
                <p>${orderDetails.shippingFrom.state}</p>
                <p>${orderDetails.shippingFrom.country}</p>
                <p>${orderDetails.shippingFrom.phone}</p>
                <p>${orderDetails.shippingFrom.email}</p>
                </div>
            </div>
        </div>
        
        <div class="border_line"></div>
        <div id="payment_info">
            <h2>Sale Order</h2>
            <div>
                <p><b>Sale Order #: </b></p>
                <p>${orderDetails.saleOrderID}</p>
            </div>
        </div>
        <div style="margin-bottom: 40px; page-break-after: always;">
            <table id="items_table">
                <thead>
                    <tr>
                        <th>Item Discription</th>
                        <th>SKU/ProductID</th>
                        <th>QTY</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="empty_row">
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    ${items}
                </tbody>
            </table>
        </div>
    `;
  });


  const pdfTemplate = `<!DOCTYPE html>
  <!-- saved from url=(0037)file:///C:/Users/PC/Videos/index.html -->
  <html><head><meta http-equiv="Content-Type" content="text/html; charset=windows-1252">
      <title>INVOICE</title>
      <style>
      @page {
          size: A4;
      }
  
      @page :left {
          margin-left: 1cm;
      }
  
      @page :right {
          margin-left: 1cm;
      }
  
      @page :first {
          margin-top: 1cm;
      }
  
      @media print {
          div {
              break-inside: avoid!important;
              page-break-inside: avoid!important;
          }
      }
  
      #page-header {
          display: block;
          position: running(header);
      }
  
      #page-footer {
          display: block;
          position: running(footer);
      }
  
      body {
          color: #2a2a2a;
          font-family: Helvetica, Arial, sans-serif;
          max-width: 1200px;
          width: 100%;
          margin-top: 1em;
          box-sizing: border-box;
          font-size:16px;
      }
  
      .flex-container {
          margin-left: 5%;
          margin-right: 5%;
          margin-top: 1em;
      }
  
      h1 {
          font-size: 3em;
          margin: 0;
      }
  
      h2 {
          margin-top: 10px;
          font-style: normal;
          font-weight: 500;
          font-size: 30px;
          letter-spacing: 0.25px;
          color: rgba(0, 0, 0, 0.6);
      }
  
      p {
          margin: 0 0 7px;
          color:rgba(0, 0, 0, 0.6)
      }
  
      .flex-box {
          padding: 0;
          margin: 0;
          list-style: none;
          display: flex;
      }
  
      .flex-start {
          justify-content: flex-start;
      }
  
      th,
      td {
          text-align: center;
          table-layout: fixed;
          page-break-inside: avoid;
          display: table-cell;
      }
  
      th {
          background-color: rgba(0, 0, 0, 0.4);
          border: 2px solid rgba(40, 157, 161, 0.490193);
          border-right: 0;
          color: white;
          text-transform: uppercase;
          padding: 10px 10px;
          -webkit-print-color-adjust: exact;
      }
  
      th:nth-child(even) {
          background-color: rgba(0, 0, 0, 0.5);
      }
  
      th:last-child {
          border-right: 2px solid rgba(40, 157, 161, 0.490193);
      }
  
      table td {
          border-bottom: 3px solid lightgray;
          border-collapse: collapse;
          padding: 10px auto;
      }
  
      table tbody tr:nth-child(odd) {
          background-color: #f2f2f2;
          -webkit-print-color-adjust: exact;
      }
  
      table th:first-child {
          width: 60%;
          padding: 10px 20px;
          text-align: left;
      }
  
      table tbody tr td:first-child {
          display: table;
          text-align: left;
          width: 100%;
      }
  
      table tbody tr td:nth-child(2) {
          text-align: left;
      }
      
      td:empty::after {
          content: "";
      }
  
      span {
          margin-left: 40%;
          color: rgba(0, 0, 0, 0.6)
      }
  
      .product_name span {
          margin: 0;
      }
  
      #logo {
          width: 150px;
      }
  
      #invoice_log {
          padding: 4px 20px;
          background-color: rgba(0, 0, 0, 0.5);
          border: 2px solid rgba(40, 157, 161, 0.490193);
          color: white;
          text-align: center;
          text-transform: uppercase;
          -webkit-print-color-adjust: exact;
      }
  
      #items_table {
          margin-top: 30px;
          border-spacing: 0;
      }
      
      .empty_row {
          height: 20px;
          background-color: white!important;
      }
  
      .empty_row td {
          display: table-cell!important;
      }
  
      .product_image {
          width: 100px;
          height: 100px;
          vertical-align: middle;
          border: 2px solid rgba(40, 157, 161, 0.490193);
          margin: 10px 0;
      }
  
      .product_name {
          display: table-cell;
          width: 100%;
          vertical-align: middle;
          padding: 15px 0;
          padding-right: 5px;
      }
  
      .product_name p {
          margin: 0;
      }
  
      .product_name p:first-child {
          margin-bottom: 5px;
      }
  
      .line_break {
          line-break: anywhere;
          overflow-wrap: break-word;
      }
  
      #price_summary {
          width: 375px;
          float: right;
      }
  
      .price_summary_item {
          width: 275px;
          float: right;
          display: table;
          font-size: 20px;
          justify-content: space-between;
      }
  
      .price_summary_item p {
          display: table-cell;
          text-align: right;
          letter-spacing: 0.25px;
          width: 50%;
      }
  
      .price_summary_item:last-child {
          font-style: normal;
          font-weight: 500;
          font-size: 24px;
          letter-spacing: 0.25px;
          width: 100%;
          margin-top: 25px;
          padding-top: 35px;
          border-top: 2px solid lightgray;
      }
  
      .price_summary_item:last-child p:first-child {
          text-align: left;
      }
  
      #order_summary {
          width: 405px;
      }
  
      .order_summary_item {
          display: flex;
          justify-content: space-between;
      }
  
      .billing_address p {
          padding-left: 140px;
      }        
  
      .billing_address p:first-child {
          padding: 0;
          display: inline-flex;
      }
  
      .billing_address p:nth-child(2) {
          padding-left: 10px;
          display: inline-flex;
      }
  
      #shipping_address,
      #billing_address {
          width: 50%;
          float: left;
          color: rgba(0, 0, 0, 0.6);
      }
      #shipping_address h3 {
          color: #41dede;
          -webkit-print-color-adjust: exact;
      }
  
      .border_line {
          border-top: 5px solid lightgray; 
          margin: 10px 0;
      }
  
      .border_line:first {
          border-color: gray
      }
  
      #header {
          padding: 10px 0; 
          display: flex;
          justify-content: space-between;
          overflow: hidden;
          margin: 0 0 10px;
      }
  
      #payment_info div {
          display: flex;
          justify-content: space-between;
      }
      </style>
  </head>
  
  <body>
      <div class="flex-container">
          <div id="header">
              <div style="display: table-cell; vertical-align: top; padding-right: 25px;">
                  <img id="logo" src="https://shoclef-android-apk.s3.amazonaws.com/Square%403x.png">
              </div>
              <div style="float: right;">
                  <h2 id="invoice_log"><b>Packing Slip</b></h2>
                  <div id="order_summary">
                      <div class="order_summary_item">
                          <p>Order Date:</p>
                          <p>${orderDetails.orderDate}</p>
                      </div>
                      <div class="order_summary_item">
                          <p>Order #:</p>
                          <p>${orderDetails.ID}</p>
                      </div>
                      <div class="order_summary_item">
                          <p>Product Qty:</p>
                          <p>${itemQty} ${itemQty > 1 ? 'items' : 'item'}</p>
                      </div>
                  </div>
              </div>
          </div>
          ${orderDetailsContent}
      </div>
      
  </body></html>`;

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(pdfTemplate);
  const invoicePDF = await page.pdf({
    format: 'A4',
    margin: {
      top: '2cm',
      bottom: '2cm',
      left: '1.5cm',
      right: '1.5cm',
    },
  });

  await browser.close();

  return invoicePDF;
};
