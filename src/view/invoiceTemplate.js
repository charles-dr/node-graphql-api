const puppeteer = require('puppeteer');

module.exports = async (orderDetails) => {
  let orderDetailsContent = '';
  let itemQty = 0;
  await Promise.all(orderDetails.orderDetails.map((orderDetail) => {
    let items = '';
    const payment_info = orderDetail.payment_info.payment_method ? orderDetail.payment_info.payment_method : 'N/A';

    itemQty += orderDetail.items.length;

    orderDetail.items.map((item) => {
      const deliveryDate = item.deliveryOrder.estimatedDeliveryDate ? item.deliveryOrder.estimatedDeliveryDate : 'N/A';
      let variation = '';
      if (item.productAttribute && item.productAttribute.variation) {
        item.productAttribute.variation.map((vairationItem) => {
          variation += `${vairationItem.name} : ${vairationItem.value} `;
        });
      }

      items += `
            <tr>
                <td>
                    <img class="product_image" src="${item.image}">
                    <div class="product_name">
                        <p class="line_break"><b>${item.title}</b></p>
                        <p class="line_break">${variation}</p>
                        <span>Estimate Delivery : </span>
                        <span class="delivery_estimate">${deliveryDate}</span>
                    </div>
                </td>
                <td>${item.price.formatted}</td>
                <td>${item.quantity}</td>
                <td>${item.subtotal.formatted}</td>
            </tr>
        `;
    });

    orderDetailsContent += `
        <div class="border_line"></div>
        <div style="display:flex;">
            <div id="shipping_address">
                <h2>Shipping Address</h2>
                <div>
                    <p><b>${orderDetail.shipping_address.client_name ? orderDetail.shipping_address.client_name : 'N/A'}</b></p>
                    <p>${orderDetail.shipping_address.street ? orderDetail.shipping_address.street : ''}</p>
                    <p>${orderDetail.shipping_address.city ? orderDetail.shipping_address.city : ''}</p>
                    <p>${orderDetail.shipping_address.state ? orderDetail.shipping_address.state : ''}</p>
                    <p>${orderDetail.shipping_address.country ? orderDetail.shipping_address.country : ''}</p>
                    <p>${orderDetail.shipping_address.phone ? orderDetail.shipping_address.phone : ''}</p>
                    <p>${orderDetail.shipping_address.email ? orderDetail.shipping_address.email : ''}</p>
                </div>
            </div>
            <div id="billing_address">
                <h2>Billing Address</h2>
                <div>
                    <p><b>${orderDetail.payment_info.billing_address.name ? orderDetail.payment_info.billing_address.name : 'N/A'}</b></p>
                    <p>${orderDetail.payment_info.billing_address.street ? orderDetail.payment_info.billing_address.street : ''}</p>
                    <p>${orderDetail.payment_info.billing_address.city ? orderDetail.payment_info.billing_address.city : ''}</p>
                    <p>${orderDetail.payment_info.billing_address.state ? orderDetail.payment_info.billing_address.state : ''}</p>
                    <p>${orderDetail.payment_info.billing_address.country ? orderDetail.payment_info.billing_address.country : ''}</p>
                    <p>${orderDetail.payment_info.billing_address.phone ? orderDetail.payment_info.billing_address.phone : ''}</p>
                    <p>${orderDetail.payment_info.billing_address.email ? orderDetail.payment_info.billing_address.email : ''}</p>
                </div>
            </div>
        </div>
        <div class="border_line"></div>
        <div id="payment_info">
            <h2>Payment Information</h2>
            <div>
                <div>
                    <p><b>Payment Method: </b>${payment_info}</p>
                </div>
            </div>
        </div>
        <div style="margin-bottom: 40px; page-break-after: always;">
            <table id="items_table">
                <thead>
                    <tr>
                        <th>Item Discription</th>
                        <th>Price</th>
                        <th>QTY</th>
                        <th>Total</th>
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
  }));
  //   let items = '';
  //   const payment_info = orderDetails.payment_info.payment_method ? orderDetails.payment_info.payment_method : 'N/A';

  //   orderDetails.items.map((item) => {
  //     const deliveryDate = item.deliveryOrder.estimatedDeliveryDate ? item.deliveryOrder.estimatedDeliveryDate : 'N/A';
  //     items += `
  //                 <tr>
  //                     <td>
  //                         <img class="product_image" src="${item.image}">
  //                         <div class="product_name">
  //                             <p class="line_break"><b>${item.title}</b></p>
  //                             <span>Estimate Delivery : </span>
  //                             <span class="delivery_estimate">${deliveryDate}</span>
  //                         </div>
  //                     </td>
  //                     <td>${item.price.formatted}</td>
  //                     <td>${item.quantity}</td>
  //                     <td>${item.total.formatted}</td>
  //                 </tr>
  //             `;
  //   });

  const pdfTemplate = `<!DOCTYPE html>
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
                width: 100%;
                padding: 10px 20px;
                text-align: left;
            }

            table tbody tr td:first-child {
                display: table;
                width: 100%;
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
                padding-left: 120px;
                width: 100%;
                vertical-align: middle;
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
        </style>
    </head>
    
    <body>
        <div class="flex-container">
            <div id="header">
                <div style="display: table-cell; vertical-align: top; padding-right: 25px;">
                    <img id="logo" src="https://shoclef-android-apk.s3.amazonaws.com/Square%403x.png">
                </div>
                <div style="float: right;">
                    <h2 id="invoice_log"><b>INVOICE</b></h2>
                    <div id="order_summary">
                        <div class="order_summary_item">
                            <p>Order Date:</p>
                            <p>${orderDetails.orderDate ? orderDetails.orderDate : 'N/A'}</p>
                        </div>
                        <div class="order_summary_item">
                            <p>Order #:</p>
                            <p>${orderDetails.orderID}</p>
                        </div>
                        <div class="order_summary_item">
                            <p>Order Total:</p>
                            <p>${orderDetails.price_summary.total.formatted} ${orderDetails.price_summary.total.currency} (${itemQty} ${itemQty == 1 ? 'item' : 'items'})</p>
                        </div>
                    </div>
                </div>
            </div>
            ${orderDetailsContent}            
            <div id="price_summary">
                <div class="price_summary_item">
                    <p>Subtotal: </p>  
                    <p>${orderDetails.price_summary.items.formatted}</p>
                </div>
                <div class="price_summary_item">
                    <p>Tax/VAT: </p>
                    <p>${orderDetails.price_summary.tax.formatted}</p>
                </div>
                <div class="price_summary_item">
                    <p>Shipping: </p>
                    <p>${orderDetails.price_summary.shipping.formatted}</p>
                </div>
                <div class="price_summary_item">
                    <p><b>Order Total</b></p>
                    <p><b>${orderDetails.price_summary.total.currency} </b>${orderDetails.price_summary.total.formatted}</p>
                </div>
            </div>
        </div>
        
    </body></html>`;

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(pdfTemplate);
  const invoicePDF = await page.pdf({
    // path: 'invoice.pdf',
    format: 'A4',
    margin: {
      top: '2cm',
      bottom: '2cm',
      left: '1.5cm',
      right: '1.5cm',
    },
    footerTemplate: '<div style="text-align: right;width: 297mm;font-size: 8px;"><span style="margin-right: 1cm"><span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
  });

  await browser.close();

  return invoicePDF;
};
